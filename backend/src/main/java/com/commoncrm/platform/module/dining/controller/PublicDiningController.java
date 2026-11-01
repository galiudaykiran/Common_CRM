package com.commoncrm.platform.module.dining.controller;

import com.commoncrm.platform.common.api.ApiResponse;
import com.commoncrm.platform.module.dining.dto.DiningDtos.PublicDiningMenuResponse;
import com.commoncrm.platform.module.dining.service.PublicDiningMenuService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/public/dining")
@RequiredArgsConstructor
public class PublicDiningController {

    private final PublicDiningMenuService publicDiningMenuService;

    @GetMapping("/menu/{qrToken}")
    public ResponseEntity<ApiResponse<PublicDiningMenuResponse>> getPublicMenu(@PathVariable String qrToken) {
        PublicDiningMenuResponse response = publicDiningMenuService.getPublicMenuByToken(qrToken);
        return ResponseEntity.ok(ApiResponse.success(response, "Public digital menu loaded"));
    }
}
