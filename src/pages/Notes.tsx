
import React, { useState } from 'react';
import MarkdownEditor from '@/components/notes/MarkdownEditor';
import NotesList from '@/components/notes/NotesList';
import NotesGraph from '@/components/notes/NotesGraph';
import { Button } from '@/components/ui/button';
import { FileText, Network, Edit, Eye, Link } from 'lucide-react';

const Notes = () => {
  const [selectedNoteId, setSelectedNoteId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'editor' | 'graph'>('editor');
  const [graphMode, setGraphMode] = useState<'view' | 'edit' | 'link'>('view');

  const modes = [
    { id: 'view', label: 'View', icon: Eye },
    { id: 'edit', label: 'Edit', icon: Edit },
    { id: 'link', label: 'Link', icon: Link },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Notes</h1>
          <p className="text-slate-600 mt-2">Capture your thoughts with Markdown</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'editor' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('editor')}
          >
            <FileText className="w-4 h-4 mr-2" />
            Editor
          </Button>
          <Button
            variant={viewMode === 'graph' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('graph')}
          >
            <Network className="w-4 h-4 mr-2" />
            Graph
          </Button>
        </div>
      </div>

      {viewMode === 'graph' && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Graph Mode:</span>
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <Button
                key={mode.id}
                variant={graphMode === mode.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGraphMode(mode.id)}
              >
                <Icon className="w-4 h-4 mr-2" />
                {mode.label}
              </Button>
            );
          })}
        </div>
      )}

      {viewMode === 'editor' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Notes List */}
          <div className="lg:col-span-1">
            <NotesList 
              onSelectNote={setSelectedNoteId} 
              selectedNoteId={selectedNoteId}
            />
          </div>

          {/* Editor */}
          <div className="lg:col-span-3">
            <MarkdownEditor noteId={selectedNoteId} />
          </div>
        </div>
      ) : (
        <NotesGraph mode={graphMode} onSelectNote={setSelectedNoteId} />
      )}
    </div>
  );
};

export default Notes;
