import {VK} from "vk-io";
import {Client} from 'pg';
import VkMessagesService from "./service/VkMessagesService";
import VkUsersService from "./service/VkUsersService";
import BotService from "./service/BotService";
import ConfigService from "./service/ConfigService";
import DrawLogOrmService from "./orm/DrawLogOrmService";
import ChatSettingsOrmService from "./orm/ChatSettingsOrmService";
import ChatSettingsService from "./service/ChatSettingsService";
import {Context} from "./Context";
import HelpCommand from "./command/HelpCommand";
import {exit} from 'node:process';
import ChatAdminsOrmService from "./orm/ChatAdminsOrmService";
import UserPermissionsService from "./service/UserPermissionsService";
import AdminsCommand from "./command/AdminsCommand";
import SetPixelCommand from "./command/SetPixelCommand";
import {StartCommand} from "./command/StartCommand";
import StopCommand from "./command/StopCommand";
import BoardService from "./service/BoardService";
import AppCeosOrmService from "./orm/AppCeosOrmService";
import {ImageCommand} from "./command/ImageCommand";
import DisableCommand from "./command/DisableCommand";

function getAppVersion() {
    const defaultVersion = "(unknown version)";
    try {
        return require("../package.json").version || defaultVersion;
    } catch (e) {
        console.warn("Couldn't get version from package.json");
    }
    return defaultVersion;
}

export const version = getAppVersion();

console.log("Pixel Battle Bot version " + version);

const configService = new ConfigService();
const config = configService.getAppConfig();

const vk = new VK({
    token: config.vkAccessToken,
    pollingGroupId: config.vkGroupId,
    uploadTimeout: 75e3,
    apiTimeout: 75e3,
    language: "ru"
});

const postgresClient = new Client({
    user: config.dbUser,
    host: config.dbHost,
    database: config.dbName,
    password: config.dbPassword,
    port: config.dbPort || 5432,
});

postgresClient.connect((error: any) => {
    if (error) {
        console.error("Couldn't connect to database", error);
        exit(1);
    } else {
        console.log("Connected to database");
        ready().then(() => {});
    }
});

async function ready() {
    const context = new Context();

    context.configService = configService;
    context.postgresClient = postgresClient;
    context.vk = vk;

    context.chatSettingsOrmService = new ChatSettingsOrmService(context);
    context.drawLogOrmService = new DrawLogOrmService(context);
    context.chatAdminsOrmService = new ChatAdminsOrmService(context);
    context.appCeosOrmService = new AppCeosOrmService(context);

    context.botService = new BotService(context);
    context.userPermissionsService = new UserPermissionsService(context);
    context.vkMessagesService = new VkMessagesService(context);
    context.vkUsersService = new VkUsersService(context);
    context.chatSettingsService = new ChatSettingsService(context);
    context.boardService = new BoardService(context);

    context.ready();

    const pbTriggerWords = ['pb', 'пб'];
    for (const triggerWord of pbTriggerWords) {
        context.botService.addCommand(triggerWord, new HelpCommand(context));
        context.botService.addCommand(triggerWord, new AdminsCommand(context, triggerWord));
        context.botService.addCommand(triggerWord, new StartCommand(context, triggerWord));
        context.botService.addCommand(triggerWord, new StopCommand(context, triggerWord));
        context.botService.addCommand(triggerWord, new ImageCommand(context, triggerWord));
        context.botService.addCommand(triggerWord, new DisableCommand(context));
    }

    context.botService.addCommand("draw", new SetPixelCommand(context, "draw"));
    context.botService.addCommand("pixel", new SetPixelCommand(context, "pixel"));
    context.botService.addCommand("px", new SetPixelCommand(context, "px"));
    context.botService.addCommand("пиксель", new SetPixelCommand(context, "пиксель"));
    context.botService.addCommand("пиксел", new SetPixelCommand(context, "пиксел"));
    context.botService.addCommand("п", new SetPixelCommand(context, "п"));
    context.botService.addCommand("покрасить", new SetPixelCommand(context, "покрасить"));
}