import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { useState, useEffect } from "react";
import { ChartModal } from "@/components/chart-modal";
import type { Device, DeviceData } from "@shared/schema";

interface DeviceCardProps {
  device: Device;
  latestData?: DeviceData | null;
  onRefresh?: (deviceId: string) => void;
}

interface ChartDataPoint {
  time: string;
  value: number;
  timestamp: number;
}

export function DeviceCard({ device, latestData, onRefresh }: DeviceCardProps) {
  // Maintain rolling window of real-time data for charts
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);

  // Update chart data when new sensor data arrives
  useEffect(() => {
    if (latestData?.rawData) {
      try {
        const parsedData = JSON.parse(latestData.rawData);
        // Look for alcohol_level first (from WebSocket), then Index (from raw MQTT data) with null safety
        const alcoholLevel = (parsedData?.alcohol_level !== undefined ? parsedData.alcohol_level : 
                             parsedData?.Index !== undefined ? parsedData.Index : 0);
        
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit'
        });

        setChartData(prev => {
          const newPoint: ChartDataPoint = {
            time: timeStr,
            value: alcoholLevel,
            timestamp: now.getTime()
          };

          // Keep only last 30 data points for ECG-style flowing display
          const updatedData = [...prev, newPoint];
          return updatedData.slice(-30);
        });
      } catch (error) {
        // Failed to parse sensor data
      }
    }
  }, [latestData?.rawData, latestData?.timestamp]);
  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-success";
      case "waiting":
        return "bg-warning animate-pulse-slow";
      case "offline":
        return "bg-error";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "online":
        return "default";
      case "waiting":
        return "secondary";
      case "offline":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const formatLastSeen = (lastSeen: Date | null) => {
    if (!lastSeen) return "Never";
    
    const now = new Date();
    const diff = now.getTime() - new Date(lastSeen).getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  };

  const hasData = latestData && device.status === "online";

  return (
    <Card className="animate-fade-in bg-white/90 backdrop-blur-sm border-gray-200/50">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className={cn("w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0", getStatusColor(device.status))} />
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">{device.name}</h3>
              <p className="text-xs sm:text-sm text-gray-500 truncate">{device.deviceId}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            <Badge variant={getStatusBadgeVariant(device.status)} className="text-xs">
              {device.status === "online" ? "Active" : 
               device.status === "waiting" ? "Waiting" : "Offline"}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRefresh?.(device.deviceId)}
              className="text-gray-400 hover:text-gray-600 h-7 w-7 sm:h-8 sm:w-8 p-0"
            >
              <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {hasData ? (
            <>
              {latestData.rawData && (
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-gray-600">Alcohol Value:</span>
                  <span className="text-gray-900 font-medium">
                    {(() => {
                      try {
                        const parsed = JSON.parse(latestData.rawData);
                        // Look for alcohol_level first (from WebSocket), then Index (from raw MQTT data)
                        return parsed.alcohol_level || parsed.Index || 0;
                      } catch (error) {
                        return 0;
                      }
                    })()}
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-gray-600">Status:</span>
                <span className={cn("font-medium", {
                  "text-warning": device.status === "waiting",
                  "text-error": device.status === "offline",
                  "text-success": device.status === "online",
                })}>
                  {device.status === "waiting" ? "Waiting for data..." : 
                   device.status === "offline" ? "Device offline" : "Online"}
                </span>
              </div>

            </>
          )}
          
          <div className="flex justify-between items-center text-xs sm:text-sm">
            <span className="text-gray-600">Last Seen:</span>
            <span className="text-gray-900">{formatLastSeen(device.lastSeen)}</span>
          </div>
        </div>

        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
          <div className="h-64 sm:h-80 lg:h-96 rounded-lg overflow-hidden">
            {hasData ? (
              <div 
                className="w-full h-full bg-white rounded-lg border border-gray-200 p-3 sm:p-4 flex flex-col cursor-pointer hover:shadow-md hover:border-teal-300 transition-all duration-200 group relative"
                onClick={() => setIsChartModalOpen(true)}
                data-testid="chart-container-clickable"
              >
                {/* Hover indicator */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="bg-teal-500 text-white p-1 rounded-full">
                    <Maximize2 className="h-3 w-3" />
                  </div>
                </div>
                
                <div className="mb-2 sm:mb-3 flex-shrink-0">
                  <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Sensor Data Trend</h4>
                  <div className="flex items-center space-x-2 sm:space-x-4 text-xs">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-0.5 bg-teal-500"></div>
                      <span className="text-gray-600">Alcohol Level</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-h-0 relative">
                  <div className="absolute inset-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData.length > 0 ? chartData : [
                          // Fallback data only if no real data available
                          { time: new Date().toLocaleTimeString(), value: 0 }
                        ]}
                        margin={{ top: 5, right: 15, left: 15, bottom: 25 }}
                      >
                        <CartesianGrid strokeDasharray="1 1" stroke="#e5e7eb" strokeWidth={0.5} />
                        <XAxis 
                          dataKey="time" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 8, fill: '#6b7280' }}
                          interval="preserveStartEnd"
                          height={20}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 8, fill: '#6b7280' }}
                          width={25}
                        />
                        <Line 
                          type="linear" 
                          dataKey="value" 
                          stroke="#000000" 
                          strokeWidth={1.5}
                          dot={false}
                          activeDot={false}
                          connectNulls={true}
                          strokeDasharray="0"
                          style={{
                            filter: 'drop-shadow(0 0 3px #00000040)',
                            animation: 'ecg-glow 2s ease-in-out infinite alternate'
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="mt-1 sm:mt-2 p-2 bg-green-50 rounded text-xs flex-shrink-0">
                  <div className="text-green-800 font-medium text-xs sm:text-sm">
                    Alcohol Value: {(() => {
                      try {
                        const parsed = JSON.parse(latestData?.rawData || '{}');
                        // Look for alcohol_level first (from WebSocket), then Index (from raw MQTT data)
                        return parsed.alcohol_level || parsed.Index || 0;
                      } catch {
                        return 0;
                      }
                    })()}
                  </div>
                  <div className="text-green-700 text-xs">Status: Normal</div>
                </div>
              </div>
            ) : (
              <div className="text-center bg-gray-50 w-full h-full rounded-lg flex items-center justify-center">
                <div>
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mb-2 mx-auto" />
                  <p className="text-xs sm:text-sm text-gray-500">No data available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* Chart Modal */}
      <ChartModal
        isOpen={isChartModalOpen}
        onClose={() => setIsChartModalOpen(false)}
        title="Sensor Data Trend - Detailed View"
        data={chartData}
        deviceName={device.name}
      />
    </Card>
  );
}
