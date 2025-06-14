
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/stores/appStore';
import HabitList from './HabitList';
import HabitCalendar from './HabitCalendar';
import AddHabitForm from './AddHabitForm';

const HabitTracker: React.FC = () => {
  const { habits } = useAppStore();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Habits List */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>My Habits ({habits.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AddHabitForm />
              <HabitList />
            </CardContent>
          </Card>
        </div>

        {/* Calendar Heatmap */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Activity Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <HabitCalendar />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HabitTracker;
