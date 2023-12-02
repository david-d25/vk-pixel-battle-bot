package space.davids_digital.vk_pixel_battle_bot.model;

import java.time.LocalDateTime;
import java.util.Objects;

public class ChatSettingsModel {
    private long peerId;
    private String name;
    private boolean botEnabled;
    private boolean pixelBattleStarted;
    private int boardWidth;
    private int boardHeight;
    private int pixelSetIntervalSeconds;
    private LocalDateTime lastStartTime;
    private LocalDateTime battleStopTime;
    private String autoRestartMode;

    public ChatSettingsModel(
            long peerId,
            String name,
            boolean botEnabled,
            boolean pixelBattleStarted,
            int boardWidth,
            int boardHeight,
            int pixelSetIntervalSeconds,
            LocalDateTime lastStartTime,
            LocalDateTime battleStopTime,
            String autoRestartMode
    ) {
        this.peerId = peerId;
        this.name = name;
        this.botEnabled = botEnabled;
        this.pixelBattleStarted = pixelBattleStarted;
        this.boardWidth = boardWidth;
        this.boardHeight = boardHeight;
        this.pixelSetIntervalSeconds = pixelSetIntervalSeconds;
        this.lastStartTime = lastStartTime;
        this.battleStopTime = battleStopTime;
        this.autoRestartMode = autoRestartMode;
    }

    public long getPeerId() {
        return peerId;
    }

    public void setPeerId(long peerId) {
        this.peerId = peerId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public boolean isBotEnabled() {
        return botEnabled;
    }

    public void setBotEnabled(boolean botEnabled) {
        this.botEnabled = botEnabled;
    }

    public boolean isPixelBattleStarted() {
        return pixelBattleStarted;
    }

    public void setPixelBattleStarted(boolean pixelBattleStarted) {
        this.pixelBattleStarted = pixelBattleStarted;
    }

    public int getBoardWidth() {
        return boardWidth;
    }

    public void setBoardWidth(int boardWidth) {
        this.boardWidth = boardWidth;
    }

    public int getBoardHeight() {
        return boardHeight;
    }

    public void setBoardHeight(int boardHeight) {
        this.boardHeight = boardHeight;
    }

    public int getPixelSetIntervalSeconds() {
        return pixelSetIntervalSeconds;
    }

    public void setPixelSetIntervalSeconds(int pixelSetIntervalSeconds) {
        this.pixelSetIntervalSeconds = pixelSetIntervalSeconds;
    }

    public LocalDateTime getLastStartTime() {
        return lastStartTime;
    }

    public void setLastStartTime(LocalDateTime lastStartTime) {
        this.lastStartTime = lastStartTime;
    }

    public LocalDateTime getBattleStopTime() {
        return battleStopTime;
    }

    public void setBattleStopTime(LocalDateTime battleStopTime) {
        this.battleStopTime = battleStopTime;
    }

    public String getAutoRestartMode() {
        return autoRestartMode;
    }

    public void setAutoRestartMode(String autoRestartMode) {
        this.autoRestartMode = autoRestartMode;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        ChatSettingsModel that = (ChatSettingsModel) o;

        if (peerId != that.peerId) return false;
        if (botEnabled != that.botEnabled) return false;
        if (pixelBattleStarted != that.pixelBattleStarted) return false;
        if (boardWidth != that.boardWidth) return false;
        if (boardHeight != that.boardHeight) return false;
        if (pixelSetIntervalSeconds != that.pixelSetIntervalSeconds) return false;
        if (!Objects.equals(name, that.name)) return false;
        if (!Objects.equals(lastStartTime, that.lastStartTime))
            return false;
        if (!Objects.equals(battleStopTime, that.battleStopTime))
            return false;
        return Objects.equals(autoRestartMode, that.autoRestartMode);
    }

    @Override
    public int hashCode() {
        int result = (int) (peerId ^ (peerId >>> 32));
        result = 31 * result + (name != null ? name.hashCode() : 0);
        result = 31 * result + (botEnabled ? 1 : 0);
        result = 31 * result + (pixelBattleStarted ? 1 : 0);
        result = 31 * result + boardWidth;
        result = 31 * result + boardHeight;
        result = 31 * result + pixelSetIntervalSeconds;
        result = 31 * result + (lastStartTime != null ? lastStartTime.hashCode() : 0);
        result = 31 * result + (battleStopTime != null ? battleStopTime.hashCode() : 0);
        result = 31 * result + (autoRestartMode != null ? autoRestartMode.hashCode() : 0);
        return result;
    }
}
