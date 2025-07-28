import { useCallback, useEffect, useState } from 'react';
import { soundService, type SoundType } from '@/services/sound';

interface SoundStatus {
  loaded: boolean;
  error?: string;
}

interface UseSoundReturn {
  play: (type: SoundType, options?: { volume?: number; loop?: boolean }) => Promise<boolean>;
  stop: (type: SoundType) => boolean;
  stopAll: () => void;
  setGlobalVolume: (volume: number) => void;
  reloadSound: (type: SoundType) => void;
  reloadAll: () => void;
  status: Record<SoundType, SoundStatus>;
  isLoaded: (type: SoundType) => boolean;
  hasError: (type: SoundType) => boolean;
}

/**
 * Custom React hook for sound notifications
 * 
 * Provides easy access to the sound service with proper cleanup and state management.
 * Automatically tracks loading status and errors for all sound types.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { play, status, isLoaded } = useSound();
 *   
 *   const handleNotification = async () => {
 *     if (isLoaded('notification')) {
 *       await play('notification', { volume: 0.8 });
 *     }
 *   };
 *   
 *   return (
 *     <button onClick={handleNotification}>
 *       Play Notification {!isLoaded('notification') && '(Loading...)'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useSound(): UseSoundReturn {
  const [status, setStatus] = useState<Record<SoundType, SoundStatus>>(() => 
    soundService.getStatus()
  );

  // Update status periodically to track loading progress
  useEffect(() => {
    const updateStatus = () => {
      setStatus(soundService.getStatus());
    };

    // Initial status update
    updateStatus();

    // Set up periodic status updates to catch loading changes
    const interval = setInterval(updateStatus, 500);

    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, []);

  // Play sound with optional configuration
  const play = useCallback(async (
    type: SoundType, 
    options?: { volume?: number; loop?: boolean }
  ): Promise<boolean> => {
    try {
      const result = await soundService.play(type, options);
      // Update status after play attempt
      setStatus(soundService.getStatus());
      return result;
    } catch (error) {
      console.error(`Error playing sound ${type}:`, error);
      return false;
    }
  }, []);

  // Stop a specific sound
  const stop = useCallback((type: SoundType): boolean => {
    try {
      const result = soundService.stop(type);
      setStatus(soundService.getStatus());
      return result;
    } catch (error) {
      console.error(`Error stopping sound ${type}:`, error);
      return false;
    }
  }, []);

  // Stop all sounds
  const stopAll = useCallback((): void => {
    try {
      soundService.stopAll();
      setStatus(soundService.getStatus());
    } catch (error) {
      console.error('Error stopping all sounds:', error);
    }
  }, []);

  // Set global volume
  const setGlobalVolume = useCallback((volume: number): void => {
    try {
      soundService.setGlobalVolume(volume);
      setStatus(soundService.getStatus());
    } catch (error) {
      console.error('Error setting global volume:', error);
    }
  }, []);

  // Reload a specific sound
  const reloadSound = useCallback((type: SoundType): void => {
    try {
      soundService.reloadSound(type);
      // Status will be updated by the periodic interval
    } catch (error) {
      console.error(`Error reloading sound ${type}:`, error);
    }
  }, []);

  // Reload all sounds
  const reloadAll = useCallback((): void => {
    try {
      soundService.reloadAll();
      // Status will be updated by the periodic interval
    } catch (error) {
      console.error('Error reloading all sounds:', error);
    }
  }, []);

  // Helper function to check if a sound is loaded
  const isLoaded = useCallback((type: SoundType): boolean => {
    return status[type]?.loaded ?? false;
  }, [status]);

  // Helper function to check if a sound has an error
  const hasError = useCallback((type: SoundType): boolean => {
    return !!status[type]?.error;
  }, [status]);

  return {
    play,
    stop,
    stopAll,
    setGlobalVolume,
    reloadSound,
    reloadAll,
    status,
    isLoaded,
    hasError,
  };
}

/**
 * Convenience hook for playing a specific sound type
 * 
 * @example
 * ```tsx
 * function SuccessButton() {
 *   const playSuccess = useSoundPlayer('success');
 *   
 *   return (
 *     <button onClick={() => playSuccess({ volume: 0.9 })}>
 *       Success!
 *     </button>
 *   );
 * }
 * ```
 */
export function useSoundPlayer(type: SoundType) {
  const { play } = useSound();
  
  return useCallback((options?: { volume?: number; loop?: boolean }) => {
    return play(type, options);
  }, [play, type]);
}

/**
 * Hook for notification sounds with common presets
 */
export function useNotificationSounds() {
  const { play, isLoaded } = useSound();

  const playNotification = useCallback(() => play('notification'), [play]);
  const playSuccess = useCallback(() => play('success'), [play]);
  const playError = useCallback(() => play('error'), [play]);
  const playAlert = useCallback(() => play('alert'), [play]);

  return {
    playNotification,
    playSuccess,
    playError,
    playAlert,
    isReady: isLoaded('notification') && isLoaded('success') && isLoaded('error') && isLoaded('alert'),
  };
}
