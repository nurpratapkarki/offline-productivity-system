
import React from 'react';
import HabitTracker from '@/components/habits/HabitTracker';

const Habits = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Habits</h1>
          <p className="text-slate-600 mt-2">Track daily habits with visual heatmaps</p>
        </div>
      </div>

      <HabitTracker />
    </div>
  );
};

export default Habits;
