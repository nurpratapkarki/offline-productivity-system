
import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/appStore';
import { 
  Command, 
  CommandDialog, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from '@/components/ui/command';
import { Search, FileText, Kanban } from 'lucide-react';
import { Button } from '@/components/ui/button';

const GlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const { 
    searchQuery, 
    setSearchQuery, 
    searchResults, 
    performSearch, 
    setCurrentPage 
  } = useAppStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    performSearch();
  }, [searchQuery, performSearch]);

  const handleSelectNote = (noteId: string) => {
    setCurrentPage('notes');
    setOpen(false);
  };

  const handleSelectTask = (taskId: string) => {
    setCurrentPage('tasks');
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        Search...
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search notes, tasks, and more..." 
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          {searchResults.notes.length > 0 && (
            <CommandGroup heading="Notes">
              {searchResults.notes.map((note) => (
                <CommandItem
                  key={note.id}
                  onSelect={() => handleSelectNote(note.id)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{note.title || 'Untitled Note'}</span>
                    <span className="text-xs text-muted-foreground">
                      {note.content.substring(0, 60)}...
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          
          {searchResults.tasks.length > 0 && (
            <CommandGroup heading="Tasks">
              {searchResults.tasks.map((task) => (
                <CommandItem
                  key={task.id}
                  onSelect={() => handleSelectTask(task.id)}
                >
                  <Kanban className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{task.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {task.description.substring(0, 60)}...
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default GlobalSearch;
