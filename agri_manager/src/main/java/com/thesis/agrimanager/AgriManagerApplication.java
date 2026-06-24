package com.thesis.agrimanager;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;

@SpringBootApplication
public class AgriManagerApplication {

	// Εκκινεί την εφαρμογή.
	public static void main(String[] args) {
		SpringApplication.run(AgriManagerApplication.class, args);
	}

	// Δηλώνει bean ρύθμισης.
	@Bean
	public RestTemplate restTemplate() {
		return new RestTemplate();
	}
}

