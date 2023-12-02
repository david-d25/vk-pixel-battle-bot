import Command from "./Command";
import {Context} from "../Context";
import {VkMessage} from "../service/VkMessagesService";

export class ImageCommand extends Command {
    constructor(context: Context, private triggerWord: string) {
        super(context);
    }

    canYouHandleThisCommand(command: string, message: VkMessage): boolean {
        return command === "картинка" || command === "доска" || command === "рисунок" || command === "image";
    }

    getCanonicalName(): string {
        return "image";
    }

    requiresPrivileges(peerId: number): boolean {
        return false;
    }

    async handle(command: string, restArgs: string, message: VkMessage): Promise<void> {
        const { vkMessagesService, chatSettingsService, drawLogOrmService, boardService } = this.context;
        const chatSettings = await chatSettingsService.getSettingsOrCreateDefault(message.peerId);
        if (await drawLogOrmService.countDrawLogs(message.peerId) === 0) {
            await vkMessagesService.send(message.peerId, "Еще никто не рисовал");
            return;
        }
        const grid = restArgs != "nogrid";
        const image = await boardService.createBoardImage(message.peerId, grid);
        const attachments = await vkMessagesService.uploadPhotoAttachments(message.peerId, [image]);
        const text = chatSettings.pixelBattleStarted ? "" : "Рисунок прошлого баттла:";
        await vkMessagesService.sendDisposable(message.peerId, text, attachments);
    }
}