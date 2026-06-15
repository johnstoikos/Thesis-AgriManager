package com.thesis.agrimanager.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class AiAssistantService {

    private static final String SYSTEM_INSTRUCTION = """
            Είσαι ο AgriManager AI, ένας έμπειρος και εξειδικευμένος ψηφιακός γεωπόνος.
            Απάντησε στα ελληνικά, με σύντομο, πρακτικό και επιστημονικό τρόπο.
            Χρησιμοποίησε τα δεδομένα των χωραφιών και των καλλιεργειών του αγρότη.
            Αν λείπουν κρίσιμα δεδομένα, εξήγησε τι χρειάζεται πριν δώσεις ασφαλή σύσταση.
            Μην παρουσιάζεις υποθέσεις ως βεβαιότητες.
            """;

    private final RestTemplate restTemplate;
    private final String groqApiUrl;
    private final String groqApiKey;
    private final String groqModel;

    public AiAssistantService(
            RestTemplate restTemplate,
            @Value("${groq.api.url:https://api.groq.com/openai/v1/chat/completions}") String groqApiUrl,
            @Value("${groq.api.key:}") String groqApiKey,
            @Value("${groq.api.model:llama-3.1-8b-instant}") String groqModel
    ) {
        this.restTemplate = restTemplate;
        this.groqApiUrl = groqApiUrl;
        this.groqApiKey = groqApiKey;
        this.groqModel = groqModel;
    }

    public String chatWithGroq(String userMessage, String fieldDataPrompt) {
        if (groqApiKey == null || groqApiKey.isBlank()) {
            throw new IllegalStateException(
                    "Δεν έχει οριστεί Groq API key. Ρύθμισε τη μεταβλητή περιβάλλοντος GROQ_API_KEY."
            );
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        Map<String, Object> requestBody = Map.of(
                "model", groqModel,
                "messages", List.of(
                        Map.of("role", "system", "content", SYSTEM_INSTRUCTION),
                        Map.of(
                                "role", "user",
                                "content", fieldDataPrompt + "\n\nΕρώτηση αγρότη:\n" + userMessage
                        )
                ),
                "temperature", 0.3
        );

        try {
            ResponseEntity<JsonNode> response = restTemplate.postForEntity(
                    groqApiUrl,
                    new HttpEntity<>(requestBody, headers),
                    JsonNode.class
            );
            return extractAnswer(response.getBody());
        } catch (RestClientException ex) {
            throw new RuntimeException("Αδυναμία επικοινωνίας με το Groq API.", ex);
        }
    }

    private String extractAnswer(JsonNode responseBody) {
        if (responseBody == null) {
            throw new RuntimeException("Το Groq API επέστρεψε κενή απάντηση.");
        }

        JsonNode content = responseBody.path("choices").path(0).path("message").path("content");
        if (!content.isTextual() || content.asText().isBlank()) {
            throw new RuntimeException("Το Groq API επέστρεψε απάντηση χωρίς κείμενο.");
        }

        return content.asText().trim();
    }
}
