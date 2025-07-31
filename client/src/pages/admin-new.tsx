import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/use-websocket";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ErrorDialog } from "@/components/error-dialog";
import { SuccessDialog } from "@/components/success-dialog";
import { PinProtection } from "@/components/pin-protection";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Trash, RefreshCw, AlertTriangle, Shield, Database, Settings, Zap, Activity, Users, Clock, CheckCircle2, XCircle, AlertCircle, Calendar } from "lucide-react";
import chiplLogo from '@assets/chipl-logo.png';
import { cn } from "@/lib/utils";
import type { Device, InsertDevice } from "@shared/schema";

// Admin content component that only renders when authenticated
function AdminContent() {
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
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: "default" | "destructive";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    variant: "default"
  });

  const [devices, setDevices] = useState<Device[]>([]);
  const { data: initialDevices = [], isLoading } = useQuery<Device[]>({
    queryKey: ["/api/devices"],
  });

  // Initialize devices from query
  useEffect(() => {
    if (initialDevices.length > 0) {
      setDevices(initialDevices);
    }
  }, [initialDevices]);

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
      } else if (message.type === "devices_list") {
        // Initial device list from server
        setDevices(message.data);
      }
    },
  });

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

  const completeCleanupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/cleanup/clear-all");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cleanup/status"] });
      setSuccessDialog({
        isOpen: true,
        title: "Complete Cleanup Successful",
        message: `All device data has been removed. ${data.deletedRecords} records deleted.`
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to clear all data";
      setErrorDialog({
        isOpen: true,
        title: "Complete Cleanup Failed",
        message: "Unable to clear all device data. Please try again.",
        details: errorMessage
      });
    },
  });

  const createDeviceMutation = useMutation({
    mutationFn: async (device: InsertDevice) => {
      const response = await apiRequest("POST", "/api/devices", device);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      setIsDialogOpen(false);
      setEditingDevice(null);
      setSuccessDialog({
        isOpen: true,
        title: "Device Created",
        message: "The device has been successfully created and is now online."
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to create device";
      setErrorDialog({
        isOpen: true,
        title: "Device Creation Failed",
        message: "Unable to create the device. Please check your configuration and try again.",
        details: errorMessage
      });
    },
  });

  const updateDeviceMutation = useMutation({
    mutationFn: async (device: Device) => {
      const response = await apiRequest("PUT", `/api/devices/${device.id}`, device);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      setIsDialogOpen(false);
      setEditingDevice(null);
      setSuccessDialog({
        isOpen: true,
        title: "Device Updated",
        message: "The device configuration has been successfully updated."
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to update device";
      setErrorDialog({
        isOpen: true,
        title: "Device Update Failed",
        message: "Unable to update the device. Please check your configuration and try again.",
        details: errorMessage
      });
    },
  });

  const deleteDeviceMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/devices/${id}`);
      return response.json();
    },
    onSuccess: () => {
      // Show success immediately - WebSocket will handle UI update
      setSuccessDialog({
        isOpen: true,
        title: "Device Deleted",
        message: "The device has been successfully removed from the system."
      });
      // Don't wait for query invalidation since WebSocket handles real-time updates
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      }, 100);
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to delete device";
      setErrorDialog({
        isOpen: true,
        title: "Device Deletion Failed",
        message: "Unable to delete the device. Please try again.",
        details: errorMessage
      });
    },
  });

  const handleFormSubmit = (data: InsertDevice) => {
    if (editingDevice) {
      updateDeviceMutation.mutate({ ...editingDevice, ...data });
    } else {
      createDeviceMutation.mutate(data);
    }
  };

  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Device",
      message: "Are you sure you want to delete this device? This action cannot be undone.",
      variant: "destructive",
      onConfirm: () => {
        deleteDeviceMutation.mutate(id);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
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

  console.log('Admin component state:', { isLoading, devicesCount: devices?.length });

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
        {/* Enhanced Header */}
        <div className="mb-8 sm:mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-white to-gray-50 rounded-xl shadow-lg border-2 border-teal-500">
                <img 
                  src={chiplLogo} 
                  alt="CHIPL Logo" 
                  className="h-8 w-8 object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-gray-600 mt-1">Manage devices and system settings</p>
              </div>
            </div>
            <Button 
              onClick={() => {
                setEditingDevice(null);
                setIsDialogOpen(true);
              }}
              className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 rounded-xl"
            >
              <Plus className="h-5 w-5" />
              <span className="font-medium">Add New Device</span>
            </Button>
          </div>
        </div>

        {/* Device Management Section */}
        <Card className="mb-8 sm:mb-10 bg-white/95 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="p-6 sm:p-8 bg-gradient-to-r from-gray-50 to-blue-50/50 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">Connected Devices</CardTitle>
                <p className="text-gray-600 mt-1">Monitor and manage your IoT devices</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Device Name
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      MQTT Broker
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Last Activity
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {devices.map((device) => (
                    <tr key={device.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {device.name}
                          </div>
                          <div className="text-xs text-gray-500 sm:hidden">
                            ID: {device.id}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 hidden sm:table-cell">
                        <div className="max-w-xs truncate" title={device.mqttBroker}>
                          {device.mqttBroker}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <div className="flex items-center gap-2">
                          {device.status === "online" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                          {device.status === "waiting" && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                          {device.status === "offline" && <XCircle className="h-4 w-4 text-red-500" />}
                          <Badge 
                            variant={getStatusBadgeVariant(device.status)}
                            className="font-medium"
                          >
                            {device.status === "online" ? "Online" : 
                             device.status === "waiting" ? "Waiting" : "Offline"}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          {formatLastActivity(device.lastSeen)}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(device)}
                            className="p-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 rounded-lg transition-all duration-200"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit device</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(device.id)}
                            className="p-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-lg transition-all duration-200"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete device</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {devices.length === 0 && (
                <div className="text-center py-12">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                      <Database className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No devices configured</h3>
                      <p className="text-gray-500 mb-4">Get started by adding your first IoT device</p>
                      <Button
                        onClick={() => {
                          setEditingDevice(null);
                          setIsDialogOpen(true);
                        }}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-3"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Device
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Data Cleanup Management - Compact Design */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Data Cleanup Card */}
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg shadow-lg">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-gray-900">Data Cleanup Management</CardTitle>
                    <p className="text-xs text-gray-600">Automated system maintenance and data retention</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {isLoadingCleanup ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : cleanupStatus ? (
                <div className="space-y-4">
                  {/* Compact Status Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-gray-50 p-3 rounded-lg border">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-3 w-3 text-blue-500" />
                        <span className="font-medium text-gray-700">Status:</span>
                      </div>
                      <div className="text-gray-600">Cleanup scheduler status</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border">
                      <div className="flex items-center gap-2 mb-1">
                        <RefreshCw className="h-3 w-3 text-purple-500" />
                        <span className="font-medium text-gray-700">Cleanup Interval:</span>
                      </div>
                      <div className="text-gray-600">Every {cleanupStatus.config.intervalDays} days</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border">
                      <div className="flex items-center gap-2 mb-1">
                        <Database className="h-3 w-3 text-indigo-500" />
                        <span className="font-medium text-gray-700">Retention Period:</span>
                      </div>
                      <div className="text-gray-600">{cleanupStatus.config.olderThanDays} days</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-3 w-3 text-green-500" />
                        <span className="font-medium text-gray-700">Next Cleanup:</span>
                      </div>
                      <div className="text-gray-600">
                        {cleanupStatus.config.nextCleanup ? 
                          new Date(cleanupStatus.config.nextCleanup).toLocaleDateString() : 
                          "01/08/2025"
                        }
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <Button
                    onClick={() => runCleanupMutation.mutate()}
                    disabled={runCleanupMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-lg h-10"
                  >
                    <RefreshCw className={cn("h-4 w-4", runCleanupMutation.isPending && "animate-spin")} />
                    <span className="font-medium text-sm">
                      {runCleanupMutation.isPending ? "Running Cleanup..." : "Run Manual Cleanup"}
                    </span>
                  </Button>
                </div>
              ) : (
                <div className="text-gray-500 text-sm">Unable to load cleanup status</div>
              )}
            </CardContent>
          </Card>

          {/* Danger Zone Card */}
          <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-0 shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="p-4 bg-gradient-to-r from-red-100 to-orange-100 border-b border-red-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg shadow-lg">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-red-800">Danger Zone</CardTitle>
                    <p className="text-xs text-red-700">Destructive actions that cannot be undone</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Trash className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-medium text-red-900 text-sm">Clear All Device Data</h3>
                      <p className="text-xs text-red-700 mt-1">
                        Permanently delete all historical sensor data from all devices. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={() => {
                    setConfirmDialog({
                      isOpen: true,
                      title: "⚠️ WARNING: Clear All Device Data",
                      message: "This will permanently delete ALL device data from the database. This action cannot be undone.\n\nAre you absolutely sure you want to continue?",
                      variant: "destructive",
                      onConfirm: () => {
                        completeCleanupMutation.mutate();
                        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                      }
                    });
                  }}
                  disabled={completeCleanupMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-lg h-10"
                >
                  <Trash className={cn("h-4 w-4", completeCleanupMutation.isPending && "animate-spin")} />
                  <span className="font-medium text-sm">
                    {completeCleanupMutation.isPending ? "Clearing..." : "Clear All Data"}
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Device Form Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingDevice ? "Edit Device" : "Add New Device"}
              </DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const protocolValue = formData.get("protocol") as string;
                const data = {
                  name: formData.get("name") as string,
                  deviceId: formData.get("deviceId") as string,
                  mqttBroker: formData.get("mqttBroker") as string,
                  mqttTopic: formData.get("mqttTopic") as string,
                  protocol: (protocolValue || "WS") as "MQTT" | "MQTTS" | "WS" | "WSS",
                  username: (formData.get("username") as string) || null,
                  password: (formData.get("password") as string) || null,
                };
                handleFormSubmit(data);
              }}
              className="space-y-4"
            >
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
                <Label htmlFor="deviceId">Device ID</Label>
                <Input
                  id="deviceId"
                  name="deviceId"
                  placeholder="device_001"
                  defaultValue={editingDevice?.deviceId || ""}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mqttBroker">MQTT Broker</Label>
                  <Input
                    id="mqttBroker"
                    name="mqttBroker"
                    placeholder="broker.hivemq.com"
                    defaultValue={editingDevice?.mqttBroker || ""}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="protocol">Protocol</Label>
                  <select 
                    name="protocol" 
                    defaultValue={editingDevice?.protocol || "WS"}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="MQTT">MQTT</option>
                    <option value="MQTTS">MQTTS</option>
                    <option value="WS">WebSocket</option>
                    <option value="WSS">WebSocket Secure</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="mqttTopic">MQTT Topic</Label>
                <Input
                  id="mqttTopic"
                  name="mqttTopic"
                  placeholder="sensors/data"
                  defaultValue={editingDevice?.mqttTopic || ""}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                   editingDevice ? "Update Device" : "Create Device"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Success Dialog */}
        <SuccessDialog
          isOpen={successDialog.isOpen}
          title={successDialog.title}
          message={successDialog.message}
          onClose={() => setSuccessDialog(prev => ({ ...prev, isOpen: false }))}
        />

        {/* Error Dialog */}
        <ErrorDialog
          isOpen={errorDialog.isOpen}
          title={errorDialog.title}
          message={errorDialog.message}
          details={errorDialog.details}
          onClose={() => setErrorDialog(prev => ({ ...prev, isOpen: false }))}
        />

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          variant={confirmDialog.variant}
          confirmText="OK"
          cancelText="Cancel"
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        />
      </main>
    </div>
  );
}

// Main admin component with PIN protection
export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  return <AdminContent />;
}