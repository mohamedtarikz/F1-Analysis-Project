import {useEffect, useState} from "react";
import {Client} from "@stomp/stompjs";
import SockJS from "sockjs-client";
import {LineChart, Line, YAxis, Tooltip, ResponsiveContainer, XAxis} from "recharts";

interface TelemetryData{
  time: string;
  driver_number: number;
  speed: number;
  rpm: number;
  throttle
  n_gear: number;
}

function App(){
  const [telemetryCurrent, setTelemetryCurrent] = useState<TelemetryData | null> (null);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryData[]>([]);

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

          const formattedData = {
            ...data,
            time: data.time ? data.time.substring(11, 19) : ''
          };

          setTelemetryCurrent(formattedData);

          setTelemetryHistory(prev => {
            const newHistory = [...prev, formattedData];
            if (newHistory.length > 50){
              return newHistory.slice(newHistory.length - 50);
            }
            return newHistory;
          });
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
        <div className="min-h-screen bg-neutral-900 text-gray-100 p-8">
          <h1 className="text-3xl font-bold mb-6 text-white">Formula 1 Live Telemetry</h1>

          {telemetryCurrent ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Text Data Card */}
                <div className="bg-neutral-800 p-6 border-2 border-red-600 rounded-lg col-span-1">
                  <h2 className="text-xl font-bold mb-4">Driver #{telemetryCurrent.driver_number}</h2>
                  <p className="text-lg">Speed: <span className="font-mono text-red-500">{telemetryCurrent.speed}</span> km/h</p>
                  <p className="text-lg">RPM: <span className="font-mono text-blue-400">{telemetryCurrent.rpm}</span></p>
                  <p className="text-lg">Gear: <span className="font-mono text-yellow-400">{telemetryCurrent.n_gear}</span></p>
                </div>

                {/* Recharts Speed Graph */}
                <div className="bg-neutral-800 p-6 rounded-lg col-span-2 h-72 border border-neutral-700">
                  <h3 className="text-gray-200 text-sm font-semibold mb-2">Live Speed (KM/H)</h3>
                  <ResponsiveContainer width="100%" height="90%">
                    <LineChart data={telemetryHistory}>
                      <XAxis dataKey="time" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#9ca3af" domain={[0, 370]} />
                      <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151' }} />
                      <Line type="monotone" dataKey="speed" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
          ) : (
              <p className="text-xl animate-pulse">Waiting for telemetry data...</p>
          )}
        </div>
    );
}

export default App;