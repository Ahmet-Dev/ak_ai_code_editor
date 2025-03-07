import React, { useState, useEffect } from 'react';
import { getSystemPrompts, saveSystemPrompt } from '../utils/promptManager';

interface SystemPromptModalProps {
  onSave: (prompt: string) => void;
  onClose: () => void;
}

export function SystemPromptModal({ onSave, onClose }: SystemPromptModalProps) {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [savedPrompts, setSavedPrompts] = useState<Record<string, string>>({});
  const [promptName, setPromptName] = useState('');

  useEffect(() => {
    const prompts = getSystemPrompts();
    setSavedPrompts(prompts);
    
    // Set default prompt if available
    if (prompts.default) {
      setSystemPrompt(prompts.default);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save the prompt if it has a name
    if (promptName.trim()) {
      saveSystemPrompt(promptName, systemPrompt);
    }
    
    onSave(systemPrompt);
  };

  const handleSelectPrompt = (name: string) => {
    setSystemPrompt(savedPrompts[name]);
    setPromptName(name);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-3/4 max-w-2xl">
        <h2 className="text-xl font-bold mb-4 text-gray-900">System Prompt Configuration</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Saved Prompts
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {Object.entries(savedPrompts).map(([name, prompt]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleSelectPrompt(name)}
                  className={`text-left px-3 py-2 border rounded hover:bg-gray-100 text-sm truncate ${
                    promptName === name ? 'bg-blue-50 border-blue-500' : 'text-gray-700'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prompt Name
            </label>
            <input
              type="text"
              value={promptName}
              onChange={(e) => setPromptName(e.target.value)}
              className="w-full px-3 py-2 border rounded text-gray-900 bg-white"
              placeholder="Enter a name to save this prompt"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              System Prompt
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full px-3 py-2 border rounded h-40 text-gray-900 bg-white"
              required
              placeholder="Enter your system prompt"
            />
            <p className="mt-1 text-sm text-gray-500">
              This prompt will be applied to all messages sent to the AI.
            </p>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save Prompt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}