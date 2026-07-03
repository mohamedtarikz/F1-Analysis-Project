package com.f1analytix.server.controller;

import com.f1analytix.server.model.TelemetryRecord;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/telemetry")
public class TelemetryController {
    @Autowired
    private RedisTemplate<String, TelemetryRecord> redisTemplate;

    @GetMapping("/live/{driverNumber}")
    public TelemetryRecord getTelemetryRecord(@PathVariable String driverNumber) {
        int driverNumberInt;
        try {
            driverNumberInt = Integer.parseInt(driverNumber);
        } catch (NumberFormatException e) {
            return null;
        }
        return  redisTemplate.opsForValue().get("driver:" + driverNumberInt + ":telemetry");
    }
}
