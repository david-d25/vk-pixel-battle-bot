import {Context} from "../Context";
import {VkMessage} from "../service/VkMessagesService";

export default class Command {
    constructor(protected context: Context) {}

    canYouHandleThisCommand(command: string, message: VkMessage): boolean {
        return false;
    }

    getCanonicalName(): string {
        return "";
    }

    requiresPrivileges(peerId: number): boolean {
        return false;
    }

    async handle(command: string, rawArguments: string, message: VkMessage): Promise<void> {
        return Promise.resolve();
    }
}