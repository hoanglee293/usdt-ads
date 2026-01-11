import { useState, useEffect, useCallback, useRef } from 'react';
import { gamService, GAMConfig } from '@/services/GAMService';

export interface UseRewardedAdOptions {
  adUnitId: string;
  autoLoad?: boolean;
}

export interface UseRewardedAdReturn {
  isLoaded: boolean;
  isLoading: boolean;
  error: Error | null;
  loadAd: () => Promise<void>;
  showAd: () => Promise<void>;
  earnedReward: boolean;
  isReady: boolean;
}

export const useRewardedAd = (
  options: UseRewardedAdOptions
): UseRewardedAdReturn => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [earnedReward, setEarnedReward] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const initializedRef = useRef(false);

  const loadAd = useCallback(async () => {
    if (!isReady) {
      setError(new Error('GAM service not ready'));
      return;
    }

    setIsLoading(true);
    setError(null);
    setEarnedReward(false);

    try {
      await gamService.loadAd();
      // onAdLoaded callback will set isLoaded to true
    } catch (err) {
      setError(err as Error);
      setIsLoading(false);
      setIsLoaded(false);
    }
  }, [isReady]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Initialize GAM service
    const config: GAMConfig = {
      adUnitId: options.adUnitId,
      onRewarded: (reward) => {
        console.log('🎁 onRewarded callback triggered:', reward);
        console.log('🔄 Setting earnedReward to true');
        setEarnedReward(true);
        setIsLoaded(false); // Reset để load ad mới
      },
      onError: (err) => {
        console.error('GAM Error:', err);
        setError(err);
        setIsLoading(false);
      },
      onAdLoaded: () => {
        console.log('Ad loaded successfully');
        setIsLoaded(true);
        setIsLoading(false);
        setError(null);
      },
    };

    setIsLoading(true);
    setError(null);
    
    // Retry initialization if it fails
    const initializeWithRetry = async (retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          await gamService.initialize(config);
          setIsReady(true);
          console.log('GAM Service initialized successfully');
          
          if (options.autoLoad) {
            // Wait a bit before loading ad
            setTimeout(() => {
              if (isReady) {
                loadAd();
              }
            }, 500);
          } else {
            setIsLoading(false);
          }
          return;
        } catch (err) {
          console.error(`GAM initialization attempt ${i + 1} failed:`, err);
          if (i === retries - 1) {
            setError(err as Error);
            setIsLoading(false);
          } else {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          }
        }
      }
    };

    initializeWithRetry();

    return () => {
      // Cleanup on unmount
      gamService.destroy();
      initializedRef.current = false;
    };
  }, [options.adUnitId, options.autoLoad, isReady, loadAd]);

  const showAd = useCallback(async () => {
    console.log('📺 showAd called', { isReady, isLoaded });
    
    if (!isReady) {
      const error = new Error('GAM service not ready');
      setError(error);
      return;
    }

    if (!isLoaded) {
      console.log('📥 Ad not loaded, loading now...');
      await loadAd();
      // Wait a bit for ad to be ready
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    try {
      console.log('▶️ Calling gamService.showAd()');
      gamService.showAd();
      // Reset earned reward state
      setEarnedReward(false);
      console.log('✅ Ad shown, waiting for reward...');
    } catch (err) {
      console.error('❌ Error showing ad:', err);
      setError(err as Error);
    }
  }, [isLoaded, isReady, loadAd]);

  return {
    isLoaded,
    isLoading,
    error,
    loadAd,
    showAd,
    earnedReward,
    isReady,
  };
};

