package com.f1analytix.server.config;

import com.f1analytix.server.model.TelemetryRecord;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.JacksonJsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import tools.jackson.databind.ObjectMapper;

@Configuration
public class RedisConfig {
    @Bean
    public RedisTemplate<String, TelemetryRecord> redisTemplate(RedisConnectionFactory connectionFactory,
                                                                ObjectMapper objectMapper) {
        RedisTemplate<String, TelemetryRecord> redisTemplate = new RedisTemplate<>();
        redisTemplate.setConnectionFactory(connectionFactory);

        // keys will be simple strings (e.g. driver:55:telemetry)
        redisTemplate.setKeySerializer(new StringRedisSerializer());

        // values will be serialized as JSON
        JacksonJsonRedisSerializer<TelemetryRecord> serializer = new JacksonJsonRedisSerializer<>(objectMapper, TelemetryRecord.class);
        redisTemplate.setValueSerializer(serializer);

        return redisTemplate;
    }
}
