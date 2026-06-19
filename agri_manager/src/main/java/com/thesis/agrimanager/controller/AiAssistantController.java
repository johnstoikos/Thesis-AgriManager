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
        Authentication authentication = getCurrentAuthentication();
        String username = authentication.getName();
        boolean admin = authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));

        List<Field> fields = admin ? fieldRepository.findAllOwnedByFarmers() : fieldRepository.findByOwnerUsername(username);
        List<Crop> crops = admin ? cropRepository.findAllOwnedByFarmers() : cropRepository.findByFieldOwnerUsername(username);
        String fieldDataPrompt = buildFieldDataPrompt(username, fields, crops, admin);

        String answer = aiAssistantService.chatWithGroq(request.message(), fieldDataPrompt, request.language());
        return ResponseEntity.ok(answer);
    }

    private Authentication getCurrentAuthentication() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("Δεν βρέθηκε συνδεδεμένος χρήστης.");
        }
        return authentication;
    }

    private String buildFieldDataPrompt(String username, List<Field> fields, List<Crop> crops, boolean admin) {
        StringBuilder prompt = new StringBuilder(admin ? "Δεδομένα πλατφόρμας για διαχειριστή: " : "Δεδομένα αγρότη: ")
                .append(valueOrDash(username))
                .append("\n\nΧωράφια:\n");

        if (fields.isEmpty()) {
            prompt.append("- Δεν υπάρχουν καταχωρημένα χωράφια.\n");
        } else {
            for (Field field : fields) {
                prompt.append("- ")
                        .append(valueOrDash(field.getName()))
                        .append(admin ? " | Ιδιοκτήτης: " + ownerLabel(field) : "")
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
                        .append(admin ? " | Ιδιοκτήτης: " + ownerLabel(field) : "")
                        .append(" | Ημερομηνία φύτευσης: ").append(valueOrDash(crop.getPlantingDate()))
                        .append(" | Παραγωγή: ").append(valueOrDash(crop.getHarvestYield())).append(" kg")
                        .append(" | Τιμή/kg: ").append(valueOrDash(crop.getSellingPricePerKg())).append(" ευρώ")
                        .append('\n');
            }
        }

        return prompt.toString();
    }

    private String ownerLabel(Field field) {
        if (field == null || field.getOwner() == null) {
            return "-";
        }
        String fullName = field.getOwner().getFullName();
        String username = field.getOwner().getUsername();
        if (fullName != null && !fullName.isBlank()) {
            return fullName + " (" + valueOrDash(username) + ")";
        }
        return valueOrDash(username);
    }

    private String valueOrDash(Object value) {
        if (value == null || value.toString().isBlank()) {
            return "-";
        }
        return value.toString();
    }
}
