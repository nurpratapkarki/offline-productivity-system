
import React from 'react';
import KanbanBoard from '@/components/tasks/KanbanBoard';

const Tasks = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Tasks</h1>
          <p className="text-slate-600 mt-2">Organize your work with Kanban boards</p>
        </div>
      </div>

      <div className="h-[calc(100vh-200px)]">
        <KanbanBoard />
      </div>
    </div>
  );
};

export default Tasks;
