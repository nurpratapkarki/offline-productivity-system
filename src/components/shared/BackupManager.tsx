import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Cloud, 
  Download, 
  Upload, 
  Trash2, 
  Shield, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { backupService, type BackupFile } from '@/services/backup';
import { toast } from '@/hooks/use-toast';

const BackupManager: React.FC = () => {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState('');
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);

  useEffect(() => {
    initializeAndLoadBackups();
  }, []);

  const initializeAndLoadBackups = async () => {
    try {
      await initializeGoogleDrive();
      await loadBackups();
    } catch (error) {
      console.error('Failed to initialize backup system:', error);
    }
  };

  const initializeGoogleDrive = async () => {
    try {
      await backupService.initializeGoogleDrive();
    } catch (error) {
      console.error('Failed to initialize Google Drive:', error);
      toast({
        title: 'Google Drive Error',
        description: error instanceof Error ? error.message : 'Failed to connect to Google Drive. Please try logging in again.',
        variant: 'destructive',
      });
      throw error; // Re-throw to prevent loadBackups from running
    }
  };

  const loadBackups = async () => {
    setIsLoading(true);
    try {
      const backupList = await backupService.listBackups();
      setBackups(backupList);
    } catch (error) {
      console.error('Failed to load backups:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load backups from Google Drive.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const result = await backupService.createBackup(encryptionKey || undefined);
      toast({
        title: 'Backup Updated',
        description: 'Your backup has been successfully updated on Google Drive.',
      });
      await loadBackups();
    } catch (error) {
      console.error('Backup creation failed:', error);
      toast({
        title: 'Backup Failed',
        description: error instanceof Error ? error.message : 'Failed to create backup.',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const restoreBackup = async (fileId: string) => {
    setIsRestoring(true);
    setSelectedBackup(fileId);
    try {
      await backupService.restoreBackup(fileId, encryptionKey || undefined);
      toast({
        title: 'Restore Complete',
        description: 'Your data has been successfully restored from backup.',
      });
    } catch (error) {
      console.error('Restore failed:', error);
      toast({
        title: 'Restore Failed',
        description: error instanceof Error ? error.message : 'Failed to restore backup.',
        variant: 'destructive',
      });
    } finally {
      setIsRestoring(false);
      setSelectedBackup(null);
    }
  };

  const deleteBackup = async (fileId: string) => {
    try {
      await backupService.deleteBackup(fileId);
      toast({
        title: 'Backup Deleted',
        description: 'The backup has been successfully deleted.',
      });
      await loadBackups();
    } catch (error) {
      console.error('Delete failed:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete the backup.',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatSize = (sizeString?: string) => {
    if (!sizeString) return 'Unknown size';
    const size = parseInt(sizeString);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatBackupName = (name: string) => {
    // For single backup file like "focusflow-backup-uuid.json"
    if (name.startsWith('focusflow-backup-') && name.endsWith('.json')) {
      return 'FocusFlow Backup';
    }
    return name;
  };

  return (
    <div className="space-y-6">
      {/* Create Backup Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Cloud className="w-5 h-5 mr-2" />
            Create Backup
          </CardTitle>
          <CardDescription>
            Create a secure backup of your data to Google Drive. Each backup will update your single backup file with the latest data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="encryption-key">Encryption Password (Optional)</Label>
            <Input
              id="encryption-key"
              type="password"
              placeholder="Enter password to encrypt your backup"
              value={encryptionKey}
              onChange={(e) => setEncryptionKey(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Leave empty for unencrypted backup. Encrypted backups are more secure but require the password to restore.
            </p>
          </div>

          <Button 
            onClick={createBackup} 
            disabled={isCreatingBackup}
            className="w-full"
          >
            {isCreatingBackup ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Backup...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Create Backup
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Backup List Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Cloud className="w-5 h-5 mr-2" />
                Available Backups
              </CardTitle>
              <CardDescription>
                Manage your Google Drive backup. Your backup file contains all your current data.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadBackups} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading backups...
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Cloud className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No backups found</p>
              <p className="text-sm">Create your first backup to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {backups.map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium">{formatBackupName(backup.name)}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Created: {formatDate(backup.created_time)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Modified: {formatDate(backup.modified_time)}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Restore
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Restore Backup</DialogTitle>
                          <DialogDescription>
                            This will replace your current data with the backup. This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              Make sure to create a current backup before restoring if you want to preserve your current data.
                            </AlertDescription>
                          </Alert>
                          
                          <div className="space-y-2">
                            <Label htmlFor="restore-key">Decryption Password (if encrypted)</Label>
                            <Input
                              id="restore-key"
                              type="password"
                              placeholder="Enter decryption password"
                              value={encryptionKey}
                              onChange={(e) => setEncryptionKey(e.target.value)}
                            />
                          </div>

                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              onClick={() => setSelectedBackup(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => restoreBackup(backup.id)}
                              disabled={isRestoring && selectedBackup === backup.id}
                            >
                              {isRestoring && selectedBackup === backup.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Restoring...
                                </>
                              ) : (
                                <>
                                  <Download className="w-4 h-4 mr-2" />
                                  Restore
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteBackup(backup.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupManager;
