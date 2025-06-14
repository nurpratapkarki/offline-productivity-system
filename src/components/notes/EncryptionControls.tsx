
import React, { useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Lock, Unlock, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EncryptionControlsProps {
  noteId: string;
  isEncrypted: boolean;
}

const EncryptionControls: React.FC<EncryptionControlsProps> = ({ noteId, isEncrypted }) => {
  const [password, setPassword] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { encryptNote, decryptNote } = useAppStore();
  const { toast } = useToast();

  const handleEncrypt = () => {
    if (!password.trim()) {
      toast({
        title: "Password required",
        description: "Please enter a password to encrypt the note.",
        variant: "destructive"
      });
      return;
    }

    encryptNote(noteId, password);
    setPassword('');
    setDialogOpen(false);
    toast({
      title: "Note encrypted",
      description: "Your note has been encrypted successfully."
    });
  };

  const handleDecrypt = () => {
    if (!password.trim()) {
      toast({
        title: "Password required",
        description: "Please enter the password to decrypt the note.",
        variant: "destructive"
      });
      return;
    }

    const success = decryptNote(noteId, password);
    if (success) {
      setPassword('');
      setDialogOpen(false);
      toast({
        title: "Note decrypted",
        description: "Your note has been decrypted successfully."
      });
    } else {
      toast({
        title: "Decryption failed",
        description: "Invalid password. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          {isEncrypted ? (
            <>
              <Lock className="w-4 h-4 mr-2" />
              Encrypted
            </>
          ) : (
            <>
              <Shield className="w-4 h-4 mr-2" />
              Encrypt
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {isEncrypted ? (
              <>
                <Unlock className="w-5 h-5 mr-2" />
                Decrypt Note
              </>
            ) : (
              <>
                <Lock className="w-5 h-5 mr-2" />
                Encrypt Note
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEncrypted 
              ? "Enter your password to decrypt this note."
              : "Enter a password to encrypt this note. Make sure to remember it!"
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                isEncrypted ? handleDecrypt() : handleEncrypt();
              }
            }}
          />
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={isEncrypted ? handleDecrypt : handleEncrypt}>
              {isEncrypted ? 'Decrypt' : 'Encrypt'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EncryptionControls;
