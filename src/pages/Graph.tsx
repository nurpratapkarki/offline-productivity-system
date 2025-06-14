
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Network } from "lucide-react";

const Graph = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Knowledge Graph</h1>
          <p className="text-slate-600 mt-2">Visualize connections between your notes</p>
        </div>
      </div>

      <Card className="border-2 border-dashed border-slate-300">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
            <Network className="w-6 h-6 text-orange-600" />
          </div>
          <CardTitle>Knowledge Graph Coming Soon</CardTitle>
          <CardDescription>
            Interactive visualization showing how your ideas connect
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="space-y-2 text-sm text-slate-600">
            <p>• Interactive force-directed graph</p>
            <p>• Auto-detect links between notes</p>
            <p>• Tag-based clustering</p>
            <p>• Zoom and pan navigation</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Graph;
