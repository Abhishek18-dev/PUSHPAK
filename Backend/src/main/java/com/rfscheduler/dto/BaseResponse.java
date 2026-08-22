package com.rfscheduler.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record BaseResponse<T>(
    boolean success,
    T data,
    ErrorDetail error,
    String requestId
) {
    public static <T> BaseResponse<T> success(T data, String requestId) {
        return new BaseResponse<>(true, data, null, requestId);
    }

    public static <T> BaseResponse<T> error(ErrorDetail error, String requestId) {
        return new BaseResponse<>(false, null, error, requestId);
    }
}
