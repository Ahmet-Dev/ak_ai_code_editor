import React, { useState, useCallback, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CodeEditor } from './components/CodeEditor';
import { MessageList } from './components/MessageList';
import { AutomationBuilder } from './components/AutomationBuilder';
import { sendMessage } from './api';
import { getStoredConfig } from './config/apiConfig';
import { DataLogger } from './utils/dataLogger';
import type { Message, Automation, CodeChunk } from './types';
import type { APIConfig } from './config/apiConfig';
import { Send, AlertCircle } from 'lucide-react';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [code, setCode] = useState('');
  const [codeChunks, setCodeChunks] = useState<CodeChunk[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentValidationScore, setCurrentValidationScore] = useState<number | null>(null);
  const [apiConfig, setApiConfig] = useState<APIConfig | null>(getStoredConfig());
  const [autoDebug, setAutoDebug] = useState(false);
  const [aiStatus, setAiStatus] = useState<'idle' | 'working' | 'waiting' | 'error'>('idle');
  const [isValidated, setIsValidated] = useState(false);
  const [isDebugged, setIsDebugged] = useState(false);

  const dataLogger = DataLogger.getInstance();

  const processMessage = async (content: string) => {
    if (!apiConfig) {
      setError('Please configure the API first');
      setAiStatus('error');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setAiStatus('working');

      const newMessage: Message = {
        id: Date.now().toString(),
        content,
        role: 'user',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, newMessage]);

      const response = await sendMessage(content, currentValidationScore);
      
      if (response.code) {
        setCode(response.code);
        
        if (response.codeChunks) {
          const chunks: CodeChunk[] = response.codeChunks.map((chunk, index) => ({
            id: `chunk-${index}`,
            content: chunk,
            index,
            validated: false
          }));
          setCodeChunks(chunks);

          // Log the interaction
          dataLogger.logInteraction(
            content,
            response.code,
            isValidated,
            currentValidationScore || 0,
            isDebugged
          );

          // Auto-debug if enabled and code was generated
          if (autoDebug) {
            setAiStatus('waiting');
            setIsDebugged(true);
            await processMessage('Debug this code and explain any potential issues or improvements.');
          }
        }
      }

      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          content: response.response,
          role: 'assistant',
          timestamp: Date.now(),
        },
      ]);
      setAiStatus('idle');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error processing message:', errorMessage);
      setError(errorMessage);
      setAiStatus('error');
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          content: `Error: ${errorMessage}`,
          role: 'assistant',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isProcessing) return;

    // Reset validation and debug states for new prompts
    setIsValidated(false);
    setIsDebugged(false);
    
    await processMessage(inputMessage);
    setInputMessage('');
  };

  const handleAutomation = async (prompts: string[]) => {
    for (const prompt of prompts) {
      await processMessage(prompt);
    }
  };

  const handleValidationSubmit = (score: number) => {
    setCurrentValidationScore(score);
    setIsValidated(true);
    
    // Update the last log entry with the new validation score
    if (code) {
      dataLogger.logInteraction(
        messages[messages.length - 2]?.content || '', // Get the last user prompt
        code,
        true,
        score,
        isDebugged
      );
    }
  };

  const handleConfigUpdate = (config: APIConfig) => {
    setApiConfig(config);
    setError(null);
    setAiStatus('idle');
  };

  const handleDebugRequest = async () => {
    setIsDebugged(true);
    await processMessage('Debug this code and explain any potential issues or improvements.');
  };

  const handleAutoDebugToggle = (enabled: boolean) => {
    setAutoDebug(enabled);
  };

  return (
    <div className="flex flex-col h-screen">
      <Navbar aiStatus={aiStatus} />
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-4">
          <CodeEditor 
            code={code}
            onValidationSubmit={handleValidationSubmit}
            onConfigUpdate={handleConfigUpdate}
            onDebugRequest={handleDebugRequest}
            autoDebug={autoDebug}
            onAutoDebugToggle={handleAutoDebugToggle}
          />
        </div>
        <div className="w-96 bg-white border-l flex flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            <MessageList messages={messages} />
          </div>
          <div className="p-4 border-t">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span>{error}</span>
              </div>
            )}
            <AutomationBuilder onCreateAutomation={handleAutomation} />
            <form onSubmit={handleSubmit} className="mt-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your prompt..."
                  className="flex-1 border rounded p-2"
                  disabled={isProcessing || !apiConfig}
                />
                <button
                  type="submit"
                  disabled={isProcessing || !apiConfig}
                  className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;