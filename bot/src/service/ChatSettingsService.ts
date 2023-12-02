import ChatSettingsOrmService from "../orm/ChatSettingsOrmService";
import {Context} from "../Context";

export type AutoRestartMode = "none" | "on_board_fill" | "daily" | "weekly";

export type ChatSettingsModel = {
    peerId: number,
    botEnabled: boolean,
    nameCached: string | null,
    pixelBattleStarted: boolean,
    boardWidth: number,
    boardHeight: number,
    pixelSetIntervalSeconds: number,
    lastStartTime: Date | null,
    battleStopTime: Date | null,
    autoRestartMode: AutoRestartMode,
    lastDisposableMessageId: number | null,
}

export default class ChatSettingsService {
    private chatSettingsOrmService!: ChatSettingsOrmService
    constructor(private context: Context) {
        context.onReady(() => {
            this.chatSettingsOrmService = context.chatSettingsOrmService
        })
    }

    async getSettingsOrCreateDefault(peerId: number): Promise<ChatSettingsModel> {
        return await this.chatSettingsOrmService.getSettings(peerId)
            || await this.chatSettingsOrmService.createDefaultSettings(peerId);
    }

    async saveSettings(peerId: number, settings: ChatSettingsModel) {
        return await this.chatSettingsOrmService.saveSettings(peerId, settings)
    }

    async setBotEnabled(peerId: number, botEnabled: boolean) {
        return await this.changeSettings(peerId, model => model.botEnabled = botEnabled)
    }

    async setName(peerId: number, name: string | null) {
        return await this.changeSettings(peerId, model => model.nameCached = name)
    }

    async setPixelBattleStarted(peerId: number, pixelBattleStarted: boolean) {
        return await this.changeSettings(peerId, model => model.pixelBattleStarted = pixelBattleStarted)
    }

    async setBoardWidth(peerId: number, boardWidth: number) {
        return await this.changeSettings(peerId, model => model.boardWidth = boardWidth)
    }

    async setBoardHeight(peerId: number, boardHeight: number) {
        return await this.changeSettings(peerId, model => model.boardHeight = boardHeight)
    }

    async setPixelSetIntervalSeconds(peerId: number, pixelSetIntervalSeconds: number) {
        return await this.changeSettings(peerId, model => model.pixelSetIntervalSeconds = pixelSetIntervalSeconds)
    }

    async setLastStartTime(peerId: number, lastStartTime: Date | null) {
        return await this.changeSettings(peerId, model => model.lastStartTime = lastStartTime)
    }

    async setBattleStopTime(peerId: number, battleStopTime: Date | null) {
        return await this.changeSettings(peerId, model => model.battleStopTime = battleStopTime)
    }

    async setAutoRestartMode(peerId: number, autoRestartMode: AutoRestartMode) {
        return await this.changeSettings(peerId, model => model.autoRestartMode = autoRestartMode)
    }

    private async changeSettings(
        peerId: number,
        change: (entity: ChatSettingsModel) => void
    ): Promise<ChatSettingsModel> {
        const model = await this.getSettingsOrCreateDefault(peerId);
        change(model);
        return this.chatSettingsOrmService.saveSettings(peerId, model);
    }
}
