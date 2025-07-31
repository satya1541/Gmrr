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

    console.log(`Starting automatic cleanup scheduler - runs every ${this.CLEANUP_INTERVAL_MS / (24 * 60 * 60 * 1000)} days, deletes records older than ${this.CLEANUP_OLDER_THAN_DAYS} days`);
    
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
      console.log(`Running cleanup for device_data older than ${this.CLEANUP_OLDER_THAN_DAYS} days`);
      
      const deletedCount = await storage.cleanupOldDeviceData(this.CLEANUP_OLDER_THAN_DAYS);
      
      console.log(`Cleanup completed: ${deletedCount} records deleted`);
      
      return deletedCount;
    } catch (error) {
      console.error('Cleanup failed:', error);
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
