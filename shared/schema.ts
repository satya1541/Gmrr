import { mysqlTable, varchar, int, boolean, timestamp, text } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
});

export const devices = mysqlTable("devices", {
  id: int("id").primaryKey().autoincrement(),
  deviceId: varchar("device_id", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  mqttBroker: varchar("mqtt_broker", { length: 255 }).notNull(),
  mqttTopic: varchar("mqtt_topic", { length: 255 }).notNull(),
  protocol: varchar("protocol", { length: 10 }).notNull().default("MQTT"), // MQTT, MQTTS, WS, WSS
  username: varchar("username", { length: 255 }),
  password: varchar("password", { length: 255 }),
  status: varchar("status", { length: 50 }).notNull().default("offline"), // online, offline, waiting
  lastSeen: timestamp("last_seen"),
  isActive: boolean("is_active").notNull().default(true),
});

export const deviceData = mysqlTable("device_data", {
  id: int("id").primaryKey().autoincrement(),
  deviceId: varchar("device_id", { length: 255 }).notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  rawData: text("raw_data"), // JSON string of all sensor data
});

export const adminSettings = mysqlTable("admin_settings", {
  id: int("id").primaryKey().autoincrement(),
  settingKey: varchar("setting_key", { length: 100 }).notNull().unique(),
  settingValue: text("setting_value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertDeviceSchema = createInsertSchema(devices).omit({
  id: true,
  lastSeen: true,
}).extend({
  deviceId: z.string().min(1, "Device ID is required"),
  name: z.string().min(1, "Device name is required"),
  mqttBroker: z.string().min(1, "MQTT broker is required"),
  mqttTopic: z.string().min(1, "MQTT topic is required"),
  protocol: z.enum(["MQTT", "MQTTS", "WS", "WSS"]).default("MQTT"),
});

export const insertDeviceDataSchema = createInsertSchema(deviceData).omit({
  id: true,
  timestamp: true,
});

export const insertAdminSettingSchema = createInsertSchema(adminSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Device = typeof devices.$inferSelect;
export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type DeviceData = typeof deviceData.$inferSelect;
export type InsertDeviceData = z.infer<typeof insertDeviceDataSchema>;
export type AdminSetting = typeof adminSettings.$inferSelect;
export type InsertAdminSetting = z.infer<typeof insertAdminSettingSchema>;
