package com.commoncrm.platform.common.event;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class EventPublisher {

    private static final Logger log = LoggerFactory.getLogger(EventPublisher.class);
    public static final String PLATFORM_EVENTS_TOPIC = "platform.admin.events";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Autowired(required = false)
    public EventPublisher(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    @Async
    public void publishEvent(String key, PlatformEvent event) {
        if (kafkaTemplate == null) {
            log.info("[Event Simulation] KafkaTemplate not configured. Simulated event published: key={}, type={}", key, event.getEventType());
            return;
        }

        try {
            kafkaTemplate.send(PLATFORM_EVENTS_TOPIC, key, event)
                    .whenComplete((result, ex) -> {
                        if (ex != null) {
                            log.warn("Failed to publish event to Kafka [topic={}, key={}, type={}]: {}",
                                    PLATFORM_EVENTS_TOPIC, key, event.getEventType(), ex.getMessage());
                        } else {
                            log.debug("Event published successfully to Kafka [topic={}, offset={}, type={}]",
                                    PLATFORM_EVENTS_TOPIC, result.getRecordMetadata().offset(), event.getEventType());
                        }
                    });
        } catch (Exception ex) {
            log.warn("Kafka unavailable or broker offline. Gracefully proceeding without blocking: {}", ex.getMessage());
        }
    }
}
