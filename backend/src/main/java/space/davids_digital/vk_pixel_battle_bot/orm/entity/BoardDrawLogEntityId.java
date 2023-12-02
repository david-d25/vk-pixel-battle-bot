package space.davids_digital.vk_pixel_battle_bot.orm.entity;

import java.io.Serializable;

public class BoardDrawLogEntityId implements Serializable {
    public long peerId;
    public long userId;
    public int orderId;

    public BoardDrawLogEntityId() {}

    public BoardDrawLogEntityId(long peerId, long userId, int orderId) {
        this.peerId = peerId;
        this.userId = userId;
        this.orderId = orderId;


    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        BoardDrawLogEntityId that = (BoardDrawLogEntityId) o;

        if (peerId != that.peerId) return false;
        if (userId != that.userId) return false;
        return orderId == that.orderId;
    }

    @Override
    public int hashCode() {
        int result = (int) (peerId ^ (peerId >>> 32));
        result = 31 * result + (int) (userId ^ (userId >>> 32));
        result = 31 * result + orderId;
        return result;
    }
}
