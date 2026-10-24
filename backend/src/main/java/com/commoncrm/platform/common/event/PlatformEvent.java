package com.commoncrm.platform.common.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.Instant;
import java.util.UUID;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public abstract class PlatformEvent {

    @lombok.Builder.Default
    private String eventId = UUID.randomUUID().toString();
    private String eventType;
    @lombok.Builder.Default
    private Instant timestamp = Instant.now();
    private String correlationId;
}
