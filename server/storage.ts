import { 
  users, 
  devices, 
  deviceData,
  type User, 
  type InsertUser,
  type Device,
  type InsertDevice,
  type DeviceData,
  type InsertDeviceData
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, count, lt } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Device methods
  getDevices(): Promise<Device[]>;
  getDevice(id: number): Promise<Device | undefined>;
  getDeviceByDeviceId(deviceId: string): Promise<Device | undefined>;
  createDevice(device: InsertDevice & Partial<Pick<Device, 'status' | 'lastSeen'>>): Promise<Device>;
  updateDevice(id: number, updates: Partial<Device>): Promise<Device | undefined>;
  deleteDevice(id: number): Promise<boolean>;
  
  // Device data methods
  getDeviceData(deviceId: string, limit?: number): Promise<DeviceData[]>;
  createDeviceData(data: InsertDeviceData): Promise<DeviceData>;
  getLatestDeviceData(deviceId: string): Promise<DeviceData | undefined>;
  
  // History and filtering methods
  getDeviceDataFiltered(
    deviceId: string, 
    limit: number, 
    offset: number, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<DeviceData[]>;
  getDeviceDataCount(
    deviceId: string, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<number>;
  
  // Cleanup methods
  cleanupOldDeviceData(olderThanDays: number): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private devices: Map<number, Device>;
  private deviceData: Map<number, DeviceData>;
  private currentUserId: number;
  private currentDeviceId: number;
  private currentDeviceDataId: number;

  constructor() {
    this.users = new Map();
    this.devices = new Map();
    this.deviceData = new Map();
    this.currentUserId = 1;
    this.currentDeviceId = 1;
    this.currentDeviceDataId = 1;
    
    // Initialize with some default devices
    this.initializeDefaultDevices();
  }

  private initializeDefaultDevices() {
    const defaultDevices = [
      {
        deviceId: "EC64C984BAAC",
        name: "Sensor Node 1",
        mqttBroker: "broker.hivemq.com:1883",
        mqttTopic: "sensors/EC64C984BAAC",
        protocol: "MQTT",
        username: "",
        password: "",
        status: "waiting" as const,
        lastSeen: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
        isActive: true,
      },
      {
        deviceId: "EC64C984E8B0",
        name: "Org",
        mqttBroker: "98.130.28.156:8084",
        mqttTopic: "breath/EC64C984E8B0",
        protocol: "WS",
        username: "moambulance",
        password: process.env.MQTT_PASSWORD || "",
        status: "waiting" as const,
        lastSeen: new Date(),
        isActive: true,
      },
      {
        deviceId: "EC64C984B274",
        name: "Sensor Node 3",
        mqttBroker: "broker.hivemq.com:1883",
        mqttTopic: "sensors/EC64C984B274",
        protocol: "MQTT",
        username: "",
        password: "",
        status: "waiting" as const,
        lastSeen: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        isActive: true,
      },
      {
        deviceId: "EC64C984BAB0",
        name: "Sensor Node 4",
        mqttBroker: "broker.hivemq.com:1883",
        mqttTopic: "sensors/EC64C984BAB0",
        protocol: "MQTT",
        username: "",
        password: "",
        status: "online" as const,
        lastSeen: new Date(Date.now() - 30 * 1000), // 30 seconds ago
        isActive: true,
      },
    ];

    defaultDevices.forEach(device => {
      const deviceRecord: Device = {
        id: this.currentDeviceId++,
        ...device,
      };
      this.devices.set(deviceRecord.id, deviceRecord);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Device methods
  async getDevices(): Promise<Device[]> {
    return Array.from(this.devices.values()).filter(device => device.isActive);
  }

  async getDevice(id: number): Promise<Device | undefined> {
    return this.devices.get(id);
  }

  async getDeviceByDeviceId(deviceId: string): Promise<Device | undefined> {
    return Array.from(this.devices.values()).find(
      (device) => device.deviceId === deviceId && device.isActive,
    );
  }

  async createDevice(insertDevice: InsertDevice & Partial<Pick<Device, 'status' | 'lastSeen'>>): Promise<Device> {
    const id = this.currentDeviceId++;
    const device: Device = { 
      ...insertDevice, 
      id,
      status: insertDevice.status || "offline",
      lastSeen: insertDevice.lastSeen || null,
      isActive: insertDevice.isActive !== undefined ? insertDevice.isActive : true,
      username: insertDevice.username || null,
      password: insertDevice.password || null,
    };
    this.devices.set(id, device);
    return device;
  }

  async updateDevice(id: number, updates: Partial<Device>): Promise<Device | undefined> {
    const device = this.devices.get(id);
    if (!device) return undefined;
    
    const updatedDevice = { ...device, ...updates };
    this.devices.set(id, updatedDevice);
    return updatedDevice;
  }

  async deleteDevice(id: number): Promise<boolean> {
    const device = this.devices.get(id);
    if (!device) return false;
    
    // Soft delete by setting isActive to false
    const updatedDevice = { ...device, isActive: false };
    this.devices.set(id, updatedDevice);
    return true;
  }

  // Device data methods
  async getDeviceData(deviceId: string, limit: number = 100): Promise<DeviceData[]> {
    return Array.from(this.deviceData.values())
      .filter(data => data.deviceId === deviceId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async createDeviceData(insertData: InsertDeviceData): Promise<DeviceData> {
    const id = this.currentDeviceDataId++;
    const data: DeviceData = { 
      ...insertData, 
      id,
      timestamp: new Date(),
      rawData: insertData.rawData || null,
    };
    this.deviceData.set(id, data);
    return data;
  }

  async getLatestDeviceData(deviceId: string): Promise<DeviceData | undefined> {
    const deviceDataArray = Array.from(this.deviceData.values())
      .filter(data => data.deviceId === deviceId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return deviceDataArray[0];
  }

  // History and filtering methods
  async getDeviceDataFiltered(
    deviceId: string, 
    limit: number, 
    offset: number, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<DeviceData[]> {
    let filteredData = Array.from(this.deviceData.values())
      .filter(data => data.deviceId === deviceId);
    
    if (startDate) {
      filteredData = filteredData.filter(data => data.timestamp >= startDate);
    }
    
    if (endDate) {
      filteredData = filteredData.filter(data => data.timestamp <= endDate);
    }
    
    return filteredData
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(offset, offset + limit);
  }

  async getDeviceDataCount(
    deviceId: string, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<number> {
    let filteredData = Array.from(this.deviceData.values())
      .filter(data => data.deviceId === deviceId);
    
    if (startDate) {
      filteredData = filteredData.filter(data => data.timestamp >= startDate);
    }
    
    if (endDate) {
      filteredData = filteredData.filter(data => data.timestamp <= endDate);
    }
    
    return filteredData.length;
  }

  async cleanupOldDeviceData(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    const oldDataArray = Array.from(this.deviceData.values())
      .filter(data => data.timestamp < cutoffDate);
    
    let deletedCount = 0;
    for (const data of oldDataArray) {
      this.deviceData.delete(data.id);
      deletedCount++;
    }
    
    return deletedCount;
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser);
    
    // Get the inserted user
    const [newUser] = await db.select().from(users).where(eq(users.username, insertUser.username));
    return newUser;
  }

  async getDevices(): Promise<Device[]> {
    return await db.select().from(devices).where(eq(devices.isActive, true));
  }

  async getDevice(id: number): Promise<Device | undefined> {
    const [device] = await db.select().from(devices).where(eq(devices.id, id));
    return device || undefined;
  }

  async getDeviceByDeviceId(deviceId: string): Promise<Device | undefined> {
    const [device] = await db.select().from(devices)
      .where(eq(devices.deviceId, deviceId));
    return device || undefined;
  }

  async createDevice(insertDevice: InsertDevice & Partial<Pick<Device, 'status' | 'lastSeen'>>): Promise<Device> {
    await db.insert(devices).values({
      ...insertDevice,
      username: insertDevice.username || null,
      password: insertDevice.password || null,
      status: insertDevice.status || "offline",
      lastSeen: insertDevice.lastSeen || null,
    });
    
    // Get the inserted device
    const [newDevice] = await db.select().from(devices)
      .where(eq(devices.deviceId, insertDevice.deviceId));
    return newDevice;
  }

  async updateDevice(id: number, updates: Partial<Device>): Promise<Device | undefined> {
    await db.update(devices)
      .set(updates)
      .where(eq(devices.id, id));
    
    const [updatedDevice] = await db.select().from(devices).where(eq(devices.id, id));
    return updatedDevice || undefined;
  }

  async deleteDevice(id: number): Promise<boolean> {
    const result = await db.update(devices)
      .set({ isActive: false })
      .where(eq(devices.id, id));
    
    return true;
  }

  async getDeviceData(deviceId: string, limit: number = 100): Promise<DeviceData[]> {
    return await db.select().from(deviceData)
      .where(eq(deviceData.deviceId, deviceId))
      .orderBy(desc(deviceData.timestamp))
      .limit(limit);
  }

  async createDeviceData(insertData: InsertDeviceData): Promise<DeviceData> {
    await db.insert(deviceData).values({
      ...insertData,
      rawData: insertData.rawData || null,
    });
    
    // Get the latest inserted data for this device
    const [newData] = await db.select().from(deviceData)
      .where(eq(deviceData.deviceId, insertData.deviceId))
      .orderBy(desc(deviceData.timestamp))
      .limit(1);
    return newData;
  }

  async getLatestDeviceData(deviceId: string): Promise<DeviceData | undefined> {
    const [data] = await db.select().from(deviceData)
      .where(eq(deviceData.deviceId, deviceId))
      .orderBy(desc(deviceData.timestamp))
      .limit(1);
    
    return data || undefined;
  }

  // History and filtering methods
  async getDeviceDataFiltered(
    deviceId: string, 
    limit: number, 
    offset: number, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<DeviceData[]> {
    const conditions = [eq(deviceData.deviceId, deviceId)];
    
    if (startDate) {
      conditions.push(gte(deviceData.timestamp, startDate));
    }
    
    if (endDate) {
      conditions.push(lte(deviceData.timestamp, endDate));
    }
    
    return await db.select().from(deviceData)
      .where(and(...conditions))
      .orderBy(desc(deviceData.timestamp))
      .limit(limit)
      .offset(offset);
  }

  async getDeviceDataCount(
    deviceId: string, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<number> {
    const conditions = [eq(deviceData.deviceId, deviceId)];
    
    if (startDate) {
      conditions.push(gte(deviceData.timestamp, startDate));
    }
    
    if (endDate) {
      conditions.push(lte(deviceData.timestamp, endDate));
    }
    
    const [result] = await db.select({ count: count() }).from(deviceData)
      .where(and(...conditions));
    
    return result.count;
  }

  async cleanupOldDeviceData(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    // First count the records to be deleted
    const [countResult] = await db.select({ count: count() }).from(deviceData)
      .where(lt(deviceData.timestamp, cutoffDate));
    
    const recordsToDelete = countResult.count;
    
    // Then delete them
    if (recordsToDelete > 0) {
      await db.delete(deviceData)
        .where(lt(deviceData.timestamp, cutoffDate));
    }
    
    return recordsToDelete;
  }
}

// Use database storage by default, fallback to memory storage if database fails
let storage: IStorage;

try {
  storage = new DatabaseStorage();
  // Using MySQL database storage
} catch (error) {
  // Failed to connect to MySQL database, falling back to memory storage
  storage = new MemStorage();
}

export { storage };
