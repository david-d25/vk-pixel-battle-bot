import Command from "./Command";
import {Context} from "../Context";
import {VkMessage} from "../service/VkMessagesService";
import {secondsToHumanReadable} from "../util/StringUtil";

export default class StopCommand extends Command {
    constructor(context: Context, private triggerWord: string) {
        super(context);
    }

    canYouHandleThisCommand(command: string, message: VkMessage): boolean {
        return ["stop", "end", "finish", "стоп", "закончить"].includes(command);
    }

    getCanonicalName(): string {
        return "stop";
    }

    requiresPrivileges(peerId: number): boolean {
        return true;
    }

    async handle(command: string, restArgs: string, message: VkMessage): Promise<void> {
        const {vkMessagesService, chatSettingsService, boardService} = this.context;

        const mode = restArgs.split(' ')[0];
        restArgs = restArgs.substring(mode.length).trim();

        if (mode == 'help' || mode == 'помощь') {
            await vkMessagesService.sendDisposable(message.peerId, this.getUsage());
            return;
        }

        const chatSettings = await chatSettingsService.getSettingsOrCreateDefault(message.peerId);
        if (!chatSettings.pixelBattleStarted) {
            await vkMessagesService.send(message.peerId, "Баттл не начинался");
            return;
        }

        if (mode == 'in' || mode == 'через') {
            const time = this.parseSeconds(restArgs);
            await chatSettingsService.setBattleStopTime(message.peerId, new Date(Date.now() + time * 1000));
            const humanReadableTime = secondsToHumanReadable(time);
            await vkMessagesService.send(message.peerId, `Баттл закончится через ${humanReadableTime}`);
            return;
        }

        let showFinalPicture = mode != 'noimage' && mode != 'no_image' && mode != 'no-image';
        await boardService.endBattle(message.peerId, showFinalPicture);
        await chatSettingsService.setAutoRestartMode(message.peerId, 'none');
    }

    private parseSeconds(time: string): number {
        const timeRegex = /(\d+)([smhdсмчд])/g;
        let result = 0;
        let match;
        while ((match = timeRegex.exec(time)) != null) {
            const value = parseInt(match[1]);
            const unit = match[2];
            switch (unit) {
                case 's':
                case 'с': // cyrillic
                    result += value;
                    break;
                case 'm':
                case 'м': // cyrillic
                    result += value * 60;
                    break;
                case 'h':
                case 'ч': // cyrillic
                    result += value * 60 * 60;
                    break;
                case 'd':
                case 'д': // cyrillic
                    result += value * 60 * 60 * 24;
                    break;
            }
        }
        return result;
    }

    private getUsage(): string {
        let result = ``;
        result += `Закончить баттл сейчас:\n`;
        result += `/${this.triggerWord} stop\n`;
        result += `\n`;
        result += `Закончить через время:\n`;
        result += `/${this.triggerWord} stop in 3d 12h\n`;
        result += `\n`;
        result += `Без картинки:\n`;
        result += `/${this.triggerWord} noimage\n`;
        return result;
    }
}