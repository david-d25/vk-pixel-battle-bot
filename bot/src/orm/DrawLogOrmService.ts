import {Client} from 'pg';
import {Context} from "../Context";
import {DrawLogModel} from "../service/BoardService";

export default class DrawLogOrmService {
    private client!: Client;
    constructor(private context: Context) {
        context.onReady(this.start.bind(this));
    }

    async start() {
        this.client = this.context.postgresClient!;
        const q = this.client.query.bind(this.client);
        await q(`
            create table if not exists board_draw_log (
                peer_id bigint,
                user_id bigint,
                order_id serial,
                time timestamp,
                x bigint,
                y bigint,
                color_rgb bigint,
                primary key (peer_id, user_id, order_id)
            );
        `);
        await q(`create index if not exists board_draw_log__peer_id_idx on board_draw_log (peer_id)`);
        await q(`create index if not exists board_draw_log__peer_id_user_id_idx on board_draw_log (peer_id, user_id)`);
    }

    async getDrawLogs(peerId: number): Promise<DrawLogModel[]> {
        const q = this.client.query.bind(this.client);
        const result = await q(`
            select peer_id, user_id, order_id, time, x, y, color_rgb
            from board_draw_log
            where peer_id = $1
            order by order_id;
        `, [peerId]);
        return result.rows.map(row => ({
            peerId: +row.peer_id,
            userId: +row.user_id,
            orderId: +row.order_id,
            time: new Date(row.time),
            x: +row.x,
            y: +row.y,
            colorRgb: +row.color_rgb,
        }));
    }

    async getUserLastDrawLogTime(peerId: number, userId: number): Promise<Date | null> {
        const q = this.client.query.bind(this.client);
        const result = await q(`
            select time
            from board_draw_log
            where peer_id = $1 and user_id = $2
            order by order_id desc
            limit 1;
        `, [peerId, userId]);
        if (result.rows.length == 0) {
            return null;
        }
        return new Date(result.rows[0].time);
    }

    async addDrawLog(peerId: number, userId: number, x: number, y: number, colorRgb: number): Promise<void> {
        const q = this.client.query.bind(this.client);
        await q(`
            insert into board_draw_log (peer_id, user_id, time, x, y, color_rgb)
            values ($1, $2, now(), $3, $4, $5);
        `, [peerId, userId, x, y, colorRgb]);
    }

    async clearDrawLog(peerId: number): Promise<void> {
        const q = this.client.query.bind(this.client);
        await q(`
            delete from board_draw_log
            where peer_id = $1;
        `, [peerId]);
    }

    async countDrawLogs(peerId: number): Promise<number> {
        const q = this.client.query.bind(this.client);
        const result = await q(`
            select count(*)
            from board_draw_log
            where peer_id = $1;
        `, [peerId]);
        return +result.rows[0].count;
    }
}