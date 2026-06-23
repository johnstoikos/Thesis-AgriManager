package com.thesis.agrimanager.service;

import com.thesis.agrimanager.dto.FieldDTO;

import com.thesis.agrimanager.dto.FieldRequest;

import com.thesis.agrimanager.model.Field;
import com.thesis.agrimanager.model.User;
import com.thesis.agrimanager.repository.FieldRepository;
import com.thesis.agrimanager.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class FieldService {

    private final FieldRepository fieldRepository;
    private final UserRepository userRepository;
    private final UserProfitService userProfitService;

    public FieldService(
            FieldRepository fieldRepository,
            UserRepository userRepository,
            UserProfitService userProfitService
    ) {
        this.fieldRepository = fieldRepository;
        this.userRepository = userRepository;
        this.userProfitService = userProfitService;
    }

    public List<FieldDTO> getFieldsByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Field> fields = fieldRepository.findByOwnerId(user.getId());

        return fields.stream()
                .map(this::convertToDTO)
                .toList();
    }

    public Field saveField(Field field) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();

        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));

        field.setOwner(user);
        return fieldRepository.save(field);
    }

    private FieldDTO convertToDTO(Field field) {
        return new FieldDTO(
                field.getId(),
                field.getName(),
                field.getArea(),
                field.getBoundary(),
                field.getSoilType(),
                field.getSoilPh(),
                field.getIrrigationType()
        );
    }

    public FieldDTO getFieldById(Long id) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();

        Field field = fieldRepository.findByIdAndOwnerUsername(id, currentUsername)
                .orElseThrow(() -> new RuntimeException("Το χωράφι δεν βρέθηκε ή δεν σας ανήκει."));

        return convertToDTO(field);
    }

    public FieldDTO updateField(Long id, FieldRequest request) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();

        Field field = fieldRepository.findByIdAndOwnerUsername(id, currentUsername)
                .orElseThrow(() -> new RuntimeException("Το χωράφι δεν βρέθηκε ή δεν σας ανήκει."));

        field.setName(request.name());
        field.setArea(request.area());
        field.setBoundary(request.boundary());
        applyFieldContext(field, request);

        Field updatedField = fieldRepository.save(field);
        return convertToDTO(updatedField);
    }

    private void applyFieldContext(Field field, FieldRequest request) {
        field.setSoilType(request.soilType());
        field.setSoilPh(request.soilPh());
        field.setIrrigationType(request.irrigationType());
    }

    @Transactional
    public void deleteField(Long id) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();

        Field field = fieldRepository.findByIdAndOwnerUsername(id, currentUsername)
                .orElseThrow(() -> new RuntimeException("Το χωράφι δεν βρέθηκε ή δεν σας ανήκει."));

        userProfitService.preserveFinancialsAfterDeletion(field.getOwner());
        fieldRepository.delete(field);
    }
}
