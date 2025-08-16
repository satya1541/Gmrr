import mqtt from 'mqtt';
import { storage } from './storage';
import { log } from './vite';

// WebSocket broadcasters will be injected from routes
let webSocketBroadcaster: ((device: any) => void) | null = null;
let sensorDataBroadcaster: ((deviceId: string, data: any) => void) | null = null;

interface MqttDeviceData {
  alcohol_level: number;
  timestamp?: string;
}

class MqttClientService {
  private clients: Map<string, mqtt.MqttClient> = new Map(); // Map device ID to client
  private subscribedTopics: Set<string> = new Set();
  private client: mqtt.MqttClient | null = null; // Main client for legacy methods

  // Set the WebSocket broadcaster functions
  setWebSocketBroadcaster(broadcaster: (device: any) => void) {
    webSocketBroadcaster = broadcaster;
  }

  setSensorDataBroadcaster(broadcaster: (deviceId: string, data: any) => void) {
    sensorDataBroadcaster = broadcaster;
  }

  async initialize() {
    try {
      // Initialize MQTT connections for all active devices
      await this.connectToDeviceBrokers();
    } catch (error) {
      console.error('Failed to initialize MQTT client:', error instanceof Error ? error.message : error);
    }
  }

  private async connectToDeviceBrokers() {
    try {
      const devices = await storage.getDevices();
      
      for (const device of devices.filter(d => d.isActive)) {
        await this.connectToDevice(device);
      }
    } catch (error) {
      console.error('Failed to connect to device brokers:', error instanceof Error ? error.message : error);
    }
  }

  private async connectToDevice(device: any) {
    try {
      // Parse broker URL properly - handle different formats
      let brokerHost = device.mqttBroker;
      let brokerPort = 1883;
      
      if (brokerHost.includes(':')) {
        const parts = brokerHost.split(':');
        brokerHost = parts[0];
        brokerPort = parseInt(parts[1]) || 1883;
      }
      
      // Determine protocol based on device protocol setting
      const protocol = device.protocol || 'WS';
      let brokerUrl: string;
      let isSecure = false;
      
      switch (protocol) {
        case 'WSS':
          brokerUrl = `wss://${brokerHost}:${brokerPort}`;
          isSecure = true;
          break;
        case 'WS':
          brokerUrl = `ws://${brokerHost}:${brokerPort}`;
          break;
        case 'MQTTS':
          brokerUrl = `mqtts://${brokerHost}:${brokerPort}`;
          isSecure = true;
          break;
        case 'MQTT':
        default:
          brokerUrl = `mqtt://${brokerHost}:${brokerPort}`;
          break;
      }
      
      // Connecting to MQTT broker
      
      const options = {
        clientId: `toxishield-server-${device.deviceId}-${Date.now()}`,
        clean: true,
        connectTimeout: 10000,
        username: device.username || '',
        password: device.password || '',
        reconnectPeriod: 5000,
        protocolVersion: (protocol === 'WS' || protocol === 'WSS') ? 4 : 3 as 3 | 4, // Use v4 for WebSocket, v3 for regular MQTT
        keepalive: 60,
        rejectUnauthorized: false, // Allow self-signed certificates
        // Use WebSocket options for WS/WSS protocols
        ...((protocol === 'WS' || protocol === 'WSS') && {
          protocolId: 'MQTT' as const
        })
      };
      
      const client = mqtt.connect(brokerUrl, options);

      client.on('connect', () => {
        // Connected to MQTT broker
        
        // Subscribe to device topic
        client.subscribe(device.mqttTopic, { qos: 1 }, (error: Error | null) => {
          if (error) {
            // Failed to subscribe to topic
          } else {
            // Subscribed to topic
            this.subscribedTopics.add(device.mqttTopic);
            
            // Update device status to online when MQTT connection established
            storage.updateDevice(device.id, {
              status: 'online',
              lastSeen: new Date(),
            }).then(updatedDevice => {
              // Broadcast device status update via WebSocket
              if (webSocketBroadcaster && updatedDevice) {
                webSocketBroadcaster(updatedDevice);
              }
            });
          }
        });
      });

      client.on('error', (error) => {
        // MQTT connection error
        
        // For connection timeout errors, try to reconnect with different settings
        if (error.message.includes('connack timeout') || error.message.includes('timeout')) {
          // Connection timeout, will retry with different settings
          client.end();
          // Remove old client and try again with WebSocket protocol
          this.clients.delete(device.deviceId);
          setTimeout(() => {
            try {
              this.connectToDevice(device);
            } catch (retryError) {
              console.warn('Error during MQTT reconnection timeout:', retryError);
            }
          }, 5000);
          return;
        }
        
        // Try different protocol versions for compatibility
        if (error.message.includes('Invalid header flag bits') || error.message.includes('protocol')) {
          // Trying different protocol version
          client.end();
          this.retryWithDifferentProtocol(device);
          return;
        }
        
        // Update device status to offline on connection error
        storage.updateDevice(device.id, {
          status: 'offline',
          lastSeen: new Date(),
        }).then(updatedDevice => {
          // Broadcast device status update via WebSocket
          if (webSocketBroadcaster && updatedDevice) {
            webSocketBroadcaster(updatedDevice);
          }
        }).catch(updateError => {
          console.warn('Failed to update device status on MQTT error:', updateError);
        });
      });

      client.on('message', async (topic, message) => {
        await this.handleMessage(topic, message, device);
      });

      client.on('disconnect', () => {
        // Disconnected from MQTT broker
        
        // Update device status to waiting when disconnected
        storage.updateDevice(device.id, {
          status: 'waiting',
          lastSeen: new Date(),
        }).then(updatedDevice => {
          // Broadcast device status update via WebSocket
          if (webSocketBroadcaster && updatedDevice) {
            webSocketBroadcaster(updatedDevice);
          }
        });
      });

      // Store the client for this device
      this.clients.set(device.deviceId, client);
      
    } catch (error) {
      // Failed to connect to MQTT broker
    }
  }

