
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/appStore';
import { Check, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const HabitList: React.FC = () => {
  const { habits, deleteHabit, markHabitComplete } = useAppStore();
  const { toast } = useToast();
  
  const today = new Date().toISOString().split('T')[0];

  const handleToggleHabit = (habitId: string) => {
    markHabitComplete(habitId, today);
    toast({
      title: "Habit updated",
      description: "Your habit progress has been recorded."
    });
  };

  const handleDeleteHabit = (habitId: string) => {
    deleteHabit(habitId);
    toast({
      title: "Habit deleted",
      description: "Your habit has been removed."
    });
  };

  if (habits.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No habits yet</p>
        <p className="text-sm text-gray-500">Add your first habit to start tracking</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {habits.map((habit) => {
        const isCompletedToday = habit.completedDates.includes(today);
        
        return (
          <div
            key={habit.id}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-center space-x-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: habit.color }}
              />
              <div>
                <h4 className="font-medium">{habit.name}</h4>
                <p className="text-sm text-gray-500">
                  Streak: {habit.streak} days
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant={isCompletedToday ? "default" : "outline"}
                size="sm"
                onClick={() => handleToggleHabit(habit.id)}
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteHabit(habit.id)}
                className="hover:bg-red-100"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default HabitList;
