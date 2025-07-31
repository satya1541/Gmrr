import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertDeviceSchema, insertDeviceDataSchema, insertAdminSettingSchema, type DeviceData } from "@shared/schema";
import * as XLSX from 'xlsx';
import { z } from "zod";
import { mqttClient } from "./mqtt-client";
import { cleanupScheduler } from "./cleanup-scheduler";

export async function registerRoutes(app: Express): Promise<Server> {
  // Store active WebSocket connections for broadcasting
  const clients = new Set<WebSocket>();

  // Function to broadcast device updates to all connected clients
  function broadcastDeviceUpdate(device: any) {
    const message = JSON.stringify({
      type: 'device_update',
      data: device,
      timestamp: new Date().toISOString()
    });

    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Function to broadcast sensor data updates to all connected clients
  function broadcastSensorData(deviceId: string, sensorData: any) {
    const message = JSON.stringify({
      type: 'sensor_data',
      deviceId: deviceId,
      data: sensorData,
      timestamp: new Date().toISOString()
    });

    // Broadcasting sensor data to connected clients

    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Connect MQTT service with WebSocket broadcasters
  mqttClient.setWebSocketBroadcaster(broadcastDeviceUpdate);
  mqttClient.setSensorDataBroadcaster(broadcastSensorData);

  // Device routes
  app.get("/api/devices", async (req, res) => {
    try {
      const devices = await storage.getDevices();
      res.json(devices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch devices" });
    }
  });

  app.get("/api/devices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const device = await storage.getDevice(id);
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }
      res.json(device);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch device" });
    }
  });

  app.post("/api/devices", async (req, res) => {
    try {
      const deviceData = insertDeviceSchema.parse(req.body);
      
      // Check if device ID already exists
      const existingDevice = await storage.getDeviceByDeviceId(deviceData.deviceId);
      if (existingDevice) {
        return res.status(400).json({ message: "Device ID already exists" });
      }
      
      // Set the device as online when created (assuming it's ready to connect)
      const device = await storage.createDevice({
        ...deviceData,
        status: "online",
        lastSeen: new Date(),
      });

      // Broadcast new device to all connected WebSocket clients
      broadcastDeviceUpdate(device);
      
      res.status(201).json(device);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid device data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create device" });
    }
  });

  // API endpoint to receive device data from external systems
  app.post("/api/devices/:deviceId/data", async (req, res) => {
    try {
      const { deviceId } = req.params;
      const { alcohol_level, timestamp } = req.body;
      
      // Received data for device
      
      // Validate input
      if (alcohol_level === undefined || alcohol_level === null) {
        return res.status(400).json({ message: "alcohol_level is required" });
      }
      
      // Validate device exists
      const device = await storage.getDeviceByDeviceId(deviceId);
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }
      
      // Found device
      
      // Store the device data in rawData field and omit alcoholLevel
      const rawData = JSON.stringify({ 
        alcohol_level, 
        timestamp: new Date(),
        device_id: deviceId 
      });
      
      const deviceData = await storage.createDeviceData({
        deviceId: deviceId,
        rawData: rawData,
      });
      
      // Stored device data
      
      // Update device status to online and last seen
      const updatedDevice = await storage.updateDevice(device.id, {
        status: 'online',
        lastSeen: new Date(),
      });
      
      // Updated device status
      
      res.status(201).json({ message: "Data received successfully", data: deviceData });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: "Failed to store device data", error: errorMessage });
    }
  });

  app.put("/api/devices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      // When updating a device, automatically set it to online status
      // This indicates the device configuration is active and ready to connect
      const deviceUpdates = {
        ...updates,
        status: "online",
        lastSeen: new Date(),
      };
      
      const device = await storage.updateDevice(id, deviceUpdates);
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }

      // Broadcast device status update to all connected WebSocket clients
      broadcastDeviceUpdate(device);
      
      res.json(device);
    } catch (error) {
      res.status(500).json({ message: "Failed to update device" });
    }
  });

  app.delete("/api/devices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the device before deletion to broadcast the update
      const device = await storage.getDevice(id);
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }
      
      // Broadcast device deletion immediately to all connected WebSocket clients
      const deleteMessage = JSON.stringify({
        type: 'device_deleted',
        deviceId: device.deviceId,
        id: device.id,
        timestamp: new Date().toISOString()
      });
      
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(deleteMessage);
        }
      });
      
      // Respond immediately before database operation completes
      res.json({ message: "Device deleted successfully" });
      
      // Delete from database asynchronously 
      storage.deleteDevice(id).catch(error => {
        console.error('Failed to delete device from database:', error);
      });
      
    } catch (error) {
      res.status(500).json({ message: "Failed to delete device" });
    }
  });

  // Device data routes
  app.get("/api/devices/:deviceId/data", async (req, res) => {
    try {
      const { deviceId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const data = await storage.getDeviceData(deviceId, limit);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch device data" });
    }
  });

  app.get("/api/devices/:deviceId/data/latest", async (req, res) => {
    try {
      const { deviceId } = req.params;
      const data = await storage.getLatestDeviceData(deviceId);
      res.json(data || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch latest device data" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const devices = await storage.getDevices();
      const onlineDevices = devices.filter(d => d.status === "online").length;
      const waitingDevices = devices.filter(d => d.status === "waiting").length;
      const offlineDevices = devices.filter(d => d.status === "offline").length;
      
      // Calculate total messages (mock for now)
      const totalMessages = Math.floor(Math.random() * 2000) + 1000;
      
      res.json({
        onlineDevices,
        waitingDevices,
        offlineDevices,
        totalMessages,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // History data routes with pagination and date filtering
  app.get("/api/history/devices/:deviceId", async (req, res) => {
    try {
      const { deviceId } = req.params;
      const { 
        page = "1", 
        limit = "50", 
        startDate, 
        endDate 
      } = req.query as { 
        page?: string; 
        limit?: string; 
        startDate?: string; 
        endDate?: string; 
      };
      
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;
      
      // Validate device exists
      const device = await storage.getDeviceByDeviceId(deviceId);
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }
      
      // Get filtered data with pagination
      const data = await storage.getDeviceDataFiltered(
        deviceId, 
        limitNum, 
        offset, 
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );
      
      // Get total count for pagination
      const totalCount = await storage.getDeviceDataCount(
        deviceId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );
      
      res.json({
        data,
        device,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          pages: Math.ceil(totalCount / limitNum)
        }
      });
    } catch (error) {
      console.error("Error fetching device history:", error);
      res.status(500).json({ message: "Failed to fetch device history" });
    }
  });

  // Export device data to Excel
  app.get("/api/history/devices/:deviceId/export", async (req, res) => {
    try {
      const { deviceId } = req.params;
      const { startDate, endDate } = req.query as { 
        startDate?: string; 
        endDate?: string; 
      };
      
      // Validate device exists
      const device = await storage.getDeviceByDeviceId(deviceId);
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }
      
      // Get all data for export (no pagination limit)
      const data = await storage.getDeviceDataFiltered(
        deviceId, 
        10000, // Large limit for export
        0,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );
      
      // Create Excel file using xlsx
      
      // Transform data for Excel export
      const excelData = data.map((item: DeviceData) => {
        const rawData = item.rawData ? JSON.parse(item.rawData) : {};
        return {
          'Date': item.timestamp.toISOString().split('T')[0],
          'Time': item.timestamp.toTimeString().split(' ')[0],
          'Timestamp': item.timestamp.toISOString(),
          'Device ID': item.deviceId,
          'Device Name': device.name,
          'Alcohol Level': rawData.alcohol_level || rawData.Index || 0,
          'Alert Status': rawData.Alert || 'Unknown',
          'Owner ID': rawData.OwnerId || '',
          'MAC Address': rawData.MAC || ''
        };
      });
      
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Add the worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Device Data');
      
      // Generate Excel file buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      // Set headers for file download
      const filename = `${device.name}_${deviceId}_data_${new Date().toISOString().split('T')[0]}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      res.send(excelBuffer);
    } catch (error) {
      res.status(500).json({ message: "Failed to export device data" });
    }
  });

  // Cleanup management routes
  app.get("/api/cleanup/status", async (req, res) => {
    try {
      const config = cleanupScheduler.getConfig();
      res.json({
        message: "Cleanup scheduler status",
        config: config
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get cleanup status" });
    }
  });

  app.post("/api/cleanup/run", async (req, res) => {
    try {
      const deletedCount = await cleanupScheduler.runCleanup();
      res.json({
        message: "Manual cleanup completed",
        deletedRecords: deletedCount
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to run manual cleanup" });
    }
  });

  app.post("/api/cleanup/clear-all", async (req, res) => {
    try {
      const deletedCount = await storage.clearAllDeviceData();
      res.json({
        message: "All device data cleared",
        deletedRecords: deletedCount
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear all device data" });
    }
  });

  // Admin Settings routes
  app.get("/api/admin/settings/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const setting = await storage.getAdminSetting(key);
      
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      
      res.json(setting);
    } catch (error) {
      console.error("Error fetching admin setting:", error);
      res.status(500).json({ message: "Failed to fetch admin setting" });
    }
  });

  app.post("/api/admin/settings", async (req, res) => {
    try {
      const validatedData = insertAdminSettingSchema.parse(req.body);
      const setting = await storage.setAdminSetting(validatedData);
      res.json(setting);
    } catch (error) {
      console.error("Error saving admin setting:", error);
      res.status(500).json({ message: "Failed to save admin setting" });
    }
  });

  // Initialize admin PIN if it doesn't exist
  (async () => {
    try {
      const existingPin = await storage.getAdminSetting('admin_pin');
      if (!existingPin) {
        await storage.setAdminSetting({
          settingKey: 'admin_pin',
          settingValue: '1541'
        });
      }
    } catch (error) {
      console.log('Admin PIN initialization completed or already exists');
    }
  })();

  const httpServer = createServer(app);

  // WebSocket server setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });



  wss.on('connection', (ws) => {
    clients.add(ws);

    // Send current device list to newly connected client
    storage.getDevices().then(devices => {
      ws.send(JSON.stringify({
        type: 'devices_list',
        data: devices,
        timestamp: new Date().toISOString()
      }));
    });

    ws.on('close', () => {
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      clients.delete(ws);
    });
  });

  // Simulate MQTT data and device status updates
  const simulateDeviceData = async () => {
    try {
      const devices = await storage.getDevices();
      
      for (const device of devices) {
        // Randomly update device status
        if (Math.random() < 0.1) { // 10% chance to change status
          const statuses = ["online", "offline", "waiting"];
          const currentIndex = statuses.indexOf(device.status);
          const newStatus = statuses[(currentIndex + 1) % statuses.length];
          
          await storage.updateDevice(device.id, {
            status: newStatus,
            lastSeen: new Date(),
          });

          // Broadcast status change
          const message = JSON.stringify({
            type: "device_status_update",
            deviceId: device.deviceId,
            status: newStatus,
            lastSeen: new Date(),
          });

          clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(message);
            }
          });
        }

        // Generate sensor data for online devices
        if (device.status === "online" && Math.random() < 0.3) { // 30% chance to send data
          const sensorData = {
            deviceId: device.deviceId,
            alcoholLevel: Math.floor(Math.random() * 400 + 100).toString(), // 100-500 alcohol level
            rawData: JSON.stringify({
              timestamp: new Date().toISOString(),
              sensors: {
                alcoholLevel: Math.floor(Math.random() * 400 + 100).toString(),
              }
            }),
          };

          // Store the data
          await storage.createDeviceData(sensorData);

          // Update device last seen
          await storage.updateDevice(device.id, {
            lastSeen: new Date(),
          });

          // Broadcast new data
          const message = JSON.stringify({
            type: "device_data_update",
            deviceId: device.deviceId,
            data: sensorData,
          });

          clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(message);
            }
          });
        }
      }
    } catch (error) {
      // Error simulating device data
    }
  };

  // Start simulation - temporarily disabled due to schema migration
  // setInterval(simulateDeviceData, 5000); // Run every 5 seconds

  return httpServer;
}
