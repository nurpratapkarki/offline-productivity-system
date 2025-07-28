
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/stores/appStore';
import { Target, Calendar, Trophy, Plus, Play, Pause, CheckCircle } from 'lucide-react';
import HabitPlan from './HabitPlan';
import HabitExecution from './HabitExecution';
import HabitProgress from './HabitProgress';

const HabitPlanner: React.FC = () => {
  const { habits } = useAppStore();

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-2xl font-bold">{habits.length}</p>
                <p className="text-sm text-muted-foreground">Active Habits</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-2xl font-bold">
                  {habits.filter(h => h.completedDates.includes(new Date().toISOString().split('T')[0])).length}
                </p>
                <p className="text-sm text-muted-foreground">Today's Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">
                  {Math.round(habits.reduce((sum, h) => sum + h.streak, 0) / Math.max(habits.length, 1))}
                </p>
                <p className="text-sm text-muted-foreground">Avg. Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  {habits.reduce((sum, h) => sum + h.completedDates.length, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="plan" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="plan" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            <span>Plan</span>
          </TabsTrigger>
          <TabsTrigger value="execute" className="flex items-center gap-2">
            <Play className="w-4 h-4" />
            <span>Execute</span>
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            <span>Progress</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plan">
          <HabitPlan />
        </TabsContent>

        <TabsContent value="execute">
          <HabitExecution />
        </TabsContent>

        <TabsContent value="progress">
          <HabitProgress />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HabitPlanner;
