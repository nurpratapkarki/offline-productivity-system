import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  FileText, 
  Kanban, 
  Calendar, 
  Clock, 
  Shield, 
  Download,
  Zap,
  Users,
  BookOpen,
  Heart,
  ArrowRight
} from "lucide-react";

const Index = () => {
  const features = [
    {
      icon: FileText,
      title: "Rich Markdown Editor",
      description: "Obsidian-style note taking with live preview, syntax highlighting, and seamless linking between notes."
    },
    {
      icon: Kanban,
      title: "Drag & Drop Kanban",
      description: "Visual task management with customizable boards, labels, and progress tracking that feels like Trello."
    },
    {
      icon: Heart,
      title: "Habit Tracker",
      description: "GitHub-style calendar heatmaps to visualize your daily habits and build consistent routines."
    },
    {
      icon: BookOpen,
      title: "Knowledge Graph",
      description: "Interactive visualization of connections between your notes, revealing patterns in your thinking."
    },
    {
      icon: Clock,
      title: "Pomodoro Timer",
      description: "Built-in focus sessions with customizable intervals and automatic break reminders."
    },
    {
      icon: Calendar,
      title: "Smart Calendar",
      description: "Plan your day with integrated scheduling that connects to your tasks and habits."
    }
  ];

  const benefits = [
    {
      icon: Shield,
      title: "100% Private",
      description: "Your data never leaves your device. Optional AES encryption for sensitive notes."
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "No loading screens, no API calls. Everything runs locally in your browser."
    },
    {
      icon: Download,
      title: "Portable Workspace",
      description: "Export/import your entire workspace as JSON. Move between devices effortlessly."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16 animate-fade-in">
          <Badge variant="outline" className="mb-6 px-4 py-2 text-sm font-medium bg-white/80 backdrop-blur-sm">
            <Zap className="w-4 h-4 mr-2" />
            No Backend • No Account • No APIs
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-800 bg-clip-text text-transparent mb-6 leading-tight">
            FocusFlow
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 mb-4 max-w-3xl mx-auto leading-relaxed">
            The ultimate offline productivity OS for developers, students, and digital creators
          </p>
          
          <p className="text-lg text-slate-500 mb-10 max-w-2xl mx-auto">
            Combine notes, tasks, habits, and planning in one beautiful interface. 
            Everything runs in your browser—fast, free, and completely private.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="px-8 py-6 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <Link to="/app">
                <ArrowRight className="w-5 h-5 mr-2" />
                Launch FocusFlow
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-6 text-lg bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-300">
              <FileText className="w-5 h-5 mr-2" />
              View Demo
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-slate-800">
            Everything you need to stay productive
          </h2>
          <p className="text-lg text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            Six powerful tools working together seamlessly, all running offline in your browser
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:bg-white"
              >
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl text-slate-800">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-600 text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-slate-800">
            Why choose FocusFlow?
          </h2>
          <p className="text-lg text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            Built for the modern knowledge worker who values privacy, speed, and simplicity
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center animate-fade-in">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <benefit.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-slate-800">{benefit.title}</h3>
                <p className="text-slate-600 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white/60 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-white/20">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-800">
            Ready to transform your productivity?
          </h2>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Join thousands of developers, students, and creators who've made FocusFlow their digital workspace of choice.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="px-8 py-6 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <Link to="/app">
                <Download className="w-5 h-5 mr-2" />
                Get Started Free
              </Link>
            </Button>
            <p className="text-sm text-slate-500">
              No installation required • Works in any modern browser
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 pt-8 border-t border-slate-200">
          <p className="text-slate-500">
            Built with React, Vite, and Tailwind CSS • Open source and privacy-first
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
