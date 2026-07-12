package com.f1analytix.server.service;

import org.springframework.boot.CommandLineRunner;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.ServerSocket;
import java.net.Socket;

import tools.jackson.databind.ObjectMapper;
import com.f1analytix.server.model.TelemetryRecord;
import org.springframework.beans.factory.annotation.Autowired;

@Service
public class IngestionService implements CommandLineRunner {
    private static final int PORT = 9999;

    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private RedisTemplate<String, TelemetryRecord> redisTemplate;
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Override
    public void run(String... args) {
        new Thread(this::startSocketServer).start();
    }

    private void startSocketServer(){
        try(ServerSocket serverSocket = new ServerSocket(PORT)){
            System.out.println("Ingestion server started on port " + PORT);

            while (true) {
                // Wait till emulator connect
                Socket clientSocket = serverSocket.accept();
                System.out.println("Client connected: " + clientSocket.getInetAddress());

                // Handle connection in a dedicated thread
                new Thread(() -> handleStream(clientSocket)).start();
            }
        } catch (Exception e) {
            System.err.println("Error starting server: " + e.getMessage());
        }
    }

    private void handleStream(Socket clientSocket){
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(clientSocket.getInputStream()))) {
            String jsonLine;

            while ((jsonLine = reader.readLine()) != null) {
                try {
                    // 1. Convert json text to our model structure
                    TelemetryRecord telemetryRecord = objectMapper.readValue(jsonLine, TelemetryRecord.class);

                    // 2. Save to Redis
                    String cacheKey = "driver:" + telemetryRecord.getDriver_number() + ":telemetry";
                    redisTemplate.opsForValue().set(cacheKey, telemetryRecord);

                    // 3. Send to WebSocket clients
                    messagingTemplate.convertAndSend("/topic/telemetry/" + telemetryRecord.getDriver_number(), telemetryRecord);

                    System.out.printf("[Saved to Redis] Key: %s | Speed: %d km/h, rpm: %d\n", cacheKey, telemetryRecord.getSpeed(), telemetryRecord.getRpm());
                } catch (Exception e) {
                    System.err.println("Error parsing JSON: " + e.getMessage());
                }
            }
        } catch (Exception e){
            System.err.println("Error receiving JSON: " + e.getMessage());
        }
    }
}
