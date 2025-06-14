
import React, { useState } from 'react';
import MarkdownEditor from '@/components/notes/MarkdownEditor';
import NotesList from '@/components/notes/NotesList';

const Notes = () => {
  const [selectedNoteId, setSelectedNoteId] = useState<string>('');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Notes</h1>
          <p className="text-slate-600 mt-2">Capture your thoughts with Markdown</p>
        </div>
      </div>

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
    </div>
  );
};

export default Notes;
