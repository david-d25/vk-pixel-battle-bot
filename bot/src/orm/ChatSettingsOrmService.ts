import {Client} from "pg";
import {Context} from "../Context";
import {AutoRestartMode, ChatSettingsModel} from "../service/ChatSettingsService";
import ServiceError from "../ServiceError";

export type ChatSettingsEntity = {
    peer_id: number,
    bot_enabled: boolean,
    name: string | null,
    pixel_battle_started: boolean,
    board_width: number,
    board_height: number,
    pixel_set_interval_seconds: number,
    last_start_time: Date | null,
    battle_stop_time: Date | null,
    auto_restart_mode: string,
    last_disposable_message_id: number | null,
}

export default class ChatSettingsOrmService {
    private client!: Client;
    constructor(private context: Context) {
        context.onReady(this.start.bind(this));
    }

    private async start() {
        this.client = this.context.postgresClient;
        await this.client.query(`
            create table if not exists chat_settings (
                peer_id bigint primary key,
                name text default null,
                bot_enabled boolean default true,
                pixel_battle_started boolean default false,
                board_width integer default 50,
                board_height integer default 50,
                pixel_set_interval_seconds integer default 60,
                last_start_time timestamp default null,
                battle_stop_time timestamp default null,
                auto_restart_mode text default 'none',
                last_disposable_message_id bigint default null
            );
        `);
    }

    async getAll(): Promise<ChatSettingsModel[]> {
        const rows = await this.client.query(
            `select * from chat_settings`
        );
        return rows.rows.map(row => this.entityToModel({...row}));
    }

    async getSettings(peerId: number): Promise<ChatSettingsModel | null> {
        const rows = await this.client.query(
            `select * from chat_settings where peer_id = $1`,
            [peerId]
        );
        if (rows.rows.length === 0) {
            return null;
        }
        return this.entityToModel({...rows.rows[0]});
    }

    async saveSettings(peerId: number, settings: ChatSettingsModel): Promise<ChatSettingsModel> {
        const entity = this.modelToEntity(settings, peerId);
        const rows = await this.client.query(
            `update chat_settings set 
                name = $2,
                bot_enabled = $3,
                pixel_battle_started = $4,
                board_width = $5,
                board_height = $6,
                pixel_set_interval_seconds = $7,
                last_start_time = $8,
                battle_stop_time = $9,
                auto_restart_mode = $10
            where peer_id = $1
            returning *`,
            [
                entity.peer_id,
                entity.name,
                entity.bot_enabled,
                entity.pixel_battle_started,
                entity.board_width,
                entity.board_height,
                entity.pixel_set_interval_seconds,
                entity.last_start_time,
                entity.battle_stop_time,
                entity.auto_restart_mode,
            ]
        );
        if (rows.rows.length === 0) {
            throw new ServiceError(`Can't save settings for id '${peerId}'`);
        }
        return this.entityToModel({...rows.rows[0]});
    }

    async createDefaultSettings(peerId: number): Promise<ChatSettingsModel> {
        const rows = await this.client.query(
            `insert into chat_settings (peer_id) values ($1) on conflict (peer_id) do nothing returning *`,
            [peerId]
        );
        if (rows.rows.length === 0) {
            throw new ServiceError(`Can't create default settings for id '${peerId}'`);
        }
        return this.entityToModel({...rows.rows[0]});
    }

    async setLastDisposableMessageId(peerId: number, lastDisposableMessageId: number | null): Promise<void> {
        await this.client.query(
            `update chat_settings set last_disposable_message_id = $2 where peer_id = $1`,
            [peerId, lastDisposableMessageId]
        );
    }

    private modelToEntity(model: ChatSettingsModel, peerId: number): ChatSettingsEntity {
        return {
            peer_id: peerId,
            bot_enabled: model.botEnabled,
            name: model.nameCached,
            pixel_battle_started: model.pixelBattleStarted,
            board_width: model.boardWidth,
            board_height: model.boardHeight,
            pixel_set_interval_seconds: model.pixelSetIntervalSeconds,
            last_start_time: model.lastStartTime,
            battle_stop_time: model.battleStopTime,
            auto_restart_mode: model.autoRestartMode,
            last_disposable_message_id: model.lastDisposableMessageId,
        }
    }

    private entityToModel(entity: ChatSettingsEntity): ChatSettingsModel {
        return {
            peerId: entity.peer_id,
            botEnabled: entity.bot_enabled,
            nameCached: entity.name,
            pixelBattleStarted: entity.pixel_battle_started,
            boardWidth: entity.board_width,
            boardHeight: entity.board_height,
            pixelSetIntervalSeconds: entity.pixel_set_interval_seconds,
            lastStartTime: entity.last_start_time,
            battleStopTime: entity.battle_stop_time,
            autoRestartMode: this.sanitizeAutoRestartMode(entity.auto_restart_mode),
            lastDisposableMessageId: entity.last_disposable_message_id,
        }
    }

    private sanitizeAutoRestartMode(mode: string | null): AutoRestartMode {
        if (mode == null)
            return 'none';
        mode = mode.toLowerCase();
        if (mode === 'none' || mode === 'daily' || mode === 'weekly' || mode === 'on_board_fill')
            return mode;
        return 'none';
    }
}
