package com.thesis.agrimanager.controller;

import com.thesis.agrimanager.dto.AiChatRequestDTO;
import com.thesis.agrimanager.model.Crop;
import com.thesis.agrimanager.model.Field;
import com.thesis.agrimanager.repository.CropRepository;
import com.thesis.agrimanager.repository.FieldRepository;
import com.thesis.agrimanager.service.AiAssistantService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
public class AiAssistantController {

    private final AiAssistantService aiAssistantService;
    private final FieldRepository fieldRepository;
    private final CropRepository cropRepository;

    public AiAssistantController(
            AiAssistantService aiAssistantService,
            FieldRepository fieldRepository,
            CropRepository cropRepository
    ) {
        this.aiAssistantService = aiAssistantService;
        this.fieldRepository = fieldRepository;
        this.cropRepository = cropRepository;
    }

    @PostMapping("/chat")
    public ResponseEntity<String> chat(@Valid @RequestBody AiChatRequestDTO request) {
        String username = getCurrentUsername();
        List<Field> fields = fieldRepository.findByOwnerUsername(username);
        List<Crop> crops = cropRepository.findByFieldOwnerUsername(username);
        String fieldDataPrompt = buildFieldDataPrompt(username, fields, crops);

        String answer = aiAssistantService.chatWithGroq(request.message(), fieldDataPrompt, request.language());
        return ResponseEntity.ok(answer);
    }

    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("Δεν βρέθηκε συνδεδεμένος χρήστης.");
        }
        return authentication.getName();
    }

    private String buildFieldDataPrompt(String username, List<Field> fields, List<Crop> crops) {
        StringBuilder prompt = new StringBuilder("Δεδομένα αγρότη: ")
                .append(valueOrDash(username))
                .append("\n\nΧωράφια:\n");

        if (fields.isEmpty()) {
            prompt.append("- Δεν υπάρχουν καταχωρημένα χωράφια.\n");
        } else {
            for (Field field : fields) {
                prompt.append("- ")
                        .append(valueOrDash(field.getName()))
                        .append(" | Έκταση: ").append(valueOrDash(field.getArea())).append(" στρέμματα")
                        .append(" | Έδαφος: ").append(valueOrDash(field.getSoilType()))
                        .append(" | pH: ").append(valueOrDash(field.getSoilPh()))
                        .append(" | Άρδευση: ").append(valueOrDash(field.getIrrigationType()))
                        .append('\n');
            }
        }

        prompt.append("\nΚαλλιέργειες:\n");
        if (crops.isEmpty()) {
            prompt.append("- Δεν υπάρχουν καταχωρημένες καλλιέργειες.\n");
        } else {
            for (Crop crop : crops) {
                Field field = crop.getField();
                prompt.append("- ")
                        .append(valueOrDash(crop.getType()))
                        .append(" | Ποικιλία: ").append(valueOrDash(crop.getVariety()))
                        .append(" | Χωράφι: ")
                        .append(field == null ? "-" : valueOrDash(field.getName()))
                        .append(" | Ημερομηνία φύτευσης: ").append(valueOrDash(crop.getPlantingDate()))
                        .append(" | Παραγωγή: ").append(valueOrDash(crop.getHarvestYield())).append(" kg")
                        .append(" | Τιμή/kg: ").append(valueOrDash(crop.getSellingPricePerKg())).append(" ευρώ")
                        .append('\n');
            }
        }

        return prompt.toString();
    }

    private String valueOrDash(Object value) {
        if (value == null || value.toString().isBlank()) {
            return "-";
        }
        return value.toString();
    }
}
