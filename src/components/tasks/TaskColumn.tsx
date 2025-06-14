
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Task } from '@/stores/appStore';
import TaskCard from './TaskCard';
import AddTaskForm from './AddTaskForm';

interface TaskColumnProps {
  id: string;
  title: string;
  tasks: Task[];
}

const TaskColumn: React.FC<TaskColumnProps> = ({ id, title, tasks }) => {
  const { setNodeRef } = useDroppable({ id });

  const getColumnColor = (columnId: string) => {
    switch (columnId) {
      case 'todo': return 'border-blue-200 bg-blue-50';
      case 'doing': return 'border-yellow-200 bg-yellow-50';
      case 'done': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <Card className={`h-full ${getColumnColor(id)}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          {title}
          <span className="text-sm bg-white rounded-full px-2 py-1">
            {tasks.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent ref={setNodeRef} className="space-y-3 h-[calc(100%-80px)] overflow-y-auto">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
        
        {id === 'todo' && <AddTaskForm />}
      </CardContent>
    </Card>
  );
};

export default TaskColumn;
