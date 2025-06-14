
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/stores/appStore';
import { Save, Eye, Edit, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MarkdownEditorProps {
  noteId?: string;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ noteId }) => {
  const { notes, addNote, updateNote, deleteNote } = useAppStore();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [currentNote, setCurrentNote] = useState(noteId);

  useEffect(() => {
    if (currentNote) {
      const note = notes.find(n => n.id === currentNote);
      if (note) {
        setTitle(note.title);
        setContent(note.content);
      }
    }
  }, [currentNote, notes]);

  // Autosave functionality
  useEffect(() => {
    if (!currentNote || (!title && !content)) return;
    
    const timer = setTimeout(() => {
      updateNote(currentNote, { title, content });
    }, 1000);

    return () => clearTimeout(timer);
  }, [title, content, currentNote, updateNote]);

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your note.",
        variant: "destructive"
      });
      return;
    }

    if (currentNote) {
      updateNote(currentNote, { title, content });
      toast({
        title: "Note saved",
        description: "Your note has been updated successfully."
      });
    } else {
      const newNote = addNote({ title, content, tags: [] });
      setCurrentNote(newNote);
      toast({
        title: "Note created",
        description: "Your new note has been saved."
      });
    }
  };

  const handleNewNote = () => {
    setCurrentNote('');
    setTitle('');
    setContent('');
  };

  const handleDelete = () => {
    if (currentNote) {
      deleteNote(currentNote);
      handleNewNote();
      toast({
        title: "Note deleted",
        description: "Your note has been permanently deleted."
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button onClick={handleNewNote} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            New Note
          </Button>
          <Button 
            onClick={() => setIsPreview(!isPreview)} 
            size="sm" 
            variant="outline"
          >
            {isPreview ? <Edit className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {isPreview ? 'Edit' : 'Preview'}
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleSave} size="sm">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          {currentNote && (
            <Button onClick={handleDelete} size="sm" variant="destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Title Input */}
      <input
        type="text"
        placeholder="Note title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full text-2xl font-bold border-none outline-none bg-transparent placeholder-gray-400"
      />

      {/* Editor/Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[600px]">
        {/* Editor */}
        {!isPreview && (
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-sm">Editor</CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100%-80px)]">
              <Textarea
                placeholder="Start writing your note in Markdown..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-full resize-none border-none focus-visible:ring-0 text-sm font-mono"
              />
            </CardContent>
          </Card>
        )}

        {/* Preview */}
        <Card className={`h-full ${!isPreview ? '' : 'lg:col-span-2'}`}>
          <CardHeader>
            <CardTitle className="text-sm">Preview</CardTitle>
          </CardHeader>
          <CardContent className="h-[calc(100%-80px)] overflow-y-auto">
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{content || '*Start writing to see preview...*'}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MarkdownEditor;
