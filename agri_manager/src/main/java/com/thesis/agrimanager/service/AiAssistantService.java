package com.thesis.agrimanager.service;

import com.thesis.agrimanager.model.Crop;
import com.thesis.agrimanager.model.Field;
import com.thesis.agrimanager.repository.CropRepository;
import com.thesis.agrimanager.repository.FieldRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
public class AiAssistantService {

    private final FieldRepository fieldRepository;
    private final CropRepository cropRepository;
    private final WeatherService weatherService;
    private final RestTemplate restTemplate;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent}")
    private String geminiApiUrl;

    public AiAssistantService(
            FieldRepository fieldRepository,
            CropRepository cropRepository,
            WeatherService weatherService,
            RestTemplate restTemplate
    ) {
        this.fieldRepository = fieldRepository;
        this.cropRepository = cropRepository;
        this.weatherService = weatherService;
        this.restTemplate = restTemplate;
    }

    @Transactional(readOnly = true)
    public String chat(String username, String userMessage) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            throw new RuntimeException("Δεν έχει οριστεί Gemini API key. Ρύθμισε τη μεταβλητή περιβάλλοντος GEMINI_API_KEY.");
        }

        List<Field> fields = fieldRepository.findByOwnerUsername(username);
        List<Crop> crops = cropRepository.findByFieldOwnerUsername(username);
        
        // Παίρνουμε το πλούσιο system prompt με τα δεδομένα
        String systemPrompt = buildSystemPrompt(username, fields, crops);

        // Ενώνουμε τις οδηγίες και τα δεδομένα με την τρέχουσα ερώτηση του αγρότη
        String fullCombinedPrompt = systemPrompt + "\n\nΕρώτηση Αγρότη: " + userMessage;

        // Χτίζουμε το Request Body χωρίς το "systemInstruction" που μπερδεύει το API
        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of(
                                "role", "user",
                                "parts", List.of(Map.of("text", fullCombinedPrompt))
                        )
                ),
                "generationConfig", Map.of(
                        "temperature", 0.35,
                        "maxOutputTokens", 700
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        String url = UriComponentsBuilder
                .fromUriString(geminiApiUrl)
                .queryParam("key", geminiApiKey)
                .toUriString();

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(
                    url,
                    new HttpEntity<>(requestBody, headers),
                    Map.class
            );
            return extractGeminiText(response);
        } catch (RestClientException ex) {
            // Εκτυπώνουμε το stack trace για να βλέπουμε τι φταίει αν αποτύχει
            ex.printStackTrace(); 
            throw new RuntimeException("Αδυναμία επικοινωνίας με το Gemini API. Σφάλμα: " + ex.getMessage(), ex);
        }
    }

    private String buildSystemPrompt(String username, List<Field> fields, List<Crop> crops) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("""
                Είσαι ο AI Γεωπόνος του AgriManager.
                Απάντησε στην ερώτηση του αγρότη με βάση τα διαθέσιμα δεδομένα του.
                Να απαντάς σύντομα, φιλικά, πρακτικά και επιστημονικά στα Ελληνικά.
                Αν λείπουν κρίσιμα δεδομένα, πες καθαρά τι χρειάζεται να καταγραφεί πριν δοθεί ασφαλής σύσταση.
                Μην παρουσιάζεις υποθέσεις ως βεβαιότητες.
                """);

        prompt.append("\nΧρήστης: ").append(nullToDash(username)).append("\n\n");
        prompt.append("Χωράφια:\n");
        if (fields.isEmpty()) {
            prompt.append("- Δεν υπάρχουν καταχωρημένα χωράφια.\n");
        } else {
            for (Field field : fields) {
                prompt.append("- ")
                        .append(nullToDash(field.getName()))
                        .append(" | Έκταση: ").append(numberToDash(field.getArea())).append(" στρέμματα")
                        .append(" | Τύπος εδάφους: ").append(nullToDash(field.getSoilType()))
                        .append(" | pH: ").append(numberToDash(field.getSoilPh()))
                        .append(" | Άρδευση: ").append(nullToDash(field.getIrrigationType()))
                        .append(" | Καιρός: ").append(getWeatherSummary(field))
                        .append("\n");
            }
        }

        prompt.append("\nΚαλλιέργειες:\n");
        if (crops.isEmpty()) {
            prompt.append("- Δεν υπάρχουν καταχωρημένες καλλιέργειες.\n");
        } else {
            for (Crop crop : crops) {
                Field field = crop.getField();
                prompt.append("- ")
                        .append(nullToDash(crop.getType()))
                        .append(" (").append(nullToDash(crop.getVariety())).append(")")
                        .append(" | Χωράφι: ").append(field != null ? nullToDash(field.getName()) : "-")
                        .append(" | Ημ/νία φύτευσης: ").append(crop.getPlantingDate() != null ? crop.getPlantingDate() : "-")
                        .append(" | Παραγωγή: ").append(numberToDash(crop.getHarvestYield())).append(" kg")
                        .append(" | Τιμή/kg: ").append(moneyToDash(crop.getSellingPricePerKg())).append(" ευρώ")
                        .append("\n");
            }
        }

        return prompt.toString();
    }

    private String getWeatherSummary(Field field) {
        try {
            if (field.getId() == null || field.getBoundary() == null) {
                return "δεν υπάρχουν γεωχωρικά δεδομένα";
            }

            var weather = weatherService.getWeatherForField(field.getId());
            return "%s, %.1f°C, υγρασία %d%%".formatted(
                    nullToDash(weather.getDescription()),
                    weather.getTemperature(),
                    weather.getHumidity()
            );
        } catch (Exception ex) {
            return "μη διαθέσιμος";
        }
    }

    @SuppressWarnings("unchecked")
    private String extractGeminiText(Map<String, Object> response) {
        if (response == null) {
            throw new RuntimeException("Το Gemini API επέστρεψε κενή απάντηση.");
        }

        List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
        if (candidates == null || candidates.isEmpty()) {
            throw new RuntimeException("Το Gemini API δεν επέστρεψε υποψήφια απάντηση.");
        }

        // ΑΛΛΑΓΗ ΕΔΩ: από candidates.getFirst() σε candidates.get(0)
        Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
        if (content == null) {
            throw new RuntimeException("Το Gemini API επέστρεψε απάντηση χωρίς περιεχόμενο.");
        }

        List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
        if (parts == null || parts.isEmpty()) {
            throw new RuntimeException("Το Gemini API επέστρεψε απάντηση χωρίς κείμενο.");
        }

        // ΑΛΛΑΓΗ ΕΔΩ: από parts.getFirst() σε parts.get(0)
        Object text = parts.get(0).get("text");
        if (text == null || text.toString().isBlank()) {
            throw new RuntimeException("Το Gemini API επέστρεψε κενό κείμενο.");
        }

        return text.toString().trim();
    }

    private String nullToDash(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }

    private String numberToDash(Number value) {
        return value == null ? "-" : value.toString();
    }

    private String moneyToDash(BigDecimal value) {
        return value == null ? "-" : value.toPlainString();
    }
}
