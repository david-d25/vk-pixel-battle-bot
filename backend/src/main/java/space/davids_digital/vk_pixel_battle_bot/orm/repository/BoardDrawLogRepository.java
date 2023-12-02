package space.davids_digital.vk_pixel_battle_bot.orm.repository;

import space.davids_digital.vk_pixel_battle_bot.orm.entity.BoardDrawLogEntity;
import space.davids_digital.vk_pixel_battle_bot.orm.entity.BoardDrawLogEntityId;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BoardDrawLogRepository extends CrudRepository<BoardDrawLogEntity, BoardDrawLogEntityId> {
    List<BoardDrawLogEntity> findAllByPeerIdOrderByOrderId(long peerId);
}
