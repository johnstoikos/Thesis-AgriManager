package com.thesis.agrimanager.service;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class AiAssistantServiceTest {

    @Test
    void rejectsRequestWhenGroqApiKeyIsMissing() {
        AiAssistantService service = new AiAssistantService(
                new RestTemplate(),
                "https://api.groq.com/openai/v1/chat/completions",
                "",
                "llama-3.1-8b-instant"
        );

        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> service.chatWithGroq("Μήνυμα", "Δεδομένα")
        );

        assertEquals(
                "Δεν έχει οριστεί Groq API key. Ρύθμισε τη μεταβλητή περιβάλλοντος GROQ_API_KEY.",
                exception.getMessage()
        );
    }

    @Test
    void sendsGroqChatCompletionRequestAndReturnsAssistantContent() {
        RestTemplate restTemplate = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(restTemplate).build();
        AiAssistantService service = new AiAssistantService(
                restTemplate,
                "https://api.groq.com/openai/v1/chat/completions",
                "test-api-key",
                "llama-3.1-8b-instant"
        );

        server.expect(once(), requestTo("https://api.groq.com/openai/v1/chat/completions"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("Authorization", "Bearer test-api-key"))
                .andExpect(jsonPath("$.model").value("llama-3.1-8b-instant"))
                .andExpect(jsonPath("$.messages[0].role").value("system"))
                .andExpect(jsonPath("$.messages[0].content").value(
                        org.hamcrest.Matchers.containsString("Απάντησε μόνο στα ελληνικά")
                ))
                .andExpect(jsonPath("$.messages[1].role").value("user"))
                .andExpect(jsonPath("$.messages[1].content").value(
                        org.hamcrest.Matchers.containsString("Χωράφι Α")
                ))
                .andRespond(withSuccess(
                        """
                                {
                                  "choices": [
                                    {
                                      "message": {
                                        "role": "assistant",
                                        "content": "Η απάντηση του γεωπόνου."
                                      }
                                    }
                                  ]
                                }
                                """,
                        MediaType.APPLICATION_JSON
                ));

        String answer = service.chatWithGroq("Τι να κάνω;", "Χωράφι Α");

        assertEquals("Η απάντηση του γεωπόνου.", answer);
        server.verify();
    }

    @Test
    void sendsEnglishOnlyInstructionWhenFarmerWritesInEnglish() {
        RestTemplate restTemplate = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(restTemplate).build();
        AiAssistantService service = new AiAssistantService(
                restTemplate,
                "https://api.groq.com/openai/v1/chat/completions",
                "test-api-key",
                "llama-3.1-8b-instant"
        );

        server.expect(once(), requestTo("https://api.groq.com/openai/v1/chat/completions"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("Authorization", "Bearer test-api-key"))
                .andExpect(jsonPath("$.messages[0].content").value(
                        org.hamcrest.Matchers.containsString("Answer only in English")
                ))
                .andExpect(jsonPath("$.messages[1].content").value(
                        org.hamcrest.Matchers.containsString("Farmer question:")
                ))
                .andExpect(jsonPath("$.messages[1].content").value(
                        org.hamcrest.Matchers.containsString("Reminder: answer only in English.")
                ))
                .andRespond(withSuccess(
                        """
                                {
                                  "choices": [
                                    {
                                      "message": {
                                        "role": "assistant",
                                        "content": "Hello. How can I help?"
                                      }
                                    }
                                  ]
                                }
                                """,
                        MediaType.APPLICATION_JSON
                ));

        String answer = service.chatWithGroq("hi", "Δεδομένα αγρότη", "en");

        assertEquals("Hello. How can I help?", answer);
        server.verify();
    }
}
