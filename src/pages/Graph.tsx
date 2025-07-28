
import React from 'react';
import KnowledgeGraph from '@/components/graph/KnowledgeGraph';

const Graph = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Knowledge Graph</h1>
          <p className="text-muted-foreground mt-2">Visualize connections between your notes</p>
        </div>
      </div>

      <KnowledgeGraph />
    </div>
  );
};

export default Graph;
