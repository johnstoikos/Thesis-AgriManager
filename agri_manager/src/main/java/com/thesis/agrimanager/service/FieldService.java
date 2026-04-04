package com.thesis.agrimanager.service;

import com.thesis.agrimanager.dto.FieldDTO;

import com.thesis.agrimanager.dto.FieldRequest;

import com.thesis.agrimanager.model.Field;
import com.thesis.agrimanager.model.User;
import com.thesis.agrimanager.repository.FieldRepository;
import com.thesis.agrimanager.repository.UserRepository; // Χρειάζεται για να βρίσκουμε τον owner
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FieldService {

    private final FieldRepository fieldRepository;
    private final UserRepository userRepository; // 1. Προσθήκη του UserRepository

    // 2. Ενημέρωση του Constructor
    public FieldService(FieldRepository fieldRepository, UserRepository userRepository) {
        this.fieldRepository = fieldRepository;
        this.userRepository = userRepository;
    }

    // 3. Επιστρέφουμε ΜΟΝΟ τα χωράφια του συνδεδεμένου χρήστη
    // Στο FieldService.java, μέσα στην getAllFields():
    public List<FieldDTO> getAllFields() {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();

        // ΑΛΛΑΓΗ: findByOwnerUsername αντί για findByUsername
        return fieldRepository.findByOwnerUsername(currentUsername).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }


    public List<FieldDTO> getFieldsByUsername(String username) {
        // 1. Βρίσκουμε τον χρήστη
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 2. Φέρνουμε τα χωράφια του
        List<Field> fields = fieldRepository.findByOwnerId(user.getId());

        // 3. Μετατροπή σε DTO (για να μην στείλουμε όλο το Entity στο Frontend)
        return fields.stream()
                .map(field -> new FieldDTO(field.getId(), field.getName(), field.getArea(), field.getBoundary()))
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
        FieldDTO dto = new FieldDTO();
        dto.setId(field.getId());
        dto.setName(field.getName());
        dto.setArea(field.getArea());
        dto.setBoundary(field.getBoundary());
        return dto;
    }

    public Field saveFieldFromRequest(FieldRequest request) {
        Field field = new Field();
        field.setName(request.getName());
        field.setArea(request.getArea());

        // Το Jackson έχει κάνει ήδη τα μαγικά του! Παίρνουμε το έτοιμο Polygon:
        field.setBoundary(request.getBoundary());

        // Το στέλνουμε στην από πάνω μέθοδο (saveField) για να βρει τον User και να το σώσει
        return saveField(field);
    }

    // 1. Φέρε ένα συγκεκριμένο χωράφι (GET by ID)
    public FieldDTO getFieldById(Long id) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();

        Field field = fieldRepository.findByIdAndOwnerUsername(id, currentUsername)
                .orElseThrow(() -> new RuntimeException("Το χωράφι δεν βρέθηκε ή δεν σας ανήκει."));

        return convertToDTO(field);
    }

    // 2. Ενημέρωσε ένα χωράφι (PUT)
    public FieldDTO updateField(Long id, FieldRequest request) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();

        // Βρίσκουμε το χωράφι (αν του ανήκει)
        Field field = fieldRepository.findByIdAndOwnerUsername(id, currentUsername)
                .orElseThrow(() -> new RuntimeException("Το χωράφι δεν βρέθηκε ή δεν σας ανήκει."));

        // Ενημερώνουμε τα στοιχεία
        field.setName(request.getName());
        field.setArea(request.getArea());
        field.setBoundary(request.getBoundary());

        // Το αποθηκεύουμε ξανά (το JPA καταλαβαίνει ότι είναι update γιατί έχει ήδη ID)
        Field updatedField = fieldRepository.save(field);
        return convertToDTO(updatedField);
    }

    // 3. Διέγραψε ένα χωράφι (DELETE)
    public void deleteField(Long id) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();

        Field field = fieldRepository.findByIdAndOwnerUsername(id, currentUsername)
                .orElseThrow(() -> new RuntimeException("Το χωράφι δεν βρέθηκε ή δεν σας ανήκει."));

        fieldRepository.delete(field);
    }
}