  // Method to add a new device connection
  async addDeviceConnection(device: any) {
    await this.connectToDevice(device);
  }

  // Retry connection with different protocol version
  private async retryWithDifferentProtocol(device: any, protocolVersion: number = 4) {
    if (protocolVersion > 5) {
      // After trying all protocol versions, mark device as offline
      // All protocol versions failed, marking as offline
      storage.updateDevice(device.id, {
        status: 'offline',
        lastSeen: new Date(),
      }).then(updatedDevice => {
        if (webSocketBroadcaster && updatedDevice) {
          webSocketBroadcaster(updatedDevice);
        }
      });
      return;
    }
    
    try {
      let brokerHost = device.mqttBroker;
      let brokerPort = 1883;
      
      if (brokerHost.includes(':')) {
        const parts = brokerHost.split(':');
        brokerHost = parts[0];
        brokerPort = parseInt(parts[1]) || 1883;
      }
      
      // Check if this is the special WebSocket MQTT broker
      let useWebSocket = false;
      if (brokerHost === '98.130.28.156' && brokerPort === 8084) {
        useWebSocket = true;
      }
      
      const brokerUrl = useWebSocket ? `ws://${brokerHost}:${brokerPort}` : `mqtt://${brokerHost}:${brokerPort}`;
      
      // Retrying connection with different protocol
      
      const client = mqtt.connect(brokerUrl, {
        clientId: `toxishield-server-${device.deviceId}-v${protocolVersion}-${Date.now()}`,
        clean: true,
        connectTimeout: 10000,
        username: device.username || '',
        password: device.password || '',
        reconnectPeriod: 0, // Disable auto-reconnect for retry attempts
        protocolVersion: (protocolVersion as 3 | 4 | 5),
        keepalive: 60,
        rejectUnauthorized: false,
      });

      client.on('connect', () => {
        // Successfully connected to MQTT broker
        
        // Subscribe to device topic
        client.subscribe(device.mqttTopic, { qos: 1 }, (error: Error | null) => {
          if (error) {
            log(`Failed to subscribe to topic ${device.mqttTopic}: ${error.message}`);
          } else {
            log(`Subscribed to topic: ${device.mqttTopic}`);
            this.subscribedTopics.add(device.mqttTopic);
            
            // Update device status to online when MQTT connection established
            storage.updateDevice(device.id, {
              status: 'online',
              lastSeen: new Date(),
            }).then(updatedDevice => {
              if (webSocketBroadcaster && updatedDevice) {
                webSocketBroadcaster(updatedDevice);
              }
            });
          }
        });
      });

      client.on('error', (error) => {
        // Retry failed
        client.end();
        
        if (error.message.includes('Invalid header flag bits') || error.message.includes('protocol')) {
          // Try next protocol version  
          setTimeout(() => {
            try {
              this.retryWithDifferentProtocol(device, protocolVersion + 1);
            } catch (retryError) {
              console.warn('Error during MQTT protocol retry timeout:', retryError);
            }
          }, 2000);
        } else {
          // Update device status to offline
          storage.updateDevice(device.id, {
            status: 'offline',
            lastSeen: new Date(),
          }).then(updatedDevice => {
            if (webSocketBroadcaster && updatedDevice) {
              webSocketBroadcaster(updatedDevice);
            }
          }).catch(updateError => {
            console.warn('Failed to update device status during retry:', updateError);
          });
        }
      });

      client.on('message', async (topic, message) => {
        await this.handleMessage(topic, message, device);
      });

      // Store the client for this device
      this.clients.set(device.deviceId, client);
      
    } catch (error) {
      // Failed to retry connection
    }
  }

