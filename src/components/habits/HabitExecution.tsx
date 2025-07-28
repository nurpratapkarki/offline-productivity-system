
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/stores/appStore';
import { useToast } from '@/hooks/use-toast';
import { Play, Pause, CheckCircle, RotateCcw, Timer, Target } from 'lucide-react';

const HabitExecution: React.FC = () => {
  const { habits, markHabitComplete } = useAppStore();
  const { toast } = useToast();
  const [activeHabit, setActiveHabit] = useState<string | null>(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  
  const today = new Date().toISOString().split('T')[0];
  const todayHabits = habits.filter(h => !h.completedDates.includes(today));
  const completedToday = habits.filter(h => h.completedDates.includes(today));

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && activeHabit) {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, activeHabit]);

  const startHabitSession = (habitId: string) => {
    setActiveHabit(habitId);
    setSessionTime(0);
    setIsRunning(true);
    toast({
      title: "Session started",
      description: "Great! You're working on your habit now."
    });
  };

  const pauseSession = () => {
    setIsRunning(false);
  };

  const resumeSession = () => {
    setIsRunning(true);
  };

  const completeSession = () => {
    if (activeHabit) {
      markHabitComplete(activeHabit, today);
      const timeSpent = Math.floor(sessionTime / 60);
      toast({
        title: "Habit completed! 🎉",
        description: `You spent ${timeSpent} minutes on this habit. Well done!`
      });
      setActiveHabit(null);
      setIsRunning(false);
      setSessionTime(0);
    }
  };

  const resetSession = () => {
    setActiveHabit(null);
    setIsRunning(false);
    setSessionTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (index: number) => {
    const colors = ['#10b981', '#f59e0b', '#ef4444'];
    return colors[index % colors.length];
  };

  if (habits.length === 0) {
    return (
      <Card className="h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No habits to execute</p>
            <p className="text-sm text-muted-foreground opacity-75">Go to the Plan tab to create your first habit</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Session */}
      {activeHabit && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Timer className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Active Session</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div>
                <h3 className="text-xl font-bold">
                  {habits.find(h => h.id === activeHabit)?.name}
                </h3>
                <div className="text-3xl font-mono font-bold text-blue-600 dark:text-blue-400 mt-2">
                  {formatTime(sessionTime)}
                </div>
              </div>
              
              <div className="flex justify-center space-x-2">
                {isRunning ? (
                  <Button onClick={pauseSession} variant="outline">
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                ) : (
                  <Button onClick={resumeSession}>
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </Button>
                )}
                <Button onClick={completeSession} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete
                </Button>
                <Button onClick={resetSession} variant="destructive">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Habits */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Habits ({todayHabits.length} remaining)</CardTitle>
        </CardHeader>
        <CardContent>
          {todayHabits.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 dark:text-green-400 mx-auto mb-4" />
              <p className="text-green-600 dark:text-green-400 font-medium">All habits completed for today!</p>
              <p className="text-sm text-muted-foreground">Great job! Come back tomorrow.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todayHabits.map((habit, index) => (
                <div key={habit.id} className="p-4 border rounded-lg hover:bg-accent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: habit.color }}
                      />
                      <div>
                        <h4 className="font-medium">{habit.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Current streak: {habit.streak} days
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getDifficultyColor(index) }}
                        title="Difficulty indicator"
                      />
                      <Button
                        onClick={() => startHabitSession(habit.id)}
                        disabled={!!activeHabit}
                        size="sm"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Today */}
      {completedToday.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600 dark:text-green-400">
              Completed Today ({completedToday.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {completedToday.map((habit) => (
                <div key={habit.id} className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950 dark:border-green-800">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: habit.color }}
                  />
                  <span className="font-medium">{habit.name}</span>
                  <span className="text-sm text-green-600 dark:text-green-400 ml-auto">✓ Done</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Completed</span>
              <span>{completedToday.length} / {habits.length}</span>
            </div>
            <Progress 
              value={(completedToday.length / habits.length) * 100} 
              className="h-3"
            />
            <p className="text-xs text-muted-foreground text-center">
              {Math.round((completedToday.length / habits.length) * 100)}% complete
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HabitExecution;
