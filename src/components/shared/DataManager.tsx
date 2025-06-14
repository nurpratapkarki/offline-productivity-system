
import React, { useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Download, Upload, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DataManager = () => {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const { exportData, importData, clearAllData } = useAppStore();
  const { toast } = useToast();

  const handleExport = () => {
    try {
      const data = exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `focusflow-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Data exported",
        description: "Your workspace has been successfully exported."
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting your data.",
        variant: "destructive"
      });
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const success = importData(content);
        
        if (success) {
          toast({
            title: "Data imported",
            description: "Your workspace has been successfully restored."
          });
          setImportDialogOpen(false);
        } else {
          toast({
            title: "Import failed",
            description: "Invalid file format or corrupted data.",
            variant: "destructive"
          });
        }
      } catch (error) {
        toast({
          title: "Import failed",
          description: "There was an error reading the file.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    clearAllData();
    setClearDialogOpen(false);
    toast({
      title: "Data cleared",
      description: "All your data has been permanently deleted."
    });
  };

  return (
    <div className="flex items-center space-x-2">
      <Button onClick={handleExport} size="sm" variant="outline">
        <Download className="w-4 h-4 mr-2" />
        Export
      </Button>
      
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Workspace</DialogTitle>
            <DialogDescription>
              Select a FocusFlow backup file to restore your workspace. This will replace all current data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
              Clear All Data
            </DialogTitle>
            <DialogDescription>
              This will permanently delete all your notes, tasks, habits, and settings. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setClearDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearData}>
              Delete Everything
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DataManager;
