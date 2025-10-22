import { useQuery } from "@tanstack/react-query";
import { DeviceCard } from "@/components/device-card";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Activity, Database, Signal, TrendingUp } from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";
import { useEffect, useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { Device, DeviceData } from "@shared/schema";

export default function Dashboard() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceData, setDeviceData] = useState<Record<string, DeviceData>>({});

  const { data: initialDevices, isLoading: devicesLoading } = useQuery<Device[]>({
    queryKey: ["/api/devices"],
  });

  const { isConnected } = useWebSocket({
    onMessage: (message) => {
      if (message.type === "device_update") {
        setDevices(prev => 
          prev.map(device => 
            device.id === message.data.id
              ? message.data
              : device
          )
        );
      } else if (message.type === "device_deleted") {
        setDevices(prev => 
          prev.filter(device => device.id !== message.id)
        );
        setDeviceData(prev => {
          const { [message.deviceId]: deleted, ...remaining } = prev;
          return remaining;
        });
      } else if (message.type === "sensor_data") {
        const { deviceId, data } = message;
        
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
        
        setDevices(prev => 
          prev.map(device => 
            device.deviceId === deviceId
              ? { ...device, lastSeen: new Date(data.timestamp || new Date().toISOString()), status: 'online' }
              : device
          )
        );
      } else if (message.type === "devices_list") {
        setDevices(message.data);
      }
    },
  });

  useEffect(() => {
    if (initialDevices) {
      setDevices(initialDevices);
      
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

  const handleRefreshDevice = useCallback(async (deviceId: string) => {
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
  }, []);

  // Memoize device cards to prevent unnecessary re-renders
  const deviceCards = useMemo(() => {
    return devices.map((device, index) => (
      <div
        key={device.id}
        className="animate-fade-in-scale"
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        <DeviceCard
          device={device}
          latestData={deviceData[device.deviceId]}
          onRefresh={handleRefreshDevice}
        />
      </div>
    ));
  }, [devices, deviceData, handleRefreshDevice]);

  if (devicesLoading) {
    return (
      <div className="min-h-screen p-3 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-64 mb-8 animate-shimmer-wave"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-96 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl animate-fade-in-scale" style={{ animationDelay: `${i * 0.1}s` }}></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
        {/* Connection Status with enhanced design */}
        <div className="mb-4 sm:mb-5 animate-slide-in-left stagger-2">
          <div className="glass-enhanced rounded-xl p-3 sm:p-4 shadow-xl border border-white/30 hover-lift">
            <div className="flex items-center space-x-3">
              <div className={cn(
                "relative w-3 h-3 rounded-full shadow-lg",
                isConnected ? "bg-green-500" : "bg-red-500"
              )}>
                {isConnected && (
                  <>
                    <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"></span>
                    <span className="absolute inset-0 rounded-full bg-green-500 animate-pulse"></span>
                  </>
                )}
              </div>
              <div className="flex-1">
                <span className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-200">
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Real-time data stream {isConnected ? "active" : "inactive"}
                </p>
              </div>
              <TrendingUp className={cn(
                "h-5 w-5 transition-all duration-300",
                isConnected ? "text-green-500 animate-bounce" : "text-gray-400"
              )} />
            </div>
          </div>
        </div>

        {/* Device Monitoring Grid */}
        <div className="mb-6 sm:mb-8 animate-slide-in-bottom stagger-3">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <span className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></span>
            Device Monitoring
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {deviceCards}
          </div>
        </div>

        {devices.length === 0 && (
          <div className="text-center py-12 sm:py-16 animate-bounce-in">
            <div className="inline-block p-8 glass-enhanced rounded-3xl shadow-2xl">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center animate-float">
                <AlertTriangle className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">No devices found</h3>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 px-4">
                Add devices in the Admin panel to start monitoring
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
