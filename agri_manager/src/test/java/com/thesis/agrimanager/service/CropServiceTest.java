package com.thesis.agrimanager.service;

import com.thesis.agrimanager.dto.CropDTO;
import com.thesis.agrimanager.repository.CropRepository;
import com.thesis.agrimanager.repository.FieldRepository;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class CropServiceTest {

    @Mock
    private CropRepository cropRepository;

    @Mock
    private FieldRepository fieldRepository;

    @Mock
    private UserProfitService userProfitService;

    @Test
    void creatingCropWithoutSellingPriceIsRejected() {
        CropDTO crop = new CropDTO(
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );

        assertThrows(IllegalArgumentException.class, () -> service().saveCrop(crop));

        verify(cropRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void updatingCropWithNonPositiveSellingPriceIsRejected() {
        CropDTO crop = new CropDTO(
                null,
                null,
                null,
                null,
                BigDecimal.ZERO,
                null,
                null,
                null,
                null
        );

        assertThrows(IllegalArgumentException.class, () -> service().updateCrop(1L, crop));

        verify(cropRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    private CropService service() {
        return new CropService(cropRepository, fieldRepository, userProfitService);
    }
}
