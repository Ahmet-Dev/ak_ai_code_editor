import React from 'react';
import { Code2 } from 'lucide-react';
import { AIStatusIndicator } from './AIStatusIndicator';

interface NavbarProps {
  aiStatus: 'idle' | 'working' | 'waiting' | 'error';
}

export function Navbar({ aiStatus }: NavbarProps) {
  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <Code2 className="w-6 h-6 mr-2" />
          <span className="text-xl font-bold">AI Code Editor</span>
        </div>
        <AIStatusIndicator status={aiStatus} />
      </div>
    </nav>
  );
}