package space.davids_digital.vk_pixel_battle_bot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class WebApp {
    public static void main(String[] args) {
        SpringApplication.run(WebConfig.class, args);
    }
}
