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
    private static final Font LABEL_FONT = new Font("Arial", Font.PLAIN, 24);
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
            return createErrorMessageImage("[!] Settings not found");
        }
        if (chatSettings.getBoardWidth() < 0 || chatSettings.getBoardHeight() < 0) {
            return createErrorMessageImage("[!] Invalid board size");
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
            var drawWidth = imageWidth - PADDING * 2;
            var drawHeight = imageHeight - PADDING * 2;
            var gridMinX = (int) -Math.ceil(chatSettings.getBoardWidth()/2.0) + 1;
            var gridMaxX = (int) Math.floor(chatSettings.getBoardWidth()/2.0) + 1;
            var gridMinY = (int) -Math.ceil(chatSettings.getBoardHeight()/2.0) + 1;
            var gridMaxY = (int) Math.floor(chatSettings.getBoardHeight()/2.0) + 1;
            drawFreePixelDots(
                    graphics,
                    PADDING,
                    PADDING,
                    drawWidth,
                    drawHeight,
                    gridMinX,
                    gridMaxX,
                    gridMinY,
                    gridMaxY
            );
            drawAxisLabels(
                    graphics,
                    PADDING,
                    PADDING,
                    drawWidth,
                    drawHeight,
                    gridMinX,
                    gridMaxX,
                    gridMinY,
                    gridMaxY
            );
        }
        for (var boardDrawLog : boardDrawLogs) {

            var transform = AffineTransform.getTranslateInstance(0, 0);
            if (grid) {
                transform.translate(PADDING, PADDING);
            }
            transform.scale(PIXEL_SIZE, PIXEL_SIZE);
            graphics.setTransform(transform);
            graphics.setColor(boardDrawLog.getColor());
            graphics.fillRect(
                    (int) (boardDrawLog.getX() + Math.ceil(chatSettings.getBoardWidth()/2.0) - 1),
                    (int) (-boardDrawLog.getY() + Math.floor(chatSettings.getBoardHeight()/2.0)),
                    1, 1
            );
        }
        graphics.dispose();
        return image;
    }

    private void drawAxisLabels(
            Graphics2D graphics,
            double drawX,
            double drawY,
            double drawWidth,
            double drawHeight,
            int gridMinX,
            int gridMaxX,
            int gridMinY,
            int gridMaxY
    ) {
        if (gridMinX >= gridMaxX || gridMinY >= gridMaxY) {
            return;
        }
        var gridWidth = gridMaxX - gridMinX;
        var gridHeight = gridMaxY - gridMinY;
        graphics.setTransform(AffineTransform.getTranslateInstance(0, 0));

        graphics.setFont(LABEL_FONT.deriveFont(24.0f));
        var metrics = graphics.getFontMetrics();

        graphics.setColor(new Color(0f, 0f, 0.5f, 0.2f));
        for (int columnX = 0; columnX < gridWidth; columnX++) {
            var x = gridMinX + columnX;
            if (x % 5 != 0 || x == 0)
                continue;
            var text = String.valueOf(x);
            if (x > 0)
                text = "+" + text;
            var textX = (float) (drawX + drawWidth * (columnX + 0.5)/gridWidth - metrics.stringWidth(text)/2.0);
            var textY = (float) (drawY + drawHeight + metrics.getHeight() + 0.5);
            graphics.drawString(text, textX, textY);
        }
        graphics.setColor(new Color(0.5f, 0f, 0f, 0.2f));
        for (int rowY = 0; rowY < gridHeight; rowY++) {
            var y = gridMinY + rowY;
            if (y % 5 != 0 || y == 0)
                continue;
            var text = String.valueOf(y);
            if (y > 0)
                text = "+" + text;
            var textX = (float) (drawX - metrics.stringWidth(text));
            var textY = (float) (drawY + drawHeight - drawHeight * (rowY + 0.5)/gridHeight + metrics.getAscent()/2.5);
            graphics.drawString(text, textX, textY);
        }
        graphics.setColor(new Color(0f, 0f, 0.6f, 0.4f));
        var xTextY = (float) (drawY + drawHeight - drawHeight * (-gridMinY + 0.5)/gridHeight + metrics.getAscent()/2.5);
        graphics.drawString(
                "-X",
                (float) (drawX - metrics.stringWidth("-X")),
                xTextY
        );
        graphics.drawString(
                "+X",
                (float) (drawX + drawWidth),
                xTextY
        );
        graphics.setColor(new Color(0.6f, 0f, 0f, 0.4f));
        double yTextXBase = drawX + drawWidth * (-gridMinX + 0.5) / gridWidth;
        graphics.drawString(
                "-Y",
                (float) (yTextXBase - metrics.stringWidth("-Y")/2.0),
                (float) (drawY + drawHeight + metrics.getHeight())
        );
        graphics.drawString(
                "+Y",
                (float) (yTextXBase - metrics.stringWidth("+Y")/2.0),
                (float) drawY
        );
    }

    private void drawFreePixelDots(
            Graphics2D graphics,
            double drawX,
            double drawY,
            double drawWidth,
            double drawHeight,
            int gridMinX,
            int gridMaxX,
            int gridMinY,
            int gridMaxY
    ) {
        if (gridMinX >= gridMaxX || gridMinY >= gridMaxY) {
            return;
        }
        var gridWidth = gridMaxX - gridMinX;
        var gridHeight = gridMaxY - gridMinY;
        var transform = AffineTransform.getTranslateInstance(drawX, drawY);
        transform.scale(drawWidth/gridWidth, drawHeight/gridHeight);
        graphics.setTransform(transform);

        for (int columnX = 0; columnX < gridWidth; columnX++) {
            var x = gridMinX + columnX;
            for (int rowY = 0; rowY < gridHeight; rowY++) {
                var y = gridMinY + rowY;
                graphics.setColor(new Color(0f, 0f, 0f, 0.05f));
                if (x == 0 && y == 0) {
                    graphics.setColor(new Color(0.5f, 0f, 0.5f, 0.25f));
                } else if (x == 0) {
                    graphics.setColor(new Color(0.5f, 0f, 0f, 0.25f));
                } else if (y == 0) {
                    graphics.setColor(new Color(0f, 0f, 0.5f, 0.25f));
                } else if (x % 5 == 0 || y % 5 == 0) {
                    graphics.setColor(new Color(0f, 0f, 0f, 0.25f));
                }
                graphics.fill(new Arc2D.Double(columnX + 0.4, gridHeight - rowY - 0.6, 0.2, 0.2, 0, 360, Arc2D.OPEN));
            }
        }
    }

    private BufferedImage createErrorMessageImage(String message) {
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
