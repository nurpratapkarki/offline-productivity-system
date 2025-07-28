
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/stores/appStore';
import { Trophy, TrendingUp, Calendar, Star, Target } from 'lucide-react';

const HabitProgress: React.FC = () => {
  const { habits } = useAppStore();

  const getWeeklyProgress = () => {
    const today = new Date();
    const weekData = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const completedCount = habits.filter(habit => 
        habit.completedDates.includes(dateStr)
      ).length;
      
      weekData.push({
        date: dateStr,
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        completed: completedCount,
        total: habits.length,
        percentage: habits.length > 0 ? (completedCount / habits.length) * 100 : 0
      });
    }
    
    return weekData;
  };

  const getHabitStats = (habit: any) => {
    const totalSessions = habit.completedDates.length;
    const currentStreak = habit.streak;
    
    // Calculate completion rate for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentCompletions = habit.completedDates.filter((date: string) => 
      new Date(date) >= thirtyDaysAgo
    ).length;
    const completionRate = Math.round((recentCompletions / 30) * 100);
    
    return { totalSessions, currentStreak, completionRate };
  };

  const weeklyData = getWeeklyProgress();
  const bestStreak = Math.max(...habits.map(h => h.streak), 0);
  const totalSessions = habits.reduce((sum, h) => sum + h.completedDates.length, 0);
  const avgCompletionRate = habits.length > 0 
    ? Math.round(habits.reduce((sum, h) => sum + getHabitStats(h).completionRate, 0) / habits.length)
    : 0;

  if (habits.length === 0) {
    return (
      <Card className="h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No progress to show yet</p>
            <p className="text-sm text-muted-foreground opacity-75">Start executing habits to see your progress</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{bestStreak}</p>
                <p className="text-sm text-muted-foreground">Best Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{totalSessions}</p>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-2xl font-bold">{avgCompletionRate}%</p>
                <p className="text-sm text-muted-foreground">Avg. Rate (30d)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <div>
                <p className="text-2xl font-bold">
                  {weeklyData[weeklyData.length - 1]?.completed || 0}
                </p>
                <p className="text-sm text-muted-foreground">Today's Done</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Progress Chart */}
      <Card>
        <CardHeader>
          <CardTitle>This Week's Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end space-x-2 h-32">
            {weeklyData.map((day, index) => (
              <div key={day.date} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-blue-500 rounded-t"
                  style={{ 
                    height: `${Math.max(day.percentage, 5)}%`,
                    backgroundColor: day.percentage === 100 ? '#10b981' : 
                                   day.percentage >= 50 ? '#3b82f6' : '#6b7280'
                  }}
                  title={`${day.completed}/${day.total} habits completed`}
                />
                <div className="mt-2 text-center">
                  <div className="text-xs font-medium">{day.day}</div>
                  <div className="text-xs text-muted-foreground">
                    {day.completed}/{day.total}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Daily completion rate over the last 7 days
          </div>
        </CardContent>
      </Card>

      {/* Individual Habit Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Habit Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {habits.map((habit) => {
              const stats = getHabitStats(habit);
              return (
                <div key={habit.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: habit.color }}
                      />
                      <h4 className="font-medium">{habit.name}</h4>
                    </div>
                    {stats.currentStreak >= 7 && (
                      <Star className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.currentStreak}</p>
                      <p className="text-muted-foreground">Current Streak</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.totalSessions}</p>
                      <p className="text-muted-foreground">Total Sessions</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.completionRate}%</p>
                      <p className="text-muted-foreground">30-day Rate</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HabitProgress;
