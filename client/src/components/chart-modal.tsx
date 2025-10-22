import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Maximize2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";

interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: Array<{ time: string; value: number }>;
  deviceName?: string;
}

export function ChartModal({ isOpen, onClose, title, data, deviceName }: ChartModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-dialog max-w-4xl w-full h-[80vh] flex flex-col [&>button]:hidden border-0 shadow-2xl rounded-3xl" data-testid="chart-modal">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Maximize2 className="h-5 w-5 text-teal-600" />
                {title}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {deviceName ? `Device: ${deviceName} - ` : ""}Real-time sensor data visualization
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100"
              data-testid="button-close-chart"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 glass-card rounded-2xl border p-6">
          <div className="h-full flex flex-col">
            {/* Chart Legend */}
            <div className="mb-4 flex-shrink-0">
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded"></div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Alcohol Level</span>
                </div>
                {data.length > 0 && (
                  <div className="text-gray-500 dark:text-gray-400">
                    Latest: {data[data.length - 1]?.value || 0}
                  </div>
                )}
              </div>
            </div>
            
            {/* Chart Container */}
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.length > 0 ? data : [
                    { time: new Date().toLocaleTimeString(), value: 0 }
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <defs>
                    <linearGradient id="colorValueModal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeWidth={0.5} opacity={0.5} />
                  <XAxis 
                    dataKey="time" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={Math.max(0, Math.floor(data.length / 10))}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    width={60}
                    label={{ value: 'Alcohol Level', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280' } }}
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
                    stroke="url(#colorValueModal)" 
                    strokeWidth={3}
                    dot={false}
                    activeDot={false}
                    connectNulls={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* Chart Footer */}
            <div className="mt-4 p-4 glass-card rounded-xl flex-shrink-0">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                <div>
                  Time Range: {data.length > 0 ? `${data[0]?.time} - ${data[data.length - 1]?.time}` : 'No data available'}
                </div>
                <div>
                  {data.length > 0 && (
                    <>
                      Min: {Math.min(...data.map(d => d.value)).toFixed(1)}
                      {' | '}
                      Max: {Math.max(...data.map(d => d.value)).toFixed(1)}
                      {' | '}
                      Avg: {(data.reduce((sum, d) => sum + d.value, 0) / data.length).toFixed(1)}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}