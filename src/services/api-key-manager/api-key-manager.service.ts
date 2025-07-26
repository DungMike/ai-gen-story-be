import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

interface APIKeyInfo {
  key: string;
  lastUsed: number;
  requestCount: number;
  isHealthy: boolean;
}

@Injectable()
export class APIKeyManagerService implements OnModuleInit {
  private readonly logger = new Logger(APIKeyManagerService.name);
  private apiKeys: APIKeyInfo[] = [];
  private currentKeyIndex = 0;
  private readonly REQUEST_COOLDOWN = 1000; // 1 second between requests per key
  private readonly MAX_REQUESTS_PER_MINUTE = 60; // Adjust based on your rate limits

  onModuleInit() {
    this.initializeAPIKeys();
  }

  private initializeAPIKeys() {
    const keys = this.getAPIKeysFromEnv();
    
    if (keys.length === 0) {
      throw new Error('No Gemini API keys found in environment variables');
    }

    this.apiKeys = keys.map(key => ({
      key,
      lastUsed: 0,
      requestCount: 0,
      isHealthy: true
    }));   
    this.logger.log(`Initialized ${this.apiKeys.length} API keys for rotation`);
  }

  private getAPIKeysFromEnv(): string[] {
    const keys: string[] = [];
    
    // Get primary key
    if (process.env.GEMINI_API_KEY) {
      keys.push(process.env.GEMINI_API_KEY);
    }

    // Get additional keys (GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.)
    let index = 1;
    while (process.env[`GEMINI_API_KEY_${index}`]) {
      keys.push(process.env[`GEMINI_API_KEY_${index}`]);
      index++;
    }

    return keys.filter(key => key && key.trim().length > 0);
  }

  /**
   * Get the next available API key with load balancing
   */
  async getNextAPIKey(): Promise<string> {
    const now = Date.now();
    let attempts = 0;
    const maxAttempts = this.apiKeys.length * 2;

    while (attempts < maxAttempts) {
      const keyInfo = this.apiKeys[this.currentKeyIndex];
      
      // Check if this key is available (not rate limited and healthy)
      if (this.isKeyAvailable(keyInfo, now)) {
        // Update usage info
        keyInfo.lastUsed = now;
        keyInfo.requestCount++;
        
        // Log the current key index before moving to next
        const currentIndex = this.currentKeyIndex;
        
        // Move to next key for round-robin
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
        
        this.logger.debug(`Using API key ${currentIndex + 1} (${keyInfo.requestCount} requests)`);
        return keyInfo.key;
      }

      // Try next key
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
      attempts++;
    }

    // If no key is available, wait for the best one
    const bestKey = this.findBestAvailableKey();
    const waitTime = this.REQUEST_COOLDOWN - (now - bestKey.lastUsed);
    
    if (waitTime > 0) {
      this.logger.warn(`All keys rate limited, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    bestKey.lastUsed = Date.now();
    bestKey.requestCount++;
    
    // Find the index of the best key for logging
    const bestKeyIndex = this.apiKeys.findIndex(k => k.key === bestKey.key);
    this.logger.debug(`Using API key ${bestKeyIndex + 1} (${bestKey.requestCount} requests) - after waiting`);
    
    return bestKey.key;
  }

  private isKeyAvailable(keyInfo: APIKeyInfo, now: number): boolean {
    if (!keyInfo.isHealthy) {
      return false;
    }

    // Check cooldown period
    if ((now - keyInfo.lastUsed) < this.REQUEST_COOLDOWN) {
      return false;
    }

    return true;
  }

  private findBestAvailableKey(): APIKeyInfo {
    const healthyKeys = this.apiKeys.filter(key => key.isHealthy);
    if (healthyKeys.length === 0) {
      // If no healthy keys, return the first one and reset it
      const firstKey = this.apiKeys[0];
      firstKey.isHealthy = true;
      firstKey.lastUsed = 0;
      return firstKey;
    }
    
    return healthyKeys.reduce((best, current) => 
      current.lastUsed < best.lastUsed ? current : best
    );
  }

  /**
   * Create a new GoogleGenAI instance with the next available API key
   */
  async createGeminiClient(): Promise<GoogleGenAI> {
    const apiKey = await this.getNextAPIKey();
    const client = new GoogleGenAI({ apiKey });
    // Expose the API key for error handling
    (client as any).apiKey = apiKey;
    return client;
  }

  /**
   * Mark a key as unhealthy (e.g., when it gets rate limited or errors)
   */
  markKeyAsUnhealthy(apiKey: string, reason?: string) {
    const keyInfo = this.apiKeys.find(k => k.key === apiKey);
    if (keyInfo) {
      keyInfo.isHealthy = false;
      this.logger.warn(`Marked API key as unhealthy: ${reason || 'Unknown reason'}`);
      
      // Retry after 1 minutes
      setTimeout(() => {
        keyInfo.isHealthy = true;
        keyInfo.requestCount = 0;
        this.logger.log('API key marked as healthy again');
      }, 1 * 60 * 1000);
    }
  }

  /**
   * Get statistics about API key usage
   */
  getKeyStats() {
    return {
      totalKeys: this.apiKeys.length,
      healthyKeys: this.apiKeys.filter(k => k.isHealthy).length,
      currentKeyIndex: this.currentKeyIndex,
      keyStats: this.apiKeys.map((key, index) => ({
        index: index + 1, // 1-based indexing for user-friendly display
        requestCount: key.requestCount,
        lastUsed: new Date(key.lastUsed).toISOString(),
        isHealthy: key.isHealthy,
        keyPreview: `${key.key.substring(0, 8)}...`,
        timeSinceLastUse: Date.now() - key.lastUsed
      }))
    };
  }

  /**
   * Get the current key index (for debugging)
   */
  getCurrentKeyIndex(): number {
    return this.currentKeyIndex;
  }

  /**
   * Get the next key index that will be used
   */
  getNextKeyIndex(): number {
    return (this.currentKeyIndex + 1) % this.apiKeys.length;
  }

  /**
   * Reset all key statistics
   */
  resetStats() {
    this.apiKeys.forEach(key => {
      key.requestCount = 0;
      key.lastUsed = 0;
      key.isHealthy = true;
    });
    this.currentKeyIndex = 0;
    this.logger.log('API key statistics reset');
  }
} 