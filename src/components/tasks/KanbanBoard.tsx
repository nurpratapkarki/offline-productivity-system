
import React from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useAppStore, Task } from '@/stores/appStore';
import TaskColumn from './TaskColumn';
import TaskCard from './TaskCard';
import { useState } from 'react';

const KanbanBoard: React.FC = () => {
  const { tasks, moveTask } = useAppStore();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const columns = [
    { id: 'todo', title: 'To Do', status: 'todo' as const },
    { id: 'doing', title: 'Doing', status: 'doing' as const },
    { id: 'done', title: 'Done', status: 'done' as const },
  ];

  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter(task => task.status === status);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as Task['status'];

    // If dropped on a column, update status
    if (['todo', 'doing', 'done'].includes(newStatus)) {
      moveTask(taskId, newStatus);
    }
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
        {columns.map((column) => (
          <TaskColumn
            key={column.id}
            id={column.id}
            title={column.title}
            tasks={getTasksByStatus(column.status)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;
