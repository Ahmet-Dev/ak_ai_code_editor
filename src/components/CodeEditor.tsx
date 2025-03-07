import React, { useState, useRef, useEffect } from 'react';
import { ExternalLink, ThumbsUp, Settings, Bug, ToggleLeft, ToggleRight, Download, Edit, Save, Brain } from 'lucide-react';
import { APIConfigModal } from './APIConfigModal';
import { getStoredConfig, saveConfig } from '../config/apiConfig';
import type { APIConfig } from '../config/apiConfig';
import { saveAs } from 'file-saver';

interface CodeEditorProps {
  code: string;
  editableCode: string;
  isEditing: boolean;
  onCodeEdit: (code: string) => void;
  onCodeSubmit: () => void;
  onToggleEditing: () => void;
  onValidationSubmit: (score: number) => void;
  onConfigUpdate: (config: APIConfig) => void;
  onDebugRequest: () => void;
  onDownloadValidatedData: () => void;
  autoDebug?: boolean;
  thinkingMode?: boolean;
  onAutoDebugToggle: (enabled: boolean) => void;
  onThinkingModeToggle: (enabled: boolean) => void;
  onCodeSelection: (selectedText: string) => void;
}

export function CodeEditor({ 
  code, 
  editableCode,
  isEditing,
  onCodeEdit,
  onCodeSubmit,
  onToggleEditing,
  onValidationSubmit, 
  onConfigUpdate,
  onDebugRequest,
  onDownloadValidatedData,
  autoDebug = false,
  thinkingMode = false,
  onAutoDebugToggle,
  onThinkingModeToggle,
  onCodeSelection
}: CodeEditorProps) {
  const [validationScore, setValidationScore] = useState<number>(5);
  const [showConfig, setShowConfig] = useState(!getStoredConfig());
  const codeRef = useRef<HTMLPreElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleConfigSave = (config: APIConfig) => {
    saveConfig(config);
    onConfigUpdate(config);
    setShowConfig(false);
  };

  const handleImageClick = () => {
    window.open('https://ahmetkahraman.tech/', '_blank');
  };

  // Handle text selection in the code editor
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.toString() && codeRef.current?.contains(selection.anchorNode)) {
        onCodeSelection(selection.toString());
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [onCodeSelection]);

  // Adjust textarea height to match content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [editableCode, isEditing]);

  const handleDownloadCode = () => {
    if (!code) {
      return;
    }
    
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, 'ai-generated-code.txt');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 bg-gray-900 p-4 rounded-lg overflow-auto relative">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editableCode}
            onChange={(e) => onCodeEdit(e.target.value)}
            className="w-full h-full bg-gray-900 text-green-400 font-mono resize-none outline-none border-none"
            style={{ minHeight: '300px' }}
          />
        ) : (
          <pre ref={codeRef} className="text-green-400 font-mono whitespace-pre-wrap">
            {code || 'No code generated yet...'}
          </pre>
        )}
      </div>
      
      <div className="mt-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <img
            src="https://ahmetkahraman.tech/asset/uploads/66f1a68875eb8.webp"
            alt="Code Editor"
            className="w-8 h-8 rounded cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleImageClick}
          />
          <button
            onClick={() => setShowConfig(true)}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <Settings className="w-4 h-4 mr-1" />
            Configure API
          </button>
          <button
            onClick={onToggleEditing}
            className="flex items-center text-indigo-600 hover:text-indigo-800"
            title={isEditing ? "Save code" : "Edit code"}
          >
            {isEditing ? (
              <>
                <Save className="w-4 h-4 mr-1" />
                Save
              </>
            ) : (
              <>
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </>
            )}
          </button>
          {isEditing && (
            <button
              onClick={onCodeSubmit}
              className="flex items-center bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600"
            >
              Submit Code
            </button>
          )}
          <button
            onClick={handleDownloadCode}
            className="flex items-center text-gray-600 hover:text-gray-800"
            title="Download code"
            disabled={!code}
          >
            <Download className="w-4 h-4 mr-1" />
            Download Code
          </button>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onThinkingModeToggle(!thinkingMode)}
            className="flex items-center text-gray-700 hover:text-gray-900"
            title={thinkingMode ? "Thinking mode enabled" : "Thinking mode disabled"}
          >
            {thinkingMode ? (
              <Brain className="w-6 h-6 text-purple-500" />
            ) : (
              <Brain className="w-6 h-6 text-gray-400" />
            )}
          </button>
          <input
            type="number"
            min="0"
            max="10"
            value={validationScore}
            onChange={(e) => setValidationScore(Math.min(10, Math.max(0, parseInt(e.target.value) || 0)))}
            className="w-16 px-2 py-1 border rounded"
          />
          <button
            onClick={() => onValidationSubmit(validationScore)}
            className="flex items-center bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
          >
            <ThumbsUp className="w-4 h-4 mr-1" />
            Validate
          </button>
          <button
            onClick={onDownloadValidatedData}
            className="flex items-center bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
            title="Download validated data"
          >
            <Download className="w-4 h-4 mr-1" />
            Download
          </button>
          <button
            onClick={onDebugRequest}
            className="flex items-center bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600"
          >
            <Bug className="w-4 h-4 mr-1" />
            Debug
          </button>
          <button
            onClick={() => onAutoDebugToggle(!autoDebug)}
            className="flex items-center text-gray-700 hover:text-gray-900"
            title={autoDebug ? "Auto-debug enabled" : "Auto-debug disabled"}
          >
            {autoDebug ? (
              <ToggleRight className="w-6 h-6 text-purple-500" />
            ) : (
              <ToggleLeft className="w-6 h-6 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {showConfig && (
        <APIConfigModal
          onSave={handleConfigSave}
          onClose={() => setShowConfig(false)}
          currentConfig={getStoredConfig()}
        />
      )}
    </div>
  );
}