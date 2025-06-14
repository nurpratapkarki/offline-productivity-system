
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/stores/appStore';
import { Network, FileText } from 'lucide-react';

const KnowledgeGraph: React.FC = () => {
  const { notes } = useAppStore();

  // Extract potential connections between notes
  const extractConnections = () => {
    const connections = [];
    const noteMap = new Map(notes.map(note => [note.title.toLowerCase(), note]));
    
    notes.forEach(note => {
      const words = note.content.toLowerCase().split(/\W+/);
      const linkedNotes = [];
      
      words.forEach(word => {
        if (word.length > 3 && noteMap.has(word) && noteMap.get(word)?.id !== note.id) {
          linkedNotes.push(noteMap.get(word)!);
        }
      });
      
      linkedNotes.forEach(linkedNote => {
        connections.push({
          from: note,
          to: linkedNote,
          strength: 1
        });
      });
    });
    
    return connections;
  };

  const connections = extractConnections();

  if (notes.length === 0) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <Network className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No notes to visualize</p>
            <p className="text-sm text-gray-500">Create some notes to see connections</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{notes.length}</p>
                <p className="text-sm text-gray-600">Notes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Network className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{connections.length}</p>
                <p className="text-sm text-gray-600">Connections</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-purple-600 rounded" />
              <div>
                <p className="text-2xl font-bold">
                  {notes.reduce((acc, note) => acc + note.tags.length, 0)}
                </p>
                <p className="text-sm text-gray-600">Tags</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graph Visualization Placeholder */}
      <Card className="h-96">
        <CardHeader>
          <CardTitle>Knowledge Graph</CardTitle>
        </CardHeader>
        <CardContent className="h-full flex items-center justify-center">
          <div className="text-center">
            <Network className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Interactive Graph Coming Soon</p>
            <p className="text-sm text-gray-500">
              Full graph visualization with D3.js or similar will be implemented in Phase 3
            </p>
            
            {connections.length > 0 && (
              <div className="mt-4 text-left">
                <h4 className="font-medium mb-2">Detected Connections:</h4>
                <div className="space-y-1 text-sm">
                  {connections.slice(0, 5).map((conn, index) => (
                    <div key={index} className="text-gray-600">
                      "{conn.from.title}" → "{conn.to.title}"
                    </div>
                  ))}
                  {connections.length > 5 && (
                    <p className="text-gray-500">... and {connections.length - 5} more</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KnowledgeGraph;
