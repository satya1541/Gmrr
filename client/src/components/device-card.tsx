import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, LineChart as LineChartIcon, BarChart3, PieChart as PieChartIcon, Zap } from "lucide-react";
import { cn, getAlertStatus } from "@/lib/utils";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip } from 'recharts';
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
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie'>('line');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (latestData?.alcoholLevel !== undefined) {
      const alcoholLevel = latestData.alcoholLevel;
      
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

        const updatedData = [...prev, newPoint];
        return updatedData.slice(-30);
      });
    }
  }, [latestData?.alcoholLevel, latestData?.timestamp]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "waiting":
        return "bg-yellow-500 animate-pulse";
      case "offline":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusGradient = (status: string) => {
    switch (status) {
      case "online":
        return "from-green-400 to-emerald-600";
      case "waiting":
        return "from-yellow-400 to-orange-500";
      case "offline":
        return "from-red-400 to-rose-600";
      default:
        return "from-gray-400 to-gray-600";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "online":
        return "success" as const;
      case "waiting":
        return "warning" as const;
      case "offline":
        return "destructive" as const;
      default:
        return "secondary" as const;
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh?.(device.deviceId);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const hasData = latestData && device.status === "online";

  return (
    <Card className="card-3d glass-enhanced border-0 shadow-2xl overflow-hidden group relative">
      {/* Animated gradient background */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity duration-300",
        getStatusGradient(device.status)
      )}></div>

      <CardContent className="p-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {/* Animated status indicator */}
            <div className="relative">
              <div className={cn("w-3 h-3 rounded-full", getStatusColor(device.status))} />
              {device.status === "online" && (
                <>
                  <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"></span>
                  <span className="absolute inset-0 rounded-full bg-green-500 animate-pulse"></span>
                </>
              )}
            </div>
            
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate flex items-center gap-2">
                {device.name}
                {device.status === "online" && (
                  <Zap className="h-4 w-4 text-green-500 animate-pulse" />
                )}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate font-mono">{device.deviceId}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <Badge 
              variant={getStatusBadgeVariant(device.status)} 
              className="text-xs font-semibold shadow-lg animate-bounce-in"
            >
              {device.status === "online" ? "Active" : 
               device.status === "waiting" ? "Waiting" : "Offline"}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className={cn(
                "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 h-9 w-9 p-0 rounded-xl glass-button transition-all duration-300",
                isRefreshing && "animate-spin"
              )}
              data-testid="button-refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Info Section with animations */}
        <div className="space-y-3 mb-6">
          {hasData ? (
            <div className="p-4 rounded-2xl glass-enhanced border border-white/30 animate-slide-in-bottom">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Alcohol Level</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-counter-up">
                  {latestData.alcoholLevel ?? 0}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl glass-enhanced border border-white/30">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                <span className={cn("font-semibold text-sm", {
                  "text-yellow-600": device.status === "waiting",
                  "text-red-600": device.status === "offline",
                  "text-green-600": device.status === "online",
                })}>
                  {device.status === "waiting" ? "Waiting for data..." : 
                   device.status === "offline" ? "Device offline" : "Online"}
                </span>
              </div>
            </div>
          )}
          
          <div className="p-4 rounded-2xl glass-enhanced border border-white/30 animate-slide-in-bottom stagger-1">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Last Seen</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{formatLastSeen(device.lastSeen)}</span>
            </div>
          </div>
        </div>

        {/* Chart Section with enhanced styling */}
        <div className="rounded-2xl overflow-hidden border border-white/30 bg-white/50 dark:bg-black/20">
          <div className="h-80 lg:h-96">
            {hasData ? (
              <div 
                className="w-full h-full p-4 flex flex-col cursor-pointer hover:bg-white/60 dark:hover:bg-black/30 transition-all duration-300 group/chart relative"
                onClick={() => setIsChartModalOpen(true)}
                data-testid="chart-container-clickable"
              >
                {/* Chart Header */}
                <div className="mb-3 flex-shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      Sensor Data Trend
                    </h4>
                    
                    {/* Chart Type Selector with enhanced styling */}
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setChartType('line'); }}
                        className={cn(
                          "glass-button p-2 rounded-xl transition-all duration-300 hover:scale-110",
                          chartType === 'line' && 'ring-2 ring-blue-500 bg-blue-500/20'
                        )}
                        data-testid="chart-type-line"
                        title="Line Chart"
                      >
                        <LineChartIcon className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setChartType('bar'); }}
                        className={cn(
                          "glass-button p-2 rounded-xl transition-all duration-300 hover:scale-110",
                          chartType === 'bar' && 'ring-2 ring-purple-500 bg-purple-500/20'
                        )}
                        data-testid="chart-type-bar"
                        title="Bar Chart"
                      >
                        <BarChart3 className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setChartType('pie'); }}
                        className={cn(
                          "glass-button p-2 rounded-xl transition-all duration-300 hover:scale-110",
                          chartType === 'pie' && 'ring-2 ring-pink-500 bg-pink-500/20'
                        )}
                        data-testid="chart-type-pie"
                        title="Pie Chart"
                      >
                        <PieChartIcon className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Legend */}
                  <div className="flex items-center space-x-4 text-xs">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                      <span className="text-gray-600 dark:text-gray-400">Alcohol Level</span>
                    </div>
                  </div>
                </div>

                {/* Chart Container */}
                <div className="flex-1 min-h-0 relative">
                  <div className="absolute inset-0">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === 'line' ? (
                        <LineChart
                          data={chartData.length > 0 ? chartData : [
                            { time: new Date().toLocaleTimeString(), value: 0 }
                          ]}
                          margin={{ top: 5, right: 15, left: 15, bottom: 25 }}
                        >
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeWidth={0.5} opacity={0.5} />
                          <XAxis 
                            dataKey="time" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#6b7280' }}
                            interval="preserveStartEnd"
                            height={20}
                          />
                          <YAxis 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#6b7280' }}
                            width={35}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '12px',
                              boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke="url(#colorValue)" 
                            strokeWidth={3}
                            dot={false}
                            activeDot={false}
                            connectNulls={true}
                          />
                        </LineChart>
                      ) : chartType === 'bar' ? (
                        <BarChart
                          data={chartData.length > 0 ? chartData : [
                            { time: new Date().toLocaleTimeString(), value: 0 }
                          ]}
                          margin={{ top: 5, right: 15, left: 15, bottom: 25 }}
                        >
                          <defs>
                            <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.9}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.5}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeWidth={0.5} opacity={0.5} />
                          <XAxis 
                            dataKey="time" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#6b7280' }}
                            interval="preserveStartEnd"
                            height={20}
                          />
                          <YAxis 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#6b7280' }}
                            width={35}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '12px',
                              boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                            }}
                          />
                          <Bar dataKey="value" fill="url(#colorBar)" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      ) : (
                        <PieChart>
                          <Pie
                            data={chartData.length > 0 ? chartData.slice(-5).map((d, i) => ({
                              name: d.time,
                              value: d.value
                            })) : [{ name: 'No Data', value: 1 }]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${value}`}
                            outerRadius={70}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {(chartData.length > 0 ? chartData.slice(-5) : [{ name: 'No Data', value: 1 }]).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'][index % 5]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '12px',
                              boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                            }}
                          />
                        </PieChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Status Footer */}
                <div className={cn("mt-3 p-3 rounded-xl flex-shrink-0 transition-all duration-300", 
                  (() => {
                    const status = latestData?.alertStatus || "Normal";
                    if (status === "Normal") return "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20";
                    if (status === "Moderate Drunk") return "bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20";
                    return "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20";
                  })()
                )}>
                  <div className="flex items-center justify-between">
                    <div className={cn("font-semibold text-sm",
                      (() => {
                        const status = latestData?.alertStatus || "Normal";
                        if (status === "Normal") return "text-green-700 dark:text-green-400";
                        if (status === "Moderate Drunk") return "text-yellow-700 dark:text-yellow-400";
                        return "text-red-700 dark:text-red-400";
                      })()
                    )}>
                      Value: {latestData?.alcoholLevel ?? 0}
                    </div>
                    <Badge variant={
                      latestData?.alertStatus === "Normal" ? "success" :
                      latestData?.alertStatus === "Moderate Drunk" ? "warning" : "destructive"
                    } className="text-xs font-semibold">
                      {latestData?.alertStatus || "Normal"}
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center glass w-full h-full rounded-lg flex items-center justify-center">
                <div className="animate-bounce-in">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">No data available</p>
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
