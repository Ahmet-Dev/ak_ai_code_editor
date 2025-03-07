import React, { useState } from 'react';
import { Code2, MessageSquare, Database, Settings } from 'lucide-react';
import { AIStatusIndicator } from './AIStatusIndicator';
import { SystemPromptModal } from './SystemPromptModal';
import { AIModelSettings } from './AIModelSettings';
import { VectorDBSettings } from './VectorDBSettings';
import type { AIModel, AIModule, VectorDBConfig } from '../types';

interface NavbarProps {
  aiStatus: 'idle' | 'working' | 'waiting' | 'error';
  onSystemPromptChange?: (prompt: string) => void;
  onModelSelect?: (model: AIModel, modules: AIModule[]) => void;
  onVectorDBConnect?: (config: VectorDBConfig) => void;
}

export function Navbar({ 
  aiStatus, 
  onSystemPromptChange,
  onModelSelect,
  onVectorDBConnect
}: NavbarProps) {
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [showModelSettings, setShowModelSettings] = useState(false);
  const [showVectorDBSettings, setShowVectorDBSettings] = useState(false);

  const handleSystemPromptSave = (prompt: string) => {
    if (onSystemPromptChange) {
      onSystemPromptChange(prompt);
    }
    setShowSystemPrompt(false);
  };

  const handleModelSelect = (model: AIModel, modules: AIModule[]) => {
    if (onModelSelect) {
      onModelSelect(model, modules);
    }
  };

  const handleVectorDBConnect = (config: VectorDBConfig) => {
    if (onVectorDBConnect) {
      onVectorDBConnect(config);
    }
    setShowVectorDBSettings(false);
  };

  return (
    <nav className="bg-gray-800 text-white p-4 sticky top-0 z-10">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <img src=".\images\logo.png" alt="Logo" className="h-12 w-120 rounded-full"></img>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowSystemPrompt(true)}
            className="flex items-center px-3 py-1.5 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            <MessageSquare className="w-4 h-4 mr-2 text-blue-300" />
            <span className="text-sm font-medium">System Prompt</span>
          </button>
          <button
            onClick={() => setShowModelSettings(true)}
            className="flex items-center px-3 py-1.5 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            <Settings className="w-4 h-4 mr-2 text-purple-300" />
            <span className="text-sm font-medium">AI Model Settings</span>
          </button>
          <button
            onClick={() => setShowVectorDBSettings(true)}
            className="flex items-center px-3 py-1.5 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            <Database className="w-4 h-4 mr-2 text-green-300" />
            <span className="text-sm font-medium">Vector DB</span>
          </button>
          <AIStatusIndicator status={aiStatus} />
        </div>
      </div>

      {showSystemPrompt && (
        <SystemPromptModal
          onSave={handleSystemPromptSave}
          onClose={() => setShowSystemPrompt(false)}
        />
      )}

      {showModelSettings && (
        <AIModelSettings
          onClose={() => setShowModelSettings(false)}
          onModelSelect={handleModelSelect}
        />
      )}

      {showVectorDBSettings && (
        <VectorDBSettings
          onClose={() => setShowVectorDBSettings(false)}
          onConnect={handleVectorDBConnect}
        />
      )}
    </nav>
  );
}