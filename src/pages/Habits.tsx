
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart } from "lucide-react";

const Habits = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Habits</h1>
          <p className="text-slate-600 mt-2">Track daily habits with visual heatmaps</p>
        </div>
      </div>

      <Card className="border-2 border-dashed border-slate-300">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <Heart className="w-6 h-6 text-purple-600" />
          </div>
          <CardTitle>Habit Tracker Coming Soon</CardTitle>
          <CardDescription>
            GitHub-style calendar heatmaps to visualize your consistency
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="space-y-2 text-sm text-slate-600">
            <p>• Visual calendar heatmaps</p>
            <p>• Streak counting and statistics</p>
            <p>• Custom habit colors and icons</p>
            <p>• Daily completion tracking</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Habits;
