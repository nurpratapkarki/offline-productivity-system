
import { useAppStore } from "@/stores/appStore";
import Navigation from "@/components/shared/Navigation";
import Dashboard from "@/pages/Dashboard";
import Notes from "@/pages/Notes";
import Tasks from "@/pages/Tasks";
import Habits from "@/pages/Habits";
import Graph from "@/pages/Graph";

const AppLayout = () => {
  const { currentPage, focusMode } = useAppStore();

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'notes':
        return <Notes />;
      case 'tasks':
        return <Tasks />;
      case 'habits':
        return <Habits />;
      case 'graph':
        return <Graph />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className={`min-h-screen ${focusMode 
      ? 'bg-gray-900' 
      : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'
    }`}>
      <div className="container mx-auto px-4 py-6">
        {/* Header with Navigation */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <h1 className={`text-xl font-bold ${focusMode ? 'text-white' : 'text-slate-800'}`}>
                FocusFlow
              </h1>
            </div>
          </div>
          <Navigation />
        </header>

        {/* Main Content */}
        <main className={`animate-fade-in ${focusMode ? 'text-white' : ''}`}>
          <div className={focusMode ? 'max-w-4xl mx-auto' : ''}>
            {renderCurrentPage()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
