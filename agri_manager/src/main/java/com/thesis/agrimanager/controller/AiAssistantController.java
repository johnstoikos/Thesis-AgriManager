package com.thesis.agrimanager.controller;

import com.thesis.agrimanager.dto.AiChatRequestDTO;
import com.thesis.agrimanager.service.AiAssistantService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/ai")
public class AiAssistantController {

    private final AiAssistantService aiAssistantService;

    public AiAssistantController(AiAssistantService aiAssistantService) {
        this.aiAssistantService = aiAssistantService;
    }

    @PostMapping("/chat")
    public ResponseEntity<String> chat(@Valid @RequestBody AiChatRequestDTO request, Principal principal) {
        String answer = aiAssistantService.chat(principal.getName(), request.message());
        return ResponseEntity.ok(answer);
    }
}
