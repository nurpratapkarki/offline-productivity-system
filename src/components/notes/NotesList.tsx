
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/appStore';
import { FileText, Clock } from 'lucide-react';

interface NotesListProps {
  onSelectNote: (noteId: string) => void;
  selectedNoteId?: string;
}

const NotesList: React.FC<NotesListProps> = ({ onSelectNote, selectedNoteId }) => {
  const { notes } = useAppStore();

  if (notes.length === 0) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No notes yet</p>
            <p className="text-sm text-gray-500">Create your first note to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Notes ({notes.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 h-[calc(100%-80px)] overflow-y-auto">
        {notes.map((note) => (
          <Button
            key={note.id}
            variant={selectedNoteId === note.id ? "default" : "ghost"}
            className="w-full justify-start h-auto p-3"
            onClick={() => onSelectNote(note.id)}
          >
            <div className="text-left w-full">
              <div className="font-medium truncate">
                {note.title || 'Untitled Note'}
              </div>
              <div className="text-sm text-gray-500 truncate mt-1">
                {note.content.substring(0, 100) || 'No content'}
              </div>
              <div className="flex items-center text-xs text-gray-400 mt-2">
                <Clock className="w-3 h-3 mr-1" />
                {new Date(note.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};

export default NotesList;
