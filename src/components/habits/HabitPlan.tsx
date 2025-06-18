
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/stores/appStore';
import { useToast } from '@/hooks/use-toast';
import { Plus, Target, Clock, Repeat, Lightbulb } from 'lucide-react';

interface HabitPlan {
  id: string;
  name: string;
  description: string;
  goal: string;
  frequency: string;
  timeOfDay: string;
  difficulty: 'easy' | 'medium' | 'hard';
  motivation: string;
  cue: string;
  reward: string;
  color: string;
}

const HabitPlan: React.FC = () => {
  const { habits, addHabit } = useAppStore();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [newHabit, setNewHabit] = useState<Partial<HabitPlan>>({
    difficulty: 'medium',
    color: '#3b82f6'
  });

  const difficulties = [
    { id: 'easy', label: 'Easy', color: '#10b981', description: '1-5 minutes' },
    { id: 'medium', label: 'Medium', color: '#f59e0b', description: '5-20 minutes' },
    { id: 'hard', label: 'Hard', color: '#ef4444', description: '20+ minutes' },
  ] as const;

  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ];

  const handleCreateHabit = () => {
    if (!newHabit.name?.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a habit name.",
        variant: "destructive"
      });
      return;
    }

    addHabit({
      name: newHabit.name.trim(),
      color: newHabit.color || '#3b82f6',
      streak: 0,
      completedDates: [],
    });

    setNewHabit({ difficulty: 'medium', color: '#3b82f6' });
    setIsCreating(false);

    toast({
      title: "Habit planned",
      description: "Your new habit has been added to your execution list."
    });
  };

  const habitTemplates = [
    { name: 'Morning Exercise', cue: 'Wake up', reward: 'Energizing shower', time: 'Morning' },
    { name: 'Read 10 Pages', cue: 'After dinner', reward: 'Watch favorite show', time: 'Evening' },
    { name: 'Meditate 5 Minutes', cue: 'After coffee', reward: 'Check social media', time: 'Morning' },
    { name: 'Drink Water', cue: 'Every hour alarm', reward: 'Stretch break', time: 'All day' },
  ];

  return (
    <div className="space-y-6">
      {/* Create New Habit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Plan New Habit</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isCreating ? (
            <Button onClick={() => setIsCreating(true)} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Create New Habit Plan
            </Button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Habit Name *</label>
                <Input
                  placeholder="e.g., Morning Meditation"
                  value={newHabit.name || ''}
                  onChange={(e) => setNewHabit(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description & Goal</label>
                <Textarea
                  placeholder="Describe what you want to achieve and why..."
                  value={newHabit.description || ''}
                  onChange={(e) => setNewHabit(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Cue (Trigger)</label>
                  <Input
                    placeholder="e.g., After morning coffee"
                    value={newHabit.cue || ''}
                    onChange={(e) => setNewHabit(prev => ({ ...prev, cue: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Reward</label>
                  <Input
                    placeholder="e.g., Check phone for 5 minutes"
                    value={newHabit.reward || ''}
                    onChange={(e) => setNewHabit(prev => ({ ...prev, reward: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Difficulty Level</label>
                <div className="flex space-x-2">
                  {difficulties.map((diff) => (
                    <Button
                      key={diff.id}
                      variant={newHabit.difficulty === diff.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNewHabit(prev => ({ ...prev, difficulty: diff.id }))}
                    >
                      {diff.label}
                      <span className="text-xs ml-1">({diff.description})</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Color</label>
                <div className="flex space-x-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 ${
                        newHabit.color === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewHabit(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleCreateHabit}>Create Habit</Button>
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="w-5 h-5" />
            <span>Quick Start Templates</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {habitTemplates.map((template, index) => (
              <div key={index} className="p-4 border rounded-lg hover:bg-gray-50">
                <h4 className="font-medium">{template.name}</h4>
                <div className="text-sm text-gray-600 mt-2 space-y-1">
                  <div><strong>Cue:</strong> {template.cue}</div>
                  <div><strong>Reward:</strong> {template.reward}</div>
                  <div><strong>Time:</strong> {template.time}</div>
                </div>
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setNewHabit({
                      name: template.name,
                      cue: template.cue,
                      reward: template.reward,
                      difficulty: 'medium',
                      color: '#3b82f6'
                    });
                    setIsCreating(true);
                  }}
                >
                  Use Template
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Plans */}
      {habits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Habit Plans ({habits.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {habits.map((habit) => (
                <div key={habit.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: habit.color }}
                    />
                    <div>
                      <h4 className="font-medium">{habit.name}</h4>
                      <p className="text-sm text-gray-500">Current streak: {habit.streak} days</p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {habit.completedDates.length} total sessions
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HabitPlan;
