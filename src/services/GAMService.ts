// Google Ad Manager Service for Rewarded Ads
declare global {
  interface Window {
    googletag?: any;
  }
}

export interface GAMConfig {
  adUnitId: string;
  onRewarded?: (reward: any) => void;
  onError?: (error: Error) => void;
  onAdLoaded?: () => void;
}

export class GAMService {
  private static instance: GAMService;
  private isInitialized = false;
  private currentSlot: any = null;
  private config: GAMConfig | null = null;
  private containerId = 'rewarded-ad-container';

  private constructor() {
    if (typeof window !== 'undefined') {
      this.loadGPT();
    }
  }

  static getInstance(): GAMService {
    if (!GAMService.instance) {
      GAMService.instance = new GAMService();
    }
    return GAMService.instance;
  }

  private loadGPT(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Window is not available'));
        return;
      }
      
      if (window.googletag && window.googletag.apiReady) {
        this.isInitialized = true;
        resolve();
        return;
      }

      // Check if script already exists
      const existingScript = document.querySelector('script[src*="googletagservices.com/tag/js/gpt.js"]');
      if (existingScript) {
        // Script already loading, wait for it
        let attempts = 0;
        const checkInterval = setInterval(() => {
          attempts++;
          if (window.googletag && window.googletag.apiReady) {
            clearInterval(checkInterval);
            this.isInitialized = true;
            resolve();
          } else if (attempts > 50) {
            clearInterval(checkInterval);
            reject(new Error('Timeout waiting for Google Publisher Tag to load'));
          }
        }, 100);
        return;
      }

      // Load Google Publisher Tag script
      const script = document.createElement('script');
      script.src = 'https://www.googletagservices.com/tag/js/gpt.js';
      script.async = true;
      script.onload = () => {
        // Wait for googletag to be ready
        let attempts = 0;
        const checkInterval = setInterval(() => {
          attempts++;
          if (window.googletag && window.googletag.apiReady) {
            clearInterval(checkInterval);
            window.googletag = window.googletag || { cmd: [] };
            this.isInitialized = true;
            resolve();
          } else if (attempts > 50) {
            clearInterval(checkInterval);
            reject(new Error('Timeout waiting for Google Publisher Tag API to be ready'));
          }
        }, 100);
      };
      script.onerror = () => {
        reject(new Error('Failed to load Google Publisher Tag script'));
        if (this.config?.onError) {
          this.config.onError(new Error('Failed to load Google Publisher Tag'));
        }
      };
      document.head.appendChild(script);
    });
  }

  async initialize(config: GAMConfig): Promise<void> {
    this.config = config;
    
    try {
      if (typeof window === 'undefined') {
        throw new Error('Window is not available');
      }

      // Load GPT if not already loaded
      if (!window.googletag || !window.googletag.apiReady) {
        await this.loadGPT();
      }

      // Setup slot
      this.setupSlot();
      
      // Wait a bit to ensure slot is ready
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error('GAM Service initialization error:', error);
      throw error;
    }
  }

  private setupSlot(): void {
    if (!window.googletag || !this.config) return;

    window.googletag.cmd.push(() => {
      // Ensure container exists
      let container = document.getElementById(this.containerId);
      if (!container) {
        container = document.createElement('div');
        container.id = this.containerId;
        container.style.display = 'none';
        document.body.appendChild(container);
      }

      // Define rewarded ad slot
      this.currentSlot = window.googletag.defineSlot(
        this.config!.adUnitId,
        [320, 480], // Default size, can be adjusted
        this.containerId
      );

      if (this.currentSlot) {
        // Add service for rewarded ads
        this.currentSlot.addService(window.googletag.pubads());

        // Listen for rewarded slot ready event
        window.googletag.pubads().addEventListener('rewardedSlotReady', (event: any) => {
          console.log('Rewarded ad is ready to show', event);
          if (this.config?.onAdLoaded) {
            this.config.onAdLoaded();
          }
        });

        // Listen for rewarded slot granted event (user earned reward)
        window.googletag.pubads().addEventListener('rewardedSlotGranted', (event: any) => {
          console.log('🎁 User earned reward from GAM:', event);
          if (this.config?.onRewarded) {
            console.log('✅ Calling onRewarded callback');
            this.config.onRewarded(event);
          } else {
            console.warn('⚠️ onRewarded callback not set');
          }
        });

        // Listen for slot render ended
        window.googletag.pubads().addEventListener('slotRenderEnded', (event: any) => {
          if (event.slot === this.currentSlot && !event.isEmpty) {
            console.log('Ad rendered successfully');
          }
        });

        // Enable single request mode
        window.googletag.pubads().enableSingleRequest();
        window.googletag.enableServices();
      }
    });
  }

  async loadAd(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.googletag || !this.currentSlot) {
        reject(new Error('GAM not initialized or slot not available'));
        return;
      }

      window.googletag.cmd.push(() => {
        // Ensure container exists
        let container = document.getElementById(this.containerId);
        if (!container) {
          container = document.createElement('div');
          container.id = this.containerId;
          container.style.display = 'none';
          document.body.appendChild(container);
        }

        // Display the rewarded ad
        window.googletag.display(this.containerId);
        
        // Refresh to load new ad
        window.googletag.pubads().refresh([this.currentSlot], {
          changeCorrelator: true
        });

        // Wait a bit for ad to load
        setTimeout(() => {
          resolve();
        }, 500);
      });
    });
  }

  showAd(): void {
    if (!window.googletag || !this.currentSlot) {
      console.error('GAM not initialized');
      if (this.config?.onError) {
        this.config.onError(new Error('GAM not initialized'));
      }
      return;
    }

    window.googletag.cmd.push(() => {
      // Trigger rewarded ad display
      window.googletag.pubads().refresh([this.currentSlot], {
        changeCorrelator: true
      });
    });
  }

  destroy(): void {
    if (window.googletag && this.currentSlot) {
      window.googletag.cmd.push(() => {
        window.googletag.destroySlots([this.currentSlot]);
        this.currentSlot = null;
      });
    }
  }

  isReady(): boolean {
    return (
      typeof window !== 'undefined' &&
      this.isInitialized &&
      window.googletag !== undefined &&
      window.googletag.apiReady === true &&
      this.currentSlot !== null
    );
  }
}

export const gamService = GAMService.getInstance();

