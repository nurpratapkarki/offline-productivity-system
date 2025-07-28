import React from 'react';
import { SoundTestPanel } from '@/components/SoundTestPanel';

const SoundTest = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sound Test</h1>
          <p className="text-muted-foreground mt-2">
            Test the sound notification system across all platforms
          </p>
        </div>
      </div>

      <SoundTestPanel />
    </div>
  );
};

export default SoundTest;
