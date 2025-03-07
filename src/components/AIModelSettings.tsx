import React, { useState, useEffect } from 'react';
import { Settings, Database, Cpu, BrainCircuit, MessageSquare, Code, Search, Infinity } from 'lucide-react';
import { getAvailableModels, setActiveModel } from '../utils/modelManager';
import type { AIModel, AIModule } from '../types';

interface AIModelSettingsProps {
  onClose: () => void;
  onModelSelect: (model: AIModel, modules: AIModule[]) => void;
}

export function AIModelSettings({ onClose, onModelSelect }: AIModelSettingsProps) {
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeModules, setActiveModules] = useState<AIModule[]>([]);
  const [modelProvider, setModelProvider] = useState<'ollama' | 'lmstudio' | 'openai' | 'claude'>('ollama');

  const modules: AIModule[] = [
    { id: 'debug', name: 'Auto Debug', description: 'Automatically debug and suggest improvements for your code', icon: <Cpu className="w-5 h-5" /> },
    { id: 'chat', name: 'Chat', description: 'Interact with the AI to get guidance and answers', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'think', name: 'Think', description: 'AI thinks step by step through complex problems', icon: <BrainCircuit className="w-5 h-5" /> },
    { id: 'code', name: 'Coding', description: 'Generate code in specific programming languages', icon: <Code className="w-5 h-5" /> },
    { id: 'embed', name: 'Embeddings', description: 'Embed data for meaningful analysis', icon: <Database className="w-5 h-5" /> },
    { id: 'vector', name: 'Vector Search', description: 'Search through vector database for similar code and documentation', icon: <Search className="w-5 h-5" /> }
  ];

  useEffect(() => {
    const fetchModels = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const models = await getAvailableModels(modelProvider);
        setAvailableModels(models);
        if (models.length > 0) {
          setSelectedModel(models[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch models');
        setAvailableModels([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModels();
  }, [modelProvider]);

  const toggleModule = (module: AIModule) => {
    if (activeModules.some(m => m.id === module.id)) {
      setActiveModules(activeModules.filter(m => m.id !== module.id));
    } else {
      setActiveModules([...activeModules, module]);
    }
  };

  const handleModelSelect = async () => {
    if (!selectedModel) return;
    
    try {
      await setActiveModel(selectedModel, activeModules);
      onModelSelect(selectedModel, activeModules);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set active model');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-[800px] max-h-[90vh] overflow-y-auto border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">AI Model Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-white">Model Provider</h3>
          <div className="grid grid-cols-4 gap-2 mb-4">
            <button
              className={`px-4 py-2 rounded flex items-center justify-center ${
                modelProvider === 'ollama' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setModelProvider('ollama')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Ollama
            </button>
            <button
              className={`px-4 py-2 rounded flex items-center justify-center ${
                modelProvider === 'lmstudio' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setModelProvider('lmstudio')}
            >
              <BrainCircuit className="w-4 h-4 mr-2" />
              LM Studio
            </button>
            <button
              className={`px-4 py-2 rounded flex items-center justify-center ${
                modelProvider === 'openai' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setModelProvider('openai')}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              OpenAI
            </button>
            <button
              className={`px-4 py-2 rounded flex items-center justify-center ${
                modelProvider === 'claude' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setModelProvider('claude')}
            >
              <Code className="w-4 h-4 mr-2" />
              Claude
            </button>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-white">Available Models</h3>
          {isLoading ? (
            <div className="text-center py-4 text-gray-300">Loading models...</div>
          ) : availableModels.length === 0 ? (
            <div className="text-center py-4 text-gray-400">
              No models found. Make sure {modelProvider} is properly configured.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {availableModels.map(model => (
                <button
                  key={model.id}
                  className={`p-3 rounded-lg text-left ${
                    selectedModel?.id === model.id 
                      ? 'bg-blue-600 border-blue-500 text-white' 
                      : 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300'
                  }`}
                  onClick={() => setSelectedModel(model)}
                >
                  <div className="font-medium">{model.name}</div>
                  <div className="text-xs opacity-75">{model.description || 'No description available'}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-white">AI Modules</h3>
          <p className="text-sm text-gray-400 mb-3">
            Select which AI modules to enable for the selected model
          </p>
          <div className="grid grid-cols-2 gap-3">
            {modules.map(module => (
              <div
                key={module.id}
                className={`p-3 rounded-lg cursor-pointer ${
                  activeModules.some(m => m.id === module.id) 
                    ? 'bg-green-600 border-green-500' 
                    : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                }`}
                onClick={() => toggleModule(module)}
              >
                <div className="flex items-center">
                  <div className="mr-2 text-blue-400">{module.icon}</div>
                  <div>
                    <div className="font-medium text-white">{module.name}</div>
                    <div className="text-xs text-gray-300">{module.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleModelSelect}
            disabled={!selectedModel || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
}