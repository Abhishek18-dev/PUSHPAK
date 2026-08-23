package com.rfscheduler.exception;

import com.rfscheduler.dto.BaseResponse;
import com.rfscheduler.dto.ErrorDetail;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private String generateRequestId() {
        return "req_" + UUID.randomUUID().toString().substring(0, 8);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<BaseResponse<Void>> handleNotFound(ResourceNotFoundException ex) {
        ErrorDetail error = new ErrorDetail("RESOURCE_NOT_FOUND", ex.getMessage(), Map.of());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(BaseResponse.error(error, generateRequestId()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<BaseResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        
        ErrorDetail error = new ErrorDetail("VALIDATION_ERROR", "Invalid request body", errors);
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                .body(BaseResponse.error(error, generateRequestId()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<BaseResponse<Void>> handleGeneric(Exception ex) {
        ErrorDetail error = new ErrorDetail("INTERNAL_SERVER_ERROR", ex.getMessage(), Map.of());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(BaseResponse.error(error, generateRequestId()));
    }
}
