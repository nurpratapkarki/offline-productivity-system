
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/appStore";
import { 
  Home, 
  FileText, 
  Kanban, 
  Heart, 
  Network,
  Settings 
} from "lucide-react";

const Navigation = () => {
  const { currentPage, setCurrentPage } = useAppStore();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'tasks', label: 'Tasks', icon: Kanban },
    { id: 'habits', label: 'Habits', icon: Heart },
    { id: 'graph', label: 'Graph', icon: Network },
  ] as const;

  return (
    <nav className="flex items-center space-x-1 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg p-2 shadow-sm">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPage === item.id;
        
        return (
          <Button
            key={item.id}
            variant={isActive ? "default" : "ghost"}
            size="sm"
            onClick={() => setCurrentPage(item.id)}
            className={`flex items-center space-x-2 ${
              isActive 
                ? "bg-blue-600 text-white" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Icon size={16} />
            <span className="hidden sm:block">{item.label}</span>
          </Button>
        );
      })}
    </nav>
  );
};

export default Navigation;
