package com.f1analytix.server.model;

import lombok.Data;
import java.io.Serializable;

@Data
public class TelemetryRecord implements Serializable {
    private String date;
    private int driver_number;
    private int rpm;
    private int speed;
    private int n_gear;
    private int throttle;
    private int brake;
}
