
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/stores/appStore';
import { Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AddTaskForm: React.FC = () => {
  const { addTask } = useAppStore();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a task title.",
        variant: "destructive"
      });
      return;
    }

    addTask({
      title: title.trim(),
      description: description.trim(),
      status: 'todo',
      priority,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setPriority('medium');
    setIsOpen(false);

    toast({
      title: "Task created",
      description: "Your new task has been added to the board."
    });
  };

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        className="w-full border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/50"
        onClick={() => setIsOpen(true)}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add a task
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="p-3">
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Task title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-input bg-background rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
          />
          
          <Textarea
            placeholder="Task description (optional)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-sm resize-none"
            rows={2}
          />
          
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
            className="w-full border border-input bg-background rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          
          <div className="flex space-x-2">
            <Button type="submit" size="sm">
              Add Task
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
      </CardContent>
    </Card>
  );
};

export default AddTaskForm;
