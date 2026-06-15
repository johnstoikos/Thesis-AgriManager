package com.thesis.agrimanager.controller;

import com.thesis.agrimanager.dto.AiChatRequestDTO;
import com.thesis.agrimanager.model.Crop;
import com.thesis.agrimanager.model.Field;
import com.thesis.agrimanager.repository.CropRepository;
import com.thesis.agrimanager.repository.FieldRepository;
import com.thesis.agrimanager.service.AiAssistantService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiAssistantControllerTest {

    @Mock
    private AiAssistantService aiAssistantService;

    @Mock
    private FieldRepository fieldRepository;

    @Mock
    private CropRepository cropRepository;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void buildsPromptFromAuthenticatedFarmersFieldsAndCrops() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("farmer", null, List.of())
        );

        Field field = new Field();
        field.setId(10L);
        field.setName("Βόρειο Χωράφι");
        field.setArea(12.5);
        field.setSoilType("Αργιλώδες");
        field.setSoilPh(6.8);
        field.setIrrigationType("Στάγδην");

        Crop crop = new Crop();
        crop.setType("Ελιά");
        crop.setVariety("Κορωνέικη");
        crop.setPlantingDate(LocalDate.of(2025, 11, 15));
        crop.setField(field);

        when(fieldRepository.findByOwnerUsername("farmer")).thenReturn(List.of(field));
        when(cropRepository.findByFieldOwnerUsername("farmer")).thenReturn(List.of(crop));
        when(aiAssistantService.chatWithGroq(
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyString()
        )).thenReturn("Απάντηση");

        AiAssistantController controller = new AiAssistantController(
                aiAssistantService,
                fieldRepository,
                cropRepository
        );

        var response = controller.chat(new AiChatRequestDTO("Χρειάζεται πότισμα;"));

        ArgumentCaptor<String> promptCaptor = ArgumentCaptor.forClass(String.class);
        verify(aiAssistantService).chatWithGroq(
                org.mockito.ArgumentMatchers.eq("Χρειάζεται πότισμα;"),
                promptCaptor.capture()
        );
        verify(fieldRepository).findByOwnerUsername("farmer");
        verify(cropRepository).findByFieldOwnerUsername("farmer");

        assertEquals("Απάντηση", response.getBody());
        assertTrue(promptCaptor.getValue().contains("Βόρειο Χωράφι"));
        assertTrue(promptCaptor.getValue().contains("Αργιλώδες"));
        assertTrue(promptCaptor.getValue().contains("Κορωνέικη"));
        assertTrue(promptCaptor.getValue().contains("2025-11-15"));
    }
}
