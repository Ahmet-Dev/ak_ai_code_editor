import React, { useState, useEffect } from 'react';
import type { Automation } from '../types';
import { PlusCircle, Trash2, Play, Edit, Save, X, Infinity } from 'lucide-react';
import { saveAutomation, getAutomations, deleteAutomation } from '../utils/automationManager';

interface AutomationBuilderProps {
  onCreateAutomation: (prompts: string[], infiniteLoop?: boolean) => void;
}

export function AutomationBuilder({ onCreateAutomation }: AutomationBuilderProps) {
  const [prompts, setPrompts] = useState<string[]>(['']);
  const [savedAutomations, setSavedAutomations] = useState<Automation[]>([]);
  const [automationName, setAutomationName] = useState<string>('');
  const [editingAutomation, setEditingAutomation] = useState<string | null>(null);
  const [editedPrompts, setEditedPrompts] = useState<string[]>([]);
  const [editedName, setEditedName] = useState<string>('');
  const [infiniteLoop, setInfiniteLoop] = useState<boolean>(false);
  const [editedInfiniteLoop, setEditedInfiniteLoop] = useState<boolean>(false);

  // Load saved automations on component mount
  useEffect(() => {
    setSavedAutomations(getAutomations());
  }, []);

  const addPrompt = () => {
    setPrompts([...prompts, '']);
  };

  const removePrompt = (index: number) => {
    setPrompts(prompts.filter((_, i) => i !== index));
  };

  const updatePrompt = (index: number, value: string) => {
    const newPrompts = [...prompts];
    newPrompts[index] = value;
    setPrompts(newPrompts);
  };

  const handleSubmit = () => {
    const filteredPrompts = prompts.filter(prompt => prompt.trim() !== '');
    if (filteredPrompts.length > 0) {
      onCreateAutomation(filteredPrompts, infiniteLoop);
      
      // Save automation if it has a name
      if (automationName.trim()) {
        const newAutomation: Automation = {
          id: Date.now().toString(),
          name: automationName,
          prompts: filteredPrompts,
          infiniteLoop
        };
        saveAutomation(newAutomation);
        setSavedAutomations(getAutomations());
        setAutomationName('');
        setInfiniteLoop(false);
      }
      
      setPrompts(['']);
    }
  };

  const runSavedAutomation = (automation: Automation) => {
    onCreateAutomation(automation.prompts, automation.infiniteLoop);
  };

  const startEditingAutomation = (automation: Automation) => {
    setEditingAutomation(automation.id);
    setEditedName(automation.name);
    setEditedPrompts([...automation.prompts]);
    setEditedInfiniteLoop(automation.infiniteLoop || false);
  };

  const cancelEditing = () => {
    setEditingAutomation(null);
  };

  const saveEditedAutomation = () => {
    if (editingAutomation) {
      const filteredPrompts = editedPrompts.filter(prompt => prompt.trim() !== '');
      if (filteredPrompts.length > 0 && editedName.trim()) {
        const updatedAutomation: Automation = {
          id: editingAutomation,
          name: editedName,
          prompts: filteredPrompts,
          infiniteLoop: editedInfiniteLoop
        };
        saveAutomation(updatedAutomation);
        setSavedAutomations(getAutomations());
        setEditingAutomation(null);
      }
    }
  };

  const handleDeleteAutomation = (id: string) => {
    deleteAutomation(id);
    setSavedAutomations(getAutomations());
  };

  const addEditedPrompt = () => {
    setEditedPrompts([...editedPrompts, '']);
  };

  const removeEditedPrompt = (index: number) => {
    setEditedPrompts(editedPrompts.filter((_, i) => i !== index));
  };

  const updateEditedPrompt = (index: number, value: string) => {
    const newPrompts = [...editedPrompts];
    newPrompts[index] = value;
    setEditedPrompts(newPrompts);
  };

  return (
    <div className="bg-white rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Create Automation</h3>
      
      <div className="mb-4">
        <input
          type="text"
          value={automationName}
          onChange={(e) => setAutomationName(e.target.value)}
          className="w-full border rounded p-2 mb-2"
          placeholder="Automation Name (optional)"
        />
      </div>
      
      {prompts.map((prompt, index) => (
        <div key={index} className="flex gap-2 mb-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => updatePrompt(index, e.target.value)}
            className="flex-1 border rounded p-2"
            placeholder={`Step ${index + 1}`}
          />
          {prompts.length > 1 && (
            <button
              onClick={() => removePrompt(index)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      ))}
      
      <div className="flex items-center mb-4 mt-2">
        <input
          type="checkbox"
          id="infiniteLoop"
          checked={infiniteLoop}
          onChange={() => setInfiniteLoop(!infiniteLoop)}
          className="mr-2"
        />
        <label htmlFor="infiniteLoop" className="flex items-center text-sm">
          <Infinity className="w-4 h-4 mr-1 text-purple-500" />
          Run in infinite loop
        </label>
      </div>
      
      <div className="flex gap-2 mt-4">
        <button
          onClick={addPrompt}
          className="flex items-center gap-2 text-blue-500 hover:text-blue-700"
        >
          <PlusCircle className="w-5 h-5" />
          Add Step
        </button>
        <button
          onClick={handleSubmit}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create Automation
        </button>
      </div>
      
      {savedAutomations.length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-semibold mb-2">Saved Automations</h4>
          <div className="space-y-2">
            {savedAutomations.map(automation => (
              <div key={automation.id} className="border rounded p-3">
                {editingAutomation === automation.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="w-full border rounded p-2"
                      placeholder="Automation Name"
                    />
                    
                    {editedPrompts.map((prompt, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={prompt}
                          onChange={(e) => updateEditedPrompt(index, e.target.value)}
                          className="flex-1 border rounded p-2"
                          placeholder={`Step ${index + 1}`}
                        />
                        <button
                          onClick={() => removeEditedPrompt(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    
                    <div className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id="editedInfiniteLoop"
                        checked={editedInfiniteLoop}
                        onChange={() => setEditedInfiniteLoop(!editedInfiniteLoop)}
                        className="mr-2"
                      />
                      <label htmlFor="editedInfiniteLoop" className="flex items-center text-sm">
                        <Infinity className="w-4 h-4 mr-1 text-purple-500" />
                        Run in infinite loop
                      </label>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={addEditedPrompt}
                        className="flex items-center gap-1 text-blue-500 hover:text-blue-700"
                      >
                        <PlusCircle className="w-4 h-4" />
                        Add Step
                      </button>
                    </div>
                    
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={cancelEditing}
                        className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                      <button
                        onClick={saveEditedAutomation}
                        className="flex items-center gap-1 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium flex items-center">
                          {automation.name}
                          {automation.infiniteLoop && (
                            <Infinity className="w-4 h-4 ml-1 text-purple-500" title="Infinite loop enabled" />
                          )}
                        </div>
                        <div className="text-xs text-gray-500">{automation.prompts.length} steps</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditingAutomation(automation)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAutomation(automation.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => runSavedAutomation(automation)}
                          className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}