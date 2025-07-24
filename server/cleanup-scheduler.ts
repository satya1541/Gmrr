import { storage } from "./storage";

class CleanupScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL_MS = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds
  private readonly CLEANUP_OLDER_THAN_DAYS = 2;

  /**
   * Start the automatic cleanup scheduler
   * Runs cleanup every 2 days and deletes records older than 2 days
   */
  start(): void {
    if (this.intervalId) {
      // Cleanup scheduler is already running
      return;
    }

    // Starting automatic cleanup scheduler for device data older than 2 days
    
    // Run cleanup immediately on start
    this.runCleanup();
    
    // Schedule recurring cleanup every 2 days
    this.intervalId = setInterval(() => {
      this.runCleanup();
    }, this.CLEANUP_INTERVAL_MS);

    // Cleanup scheduler started
  }

  /**
   * Stop the automatic cleanup scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      // Cleanup scheduler stopped
    }
  }

  /**
   * Run cleanup manually
   */
  async runCleanup(): Promise<number> {
    try {
      // Running cleanup for device_data table
      
      const deletedCount = await storage.cleanupOldDeviceData(this.CLEANUP_OLDER_THAN_DAYS);
      
      // Cleanup completed
      
      return deletedCount;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get the current cleanup configuration
   */
  getConfig() {
    return {
      intervalDays: this.CLEANUP_INTERVAL_MS / (24 * 60 * 60 * 1000),
      olderThanDays: this.CLEANUP_OLDER_THAN_DAYS,
      isRunning: this.intervalId !== null,
      nextCleanup: this.intervalId ? new Date(Date.now() + this.CLEANUP_INTERVAL_MS) : null
    };
  }
}

// Export a singleton instance
export const cleanupScheduler = new CleanupScheduler();
