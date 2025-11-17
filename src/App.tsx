import { useState, useEffect } from 'react';
import { Bike, Wifi, WifiOff } from 'lucide-react';
import HelmetVisualization from './components/HelmetVisualization';
import LocationCard from './components/LocationCard';
import SensorDataCard from './components/SensorDataCard';
import { getSimulatedData, type SensorData } from './data/staticData';
import { getLatestSensorData, subscribeSensorData, type SensorDataRow } from './lib/supabase';

// This function now converts accelerometer data as well
function convertToSensorData(row: SensorDataRow): SensorData {
  return {
    location: {
      latitude: row.latitude,
      longitude: row.longitude,
    },
    // --- THIS IS THE NEW PART ---
    accelerometer: {
      x: row.acc_x / 16384.0, // Converts raw data to g-force
      y: row.acc_y / 16384.0,
      z: row.acc_z / 16384.0,
    },
    // --- END NEW PART ---
    gyroscope: {
      x: row.gyro_x / 131.0, // Converts raw data to degrees/sec
      y: row.gyro_y / 131.0,
      z: row.gyro_z / 131.0,
    },
    timestamp: row.created_at,
  };
}

function App() {
  const [sensorData, setSensorData] = useState<SensorData>(getSimulatedData());
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initializeData = async () => {
      const latestData = await getLatestSensorData();
      if (latestData) {
        setSensorData(convertToSensorData(latestData));
        setIsConnected(true);
        setLastUpdate(new Date(latestData.created_at));
      }

      unsubscribe = subscribeSensorData((newData) => {
        setSensorData(convertToSensorData(newData));
        setIsConnected(true);
        setLastUpdate(new Date(newData.created_at));
      });
    };

    initializeData();

    const checkTimeout = setInterval(() => {
      if (lastUpdate && Date.now() - lastUpdate.getTime() > 5000) {
        setIsConnected(false);
      }
    }, 1000);

    return () => {
      if (unsubscribe) unsubscribe();
      clearInterval(checkTimeout);
    };
  }, [lastUpdate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Bike className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Motorcycle Helmet IoT Dashboard</h1>
                <p className="text-sm text-gray-600">Real-time monitoring system</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <Wifi className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-red-600">Disconnected</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
          <LocationCard
            latitude={sensorData.location.latitude}
            longitude={sensorData.location.longitude}
          />
          <SensorDataCard
            rotation={sensorData.gyroscope}
            acceleration={sensorData.accelerometer} // <-- THIS PROP IS NOW ADDED
            timestamp={sensorData.timestamp}
          />

          <div className="bg-white rounded-lg shadow-lg p-4 flex flex-col">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">3D Helmet Orientation</h2>
            <div className="flex-1 w-full">
              <HelmetVisualization rotation={sensorData.gyroscope} />
            </div>
            <div className="mt-3 text-xs text-gray-600 text-center">
              Use mouse to rotate • Scroll to zoom
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;