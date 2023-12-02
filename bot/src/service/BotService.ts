import VkMessagesService, {VkMessage} from "service/VkMessagesService";
import ChatSettingsService from "service/ChatSettingsService";
import {Context} from "../Context";
import {getRandomBotEnablingPhrase} from "../template/BotEnablingPhrases";
import Command from "../command/Command";
import ServiceError from "../ServiceError";

export default class BotService {
    private static readonly COMMAND_START_SYMBOLS = ["/", "!", "+"];
    private messagesService!: VkMessagesService;
    private chatSettingsService!: ChatSettingsService;
    private taggingHandler: Command | null = null
    private triggerWords: { [key: string]: Command[] } = {};

    constructor(private context: Context) {
        context.onReady(this.start.bind(this));
    }

    addCommand(triggerWord: string, handler: Command) {
        if (this.triggerWords[triggerWord] == null)
            this.triggerWords[triggerWord] = [];
        this.triggerWords[triggerWord].push(handler);
    }

    setTaggingHandler(handler: Command) {
        this.taggingHandler = handler;
    }

    getTriggerWords(): { [key: string]: Command[] } {
        return this.triggerWords;
    }

    private start() {
        this.messagesService = this.context.vkMessagesService;
        this.chatSettingsService = this.context.chatSettingsService;
        this.tick().then(_ => {});
    }

    private async tick() {
        try {
            const messages = this.messagesService.popSinglePeerIdMessages();
            for (const message of messages) {
                await this.processIncomingMessage(message)
            }
            setTimeout(() => this.tick(), 250);
        } catch (e) {
            console.error("Something bad happened, will retry soon\n", e);
            setTimeout(() => this.tick(), 10000);
        }
    }

    private async processIncomingMessage(message: VkMessage) {
        if (message.text == null ||
            message.fromId == -this.context.configService.getAppConfig().vkGroupId ||
            message.fromId == 0 ||
            message.text.trim().length == 0
        ) return;

        const text = message.text.trim();
        const commandStartSymbol = BotService.COMMAND_START_SYMBOLS.find(symbol => text.startsWith(symbol));
        if (commandStartSymbol != null) {
            await this.processCommandMessage(commandStartSymbol, message);
        } else if (this.isBotTaggedInThisMessage(message)) {
            await this.processTaggingMessage(message);
        }
    }

    private async processTaggingMessage(message: VkMessage) {
        if (this.taggingHandler == null)
            return;
        let chatSettings = await this.context.chatSettingsService.getSettingsOrCreateDefault(message.peerId);
        if (!chatSettings.botEnabled) {
            console.log(`[${message.peerId}] Bot is disabled, ignoring tagging`);
            return;
        }

        console.log(`[${message.peerId}] Got tagging message: ${message.text}`);
        try {
            await this.taggingHandler.handle("", message.text!, message);
        } catch (e) {
            await this.messagesService.send(message.peerId, `Не тегай меня`);
        }
    }

    private async processCommandMessage(commandStartSymbol: string, message: VkMessage) {
        let chatSettings = await this.context.chatSettingsService.getSettingsOrCreateDefault(message.peerId);

        const text = message.text!.trim();
        const triggerWord = text.slice(commandStartSymbol.length).split(" ")[0];
        if (triggerWord == null)
            return;
        const commandHandlers = this.triggerWords[triggerWord];
        if (commandHandlers == null)
            return;
        const refinedCommandString = text.slice(commandStartSymbol.length + triggerWord.length).trim();
        const commandName = refinedCommandString.split(" ")[0];

        // TODO this is shitty design approach
        if (triggerWord == "pb" && (commandName == "enable" || commandName == "on")) {
            const privileged = await this.context.userPermissionsService.isUserPrivileged(
                message.peerId,
                message.fromId
            );
            if (!privileged) {
                await this.messagesService.send(
                    message.peerId,
                    `Только админ может включить Pixel Battle`
                );
                return;
            }
            if (chatSettings.botEnabled) {
                await this.messagesService.send(message.peerId, "Бот уже включён");
                return;
            }
            await this.chatSettingsService.setBotEnabled(message.peerId, true);
            console.log(`[${message.peerId}] Bot enabled`);
            await this.messagesService.send(message.peerId, getRandomBotEnablingPhrase());
            return;
        }

        if (!chatSettings.botEnabled) {
            console.log(`[${message.peerId}] Bot is disabled, ignoring command`);
            return;
        }

        console.log(`[${message.peerId}] Got command message: ${message.text}`);

        const argumentsRaw = refinedCommandString.slice(commandName.length).trim();
        for (const command of commandHandlers) {
            if (command.canYouHandleThisCommand(commandName, message)) {
                if (command.requiresPrivileges(message.peerId)) {
                    const privileged = await this.context.userPermissionsService.isUserPrivileged(
                        message.peerId,
                        message.fromId
                    );
                    if (!privileged) {
                        await this.messagesService.send(
                            message.peerId,
                            `Только админ может выполнить '${commandName}'`
                        );
                        return;
                    }
                }
                try {
                    await command.handle(commandName, argumentsRaw, message);
                } catch (e) {
                    console.error(`[${message.peerId}] Error while handling command '${commandName}'`, e);
                    if (e instanceof ServiceError) {
                        await this.messagesService.send(message.peerId, `Не могу это сделать (${e.message})`);
                    } else {
                        await this.messagesService.send(message.peerId, `В боте что-то сломалось и он не может ответить`);
                    }
                }
                return;
            }
        }

        await this.handleUnknownCommand(message);
    }

    private async handleUnknownCommand(message: VkMessage) {
        await this.messagesService.send(message.peerId, "Не знаю эту команду. Пиши /pb help");
    }

    private isBotTaggedInThisMessage(message: VkMessage): boolean {
        if (message.text == null)
            return false;
        return new RegExp(`\\[club${this.context.configService.getAppConfig().vkGroupId}\\|.*]`).test(message.text)
    }
}