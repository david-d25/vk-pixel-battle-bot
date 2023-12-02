import Command from "./Command";
import {VkMessage} from "../service/VkMessagesService";
import {Context} from "../Context";
import {AutoRestartMode} from "../service/ChatSettingsService";

export class StartCommand extends Command {
    constructor(context: Context, private triggerWord: string) {
        super(context);
    }

    canYouHandleThisCommand(command: string, message: VkMessage): boolean {
        return command === "начать" || command === "start" || command === "старт";
    }

    getCanonicalName(): string {
        return "start";
    }

    requiresPrivileges(peerId: number): boolean {
        return true;
    }

    async handle(command: string, restArgs: string, message: VkMessage): Promise<void> {
        const { vkMessagesService, chatSettingsService, drawLogOrmService } = this.context;
        const chatSettings = await chatSettingsService.getSettingsOrCreateDefault(message.peerId);
        if (chatSettings.pixelBattleStarted) {
            await vkMessagesService.send(message.peerId, "Баттл уже начался");
            return;
        }
        const mode = restArgs.split(' ')[0];
        restArgs = restArgs.substring(mode.length).trim();
        if (mode.length === 0) {
            await vkMessagesService.sendDisposable(message.peerId, this.getUsage());
            return;
        }
        const width = parseInt(restArgs.split(' ')[0]);
        restArgs = restArgs.substring(width.toString().length).trim();
        if (isNaN(width)) {
            await vkMessagesService.sendDisposable(message.peerId, this.getUsage());
            return;
        }
        const height = parseInt(restArgs.split(' ')[0]);
        restArgs = restArgs.substring(height.toString().length).trim();
        if (isNaN(height)) {
            await vkMessagesService.sendDisposable(message.peerId, this.getUsage());
            return;
        }
        let cooldown = parseInt(restArgs.split(' ')[0]);
        if (isNaN(cooldown)) {
            cooldown = 0;
        }

        const validationError = this.boardSizeAndTimeValidations(width, height, cooldown);
        if (validationError != null) {
            await vkMessagesService.send(message.peerId, validationError);
            return;
        }

        const onceWords = ['once', 'раз', 'разово', 'одинраз', 'единожды'];
        const dailyWords = ['daily', 'day', 'день', 'дневной', 'ежедневно'];
        const weeklyWords = ['weekly', 'неделя', 'недельный', 'еженедельно'];
        const onFillWords = ['on-fill', 'on_fill', 'onfill', 'при-заполнении', 'при_заполнении', 'призаполнении'];

        let autoRestartMode: AutoRestartMode;

        if (onceWords.includes(mode)) {
            autoRestartMode = 'none';
        } else if (dailyWords.includes(mode)) {
            autoRestartMode = 'daily';
        } else if (weeklyWords.includes(mode)) {
            autoRestartMode = 'weekly';
        } else if (onFillWords.includes(mode)) {
            autoRestartMode = 'on_board_fill';
        } else {
            await vkMessagesService.send(message.peerId, `Не знаю режим '${mode}'`);
            return;
        }

        await this.context.boardService.startBattle(message.peerId, width, height, cooldown, autoRestartMode);
    }

    private boardSizeAndTimeValidations(width: number, height: number, cooldown: number): string | null {
        if (width < 0) {
            return `Ты не можешь создать доску с отрицательной шириной`;
        }
        if (height < 0) {
            return `Ты не можешь создать доску с отрицательной высотой`;
        }
        if (width < 1) {
            return `Ты не можешь создать доску с шириной меньше 1`;
        }
        if (height < 1) {
            return `Ты не можешь создать доску с высотой меньше 1`;
        }
        if (cooldown > 1000 * 365 * 24 * 60 * 60) {
            return `Ты не можешь начать баттл с cooldown больше чем 1000 лет`;
        }
        if (width * height > 10000) {
            return `Ты не можешь создать доску с площадью больше 10000 пикселей`;
        }
        return null;
    }

    private getUsage(): string {
        let result = ``;
        const t = this.triggerWord;
        result += `Начать баттл:\n`;
        result += `/${t} start once W H T\n`;
        result += `/${t} start daily W H T\n`;
        result += `/${t} start weekly W H T\n`;
        result += `/${t} start on-fill W H T\n`;
        result += `\n`;
        result += `W - ширина\n`;
        result += `H - высота\n`;
        result += `T - cooldown (сек)\n`;
        return result;
    }
}