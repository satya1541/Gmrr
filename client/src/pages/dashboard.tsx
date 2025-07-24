import { useQuery } from "@tanstack/react-query";
import { DeviceCard } from "@/components/device-card";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";
import { useEffect, useState } from "react";
import type { Device, DeviceData } from "@shared/schema";



export default function Dashboard() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceData, setDeviceData] = useState<Record<string, DeviceData>>({});

  // Fetch initial data
  const { data: initialDevices, isLoading: devicesLoading } = useQuery<Device[]>({
    queryKey: ["/api/devices"],
  });



  // WebSocket for real-time updates
  const { isConnected } = useWebSocket({
    onMessage: (message) => {

      
      if (message.type === "device_update") {
        // Update the specific device in the list
        setDevices(prev => 
          prev.map(device => 
            device.id === message.data.id
              ? message.data
              : device
          )
        );
      } else if (message.type === "sensor_data") {
        // Real-time sensor data from MQTT
        const { deviceId, data } = message;

        
        // Update latest device data with proper structure
        setDeviceData(prev => {
          const newData = {
            ...prev,
            [deviceId]: {
              id: Date.now(),
              deviceId: deviceId,
              timestamp: data.timestamp || new Date().toISOString(),
              rawData: data.rawData?.rawData || JSON.stringify({ alcohol_level: data.alcoholLevel, Index: data.alcoholLevel }),
              alcoholLevel: data.alcoholLevel
            },
          };

          return newData;
        });
        
        // Update device last seen to online status
        setDevices(prev => 
          prev.map(device => 
            device.deviceId === deviceId
              ? { ...device, lastSeen: new Date(data.timestamp || new Date().toISOString()), status: 'online' }
              : device
          )
        );
      } else if (message.type === "devices_list") {
        // Initial device list from server

        setDevices(message.data);
      }
    },
  });

  // Initialize devices from API
  useEffect(() => {
    if (initialDevices) {
      setDevices(initialDevices);
      
      // Fetch latest data for each device
      initialDevices.forEach(async (device) => {
        try {
          const response = await fetch(`/api/devices/${device.deviceId}/data/latest`);
          const data = await response.json();
          if (data) {
            setDeviceData(prev => ({
              ...prev,
              [device.deviceId]: data,
            }));
          }
        } catch (error) {
          // Failed to fetch data for device
        }
      });
    }
  }, [initialDevices]);

  const handleRefreshDevice = async (deviceId: string) => {
    try {
      const response = await fetch(`/api/devices/${deviceId}/data/latest`);
      const data = await response.json();
      if (data) {
        setDeviceData(prev => ({
          ...prev,
          [deviceId]: data,
        }));
      }
    } catch (error) {
      // Failed to refresh device
    }
  };

  if (devicesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-6 sm:h-8 bg-gray-200 rounded w-48 sm:w-64 mb-6 sm:mb-8"></div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 sm:h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-64 sm:h-80 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">


        {/* Device Monitoring Cards */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-medium text-gray-900 mb-4 sm:mb-6">Device Status</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {devices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                latestData={deviceData[device.deviceId]}
                onRefresh={handleRefreshDevice}
              />
            ))}
          </div>
        </div>

        {devices.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <AlertTriangle className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No devices found</h3>
            <p className="text-sm sm:text-base text-gray-600 px-4">Add devices in the Admin panel to start monitoring.</p>
          </div>
        )}
      </main>
    </div>
  );
}
