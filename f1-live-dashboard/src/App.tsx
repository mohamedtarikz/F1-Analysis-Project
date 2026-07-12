import {useEffect, useState} from "react";
import {Client} from "@stomp/stompjs";
import SockJS from "sockjs-client";

interface TelemetryData{
  driver_number: number;
  speed: number;
  rpm: number;
  n_gear: number;
}

function App(){
  const [telemetry, setTelemetry] = useState<TelemetryData | null> (null);

  useEffect(() => {
    // Configure the STOMP Websocket connection
    const stompClient = new Client({
      // Fall-back function if subscription to socket failed to connect to tomcat http server
      webSocketFactory: () => new SockJS('http://localhost:8080/f1-live'),

      onConnect: () => {
        console.log("Connected to server successfully");

        // Subscribe to the telemetry topic
        stompClient.subscribe('/topic/telemetry/55', (message) => {
          const data: TelemetryData = JSON.parse(message.body);
          setTelemetry(data);
        });
      },

      onStompError: (frame) => {
        console.error("Broker reported error: ", frame.headers['message']);
      }
    });

    // Activate the STOMP client
    stompClient.activate();

    // Clean up the connection when the component unmounts
    return () => {
      stompClient.deactivate().then(() => console.log("Disconnected from server"));
    };
  }, []);

    return (
        <div style={{
          backgroundColor: '#111',
          color: '#fff',
          height: '100vh',
          padding: '20px',
          fontFamily: 'sans-serif'
        }}>
          <h1>Formula 1 Live Telemetry</h1>

          {telemetry ? (
              <div style={{
                marginTop: '20px',
                padding: '20px',
                border: '2px solid #E10600',
                borderRadius: '8px',
                display: 'inline-block'
              }}>
                <h2>Driver #{telemetry.driver_number}</h2>
                <p style={{fontSize: '18px'}}>Speed: {telemetry.speed} km/h</p>
                <p style={{fontSize: '18px'}}>RPM: {telemetry.rpm}</p>
                <p style={{fontSize: '18px'}}>Gear: {telemetry.n_gear}</p>
              </div>
          ) : (
              <p>Waiting for telemetry data...</p>
          )}
        </div>
    );
}

export default App;