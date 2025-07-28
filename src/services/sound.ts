/**
 * Sound Notification Service
 * 
 * Provides cross-platform sound notification functionality using HTML5 Audio API.
 * Works in both development (vite dev / tauri dev) and production (tauri build) environments.
 * Supports Windows, macOS, and Linux platforms.
 */

export type SoundType = 'notification' | 'success' | 'error' | 'alert';

interface SoundConfig {
  volume?: number; // 0.0 to 1.0
  loop?: boolean;
  preload?: boolean;
}

interface LoadedSound {
  audio: HTMLAudioElement;
  loaded: boolean;
  error?: string;
}

interface SoundSettings {
  soundEnabled: boolean;
  volume: number;
  soundType: 'default' | 'minimal' | 'classic';
}

class SoundService {
  private sounds: Map<SoundType, LoadedSound> = new Map();
  private defaultConfig: Required<SoundConfig> = {
    volume: 0.7,
    loop: false,
    preload: true,
  };
  private settings: SoundSettings = {
    soundEnabled: true,
    volume: 0.7,
    soundType: 'default',
  };

  constructor() {
    this.loadSettings();
    this.initializeSounds();
    this.setupSettingsListener();
  }

  /**
   * Initialize all sound files
   */
  private initializeSounds(): void {
    const soundTypes: SoundType[] = ['notification', 'success', 'error', 'alert'];
    
    soundTypes.forEach(type => {
      this.loadSound(type);
    });
  }

  /**
   * Load a specific sound file
   */
  private loadSound(type: SoundType, config: SoundConfig = {}): void {
    const finalConfig = { ...this.defaultConfig, ...config };
    const soundPath = `/sounds/${type}.mp3`;
    
    try {
      const audio = new Audio();
      
      // Set audio properties
      audio.volume = finalConfig.volume;
      audio.loop = finalConfig.loop;
      
      if (finalConfig.preload) {
        audio.preload = 'auto';
      }

      const loadedSound: LoadedSound = {
        audio,
        loaded: false,
      };

      // Handle successful loading
      audio.addEventListener('canplaythrough', () => {
        loadedSound.loaded = true;
        console.log(`Sound loaded successfully: ${type}`);
      });

      // Handle loading errors
      audio.addEventListener('error', (e) => {
        const errorMsg = `Failed to load sound: ${type} from ${soundPath}`;
        loadedSound.error = errorMsg;
        console.warn(errorMsg, e);
      });

      // Set the source and start loading
      audio.src = soundPath;
      
      this.sounds.set(type, loadedSound);
      
    } catch (error) {
      console.error(`Error initializing sound ${type}:`, error);
      this.sounds.set(type, {
        audio: new Audio(),
        loaded: false,
        error: `Initialization error: ${error}`,
      });
    }
  }

  /**
   * Play a sound notification
   */
  async play(type: SoundType, config: SoundConfig = {}): Promise<boolean> {
    const sound = this.sounds.get(type);
    
    if (!sound) {
      console.warn(`Sound not found: ${type}`);
      return false;
    }

    if (sound.error) {
      console.warn(`Cannot play sound ${type}: ${sound.error}`);
      return false;
    }

    if (!sound.loaded) {
      console.warn(`Sound not yet loaded: ${type}`);
      return false;
    }

    try {
      // Apply any runtime configuration
      if (config.volume !== undefined) {
        sound.audio.volume = Math.max(0, Math.min(1, config.volume));
      }
      
      if (config.loop !== undefined) {
        sound.audio.loop = config.loop;
      }

      // Reset audio to beginning
      sound.audio.currentTime = 0;
      
      // Play the sound
      await sound.audio.play();
      
      return true;
    } catch (error) {
      console.error(`Error playing sound ${type}:`, error);
      return false;
    }
  }

  /**
   * Stop a currently playing sound
   */
  stop(type: SoundType): boolean {
    const sound = this.sounds.get(type);
    
    if (!sound || !sound.loaded) {
      return false;
    }

    try {
      sound.audio.pause();
      sound.audio.currentTime = 0;
      return true;
    } catch (error) {
      console.error(`Error stopping sound ${type}:`, error);
      return false;
    }
  }

  /**
   * Stop all currently playing sounds
   */
  stopAll(): void {
    this.sounds.forEach((sound, type) => {
      if (sound.loaded) {
        this.stop(type);
      }
    });
  }

  /**
   * Set global volume for all sounds
   */
  setGlobalVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.defaultConfig.volume = clampedVolume;
    
    this.sounds.forEach(sound => {
      if (sound.loaded) {
        sound.audio.volume = clampedVolume;
      }
    });
  }

  /**
   * Get the loading status of all sounds
   */
  getStatus(): Record<SoundType, { loaded: boolean; error?: string }> {
    const status: Record<string, { loaded: boolean; error?: string }> = {};
    
    this.sounds.forEach((sound, type) => {
      status[type] = {
        loaded: sound.loaded,
        error: sound.error,
      };
    });
    
    return status as Record<SoundType, { loaded: boolean; error?: string }>;
  }

  /**
   * Reload a specific sound (useful if it failed to load initially)
   */
  reloadSound(type: SoundType): void {
    const existingSound = this.sounds.get(type);
    if (existingSound) {
      // Clean up existing audio element
      existingSound.audio.src = '';
      existingSound.audio.load();
    }
    
    // Reload the sound
    this.loadSound(type);
  }

  /**
   * Reload all sounds
   */
  reloadAll(): void {
    const soundTypes: SoundType[] = ['notification', 'success', 'error', 'alert'];
    soundTypes.forEach(type => this.reloadSound(type));
  }
}

// Create and export a singleton instance
export const soundService = new SoundService();

// Export the class for testing purposes
export { SoundService };
