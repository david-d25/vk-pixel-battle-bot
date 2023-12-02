package space.davids_digital.vk_pixel_battle_bot.service;

import space.davids_digital.vk_pixel_battle_bot.orm.service.BoardDrawLogOrmService;
import org.springframework.stereotype.Service;
import space.davids_digital.vk_pixel_battle_bot.orm.service.ChatSettingsOrmService;

import java.awt.*;
import java.awt.geom.AffineTransform;
import java.awt.geom.Arc2D;
import java.awt.image.BufferedImage;

@Service
public class BoardImageService {
    private static final Font LABEL_FONT = new Font("Arial", Font.PLAIN, 16);
    private final BoardDrawLogOrmService boardDrawLogOrmService;
    private final ChatSettingsOrmService chatSettingsOrmService;
    private static final int PADDING = 75;
    private static final int PIXEL_SIZE = 25;

    public BoardImageService(
            BoardDrawLogOrmService boardDrawLogOrmService,
            ChatSettingsOrmService chatSettingsOrmService
    ) {
        this.boardDrawLogOrmService = boardDrawLogOrmService;
        this.chatSettingsOrmService = chatSettingsOrmService;
    }

    public BufferedImage getBoardImage(long peerId, boolean grid) {
        var chatSettings = chatSettingsOrmService.getChatSettingsByPeerId(peerId);
        if (chatSettings == null) {
            return drawErrorMessage("[!] Settings not found");
        }
        if (chatSettings.getBoardWidth() < 0 || chatSettings.getBoardHeight() < 0) {
            return drawErrorMessage("[!] Invalid board size");
        }

        var boardDrawLogs = boardDrawLogOrmService.getDrawLogsByPeerId(peerId);
        var imageWidth = grid ? chatSettings.getBoardWidth() * PIXEL_SIZE + PADDING * 2
                : chatSettings.getBoardWidth() * PIXEL_SIZE;
        var imageHeight = grid ? chatSettings.getBoardHeight() * PIXEL_SIZE + PADDING * 2
                : chatSettings.getBoardHeight() * PIXEL_SIZE;
        var image = new BufferedImage(imageWidth, imageHeight, BufferedImage.TYPE_INT_RGB);

        var graphics = image.createGraphics();
        graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        graphics.setColor(Color.WHITE);
        graphics.fillRect(0, 0, image.getWidth(), image.getHeight());
        if (grid) {
            graphics.translate(PADDING, PADDING);
        }
        graphics.scale(PIXEL_SIZE, PIXEL_SIZE);
        if (grid) {
            drawFreePixelDots(graphics, chatSettings.getBoardWidth(), chatSettings.getBoardHeight());
        }
        for (var boardDrawLog : boardDrawLogs) {
            graphics.setColor(boardDrawLog.getColor());
            graphics.fillRect((int) boardDrawLog.getX(), (int) boardDrawLog.getY(), 1, 1);
        }
        graphics.setTransform(AffineTransform.getTranslateInstance(0, 0));
        if (grid) {
            drawPixelGrid(graphics, chatSettings.getBoardWidth(), chatSettings.getBoardHeight());
        }
        graphics.dispose();
        return image;
    }

    private void drawPixelGrid(Graphics2D graphics, int width, int height) {
        graphics.translate(PADDING, PADDING);
        graphics.scale(PIXEL_SIZE, PIXEL_SIZE);
        graphics.setColor(new Color(0f, 0f, 0f, 0.025f));
        graphics.setStroke(new BasicStroke(0.1f));
        for (int x = 0; x <= width; x++) {
            graphics.drawLine(x, 0, x, height);
        }
        for (int y = 0; y <= height; y++) {
            graphics.drawLine(0, y, width, y);
        }
        graphics.setColor(new Color(0f, 0f, 0f, 0.05f));
        graphics.setStroke(new BasicStroke(0.2f));
        for (int x = 0; x <= width; x += 10) {
            graphics.drawLine(x, 0, x, height);
        }
        for (int y = 0; y <= height; y += 10) {
            graphics.drawLine(0, y, width, y);
        }
        graphics.setColor(new Color(0f, 0f, 0f, 0.1f));
        graphics.setFont(LABEL_FONT.deriveFont(1.5f));
        for (int x = 0; x < width; x += 10) {
            var metrics = graphics.getFontMetrics();
            var text = String.valueOf(x);
            graphics.drawString(text, x + 0.1f, -0.5f);
            graphics.drawString(text, x + 0.1f, height + metrics.getDescent() + 0.5f);
        }
        for (int y = 0; y < height; y += 10) {
            var metrics = graphics.getFontMetrics();
            var text = String.valueOf(y);
            graphics.drawString(text, -metrics.stringWidth(text) - 0.5f, y + metrics.getDescent() + 0.1f);
            graphics.drawString(text, width + 0.5f, y + metrics.getDescent() + 0.1f);
        }
    }

    private void drawFreePixelDots(Graphics2D graphics2D, int width, int height) {
        graphics2D.setColor(new Color(0f, 0f, 0f, 0.05f));
        for (int x = 0; x < width; x++) {
            for (int y = 0; y < height; y++) {
                graphics2D.fill(new Arc2D.Double(x + 0.4, y + 0.4, 0.2, 0.2, 0, 360, Arc2D.OPEN));
            }
        }
    }

    private BufferedImage drawErrorMessage(String message) {
        var image = new BufferedImage(250, 100, BufferedImage.TYPE_INT_RGB);
        var graphics = image.createGraphics();
        graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        graphics.setColor(Color.WHITE);
        graphics.fillRect(0, 0, image.getWidth(), image.getHeight());
        graphics.setColor(Color.BLACK);
        graphics.setFont(LABEL_FONT);
        var metrics = graphics.getFontMetrics();
        var textWidth = metrics.stringWidth(message);
        graphics.drawString(message, (image.getWidth() - textWidth) / 2f, image.getHeight() / 2f);
        graphics.dispose();
        return image;
    }
}
