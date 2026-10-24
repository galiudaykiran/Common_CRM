package com.commoncrm.platform.module.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDto {
    private Long id;
    private Long tenantId;
    private String username;
    private String email;
    private String fullName;
    private String status;
    private List<String> roles;
    private List<String> permissions;
}
