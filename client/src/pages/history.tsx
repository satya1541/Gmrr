import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Download, History as HistoryIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface DeviceData {
  id: number;
  deviceId: string;
  timestamp: string;
  rawData: string | null;
}

interface Device {
  id: number;
  deviceId: string;
  name: string;
  status: string;
}

interface HistoryResponse {
  data: DeviceData[];
  device: Device;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function History() {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // Fetch all devices for selection
  const { data: devices = [] } = useQuery<Device[]>({
    queryKey: ["/api/devices"],
  });

  // Fetch history data for selected device
  const { data: historyData, isLoading, error } = useQuery<HistoryResponse>({
    queryKey: ["/api/history/devices", selectedDeviceId, currentPage, startDate, endDate],
    enabled: !!selectedDeviceId,
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "50",
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });
      
      const response = await fetch(`/api/history/devices/${selectedDeviceId}?${params}`);
      if (!response.ok) throw new Error("Failed to fetch history data");
      return response.json();
    }
  });

  const handleExport = async () => {
    if (!selectedDeviceId) return;
    
    setIsExporting(true);
    try {
      const params = new URLSearchParams({
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });
      
      const response = await fetch(`/api/history/devices/${selectedDeviceId}/export?${params}`);
      if (!response.ok) throw new Error("Failed to export data");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `device_${selectedDeviceId}_history.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      // Export failed
    } finally {
      setIsExporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy HH:mm:ss");
  };

  const parseAlcoholLevel = (rawData: string | null) => {
    if (!rawData) return 0;
    try {
      const data = JSON.parse(rawData);
      return data.alcohol_level || data.Index || 0;
    } catch {
      return 0;
    }
  };

  const parseAlertStatus = (rawData: string | null) => {
    if (!rawData) return "Unknown";
    try {
      const data = JSON.parse(rawData);
      return data.Alert || "Unknown";
    } catch {
      return "Unknown";
    }
  };

  return (
    <div className="min-h-screen">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <HistoryIcon className="h-6 w-6 text-blue-600" />
            Device History
          </h1>
          <p className="text-gray-600 mt-1">
            View and export historical sensor data from your IoT devices
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-white/90 backdrop-blur-sm border-gray-200/50">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Device
                </label>
                <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a device..." />
                  </SelectTrigger>
                  <SelectContent>
                    {devices.map((device) => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {device.name} ({device.deviceId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                    setCurrentPage(1);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
              
              <div className="flex items-end">
                <Button
                  onClick={handleExport}
                  disabled={!selectedDeviceId || isExporting}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? "Exporting..." : "Export Excel"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        {selectedDeviceId && (
          <Card className="bg-white/90 backdrop-blur-sm border-gray-200/50">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">
                    {historyData?.device.name} ({historyData?.device.deviceId})
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {historyData?.pagination.total} total records
                  </p>
                </div>
                
                {historyData && historyData.pagination.pages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {historyData.pagination.page} of {historyData.pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(historyData.pagination.pages, prev + 1))}
                      disabled={currentPage === historyData.pagination.pages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-600">
                  Error loading data. Please try again.
                </div>
              ) : historyData?.data.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No data found for the selected filters.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Alcohol Level
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Alert Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Raw Data
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {historyData?.data.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                              {formatDate(record.timestamp)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-lg font-semibold text-blue-600">
                              {parseAlcoholLevel(record.rawData)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              parseAlertStatus(record.rawData) === "Normal" 
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}>
                              {parseAlertStatus(record.rawData)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                              {record.rawData ? record.rawData.substring(0, 50) + "..." : "N/A"}
                            </code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!selectedDeviceId && (
          <Card>
            <CardContent className="text-center py-12">
              <HistoryIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a Device
              </h3>
              <p className="text-gray-600">
                Choose a device from the dropdown above to view its historical data.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}