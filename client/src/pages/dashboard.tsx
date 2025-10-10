import { useQuery } from "@tanstack/react-query";
import { DeviceCard } from "@/components/device-card";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
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
      } else if (message.type === "device_deleted") {
        // Remove the deleted device from the list immediately
        setDevices(prev => 
          prev.filter(device => device.id !== message.id)
        );
        // Also remove device data for the deleted device
        setDeviceData(prev => {
          const { [message.deviceId]: deleted, ...remaining } = prev;
          return remaining;
        });
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
              alcoholLevel: data.alcoholLevel || data.alcohol_level || 0,
              alertStatus: data.alertStatus || data.Alert || 'Unknown'
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
      
      // Fetch latest data for each device with proper error handling
      const fetchDeviceData = async () => {
        try {
          const dataPromises = initialDevices.map(async (device) => {
            try {
              const response = await fetch(`/api/devices/${device.deviceId}/data/latest`);
              if (!response.ok) {
                console.warn(`Failed to fetch data for device ${device.deviceId}:`, response.statusText);
                return { deviceId: device.deviceId, data: null };
              }
              const data = await response.json();
              return { deviceId: device.deviceId, data };
            } catch (error) {
              console.warn(`Error fetching data for device ${device.deviceId}:`, error);
              return { deviceId: device.deviceId, data: null };
            }
          });

          const results = await Promise.all(dataPromises);
          
          // Update state with all results at once to prevent race conditions
          const deviceDataMap: { [key: string]: any } = {};
          results.forEach(result => {
            if (result.data) {
              deviceDataMap[result.deviceId] = result.data;
            }
          });
          
          if (Object.keys(deviceDataMap).length > 0) {
            setDeviceData(prev => ({ ...prev, ...deviceDataMap }));
          }
        } catch (error) {
          console.error('Failed to fetch device data:', error);
        }
      };

      fetchDeviceData();
    }
  }, [initialDevices]);

  const handleRefreshDevice = async (deviceId: string) => {
    try {
      const response = await fetch(`/api/devices/${deviceId}/data/latest`);
      if (!response.ok) {
        console.warn(`Failed to refresh device ${deviceId}: ${response.statusText}`);
        return;
      }
      const data = await response.json();
      if (data) {
        setDeviceData(prev => ({
          ...prev,
          [deviceId]: data,
        }));
      }
    } catch (error) {
      console.warn(`Error refreshing device ${deviceId}:`, error);
    }
  };

  if (devicesLoading) {
    return (
      <div className="min-h-screen p-3 sm:p-6">
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
    <div className="min-h-screen">
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">


        {/* Connection Status Indicator */}
        <div className="mb-4 sm:mb-6">
          <div className="glass-card rounded-xl p-4 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className={cn(
                "w-3 h-3 rounded-full shadow-lg",
                isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
              )}></div>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {isConnected ? "Connected" : "Disconnected"}
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Real-time data stream
              </span>
            </div>
          </div>
        </div>

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
