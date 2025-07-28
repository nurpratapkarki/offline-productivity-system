
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/appStore';
import { Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AddHabitForm: React.FC = () => {
  const { addHabit } = useAppStore();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');

  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a habit name.",
        variant: "destructive"
      });
      return;
    }

    addHabit({
      name: name.trim(),
      color,
      streak: 0,
      completedDates: [],
    });

    setName('');
    setColor('#3b82f6');
    setIsOpen(false);

    toast({
      title: "Habit created",
      description: "Your new habit has been added to the tracker."
    });
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        className="w-full"
        onClick={() => setIsOpen(true)}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Habit
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-3 border rounded-lg bg-muted">
      <input
        type="text"
        placeholder="Habit name..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full border border-input bg-background rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        autoFocus
      />
      
      <div>
        <label className="text-sm font-medium text-foreground block mb-2">
          Color
        </label>
        <div className="flex space-x-2">
          {colors.map((colorOption) => (
            <button
              key={colorOption}
              type="button"
              className={`w-6 h-6 rounded-full border-2 transition-all ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                color === colorOption
                  ? 'border-foreground shadow-sm ring-2 ring-ring ring-offset-2'
                  : 'border-border hover:border-muted-foreground hover:shadow-sm'
              }`}
              style={{ backgroundColor: colorOption }}
              onClick={() => setColor(colorOption)}
            />
          ))}
        </div>
      </div>
      
      <div className="flex space-x-2">
        <Button type="submit" size="sm">
          Add Habit
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
};

export default AddHabitForm;