  private async subscribeToDeviceTopics() {
    if (!this.client) return;

    try {
      const devices = await storage.getDevices();
      
      for (const device of devices) {
        if (device.mqttTopic && !this.subscribedTopics.has(device.mqttTopic)) {
          this.client.subscribe(device.mqttTopic, { qos: 1 }, (error: Error | null) => {
            if (error) {
              // Failed to subscribe to topic
            } else {
              // Subscribed to topic
              this.subscribedTopics.add(device.mqttTopic);
            }
          });
        }
      }
    } catch (error) {
      // Failed to subscribe to device topics
    }
  }

  private async handleMessage(topic: string, message: Buffer, device: any) {
    try {
      const messageStr = message.toString();
      // Received MQTT message

      // Parse the incoming message
      let data: MqttDeviceData;
      try {
        const parsedMessage = JSON.parse(messageStr);
        
        // Extract alcohol_level from different possible field names with null safety
        let alcoholLevel = 0;
        if (parsedMessage && typeof parsedMessage === 'object') {
          if (parsedMessage.alcohol_level !== undefined) {
            alcoholLevel = parseFloat(parsedMessage.alcohol_level) || 0;
          } else if (parsedMessage.Index !== undefined) {
            alcoholLevel = parseFloat(parsedMessage.Index) || 0;
          } else if (parsedMessage.level !== undefined) {
            alcoholLevel = parseFloat(parsedMessage.level) || 0;
          } else if (parsedMessage.value !== undefined) {
            alcoholLevel = parseFloat(parsedMessage.value) || 0;
          }
        }
        
        data = { alcohol_level: alcoholLevel };
      } catch {
        // If it's not JSON, try to parse as a simple number (alcohol level)
        const alcoholLevel = parseFloat(messageStr);
        if (isNaN(alcoholLevel)) {
          // Invalid message format
          return;
        }
        data = { alcohol_level: alcoholLevel };
      }

      // Device is already provided from the connection context

      // Broadcast sensor data update via WebSocket FIRST for real-time charts
      if (sensorDataBroadcaster) {
        // Broadcasting sensor data
        sensorDataBroadcaster(device.deviceId, {
          alcoholLevel: data.alcohol_level,
          timestamp: new Date().toISOString(),
          rawData: { rawData: messageStr } // Send raw message directly for immediate processing
        });
      } else {
        // No sensorDataBroadcaster available
      }

      // Store the device data in database (async, don't wait)
      storage.createDeviceData({
        deviceId: device.deviceId,
        rawData: messageStr,
      }).then(deviceData => {
        // Update device status to online and last seen
        return storage.updateDevice(device.id, {
          status: 'online',
          lastSeen: new Date(),
        });
      }).then(updatedDevice => {
        // Broadcast device status update via WebSocket
        if (webSocketBroadcaster && updatedDevice) {
          webSocketBroadcaster(updatedDevice);
        }
      }).catch(error => {
        // Error storing device data
      });

      // Stored data for device

    } catch (error) {
      // Error handling MQTT message
    }
  }

  async disconnect() {
    if (this.client) {
      this.client.end();
      this.client = null;
      this.subscribedTopics.clear();
    }
  }

  // Method to subscribe to new device topics when devices are added
  async subscribeToNewDevice(mqttTopic: string) {
    if (this.client && mqttTopic && !this.subscribedTopics.has(mqttTopic)) {
      this.client.subscribe(mqttTopic, { qos: 1 }, (error: Error | null) => {
        if (error) {
          // Failed to subscribe to new topic
        } else {
          // Subscribed to new topic
          this.subscribedTopics.add(mqttTopic);
        }
      });
    }
  }
}

export const mqttClient = new MqttClientService();