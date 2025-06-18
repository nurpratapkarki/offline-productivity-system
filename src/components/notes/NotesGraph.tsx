
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/appStore';
import { Network, FileText, Plus, Trash2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NotesGraphProps {
  mode: 'view' | 'edit' | 'link';
  onSelectNote: (noteId: string) => void;
}

interface GraphNode {
  id: string;
  title: string;
  x: number;
  y: number;
  color: string;
}

interface GraphLink {
  from: string;
  to: string;
  strength: number;
}

const NotesGraph: React.FC<NotesGraphProps> = ({ mode, onSelectNote }) => {
  const { notes, updateNote } = useAppStore();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [linkingFrom, setLinkingFrom] = useState<string | null>(null);

  // Initialize graph data
  useEffect(() => {
    const graphNodes: GraphNode[] = notes.map((note, index) => ({
      id: note.id,
      title: note.title,
      x: 100 + (index % 5) * 150,
      y: 100 + Math.floor(index / 5) * 120,
      color: note.tags.length > 0 ? '#3b82f6' : '#6b7280'
    }));

    // Auto-detect links based on content
    const graphLinks: GraphLink[] = [];
    notes.forEach(note => {
      const content = note.content.toLowerCase();
      notes.forEach(otherNote => {
        if (note.id !== otherNote.id && content.includes(otherNote.title.toLowerCase())) {
          graphLinks.push({
            from: note.id,
            to: otherNote.id,
            strength: 1
          });
        }
      });
    });

    setNodes(graphNodes);
    setLinks(graphLinks);
  }, [notes]);

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw links
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    links.forEach(link => {
      const fromNode = nodes.find(n => n.id === link.from);
      const toNode = nodes.find(n => n.id === link.to);
      if (fromNode && toNode) {
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.stroke();
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      ctx.fillStyle = node.id === selectedNode ? '#ef4444' : node.color;
      ctx.beginPath();
      ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI);
      ctx.fill();

      // Draw node labels
      ctx.fillStyle = '#1f2937';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      const text = node.title.length > 15 ? node.title.substring(0, 15) + '...' : node.title;
      ctx.fillText(text, node.x, node.y + 35);
    });

    // Highlight linking mode
    if (mode === 'link' && linkingFrom) {
      const fromNode = nodes.find(n => n.id === linkingFrom);
      if (fromNode) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(fromNode.x, fromNode.y, 25, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }, [nodes, links, selectedNode, mode, linkingFrom]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find clicked node
    const clickedNode = nodes.find(node => {
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return distance <= 20;
    });

    if (clickedNode) {
      if (mode === 'view') {
        setSelectedNode(clickedNode.id);
        onSelectNote(clickedNode.id);
      } else if (mode === 'edit') {
        setSelectedNode(clickedNode.id);
      } else if (mode === 'link') {
        if (!linkingFrom) {
          setLinkingFrom(clickedNode.id);
          toast({
            title: "Link mode active",
            description: "Click another note to create a link"
          });
        } else if (linkingFrom !== clickedNode.id) {
          // Create link
          const newLink = { from: linkingFrom, to: clickedNode.id, strength: 1 };
          setLinks(prev => [...prev, newLink]);
          setLinkingFrom(null);
          toast({
            title: "Link created",
            description: "Notes have been connected"
          });
        }
      }
    } else if (mode === 'edit') {
      // Create new node
      const newNodeId = crypto.randomUUID();
      const newNode: GraphNode = {
        id: newNodeId,
        title: 'New Note',
        x,
        y,
        color: '#6b7280'
      };
      setNodes(prev => [...prev, newNode]);
    }
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'edit') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const clickedNode = nodes.find(node => {
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return distance <= 20;
    });

    if (clickedNode) {
      setDraggedNode(clickedNode.id);
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'edit' || !draggedNode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setNodes(prev => prev.map(node => 
      node.id === draggedNode ? { ...node, x, y } : node
    ));
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
  };

  const deleteSelectedNode = () => {
    if (selectedNode) {
      setNodes(prev => prev.filter(n => n.id !== selectedNode));
      setLinks(prev => prev.filter(l => l.from !== selectedNode && l.to !== selectedNode));
      setSelectedNode(null);
    }
  };

  if (notes.length === 0) {
    return (
      <Card className="h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <Network className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No notes to visualize</p>
            <p className="text-sm text-gray-500">Create some notes to see the graph</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats and Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{nodes.length}</p>
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
                <p className="text-2xl font-bold">{links.length}</p>
                <p className="text-sm text-gray-600">Connections</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm">
              <strong>Mode:</strong> {mode.charAt(0).toUpperCase() + mode.slice(1)}
              {mode === 'view' && <p className="text-gray-500">Click nodes to select</p>}
              {mode === 'edit' && <p className="text-gray-500">Drag nodes, click empty space to add</p>}
              {mode === 'link' && <p className="text-gray-500">Click two nodes to link them</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex space-x-2">
              {mode === 'edit' && selectedNode && (
                <Button size="sm" variant="destructive" onClick={deleteSelectedNode}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              {mode === 'link' && linkingFrom && (
                <Button size="sm" variant="outline" onClick={() => setLinkingFrom(null)}>
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graph Canvas */}
      <Card className="h-[600px]">
        <CardHeader>
          <CardTitle>Knowledge Graph - {mode.charAt(0).toUpperCase() + mode.slice(1)} Mode</CardTitle>
        </CardHeader>
        <CardContent className="h-[calc(100%-80px)]">
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            className="border border-gray-200 rounded cursor-pointer w-full"
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default NotesGraph;
