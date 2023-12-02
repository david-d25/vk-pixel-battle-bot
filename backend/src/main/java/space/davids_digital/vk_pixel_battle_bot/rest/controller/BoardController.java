package space.davids_digital.vk_pixel_battle_bot.rest.controller;

import space.davids_digital.vk_pixel_battle_bot.service.BoardImageService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import javax.imageio.ImageIO;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

@RestController
@RequestMapping("/board")
public class BoardController {
    private final BoardImageService boardImageService;

    public BoardController(BoardImageService boardImageService) {
        this.boardImageService = boardImageService;
    }

    @ResponseBody
    @GetMapping(value = "{peerId}", produces = MediaType.IMAGE_PNG_VALUE)
    public byte[] lineAggregate(
            @PathVariable long peerId,
            @RequestParam(value = "grid", defaultValue = "true") boolean grid
    ) throws IOException {
        var image = boardImageService.getBoardImage(peerId, grid);
        var stream = new ByteArrayOutputStream();
        ImageIO.write(image, "png", stream);
        return stream.toByteArray();
    }
}
