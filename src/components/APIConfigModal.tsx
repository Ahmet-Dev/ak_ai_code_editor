import React, { useState, useEffect } from 'react';
import type { APIConfig } from '../config/apiConfig';

interface APIConfigModalProps {
  onSave: (config: APIConfig) => void;
  onClose: () => void;
  currentConfig?: APIConfig | null;
}

export function APIConfigModal({ onSave, onClose, currentConfig }: APIConfigModalProps) {
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState<'openai' | 'ollama' | 'anthropic' | 'lmstudio' | 'custom'>('custom');
  const [savedConfigs, setSavedConfigs] = useState<Record<string, APIConfig>>({});
  const [configName, setConfigName] = useState('');

  useEffect(() => {
    // Load saved configurations
    const configs = localStorage.getItem('ai_code_editor_api_configs');
    if (configs) {
      setSavedConfigs(JSON.parse(configs));
    }
    
    // Set current config if provided
    if (currentConfig) {
      setApiUrl(currentConfig.apiUrl);
      setApiKey(currentConfig.apiKey);
      
      // Try to determine provider from URL
      if (currentConfig.apiUrl.includes('openai')) {
        setProvider('openai');
      } else if (currentConfig.apiUrl.includes('anthropic')) {
        setProvider('anthropic');
      } else if (currentConfig.apiUrl.includes('ollama')) {
        setProvider('ollama');
      } else if (currentConfig.apiUrl.includes('lmstudio')) {
        setProvider('lmstudio');
      } else {
        setProvider('custom');
      }
    }
  }, [currentConfig]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const config: APIConfig = { apiUrl, apiKey };
    
    // Save configuration if it has a name
    if (configName.trim()) {
      const updatedConfigs = {
        ...savedConfigs,
        [configName]: config
      };
      localStorage.setItem('ai_code_editor_api_configs', JSON.stringify(updatedConfigs));
    }
    
    onSave(config);
  };

  const handleProviderChange = (newProvider: 'openai' | 'ollama' | 'anthropic' | 'lmstudio' | 'custom') => {
    setProvider(newProvider);
    
    // Set default URLs based on provider
    switch (newProvider) {
      case 'openai':
        setApiUrl('https://api.openai.com/v1/chat/completions');
        break;
      case 'ollama':
        setApiUrl('http://localhost:11434/api/chat');
        break;
      case 'anthropic':
        setApiUrl('https://api.anthropic.com/v1/messages');
        break;
      case 'lmstudio':
        setApiUrl('http://localhost:1234/v1/chat/completions');
        break;
      default:
        // Keep current URL for custom
        break;
    }
  };

  const handleSelectConfig = (name: string) => {
    const config = savedConfigs[name];
    setApiUrl(config.apiUrl);
    setApiKey(config.apiKey);
    setConfigName(name);
    
    // Try to determine provider from URL
    if (config.apiUrl.includes('openai')) {
      setProvider('openai');
    } else if (config.apiUrl.includes('anthropic')) {
      setProvider('anthropic');
    } else if (config.apiUrl.includes('ollama')) {
      setProvider('ollama');
    } else if (config.apiUrl.includes('lmstudio')) {
      setProvider('lmstudio');
    } else {
      setProvider('custom');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">API Configuration</h2>
        
        {Object.keys(savedConfigs).length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Saved Configurations
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {Object.keys(savedConfigs).map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleSelectConfig(name)}
                  className="text-left px-3 py-2 border rounded hover:bg-gray-100 text-sm truncate"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provider
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                onClick={() => handleProviderChange('openai')}
                className={`px-3 py-2 border rounded text-sm ${
                  provider === 'openai' ? 'bg-blue-100 border-blue-500' : 'hover:bg-gray-100'
                }`}
              >
                OpenAI
              </button>
              <button
                type="button"
                onClick={() => handleProviderChange('anthropic')}
                className={`px-3 py-2 border rounded text-sm ${
                  provider === 'anthropic' ? 'bg-blue-100 border-blue-500' : 'hover:bg-gray-100'
                }`}
              >
                Claude
              </button>
              <button
                type="button"
                onClick={() => handleProviderChange('ollama')}
                className={`px-3 py-2 border rounded text-sm ${
                  provider === 'ollama' ? 'bg-blue-100 border-blue-500' : 'hover:bg-gray-100'
                }`}
              >
                Ollama
              </button>
              <button
                type="button"
                onClick={() => handleProviderChange('lmstudio')}
                className={`px-3 py-2 border rounded text-sm ${
                  provider === 'lmstudio' ? 'bg-blue-100 border-blue-500' : 'hover:bg-gray-100'
                }`}
              >
                LM Studio
              </button>
              <button
                type="button"
                onClick={() => handleProviderChange('custom')}
                className={`px-3 py-2 border rounded text-sm ${
                  provider === 'custom' ? 'bg-blue-100 border-blue-500' : 'hover:bg-gray-100'
                }`}
              >
                Custom
              </button>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Configuration Name
            </label>
            <input
              type="text"
              value={configName}
              onChange={(e) => setConfigName(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="Enter a name to save this configuration"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API URL
            </label>
            <input
              type="url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="https://api.example.com"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="Enter your API key"
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}