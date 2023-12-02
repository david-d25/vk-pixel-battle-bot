import {Client} from "pg";
import ConfigService from "./service/ConfigService";
import ChatSettingsOrmService from "./orm/ChatSettingsOrmService";
import DrawLogOrmService from "./orm/DrawLogOrmService";
import VkMessagesService from "./service/VkMessagesService";
import VkUsersService from "./service/VkUsersService";
import {VK} from "vk-io";
import ChatSettingsService from "./service/ChatSettingsService";
import BotService from "./service/BotService";
import ChatAdminsOrmService from "./orm/ChatAdminsOrmService";
import UserPermissionsService from "./service/UserPermissionsService";
import BoardService from "./service/BoardService";
import AppCeosOrmService from "./orm/AppCeosOrmService";

export class Context {
    configService!: ConfigService;
    postgresClient!: Client;
    vk!: VK;

    chatSettingsOrmService!: ChatSettingsOrmService;
    chatAdminsOrmService!: ChatAdminsOrmService;
    drawLogOrmService!: DrawLogOrmService;
    appCeosOrmService!: AppCeosOrmService;

    botService!: BotService;
    userPermissionsService!: UserPermissionsService;
    vkMessagesService!: VkMessagesService;
    vkUsersService!: VkUsersService;
    chatSettingsService!: ChatSettingsService;
    boardService!: BoardService;

    readyFlag = false;
    readyListeners: (() => void)[] = [];

    onReady(listener: () => void) {
        if (this.readyFlag) {
            listener();
        } else {
            this.readyListeners.push(listener);
        }
    }

    ready() {
        this.readyFlag = true;
        this.readyListeners.forEach(listener => listener());
    }
}