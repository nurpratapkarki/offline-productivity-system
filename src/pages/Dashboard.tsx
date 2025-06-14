
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/stores/appStore";
import { FileText, Kanban, Heart, Network, Clock, TrendingUp } from "lucide-react";

const Dashboard = () => {
  const { notes, tasks, habits } = useAppStore();

  const stats = [
    {
      title: "Notes",
      value: notes.length,
      icon: FileText,
      description: "Total notes created",
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Tasks",
      value: tasks.length,
      icon: Kanban,
      description: `${tasks.filter(t => t.status === 'done').length} completed`,
      color: "from-green-500 to-green-600"
    },
    {
      title: "Habits",
      value: habits.length,
      icon: Heart,
      description: "Active habits tracked",
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "Focus Score",
      value: Math.round((tasks.filter(t => t.status === 'done').length / Math.max(tasks.length, 1)) * 100),
      icon: TrendingUp,
      description: "Task completion rate",
      color: "from-orange-500 to-orange-600"
    }
  ];

  const recentNotes = notes.slice(-3).reverse();
  const urgentTasks = tasks.filter(t => t.status === 'todo' && t.priority === 'high').slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          Welcome to FocusFlow
        </h1>
        <p className="text-slate-600">
          Your personal productivity operating system
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.color}`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  {stat.title === "Focus Score" ? `${stat.value}%` : stat.value}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Recent Notes
            </CardTitle>
            <CardDescription>
              Your latest thoughts and ideas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentNotes.length > 0 ? (
              <div className="space-y-3">
                {recentNotes.map((note) => (
                  <div key={note.id} className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                    <h4 className="font-medium text-slate-900 truncate">
                      {note.title || "Untitled Note"}
                    </h4>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                      {note.content.substring(0, 100)}...
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">
                No notes yet. Start writing to see them here!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Urgent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Priority Tasks
            </CardTitle>
            <CardDescription>
              High priority items that need attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            {urgentTasks.length > 0 ? (
              <div className="space-y-3">
                {urgentTasks.map((task) => (
                  <div key={task.id} className="p-3 border border-red-200 rounded-lg bg-red-50">
                    <h4 className="font-medium text-slate-900">
                      {task.title}
                    </h4>
                    <p className="text-sm text-slate-600 mt-1">
                      {task.description}
                    </p>
                    <span className="inline-block mt-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                      High Priority
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">
                No urgent tasks. You're all caught up! 🎉
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
