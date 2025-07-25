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
        
        // Move to next key for round-robin
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
        
        this.logger.debug(`Using API key ${this.currentKeyIndex} (${keyInfo.requestCount} requests)`);
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
    return this.apiKeys
      .filter(key => key.isHealthy)
      .reduce((best, current) => 
        current.lastUsed < best.lastUsed ? current : best
      );
  }

  /**
   * Create a new GoogleGenAI instance with the next available API key
   */
  async createGeminiClient(): Promise<GoogleGenAI> {
    const apiKey = await this.getNextAPIKey();
    return new GoogleGenAI({ apiKey });
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
        index,
        requestCount: key.requestCount,
        lastUsed: new Date(key.lastUsed).toISOString(),
        isHealthy: key.isHealthy,
        keyPreview: `${key.key.substring(0, 8)}...`
      }))
    };
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