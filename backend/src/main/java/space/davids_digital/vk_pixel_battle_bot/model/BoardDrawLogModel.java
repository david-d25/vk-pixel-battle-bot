package space.davids_digital.vk_pixel_battle_bot.model;

import java.awt.*;
import java.time.LocalDateTime;
import java.util.Objects;

public class BoardDrawLogModel {
    private long peerId;
    private long userId;
    private int orderId;
    private LocalDateTime time;
    private long x;
    private long y;
    private Color color;

    public BoardDrawLogModel(long peerId, long userId, int orderId, LocalDateTime time, long x, long y, Color color) {
        this.peerId = peerId;
        this.userId = userId;
        this.orderId = orderId;
        this.time = time;
        this.x = x;
        this.y = y;
        this.color = color;
    }

    public long getPeerId() {
        return peerId;
    }

    public void setPeerId(long peerId) {
        this.peerId = peerId;
    }

    public long getUserId() {
        return userId;
    }

    public void setUserId(long userId) {
        this.userId = userId;
    }

    public int getOrderId() {
        return orderId;
    }

    public void setOrderId(int orderId) {
        this.orderId = orderId;
    }

    public LocalDateTime getTime() {
        return time;
    }

    public void setTime(LocalDateTime time) {
        this.time = time;
    }

    public long getX() {
        return x;
    }

    public void setX(long x) {
        this.x = x;
    }

    public long getY() {
        return y;
    }

    public void setY(long y) {
        this.y = y;
    }

    public Color getColor() {
        return color;
    }

    public void setColor(Color color) {
        this.color = color;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        BoardDrawLogModel that = (BoardDrawLogModel) o;

        if (peerId != that.peerId) return false;
        if (userId != that.userId) return false;
        if (orderId != that.orderId) return false;
        if (x != that.x) return false;
        if (y != that.y) return false;
        if (!Objects.equals(time, that.time)) return false;
        return Objects.equals(color, that.color);
    }

    @Override
    public int hashCode() {
        int result = (int) (peerId ^ (peerId >>> 32));
        result = 31 * result + (int) (userId ^ (userId >>> 32));
        result = 31 * result + orderId;
        result = 31 * result + (time != null ? time.hashCode() : 0);
        result = 31 * result + (int) (x ^ (x >>> 32));
        result = 31 * result + (int) (y ^ (y >>> 32));
        result = 31 * result + (color != null ? color.hashCode() : 0);
        return result;
    }
}
