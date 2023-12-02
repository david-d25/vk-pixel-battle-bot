package space.davids_digital.vk_pixel_battle_bot.orm.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@IdClass(BoardDrawLogEntityId.class)
@Table(name = "board_draw_log")
public class BoardDrawLogEntity {
    @Id
    @Column(name = "peer_id")
    public long peerId;

    @Id
    @Column(name = "user_id")
    public long userId;

    @Id
    @Column(name = "order_id")
    public int orderId;

    @Column(name = "time")
    public LocalDateTime time;

    @Column(name = "x")
    public long x;

    @Column(name = "y")
    public long y;

    @Column(name = "color_rgb")
    public long colorRgb;
}
