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

    private static final String GREEK_SYSTEM_INSTRUCTION = """
            Είσαι ο AgriManager AI, ένας έμπειρος και εξειδικευμένος ψηφιακός γεωπόνος.
            Απάντησε μόνο στα ελληνικά.
            Διατήρησε σύντομο, πρακτικό και επιστημονικό ύφος.
            Χρησιμοποίησε τα δεδομένα των χωραφιών και των καλλιεργειών του αγρότη.
            Αν λείπουν κρίσιμα δεδομένα, εξήγησε τι χρειάζεται πριν δώσεις ασφαλή σύσταση.
            Μην παρουσιάζεις υποθέσεις ως βεβαιότητες.
            """;

    private static final String ENGLISH_SYSTEM_INSTRUCTION = """
            You are AgriManager AI, an experienced digital agronomist.
            Answer only in English.
            The farm context may contain Greek labels or values; translate and explain them naturally in English.
            Keep the answer concise, practical, and scientifically grounded.
            Use the farmer's field and crop data.
            If critical data is missing, explain what is needed before giving a safe recommendation.
            Do not present assumptions as facts.
            """;

    private final RestTemplate restTemplate;
    private final String groqApiUrl;
    private final String groqApiKey;
    private final String groqModel;

    // Αρχικοποιεί τις εξαρτήσεις.
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

    // Στέλνει μήνυμα στον βοηθό.
    public String chatWithGroq(String userMessage, String fieldDataPrompt) {
        return chatWithGroq(userMessage, fieldDataPrompt, "el");
    }

    // Στέλνει μήνυμα στον βοηθό.
    public String chatWithGroq(String userMessage, String fieldDataPrompt, String language) {
        if (groqApiKey == null || groqApiKey.isBlank()) {
            throw new IllegalStateException(
                    "Δεν έχει οριστεί Groq API key. Ρύθμισε τη μεταβλητή περιβάλλοντος GROQ_API_KEY."
            );
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        String targetLanguage = resolveTargetLanguage(userMessage, language);

        Map<String, Object> requestBody = Map.of(
                "model", groqModel,
                "messages", List.of(
                        Map.of("role", "system", "content", buildSystemInstruction(targetLanguage)),
                        Map.of(
                                "role", "user",
                                "content", buildUserPrompt(fieldDataPrompt, userMessage, targetLanguage)
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

    // Επιλέγει κατάλληλη τιμή.
    private String resolveTargetLanguage(String userMessage, String applicationLanguage) {
        String message = userMessage == null ? "" : userMessage;
        boolean hasGreek = message.matches(".*\\p{InGreek}.*");
        boolean hasLatin = message.matches(".*[A-Za-z].*");

        if (hasGreek && !hasLatin) return "el";
        if (hasLatin && !hasGreek) return "en";
        return "en".equalsIgnoreCase(applicationLanguage) ? "en" : "el";
    }

    // Δημιουργεί περιεχόμενο.
    private String buildSystemInstruction(String targetLanguage) {
        return "en".equals(targetLanguage) ? ENGLISH_SYSTEM_INSTRUCTION : GREEK_SYSTEM_INSTRUCTION;
    }

    // Δημιουργεί περιεχόμενο.
    private String buildUserPrompt(String fieldDataPrompt, String userMessage, String targetLanguage) {
        if ("en".equals(targetLanguage)) {
            return """
                    Farm context:
                    %s

                    Farmer question:
                    %s

                    Reminder: answer only in English.
                    """.formatted(fieldDataPrompt, userMessage);
        }

        return """
                %s

                Ερώτηση αγρότη:
                %s

                Υπενθύμιση: απάντησε μόνο στα ελληνικά.
                """.formatted(fieldDataPrompt, userMessage);
    }

    // Εξάγει δεδομένα.
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
