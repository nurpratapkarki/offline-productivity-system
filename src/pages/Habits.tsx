
import React from 'react';
import HabitPlanner from '@/components/habits/HabitPlanner';

const Habits = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Habit Builder</h1>
          <p className="text-muted-foreground mt-2">Plan, track, and execute your habits with purpose</p>
        </div>
      </div>

      <HabitPlanner />
    </div>
  );
};

export default Habits;
