
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Plus } from "lucide-react";

const Notes = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Notes</h1>
          <p className="text-slate-600 mt-2">Capture your thoughts with Markdown</p>
        </div>
      </div>

      <Card className="border-2 border-dashed border-slate-300">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle>Markdown Editor Coming Soon</CardTitle>
          <CardDescription>
            Rich text editing with live preview, syntax highlighting, and autosave
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="space-y-2 text-sm text-slate-600">
            <p>• Real-time Markdown preview</p>
            <p>• Syntax highlighting for code blocks</p>
            <p>• Auto-linking between notes</p>
            <p>• Local autosave every few seconds</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Notes;
