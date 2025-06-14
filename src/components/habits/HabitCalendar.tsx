
import React from 'react';
import { useAppStore } from '@/stores/appStore';

const HabitCalendar: React.FC = () => {
  const { habits } = useAppStore();

  // Generate calendar grid for the last 12 months
  const generateCalendarData = () => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - 12);
    
    const dates = [];
    const current = new Date(startDate);
    
    while (current <= today) {
      const dateStr = current.toISOString().split('T')[0];
      dates.push(dateStr);
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  const getActivityLevel = (date: string) => {
    const completedHabits = habits.filter(habit => 
      habit.completedDates.includes(date)
    ).length;
    
    if (completedHabits === 0) return 0;
    if (completedHabits === 1) return 1;
    if (completedHabits <= 3) return 2;
    return 3;
  };

  const getActivityColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-gray-100';
      case 1: return 'bg-green-200';
      case 2: return 'bg-green-400';
      case 3: return 'bg-green-600';
      default: return 'bg-gray-100';
    }
  };

  const dates = generateCalendarData();
  const weeks = [];
  
  // Group dates into weeks
  for (let i = 0; i < dates.length; i += 7) {
    weeks.push(dates.slice(i, i + 7));
  }

  if (habits.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No habits to display</p>
        <p className="text-sm text-gray-500">Add some habits to see your activity calendar</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {habits.length} habit{habits.length !== 1 ? 's' : ''} tracked
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-600">
          <span>Less</span>
          <div className="flex space-x-1">
            {[0, 1, 2, 3].map(level => (
              <div
                key={level}
                className={`w-3 h-3 rounded ${getActivityColor(level)}`}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col space-y-1">
          {/* Month labels */}
          <div className="flex space-x-1 mb-2">
            {weeks.map((week, weekIndex) => {
              if (weekIndex % 4 === 0 && week[0]) {
                const date = new Date(week[0]);
                return (
                  <div
                    key={weekIndex}
                    className="text-xs text-gray-500 w-12 text-center"
                  >
                    {date.toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                );
              }
              return <div key={weekIndex} className="w-3" />;
            })}
          </div>

          {/* Calendar grid */}
          <div className="flex space-x-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col space-y-1">
                {week.map((date, dayIndex) => {
                  const level = getActivityLevel(date);
                  const dateObj = new Date(date);
                  
                  return (
                    <div
                      key={date}
                      className={`w-3 h-3 rounded ${getActivityColor(level)} border border-gray-200`}
                      title={`${dateObj.toLocaleDateString()}: ${habits.filter(h => h.completedDates.includes(date)).length} habits completed`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HabitCalendar;
