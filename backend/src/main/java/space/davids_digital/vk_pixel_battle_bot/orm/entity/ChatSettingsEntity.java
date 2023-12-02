package space.davids_digital.vk_pixel_battle_bot.orm.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_settings")
public class ChatSettingsEntity {
    @Id
    @Column(name = "peer_id")
    public long peerId;

    @Column(name = "name")
    public String name;

    @Column(name = "bot_enabled")
    public boolean botEnabled;

    @Column(name = "pixel_battle_started")
    public boolean pixelBattleStarted;

    @Column(name = "board_width")
    public int boardWidth;

    @Column(name = "board_height")
    public int boardHeight;

    @Column(name = "pixel_set_interval_seconds")
    public int pixelSetIntervalSeconds;

    @Column(name = "last_start_time")
    public LocalDateTime lastStartTime;

    @Column(name = "battle_stop_time")
    public LocalDateTime battleStopTime;

    @Column(name = "auto_restart_mode")
    public String autoRestartMode;
}
