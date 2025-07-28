import { apiClient } from './api';
import { authService } from './auth';

export interface BackupFile {
  id: string;
  name: string;
  size?: string;
  modified_time?: string;
  created_time?: string;
}

export interface BackupMetadata {
  user_id: string;
  backup_type: string;
  created_at: string;
  version: string;
  entities_count: number;
}

class BackupService {
  private googleAccessToken: string | null = null;

  async initializeGoogleDrive(): Promise<void> {
    try {
      // Get the Google access token from the backend
      const response = await apiClient.getGoogleAccessToken();
      this.googleAccessToken = response.access_token;
    } catch (error) {
      console.error('Failed to get Google access token:', error);
      throw new Error(`Failed to initialize Google Drive access: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createBackup(encryptionKey?: string): Promise<{ success: boolean; fileId: string }> {
    if (!this.googleAccessToken) {
      await this.initializeGoogleDrive();
    }

    try {
      const response = await apiClient.createBackup(this.googleAccessToken!, encryptionKey);
      return response;
    } catch (error) {
      console.error('Backup creation failed:', error);
      throw new Error(`Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async listBackups(): Promise<BackupFile[]> {
    if (!this.googleAccessToken) {
      await this.initializeGoogleDrive();
    }

    try {
      const response = await apiClient.listBackups(this.googleAccessToken!);
      return response.backups || [];
    } catch (error) {
      console.error('Failed to list backups:', error);

      // If the error indicates session expired, clear the cached token
      if (error instanceof Error && error.message.includes('session has expired')) {
        this.googleAccessToken = null;
      }

      throw new Error(`Failed to load backups: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async restoreBackup(fileId: string, encryptionKey?: string): Promise<void> {
    if (!this.googleAccessToken) {
      await this.initializeGoogleDrive();
    }

    try {
      await apiClient.restoreBackup(this.googleAccessToken!, fileId, encryptionKey);
    } catch (error) {
      console.error('Backup restore failed:', error);
      throw error;
    }
  }

  async deleteBackup(fileId: string): Promise<void> {
    if (!this.googleAccessToken) {
      await this.initializeGoogleDrive();
    }

    try {
      await apiClient.deleteBackup(fileId, this.googleAccessToken!);
    } catch (error) {
      console.error('Backup deletion failed:', error);
      throw error;
    }
  }

  // Client-side encryption using Web Crypto API
  async encryptData(data: string, password: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const passwordBuffer = encoder.encode(password);

    // Generate a key from the password
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    // Generate a random salt
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // Derive the encryption key
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    // Generate a random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the data
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      dataBuffer
    );

    // Combine salt, IV, and encrypted data
    const result = new Uint8Array(salt.length + iv.length + encryptedBuffer.byteLength);
    result.set(salt, 0);
    result.set(iv, salt.length);
    result.set(new Uint8Array(encryptedBuffer), salt.length + iv.length);

    // Convert to base64
    return btoa(String.fromCharCode(...result));
  }

  async decryptData(encryptedData: string, password: string): Promise<string> {
    try {
      // Convert from base64
      const combined = new Uint8Array(
        atob(encryptedData)
          .split('')
          .map(char => char.charCodeAt(0))
      );

      // Extract salt, IV, and encrypted data
      const salt = combined.slice(0, 16);
      const iv = combined.slice(16, 28);
      const encrypted = combined.slice(28);

      const encoder = new TextEncoder();
      const passwordBuffer = encoder.encode(password);

      // Generate key material from password
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );

      // Derive the decryption key
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );

      // Decrypt the data
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encrypted
      );

      // Convert back to string
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      throw new Error('Decryption failed. Please check your password.');
    }
  }

  // Auto-backup functionality
  private autoBackupInterval: number | null = null;

  startAutoBackup(intervalMinutes: number = 60, encryptionKey?: string): void {
    this.stopAutoBackup();
    
    this.autoBackupInterval = window.setInterval(async () => {
      try {
        await this.createBackup(encryptionKey);
        console.log('Auto-backup completed successfully');
      } catch (error) {
        console.error('Auto-backup failed:', error);
      }
    }, intervalMinutes * 60 * 1000);
  }

  stopAutoBackup(): void {
    if (this.autoBackupInterval) {
      clearInterval(this.autoBackupInterval);
      this.autoBackupInterval = null;
    }
  }

  isAutoBackupActive(): boolean {
    return this.autoBackupInterval !== null;
  }

  // Backup validation
  async validateBackup(fileId: string, encryptionKey?: string): Promise<boolean> {
    try {
      // This would download and validate the backup structure
      // For now, we'll just check if we can access it
      const backups = await this.listBackups();
      return backups.some(backup => backup.id === fileId);
    } catch (error) {
      console.error('Backup validation failed:', error);
      return false;
    }
  }

  // Get backup size and metadata
  async getBackupInfo(fileId: string): Promise<BackupFile | null> {
    try {
      const backups = await this.listBackups();
      return backups.find(backup => backup.id === fileId) || null;
    } catch (error) {
      console.error('Failed to get backup info:', error);
      return null;
    }
  }
}

export const backupService = new BackupService();
export default backupService;
