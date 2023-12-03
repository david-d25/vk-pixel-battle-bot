import Command from "./Command";
import {VkMessage} from "../service/VkMessagesService";
import {Context} from "../Context";
import {resolveColorToRgb} from "../util/ColorUtil";
import axios from "axios";
import {secondsToHumanReadable} from "../util/StringUtil";

export default class SetPixelCommand extends Command {
    private readonly backendUrl!: string

    constructor(context: Context, private triggerWord: string) {
        super(context);
        this.backendUrl = context.configService.getAppConfig().backendUrl;
    }

    canYouHandleThisCommand(command: string, message: VkMessage): boolean {
        return true;
    }

    getCanonicalName(): string {
        return "";
    }

    requiresPrivileges(peerId: number): boolean {
        return false;
    }

    async handle(command: string, restArgs: string, message: VkMessage): Promise<void> {
        const { vkMessagesService, drawLogOrmService, boardService } = this.context;
        restArgs = restArgs || '';
        if (restArgs.length === 0)
            return this.handleWrongFormat(message.peerId);
        let arg0 = command;
        let arg1 = restArgs.split(' ')[0];
        restArgs = restArgs.substring(arg1.length).trim();
        let arg2 = restArgs.split(' ')[0];
        if (arg0.startsWith('x'))
            arg0 = arg0.substring(1);
        if (arg1.startsWith('y'))
            arg1 = arg1.substring(1);
        const x = parseInt(arg0);
        const y = parseInt(arg1);
        if (isNaN(x) || isNaN(y))
            return this.handleWrongFormat(message.peerId);
        const chatSettings = await this.context.chatSettingsService.getSettingsOrCreateDefault(message.peerId);
        if (!chatSettings.pixelBattleStarted) {
            await vkMessagesService.send(message.peerId, `Баттл еще не начался`);
            return;
        }
        const lastPixelSetTime = await drawLogOrmService.getUserLastDrawLogTime(message.peerId, message.fromId);
        if (lastPixelSetTime != null) {
            const secondsLeft = Math.ceil((lastPixelSetTime.getTime() + chatSettings.pixelSetIntervalSeconds * 1000 - Date.now()) / 1000);
            if (secondsLeft > 0) {
                await vkMessagesService.send(
                    message.peerId,
                    `Красить можно раз в ${secondsToHumanReadable(chatSettings.pixelSetIntervalSeconds)}, ` +
                    `подожди еще ${secondsToHumanReadable(secondsLeft)}`,
                    [],
                    false
                );
                return;
            }
        }
        const minX = -Math.ceil(chatSettings.boardWidth/2.0) + 1;
        const maxX = Math.floor(chatSettings.boardWidth/2.0) + 1;
        const minY = -Math.ceil(chatSettings.boardHeight/2.0) + 1;
        const maxY = Math.floor(chatSettings.boardHeight/2.0) + 1;
        if (x < minX || y < minY || x >= maxX || y >= maxY) {
            await vkMessagesService.send(message.peerId, `За пределами доски нельзя красить (а так хочется...)`);
            return;
        }
        const color = resolveColorToRgb(arg2);
        if (color == null) {
            await vkMessagesService.send(message.peerId, `Не знаю такого цвета: ${arg2}`);
            return;
        }
        const colorHex = (color.r << 16) + (color.g << 8) + color.b;
        await drawLogOrmService.addDrawLog(message.peerId, message.fromId, x, y, colorHex);
        if (await boardService.isBoardFilled(message.peerId)) {
            await boardService.endBattle(message.peerId);
            await vkMessagesService.send(message.peerId, `Перезапускаю баттл...`);
            await boardService.startBattle(
                message.peerId,
                chatSettings.boardWidth,
                chatSettings.boardHeight,
                chatSettings.pixelSetIntervalSeconds,
                chatSettings.autoRestartMode
            );
        } else {
            const image = await this.context.boardService.createBoardImage(message.peerId);
            const attachment = await vkMessagesService.uploadPhotoAttachments(message.peerId, [image]);
            await vkMessagesService.sendDisposable(message.peerId, ``, attachment);
        }
    }



    private async handleWrongFormat(peerId: number): Promise<void> {
        await this.context.vkMessagesService.sendDisposable(peerId, this.getUsage());
    }

    private getUsage(): string {
        let result = '';
        result += 'Так пиши:\n';
        result += `/${this.triggerWord} (x) (y) (цвет)\n`;
        return result;
    }
}