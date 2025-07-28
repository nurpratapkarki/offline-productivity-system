import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useSound } from '@/hooks/use-sound';
import { type SoundType } from '@/services/sound';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Square, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Bell,
  Loader2
} from 'lucide-react';

const soundTypeConfig = {
  notification: {
    label: 'Notification',
    icon: Bell,
    description: 'General notification sound',
    color: 'bg-blue-500',
  },
  success: {
    label: 'Success',
    icon: CheckCircle,
    description: 'Success/completion sound',
    color: 'bg-green-500',
  },
  error: {
    label: 'Error',
    icon: XCircle,
    description: 'Error/failure sound',
    color: 'bg-red-500',
  },
  alert: {
    label: 'Alert',
    icon: AlertCircle,
    description: 'Important alert sound',
    color: 'bg-orange-500',
  },
} as const;

export function SoundTestPanel() {
  const {
    play,
    stop,
    stopAll,
    setGlobalVolume,
    reloadSound,
    reloadAll,
    status,
    isLoaded,
    hasError,
  } = useSound();

  const [volume, setVolume] = useState([70]);
  const [playingSound, setPlayingSound] = useState<SoundType | null>(null);

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume);
    setGlobalVolume(newVolume[0] / 100);
  };

  const handlePlay = async (type: SoundType) => {
    if (!isLoaded(type)) {
      console.warn(`Sound ${type} is not loaded yet`);
      return;
    }

    setPlayingSound(type);
    try {
      await play(type);
    } finally {
      // Reset playing state after a short delay
      setTimeout(() => setPlayingSound(null), 1000);
    }
  };

  const handleStop = (type: SoundType) => {
    stop(type);
    if (playingSound === type) {
      setPlayingSound(null);
    }
  };

  const handleStopAll = () => {
    stopAll();
    setPlayingSound(null);
  };

  const getSoundStatusBadge = (type: SoundType) => {
    if (hasError(type)) {
      return <Badge variant="destructive">Error</Badge>;
    }
    if (isLoaded(type)) {
      return <Badge variant="default" className="bg-green-600">Ready</Badge>;
    }
    return <Badge variant="secondary">Loading...</Badge>;
  };

  const getSoundIcon = (type: SoundType) => {
    const config = soundTypeConfig[type];
    const IconComponent = config.icon;
    
    if (playingSound === type) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    
    return <IconComponent className="h-4 w-4" />;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Sound Notification Test Panel
        </CardTitle>
        <CardDescription>
          Test the sound notification system across all platforms. 
          Works in both development and production builds.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Global Controls */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Global Controls</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleStopAll}
                className="flex items-center gap-1"
              >
                <Square className="h-3 w-3" />
                Stop All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={reloadAll}
                className="flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Reload All
              </Button>
            </div>
          </div>
          
          {/* Volume Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Volume</label>
              <span className="text-sm text-muted-foreground">{volume[0]}%</span>
            </div>
            <div className="flex items-center gap-3">
              <VolumeX className="h-4 w-4 text-muted-foreground" />
              <Slider
                value={volume}
                onValueChange={handleVolumeChange}
                max={100}
                min={0}
                step={5}
                className="flex-1"
              />
              <Volume2 className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Sound Test Buttons */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Sound Tests</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.keys(soundTypeConfig) as SoundType[]).map((type) => {
              const config = soundTypeConfig[type];
              const soundStatus = status[type];
              
              return (
                <div
                  key={type}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${config.color} text-white`}>
                      {getSoundIcon(type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{config.label}</span>
                        {getSoundStatusBadge(type)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {config.description}
                      </p>
                      {soundStatus?.error && (
                        <p className="text-xs text-red-500 mt-1">
                          {soundStatus.error}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePlay(type)}
                      disabled={!isLoaded(type) || playingSound === type}
                      className="flex items-center gap-1"
                    >
                      <Play className="h-3 w-3" />
                      Play
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStop(type)}
                      disabled={!isLoaded(type)}
                      className="flex items-center gap-1"
                    >
                      <Square className="h-3 w-3" />
                    </Button>
                    
                    {hasError(type) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => reloadSound(type)}
                        className="flex items-center gap-1"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Information */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">System Information</h3>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Sounds are loaded from: <code>/public/sounds/</code></p>
            <p>• Using HTML5 Audio API for cross-platform compatibility</p>
            <p>• Supports: Windows, macOS, Linux (via Tauri)</p>
            <p>• Works in both development and production builds</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
