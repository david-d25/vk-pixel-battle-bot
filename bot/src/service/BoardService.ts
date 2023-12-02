import axios from "axios";
import {Context} from "../Context";
import DrawLogOrmService from "../orm/DrawLogOrmService";
import {AutoRestartMode, ChatSettingsModel} from "./ChatSettingsService";
import ServiceError from "../ServiceError";

export type DrawLogModel = {
    peerId: number,
    userId: number,
    orderId: number,
    time: Date,
    x: number,
    y: number,
    colorRgb: number,
}

export default class BoardService {
    private backendUrl!: string
    private orm!: DrawLogOrmService;

    constructor(private context: Context) {
        context.onReady(async () => {
            await this.init();
        });
    }

    private async init() {
        this.backendUrl = this.context.configService.getAppConfig().backendUrl;
        this.orm = this.context.drawLogOrmService;
        await this.intervalRoutine();
    }

    private async intervalRoutine() {
        try {
            await this.checkTimeoutsRoutine();
        } catch (e) {
            console.error(e);
        }
        setTimeout(() => this.intervalRoutine(), 5000);
    }

    private async checkTimeoutsRoutine() {
        const { chatSettingsService, chatSettingsOrmService, drawLogOrmService, vkMessagesService } = this.context;
        const now = new Date();
        for (const settings of await chatSettingsOrmService.getAll()) {
            if (settings == null ||
                !settings.pixelBattleStarted ||
                settings.battleStopTime == null ||
                settings.battleStopTime > now
            ) {
                continue;
            }
            if (await drawLogOrmService.countDrawLogs(settings.peerId) == 0) {
                if (settings.autoRestartMode == "daily") {
                    settings.battleStopTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
                    await chatSettingsService.saveSettings(settings.peerId, settings);
                    await vkMessagesService.send(settings.peerId, `Ещё никто не рисовал, баттл продлевается на день!`);
                    continue;
                } else if (settings.autoRestartMode == "weekly") {
                    settings.battleStopTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                    await chatSettingsService.saveSettings(settings.peerId, settings);
                    await vkMessagesService.send(
                        settings.peerId,
                        `Ещё никто не рисовал, баттл продлевается на неделю!`
                    );
                    continue;
                }
            }
            await this.endBattle(settings.peerId);
            if (settings.autoRestartMode == "daily" || settings.autoRestartMode == "weekly") {
                await vkMessagesService.send(settings.peerId, `Перезапускаю баттл...`);
                await this.startBattle(
                    settings.peerId,
                    settings.boardWidth,
                    settings.boardHeight,
                    settings.pixelSetIntervalSeconds,
                    settings.autoRestartMode
                );
            }
        }
    }

    async createBoardImage(peerId: number, grid: boolean = true): Promise<Buffer> {
        let attempts = 3;
        while (attempts > 0) {
            try {
                const url = `http://${this.backendUrl}/board/${peerId}?grid=${grid}`;
                console.log(`[${peerId}] Requesting chart image from ${url}`);
                const response = await axios.get(url, {responseType: 'arraybuffer'});
                if (response.status !== 200)
                    continue;
                return Buffer.from(response.data);
            } catch (e) {
                console.error(`[${peerId}] Error requesting board image: ${e}`);
                attempts--;
            }
        }
        throw new ServiceError(`Can't get board image`);
    }

    async getStats(peerId: number): Promise<Map<number, number>> {
        const stats: Map<number, number> = new Map();
        const drawLogs = await this.orm.getDrawLogs(peerId);
        for (const drawLog of drawLogs) {
            if (!stats.has(drawLog.userId)) {
                stats.set(drawLog.userId, 0);
            }
            stats.set(drawLog.userId, stats.get(drawLog.userId)! + 1);
        }
        return stats;
    }

    async endBattle(peerId: number, showFinalPicture: boolean = true) {
        const { vkMessagesService, boardService, chatSettingsService, vkUsersService } = this.context;
        const chatSettings = await chatSettingsService.getSettingsOrCreateDefault(peerId);
        const stats = await boardService.getStats(peerId);
        const relatedUsers = await vkUsersService.getUsers([...stats.keys()]);
        const sortedStats = [...stats.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

        let text = `Баттл закончен!\n`;
        if (sortedStats.length > 0) {
            text += `Топ ${sortedStats.length}:\n`;
            for (const i in sortedStats) {
                const [userId, count] = sortedStats[i];
                const user = relatedUsers.get(userId);
                const fname = user?.firstName ?? "???";
                const lname = user?.lastName ?? "???";
                text += `${+i+1}. ${fname} ${lname} - ${count}px\n`;
            }
        }

        text += `\n`;
        const totalPixelsDrawn = [...stats.values()].reduce((a, b) => a+b, 0);
        text += `Всего было нарисовано ${totalPixelsDrawn} пикселей\n`;

        let attachments: string[] = [];
        if (showFinalPicture) {
            text += `Финальный рисунок:\n`;
            const image = await boardService.createBoardImage(peerId, false);
            attachments = await vkMessagesService.uploadPhotoAttachments(peerId, [image]);
        }

        await vkMessagesService.send(peerId, text, attachments);

        chatSettings.pixelBattleStarted = false;
        chatSettings.battleStopTime = null;
        await chatSettingsService.saveSettings(peerId, chatSettings);
    }

    async startBattle(
        peerId: number,
        width: number,
        height: number,
        cooldown: number,
        autoRestartMode: AutoRestartMode
    ) {
        const { chatSettingsService, drawLogOrmService, vkMessagesService } = this.context;
        const chatSettings = await chatSettingsService.getSettingsOrCreateDefault(peerId);
        chatSettings.pixelBattleStarted = true;
        chatSettings.boardWidth = width;
        chatSettings.boardHeight = height;
        chatSettings.pixelSetIntervalSeconds = cooldown;
        chatSettings.autoRestartMode = autoRestartMode;
        chatSettings.lastStartTime = new Date();
        if (autoRestartMode == "daily") {
            chatSettings.battleStopTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
        } else if (autoRestartMode == "weekly") {
            chatSettings.battleStopTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        }
        await chatSettingsService.saveSettings(peerId, chatSettings);
        await drawLogOrmService.clearDrawLog(peerId);
        let text = `Баттл начался!\n`;
        text += `Рисуй пиксели на доске так:\n`;
        text += `+пиксель X Y цвет\n`;
        await vkMessagesService.send(peerId, text);
    }

    async isBoardFilled(peerId: number): Promise<boolean> {
        const { drawLogOrmService } = this.context;
        const chatSettings = await this.context.chatSettingsService.getSettingsOrCreateDefault(peerId);
        const drawLogs = await drawLogOrmService.getDrawLogs(chatSettings.peerId);
        const fillSet = new Set<string>();
        for (const drawLog of drawLogs) {
            fillSet.add(drawLog.x + ":" + drawLog.y);
        }
        for (let x = 0; x < chatSettings.boardWidth; x++) {
            for (let y = 0; y < chatSettings.boardHeight; y++) {
                if (!fillSet.has(x + ":" + y)) {
                    return false;
                }
            }
        }
        return true;
    }
}