
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/appStore';
import { Target, Calendar, Trophy, Plus, Play, Pause, CheckCircle } from 'lucide-react';
import HabitPlan from './HabitPlan';
import HabitExecution from './HabitExecution';
import HabitProgress from './HabitProgress';

const HabitPlanner: React.FC = () => {
  const { habits } = useAppStore();
  const [currentView, setCurrentView] = useState<'plan' | 'execute' | 'progress'>('plan');

  const views = [
    { id: 'plan', label: 'Plan', icon: Target, description: 'Design your habit strategy' },
    { id: 'execute', label: 'Execute', icon: Play, description: 'Take action on your habits' },
    { id: 'progress', label: 'Progress', icon: Trophy, description: 'Track your achievements' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{habits.length}</p>
                <p className="text-sm text-gray-600">Active Habits</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {habits.filter(h => h.completedDates.includes(new Date().toISOString().split('T')[0])).length}
                </p>
                <p className="text-sm text-gray-600">Today's Progress</p>
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
                <p className="text-sm text-gray-600">Avg. Streak</p>
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
                <p className="text-sm text-gray-600">Total Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Selector */}
      <div className="flex space-x-2">
        {views.map((view) => {
          const Icon = view.icon;
          return (
            <Button
              key={view.id}
              variant={currentView === view.id ? 'default' : 'outline'}
              onClick={() => setCurrentView(view.id)}
              className="flex-1"
            >
              <Icon className="w-4 h-4 mr-2" />
              <div className="text-left">
                <div className="font-medium">{view.label}</div>
                <div className="text-xs opacity-70">{view.description}</div>
              </div>
            </Button>
          );
        })}
      </div>

      {/* Content */}
      {currentView === 'plan' && <HabitPlan />}
      {currentView === 'execute' && <HabitExecution />}
      {currentView === 'progress' && <HabitProgress />}
    </div>
  );
};

export default HabitPlanner;
