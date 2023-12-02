import Command from "./Command";
import {Context} from "../Context";
import {VkMessage} from "../service/VkMessagesService";
import {version} from "../main";

export default class HelpCommand extends Command {
    constructor(context: Context) {
        super(context);
    }

    getCanonicalName(): string {
        return 'help';
    }

    canYouHandleThisCommand(command: string, message: VkMessage): boolean {
        return command === 'help' || command === '';
    }

    requiresPrivileges(peerId: number): boolean {
        return false;
    }

    async handle(command: string, rawArguments: string, message: VkMessage): Promise<void> {
        const { vkMessagesService, botService, userPermissionsService } = this.context;
        const userPrivileged = await userPermissionsService.isUserPrivileged(message.peerId, message.fromId);
        let response = '';
        response += `Pixel Battle v${version}\n\n`;
        response += `Вот что можно сделать:\n`
        const triggerWords = botService.getTriggerWords();
        for (const triggerWord in triggerWords) {
            const commands = triggerWords[triggerWord];
            for (const command of commands) {
                if (command.requiresPrivileges(message.peerId) && !userPrivileged)
                    continue;
                response += `!${triggerWord} ${command.getCanonicalName()}\n`
            }
        }

        if (userPrivileged) {
            response += `\nАдминские команды:\n`
            for (const triggerWord in triggerWords) {
                const commands = triggerWords[triggerWord];
                for (const command of commands) {
                    if (command.requiresPrivileges(message.peerId) && userPrivileged)
                        response += `!${triggerWord} ${command.getCanonicalName()}\n`
                }
            }
        }
        await vkMessagesService.sendDisposable(message.peerId, response);
    }
}