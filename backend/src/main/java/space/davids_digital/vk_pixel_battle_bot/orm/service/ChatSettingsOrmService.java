package space.davids_digital.vk_pixel_battle_bot.orm.service;

import org.springframework.stereotype.Service;
import space.davids_digital.vk_pixel_battle_bot.model.ChatSettingsModel;
import space.davids_digital.vk_pixel_battle_bot.orm.entity.ChatSettingsEntity;
import space.davids_digital.vk_pixel_battle_bot.orm.repository.ChatSettingsRepository;

@Service
public class ChatSettingsOrmService {
    private final ChatSettingsRepository chatSettingsRepository;

    public ChatSettingsOrmService(ChatSettingsRepository chatSettingsRepository) {
        this.chatSettingsRepository = chatSettingsRepository;
    }

    public ChatSettingsModel getChatSettingsByPeerId(long peerId) {
        return chatSettingsRepository.findById(peerId).map(this::toModel).orElse(null);
    }

    private ChatSettingsModel toModel(ChatSettingsEntity entity) {
        return new ChatSettingsModel(
                entity.peerId,
                entity.name,
                entity.botEnabled,
                entity.pixelBattleStarted,
                entity.boardWidth,
                entity.boardHeight,
                entity.pixelSetIntervalSeconds,
                entity.lastStartTime,
                entity.battleStopTime,
                entity.autoRestartMode
        );
    }
}
