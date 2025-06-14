
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Kanban } from "lucide-react";

const Tasks = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Tasks</h1>
          <p className="text-slate-600 mt-2">Organize your work with Kanban boards</p>
        </div>
      </div>

      <Card className="border-2 border-dashed border-slate-300">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <Kanban className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle>Kanban Board Coming Soon</CardTitle>
          <CardDescription>
            Drag-and-drop task management with three columns: To Do, Doing, Done
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="space-y-2 text-sm text-slate-600">
            <p>• Drag-and-drop functionality</p>
            <p>• Priority levels and due dates</p>
            <p>• Task descriptions and checklists</p>
            <p>• Persistent storage across sessions</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Tasks;
