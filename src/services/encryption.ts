/**
 * Client-side encryption service using Web Crypto API
 * Provides AES-GCM encryption for secure data storage and backup
 */

export interface EncryptionResult {
  encryptedData: string;
  salt: string;
  iv: string;
}

export interface DecryptionParams {
  encryptedData: string;
  salt: string;
  iv: string;
  password: string;
}

class EncryptionService {
  private readonly ALGORITHM = 'AES-GCM';
  private readonly KEY_LENGTH = 256;
  private readonly IV_LENGTH = 12;
  private readonly SALT_LENGTH = 16;
  private readonly ITERATIONS = 100000;

  /**
   * Encrypt data using AES-GCM with PBKDF2 key derivation
   */
  async encrypt(data: string, password: string): Promise<EncryptionResult> {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const passwordBuffer = encoder.encode(password);

      // Generate random salt and IV
      const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));

      // Import password as key material
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );

      // Derive encryption key using PBKDF2
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: this.ITERATIONS,
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: this.ALGORITHM, length: this.KEY_LENGTH },
        false,
        ['encrypt']
      );

      // Encrypt the data
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: this.ALGORITHM, iv: iv },
        key,
        dataBuffer
      );

      // Convert to base64 strings for storage
      return {
        encryptedData: this.arrayBufferToBase64(encryptedBuffer),
        salt: this.arrayBufferToBase64(salt),
        iv: this.arrayBufferToBase64(iv),
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypt data using AES-GCM
   */
  async decrypt(params: DecryptionParams): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const passwordBuffer = encoder.encode(params.password);

      // Convert base64 strings back to ArrayBuffers
      const encryptedBuffer = this.base64ToArrayBuffer(params.encryptedData);
      const salt = this.base64ToArrayBuffer(params.salt);
      const iv = this.base64ToArrayBuffer(params.iv);

      // Import password as key material
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );

      // Derive decryption key using the same parameters
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: this.ITERATIONS,
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: this.ALGORITHM, length: this.KEY_LENGTH },
        false,
        ['decrypt']
      );

      // Decrypt the data
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: this.ALGORITHM, iv: iv },
        key,
        encryptedBuffer
      );

      // Convert back to string
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Invalid password or corrupted data'}`);
    }
  }

  /**
   * Encrypt data and combine all components into a single string
   * Format: salt.iv.encryptedData (base64 encoded, dot separated)
   */
  async encryptToString(data: string, password: string): Promise<string> {
    const result = await this.encrypt(data, password);
    return `${result.salt}.${result.iv}.${result.encryptedData}`;
  }

  /**
   * Decrypt data from combined string format
   */
  async decryptFromString(encryptedString: string, password: string): Promise<string> {
    const parts = encryptedString.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    return this.decrypt({
      salt: parts[0],
      iv: parts[1],
      encryptedData: parts[2],
      password,
    });
  }

  /**
   * Generate a secure random password
   */
  generatePassword(length: number = 32): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    return Array.from(array, byte => charset[byte % charset.length]).join('');
  }

  /**
   * Hash a password for verification (not for encryption keys)
   */
  async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return this.arrayBufferToBase64(hashBuffer);
  }

  /**
   * Verify a password against its hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = await this.hashPassword(password);
    return passwordHash === hash;
  }

  /**
   * Check if the Web Crypto API is available
   */
  isSupported(): boolean {
    return typeof crypto !== 'undefined' && 
           typeof crypto.subtle !== 'undefined' &&
           typeof crypto.getRandomValues !== 'undefined';
  }

  /**
   * Estimate encryption strength based on password
   */
  estimatePasswordStrength(password: string): 'weak' | 'medium' | 'strong' | 'very-strong' {
    if (password.length < 8) return 'weak';
    
    let score = 0;
    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    if (score < 3) return 'weak';
    if (score < 4) return 'medium';
    if (score < 5) return 'strong';
    return 'very-strong';
  }

  // Utility methods
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

export const encryptionService = new EncryptionService();
export default encryptionService;
