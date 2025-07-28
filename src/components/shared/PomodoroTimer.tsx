import React, { useEffect } from 'react';
import { useAppStore } from '@/stores/appStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Timer, Play, Pause, RotateCcw } from 'lucide-react';

const PomodoroTimer = () => {
  const { 
    pomodoroTimer, 
    startPomodoro, 
    pausePomodoro, 
    resetPomodoro, 
    updatePomodoroTime 
  } = useAppStore();

  useEffect(() => {
    if (!pomodoroTimer.isActive) return;

    const interval = setInterval(() => {
      updatePomodoroTime();
    }, 1000);

    return () => clearInterval(interval);
  }, [pomodoroTimer.isActive, updatePomodoroTime]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    const totalTime = pomodoroTimer.currentSession === 'work' 
      ? pomodoroTimer.workDuration 
      : pomodoroTimer.breakDuration;
    return ((totalTime - pomodoroTimer.timeLeft) / totalTime) * 100;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Timer className="w-4 h-4 mr-2" />
          Pomodoro
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Timer className="w-5 h-5 mr-2" />
            Pomodoro Timer
          </DialogTitle>
          <DialogDescription>
            Stay focused with the Pomodoro Technique
          </DialogDescription>
        </DialogHeader>
        
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-sm text-muted-foreground">
              {pomodoroTimer.currentSession === 'work' ? 'Work Session' : 'Break Time'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Timer Display */}
            <div className="text-center">
              <div className="text-6xl font-mono font-bold text-primary">
                {formatTime(pomodoroTimer.timeLeft)}
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center space-x-2">
              <Button
                onClick={pomodoroTimer.isActive ? pausePomodoro : startPomodoro}
                size="sm"
              >
                {pomodoroTimer.isActive ? (
                  <Pause className="w-4 h-4 mr-2" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                {pomodoroTimer.isActive ? 'Pause' : 'Start'}
              </Button>
              
              <Button onClick={resetPomodoro} size="sm" variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>

            {/* Session Info */}
            <div className="text-center text-sm text-muted-foreground">
              <p>Work: {formatTime(pomodoroTimer.workDuration)}</p>
              <p>Break: {formatTime(pomodoroTimer.breakDuration)}</p>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default PomodoroTimer;
