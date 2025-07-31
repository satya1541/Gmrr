import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ErrorDialog } from "@/components/error-dialog";
import { SuccessDialog } from "@/components/success-dialog";
import { PinProtection } from "@/components/pin-protection";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Trash, RefreshCw, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Device, InsertDevice } from "@shared/schema";

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [errorDialog, setErrorDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    details?: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
    details: ""
  });
  const [successDialog, setSuccessDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: "",
    message: ""
  });

  const { data: devices = [], isLoading } = useQuery<Device[]>({
    queryKey: ["/api/devices"],
    enabled: isAuthenticated, // Only fetch data when authenticated
  });

  // Show PIN protection screen if not authenticated
  if (!isAuthenticated) {
    return (
      <PinProtection 
        onSuccess={() => {
          console.log('PIN authentication successful');
          setIsAuthenticated(true);
        }}
        title="Admin Panel Access"
      />
    );
  }

  const { data: cleanupStatus, isLoading: isLoadingCleanup } = useQuery<{
    message: string;
    config: {
      intervalDays: number;
      olderThanDays: number;
      isRunning: boolean;
      nextCleanup: string | null;
    };
  }>({
    queryKey: ["/api/cleanup/status"],
  });

  const runCleanupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/cleanup/run");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cleanup/status"] });
      setSuccessDialog({
        isOpen: true,
        title: "Cleanup Completed",
        message: `Successfully cleaned up ${data.deletedRecords} old device data records.`
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to run cleanup";
      setErrorDialog({
        isOpen: true,
        title: "Cleanup Failed",
        message: "Unable to run the cleanup operation. Please try again.",
        details: errorMessage
      });
    },
  });

  const clearAllDataMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/cleanup/clear-all");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cleanup/status"] });
      setSuccessDialog({
        isOpen: true,
        title: "All Data Cleared",
        message: `Successfully removed all ${data.deletedRecords} device data records from the database.`
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to clear all data";
      setErrorDialog({
        isOpen: true,
        title: "Clear All Data Failed",
        message: "Unable to clear all device data. Please try again.",
        details: errorMessage
      });
    },
  });

  const createDeviceMutation = useMutation({
    mutationFn: async (deviceData: InsertDevice) => {
      const response = await apiRequest("POST", "/api/devices", deviceData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsDialogOpen(false);
      setEditingDevice(null);
      setSuccessDialog({
        isOpen: true,
        title: "Device Added",
        message: "Device has been added successfully and is now connecting to the MQTT broker."
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to add device";
      const isDeviceExists = errorMessage.includes("already exists");
      
      setErrorDialog({
        isOpen: true,
        title: isDeviceExists ? "Device Already Exists" : "Error Adding Device",
        message: isDeviceExists 
          ? "A device with this Device ID already exists in the system. Please use a different Device ID."
          : "Unable to add the device to the system. Please check your configuration and try again.",
        details: errorMessage
      });
    },
  });

  const updateDeviceMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Device> }) => {
      const response = await apiRequest("PUT", `/api/devices/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsDialogOpen(false);
      setEditingDevice(null);
      setSuccessDialog({
        isOpen: true,
        title: "Device Updated",
        message: "Device configuration has been updated successfully. The device will reconnect with the new settings."
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to update device";
      setErrorDialog({
        isOpen: true,
        title: "Error Updating Device",
        message: "Unable to update the device configuration. Please check your settings and try again.",
        details: errorMessage
      });
    },
  });

  const deleteDeviceMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/devices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setSuccessDialog({
        isOpen: true,
        title: "Device Deleted",
        message: "Device has been successfully removed from the system."
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to delete device";
      setErrorDialog({
        isOpen: true,
        title: "Error Deleting Device",
        message: "Unable to delete the device from the system. Please try again.",
        details: errorMessage
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const deviceData: InsertDevice = {
      deviceId: formData.get("deviceId") as string,
      name: formData.get("name") as string,
      mqttBroker: formData.get("mqttBroker") as string,
      mqttTopic: formData.get("mqttTopic") as string,
      protocol: formData.get("protocol") as "MQTT" | "MQTTS" | "WS" | "WSS",
      username: formData.get("username") as string || null,
      password: formData.get("password") as string || null,
      status: "offline",
      isActive: true,
    };

    if (editingDevice) {
      updateDeviceMutation.mutate({ id: editingDevice.id, updates: deviceData });
    } else {
      createDeviceMutation.mutate(deviceData);
    }
  };

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

  const formatLastActivity = (lastSeen: Date | null) => {
    if (!lastSeen) return "Never";
    
    const now = new Date();
    const diff = now.getTime() - new Date(lastSeen).getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  };

  // Debug: Check authentication and loading state
  console.log('Admin component state:', { isAuthenticated, isLoading, devicesCount: devices?.length });

  if (isLoading) {
    return (
      <div className="min-h-screen p-3 sm:p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-50">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-6 sm:h-8 bg-gray-200 rounded w-48 sm:w-64 mb-6 sm:mb-8"></div>
            <div className="h-48 sm:h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-50">
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Device Management</h2>
            <Button 
              onClick={() => {
                setEditingDevice(null);
                setIsDialogOpen(true);
              }}
              className="flex items-center justify-center space-x-2 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Add Device</span>
            </Button>
          </div>
        </div>

        {/* Device Management Table */}
        <Card className="mb-6 sm:mb-8 bg-white/90 backdrop-blur-sm border-gray-200/50">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Connected Devices</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Device Name
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      MQTT Broker
                    </th>
                    <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Protocol
                    </th>
                    <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Topic
                    </th>
                    <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Activity
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {devices.map((device) => (
                    <tr key={device.id}>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={cn("w-2 h-2 rounded-full mr-2 sm:mr-3 flex-shrink-0", getStatusColor(device.status))} />
                          <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                            {device.name}
                            <div className="sm:hidden text-xs text-gray-500 mt-1">
                              {device.deviceId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <Badge variant={getStatusBadgeVariant(device.status)} className="text-xs">
                          {device.status === "online" ? "Active" : 
                           device.status === "waiting" ? "Waiting" : "Offline"}
                        </Badge>
                      </td>
                      <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {device.mqttBroker}
                      </td>
                      <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline" className="text-xs">
                          {device.protocol || "WS"}
                        </Badge>
                      </td>
                      <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {device.mqttTopic}
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatLastActivity(device.lastSeen)}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-1 sm:space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingDevice(device);
                              setIsDialogOpen(true);
                            }}
                            className="text-primary hover:text-primary/80 h-7 w-7 sm:h-8 sm:w-8 p-0"
                          >
                            <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteDeviceMutation.mutate(device.id)}
                            className="text-error hover:text-error/80 h-7 w-7 sm:h-8 sm:w-8 p-0"
                            disabled={deleteDeviceMutation.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Data Cleanup Management */}
        <Card className="mb-6 sm:mb-8 bg-white/90 backdrop-blur-sm border-gray-200/50">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <Trash className="h-5 w-5" />
              Data Cleanup Management
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cleanup Status */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Current Settings</h3>
                {isLoadingCleanup ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ) : cleanupStatus ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cleanup Interval:</span>
                      <span className="font-medium">{cleanupStatus.config?.intervalDays} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delete Records Older Than:</span>
                      <span className="font-medium">{cleanupStatus.config?.olderThanDays} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Scheduler Status:</span>
                      <Badge variant={cleanupStatus.config?.isRunning ? "default" : "secondary"}>
                        {cleanupStatus.config?.isRunning ? "Running" : "Stopped"}
                      </Badge>
                    </div>
                    {cleanupStatus.config?.nextCleanup && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Next Cleanup:</span>
                        <span className="font-medium text-xs">
                          {new Date(cleanupStatus.config.nextCleanup).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Unable to load cleanup status</div>
                )}
              </div>

              {/* Manual Cleanup */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Manual Actions</h3>
                <div className="space-y-3">
                  <p className="text-xs text-gray-600">
                    Run cleanup manually to remove old device data records immediately.
                  </p>
                  <Button 
                    onClick={() => runCleanupMutation.mutate()}
                    disabled={runCleanupMutation.isPending}
                    className="w-full flex items-center justify-center gap-2"
                    variant="outline"
                  >
                    {runCleanupMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash className="h-4 w-4" />
                    )}
                    {runCleanupMutation.isPending ? "Running Cleanup..." : "Run Cleanup Now"}
                  </Button>
                  <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    <strong>Note:</strong> This will permanently delete device data records older than {cleanupStatus?.config.olderThanDays || 2} days.
                  </div>
                  
                  <div className="border-t pt-3 mt-3">
                    <p className="text-xs text-red-600 mb-2 font-medium">
                      Danger Zone
                    </p>
                    <Button 
                      onClick={() => clearAllDataMutation.mutate()}
                      disabled={clearAllDataMutation.isPending}
                      className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white"
                      variant="destructive"
                    >
                      {clearAllDataMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                      {clearAllDataMutation.isPending ? "Clearing All Data..." : "Clear All Device Data"}
                    </Button>
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded mt-2">
                      <strong>Warning:</strong> This will permanently delete ALL device data records from the database. This action cannot be undone.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add/Edit Device Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingDevice ? "Edit Device" : "Add New Device"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Label htmlFor="deviceId">Device ID</Label>
                    <Input
                      id="deviceId"
                      name="deviceId"
                      placeholder="EC64C984XXXX"
                      defaultValue={editingDevice?.deviceId || ""}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Device Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Sensor Node 1"
                      defaultValue={editingDevice?.name || ""}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="mqttBroker">MQTT Broker</Label>
                    <Input
                      id="mqttBroker"
                      name="mqttBroker"
                      placeholder="mqtt.broker.local:1883"
                      defaultValue={editingDevice?.mqttBroker || ""}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="mqttTopic">MQTT Topic</Label>
                    <Input
                      id="mqttTopic"
                      name="mqttTopic"
                      placeholder="sensors/deviceId"
                      defaultValue={editingDevice?.mqttTopic || ""}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="protocol">Protocol</Label>
                    <Select name="protocol" defaultValue={editingDevice?.protocol || "WS"}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select protocol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MQTT">MQTT (Standard TCP)</SelectItem>
                        <SelectItem value="MQTTS">MQTTS (TLS/SSL)</SelectItem>
                        <SelectItem value="WS">WS (WebSocket)</SelectItem>
                        <SelectItem value="WSS">WSS (Secure WebSocket)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="username">Username (Optional)</Label>
                    <Input
                      id="username"
                      name="username"
                      placeholder="mqtt_user"
                      defaultValue={editingDevice?.username || ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password (Optional)</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      defaultValue={editingDevice?.password || ""}
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingDevice(null);
                    }}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createDeviceMutation.isPending || updateDeviceMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    {createDeviceMutation.isPending || updateDeviceMutation.isPending ? "Saving..." :
                     editingDevice ? "Update Device" : "Add Device"}
                  </Button>
                </div>
              </form>
          </DialogContent>
        </Dialog>

        {devices.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <Plus className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No devices configured</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 px-4">Add your first MQTT device to start monitoring.</p>
            <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Device
            </Button>
          </div>
        )}

        {/* Error Dialog */}
        <ErrorDialog
          isOpen={errorDialog.isOpen}
          onClose={() => setErrorDialog({ ...errorDialog, isOpen: false })}
          title={errorDialog.title}
          message={errorDialog.message}
          details={errorDialog.details}
        />

        {/* Success Dialog */}
        <SuccessDialog
          isOpen={successDialog.isOpen}
          onClose={() => setSuccessDialog({ ...successDialog, isOpen: false })}
          title={successDialog.title}
          message={successDialog.message}
        />
      </main>
    </div>
  );
}
