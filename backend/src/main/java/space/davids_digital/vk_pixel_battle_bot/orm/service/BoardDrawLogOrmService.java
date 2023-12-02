package space.davids_digital.vk_pixel_battle_bot.orm.service;

import space.davids_digital.vk_pixel_battle_bot.model.BoardDrawLogModel;
import space.davids_digital.vk_pixel_battle_bot.orm.entity.BoardDrawLogEntity;
import space.davids_digital.vk_pixel_battle_bot.orm.repository.BoardDrawLogRepository;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.util.List;

@Service
public class BoardDrawLogOrmService {
    private final BoardDrawLogRepository boardDrawLogRepository;

    public BoardDrawLogOrmService(BoardDrawLogRepository boardDrawLogRepository) {
        this.boardDrawLogRepository = boardDrawLogRepository;
    }

    public List<BoardDrawLogModel> getDrawLogsByPeerId(long peerId) {
        return boardDrawLogRepository.findAllByPeerIdOrderByOrderId(peerId).stream().map(this::toModel).toList();
    }

    private BoardDrawLogModel toModel(BoardDrawLogEntity e) {
        return new BoardDrawLogModel(e.peerId, e.userId, e.orderId, e.time, e.x, e.y, new Color((int) e.colorRgb));
    }
}
