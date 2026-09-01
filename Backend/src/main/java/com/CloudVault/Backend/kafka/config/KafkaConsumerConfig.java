package com.CloudVault.Backend.kafka.config;

import com.CloudVault.Backend.kafka.event.FileUploadedEvent;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.support.serializer.JacksonJsonDeserializer;
import org.springframework.util.backoff.FixedBackOff;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class KafkaConsumerConfig {

    @Value("${cloudvault.kafka.retry.interval}")
    private long retryInterval;

    @Value("${cloudvault.kafka.retry.max-attempts}")
    private long maxAttempts;

    @Bean
    public ConsumerFactory<String, FileUploadedEvent> consumerFactory() {

        JacksonJsonDeserializer<FileUploadedEvent> deserializer =
                new JacksonJsonDeserializer<>(
                        FileUploadedEvent.class
                );

        deserializer.addTrustedPackages(
                "com.CloudVault.Backend.kafka.event"
        );

        Map<String, Object> config = new HashMap<>();

        config.put(
                ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG,
                "localhost:9092"
        );

        config.put(
                ConsumerConfig.GROUP_ID_CONFIG,
                "cloudvault-file-processor"
        );

        config.put(
                ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG,
                StringDeserializer.class
        );

        config.put(
                ConsumerConfig.AUTO_OFFSET_RESET_CONFIG,
                "earliest"
        );

        return new DefaultKafkaConsumerFactory<>(
                config,
                new StringDeserializer(),
                deserializer
        );
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, FileUploadedEvent>
    kafkaListenerContainerFactory(
            ConsumerFactory<String, FileUploadedEvent> consumerFactory,
            KafkaTemplate<String, FileUploadedEvent> kafkaTemplate
    ) {

        ConcurrentKafkaListenerContainerFactory<String, FileUploadedEvent>
                factory =
                new ConcurrentKafkaListenerContainerFactory<>();

        factory.setConsumerFactory(consumerFactory);

        DeadLetterPublishingRecoverer recoverer =
                new DeadLetterPublishingRecoverer(
                        kafkaTemplate
                );

        DefaultErrorHandler errorHandler =
                new DefaultErrorHandler(
                        recoverer,
                        new FixedBackOff(
                                retryInterval,
                                maxAttempts
                        )
                );

        factory.setCommonErrorHandler(errorHandler);

        return factory;
    }
}