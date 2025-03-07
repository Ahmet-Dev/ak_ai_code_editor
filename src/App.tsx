import React, { useState, useCallback, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CodeEditor } from './components/CodeEditor';
import { MessageList } from './components/MessageList';
import { AutomationBuilder } from './components/AutomationBuilder';
import { WorkflowProcessor } from './components/WorkflowProcessor';
import { sendMessage, getTokenLimit } from './api';
import { getStoredConfig } from './config/apiConfig';
import { DataLogger } from './utils/dataLogger';
import { getActiveModel, formatPrompt, isModuleActive } from './utils/modelManager';
import { getActiveVectorDB, searchVectorDB } from './utils/vectorDBManager';
import type { Message, APIConfig, CodeChunk, AIModel, AIModule, VectorDBConfig } from './types';
import { Send, AlertCircle, MessageSquare, Workflow, Database, Infinity } from 'lucide-react';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [code, setCode] = useState('');
  const [editableCode, setEditableCode] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [codeChunks, setCodeChunks] = useState<CodeChunk[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentValidationScore, setCurrentValidationScore] = useState<number | null>(null);
  const [apiConfig, setApiConfig] = useState<APIConfig | null>(getStoredConfig());
  const [autoDebug, setAutoDebug] = useState(false);
  const [thinkingMode, setThinkingMode] = useState(false);
  const [aiStatus, setAiStatus] = useState<'idle' | 'working' | 'waiting' | 'error'>('idle');
  const [isValidated, setIsValidated] = useState(false);
  const [isDebugged, setIsDebugged] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'automation'>('chat');
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [completionSteps, setCompletionSteps] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isMultiStepComplete, setIsMultiStepComplete] = useState(false);
  const [originalCode, setOriginalCode] = useState('');
  const [activeModel, setActiveModel] = useState<AIModel | null>(getActiveModel().model);
  const [activeModules, setActiveModules] = useState<AIModule[]>(getActiveModel().modules);
  const [vectorDBConnected, setVectorDBConnected] = useState<boolean>(!!getActiveVectorDB());
  const [isInfiniteLoop, setIsInfiniteLoop] = useState<boolean>(false);
  const [automationQueue, setAutomationQueue] = useState<string[]>([]);
  const [showWorkflowProcessor, setShowWorkflowProcessor] = useState<boolean>(false);
  const [workflowPrompt, setWorkflowPrompt] = useState<string>('');

  const dataLogger = DataLogger.getInstance();

  // Function to ask for token limit and determine steps
  const askForTokenInfo = async (prompt: string): Promise<boolean> => {
    if (!apiConfig) {
      setError('Please configure the API first');
      setAiStatus('error');
      return false;
    }

    try {
      setIsProcessing(true);
      setAiStatus('working');
      
      const tokenInfo = await getTokenLimit(prompt);
      
      if (tokenInfo.steps > 1) {
        setCompletionSteps(tokenInfo.steps);
        setCurrentStep(0);
      } else {
        setCompletionSteps(null);
      }
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error getting token limit:', errorMessage);
      setError(errorMessage);
      setAiStatus('error');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  // Process a message and get a response
  const processMessage = async (
    content: string, 
    isStepCompletion: boolean = false,
    isFinalDebug: boolean = false,
    moduleId?: string
  ) => {
    if (!apiConfig) {
      setError('Please configure the API first');
      setAiStatus('error');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setAiStatus('working');

      // Only add user message for initial prompts, not for step completions
      if (!isStepCompletion || currentStep === 0) {
        const newMessage: Message = {
          id: Date.now().toString(),
          content,
          role: 'user',
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, newMessage]);
      }

      // For step completions, modify the prompt to continue from previous code
      let processedContent = content;
      if (isStepCompletion && currentStep > 0 && !isFinalDebug) {
        processedContent = `Continue implementing the solution for: "${content}". This is step ${currentStep + 1} of ${completionSteps}. Here's what we have so far:\n\n${code}\n\nPlease add the next part without repeating the existing code.`;
      } else if (isFinalDebug) {
        processedContent = `Debug this final code and explain any potential issues or improvements:\n\n${code}`;
        
        // Add a system message indicating we're debugging the final code
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            content: "Debugging the final completed code...",
            role: 'assistant',
            timestamp: Date.now(),
          },
        ]);
      }

      // Add system prompt if available
      if (systemPrompt) {
        processedContent = `${systemPrompt}\n\n${processedContent}`;
      }

      // Format prompt based on active module
      if (moduleId) {
        processedContent = formatPrompt(processedContent, moduleId);
      } else if (thinkingMode) {
        processedContent = formatPrompt(processedContent, 'think');
      }

      // Check if vector search is needed and active
      if (vectorDBConnected && isModuleActive('vector') && !isStepCompletion) {
        try {
          const searchResults = await searchVectorDB(processedContent);
          if (searchResults.length > 0) {
            const contextAddition = `\n\nHere are some relevant code examples that might help:\n\n${
              searchResults.map((result, i) => `Example ${i+1} (similarity: ${result.similarity}):\n${result.content}`).join('\n\n')
            }`;
            processedContent += contextAddition;
            
            // Notify user that vector search was used
            setMessages(prev => [
              ...prev,
              {
                id: Date.now().toString(),
                content: "Searching vector database for relevant code examples...",
                role: 'assistant',
                timestamp: Date.now(),
              },
            ]);
          }
        } catch (err) {
          console.error('Vector search error:', err);
          // Continue without vector search results
        }
      }

      // Determine the mode based on thinking mode or module
      let mode: 'query' | 'chat' | 'think' | 'code' | 'debug' = 'chat';
      if (thinkingMode) {
        mode = 'think';
      } else if (moduleId === 'debug') {
        mode = 'debug';
      } else if (moduleId === 'code') {
        mode = 'code';
      } else if (moduleId === 'think') {
        mode = 'think';
      }
      
      const response = await sendMessage(processedContent, currentValidationScore, mode, selectedCode);
      
      if (response.code && !isFinalDebug) {
        // For the first step, save the original code
        if (currentStep === 0 || !isStepCompletion) {
          setOriginalCode(response.code);
          setCode(response.code);
          setEditableCode(response.code);
        } else {
          // For subsequent steps, merge the new code with existing code
          // Only if auto-debug is off
          if (!autoDebug) {
            const mergedCode = mergeCode(code, response.code);
            setCode(mergedCode);
            setEditableCode(mergedCode);
          } else {
            setCode(response.code);
            setEditableCode(response.code);
          }
        }
        
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

          // Auto-debug if enabled and code was generated (but not for step completions)
          if (autoDebug && !isStepCompletion && isModuleActive('debug')) {
            setAiStatus('waiting');
            setIsDebugged(true);
            await processMessage('Debug this code and explain any potential issues or improvements.', true, false, 'debug');
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

      // If we're in a multi-step process, increment the step
      if (isStepCompletion && completionSteps && currentStep < completionSteps - 1) {
        setCurrentStep(prev => prev + 1);
      } 
      // If this was the last step, mark as complete
      else if (isStepCompletion && completionSteps && currentStep === completionSteps - 1) {
        setIsMultiStepComplete(true);
      }

      setAiStatus('idle');
      
      // Process next item in automation queue if in infinite loop
      if (isInfiniteLoop && automationQueue.length > 0) {
        const nextPrompt = automationQueue[0];
        setAutomationQueue(prev => prev.slice(1));
        
        // Add the prompt back to the end of the queue for infinite loop
        setAutomationQueue(prev => [...prev, nextPrompt]);
        
        // Process the next prompt after a short delay
        setTimeout(() => {
          processMessage(nextPrompt);
        }, 2000);
      }
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

  // Function to merge new code with existing code
  const mergeCode = (existingCode: string, newCode: string): string => {
    // Simple approach: if new code is completely different, use it
    if (newCode.trim() && !existingCode.includes(newCode.trim())) {
      return existingCode + '\n\n' + newCode;
    }
    
    // If new code is a subset or identical to existing code, keep existing
    return existingCode;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isProcessing) return;

    const userPrompt = inputMessage;
    setInputMessage('');

    // Reset validation and debug states for new prompts
    setIsValidated(false);
    setIsDebugged(false);
    setIsMultiStepComplete(false);
    
    // Check if we should use the advanced workflow
    if (isModuleActive('think') && isModuleActive('code') && isModuleActive('debug')) {
      setWorkflowPrompt(userPrompt);
      setShowWorkflowProcessor(true);
    } else {
      // First, ask for token info
      const tokenInfoSuccess = await askForTokenInfo(userPrompt);
      
      if (tokenInfoSuccess) {
        // Process the first step
        await processMessage(userPrompt);
        
        // If there are multiple steps, schedule them
        if (completionSteps && completionSteps > 1) {
          setCurrentStep(1); // Set to 1 because we've already done step 0
        }
      }
    }
  };

  // Effect to handle multi-step completions
  useEffect(() => {
    const handleNextStep = async () => {
      if (completionSteps && currentStep > 0 && currentStep < completionSteps && !isProcessing) {
        // Get the original user prompt
        const originalPrompt = messages.find(m => m.role === 'user')?.content || '';
        if (originalPrompt) {
          await processMessage(originalPrompt, true);
        }
      }
    };

    handleNextStep();
  }, [currentStep, completionSteps, isProcessing]);

  // Effect to handle final debugging when all steps are complete
  useEffect(() => {
    const handleFinalDebug = async () => {
      if (isMultiStepComplete && autoDebug && !isProcessing && code && isModuleActive('debug')) {
        setIsDebugged(true);
        await processMessage('Debug final code', false, true, 'debug');
      }
    };

    handleFinalDebug();
  }, [isMultiStepComplete, autoDebug, isProcessing, code]);

  const handleAutomation = async (prompts: string[], infiniteLoop: boolean = false) => {
    if (infiniteLoop) {
      setIsInfiniteLoop(true);
      setAutomationQueue(prompts);
      // Start with the first prompt
      if (prompts.length > 0) {
        await processMessage(prompts[0]);
      }
    } else {
      // Regular sequential execution
      for (const prompt of prompts) {
        await processMessage(prompt);
      }
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
    await processMessage('Debug this code and explain any potential issues or improvements.', false, false, 'debug');
  };

  const handleAutoDebugToggle = (enabled: boolean) => {
    setAutoDebug(enabled);
  };

  const handleThinkingModeToggle = (enabled: boolean) => {
    setThinkingMode(enabled);
  };

  const handleCodeSelection = (selectedText: string) => {
    setSelectedCode(selectedText);
  };

  const handleCodeEdit = (newCode: string) => {
    setEditableCode(newCode);
  };

  const handleCodeSubmit = async () => {
    setCode(editableCode);
    setIsEditing(false);
    
    // Process the edited code
    await processMessage(`Analyze this code and provide feedback:\n\n${editableCode}`);
  };

  const handleToggleEditing = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setEditableCode(code);
    }
  };

  const handleDownloadValidatedData = () => {
    const data = dataLogger.getData();
    const validatedData = data.filter(entry => entry.completion.validated);
    
    if (validatedData.length === 0) {
      setError('No validated data to download');
      return;
    }
    
    const jsonString = JSON.stringify(validatedData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'validated-code-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSystemPromptChange = (prompt: string) => {
    setSystemPrompt(prompt);
  };

  const handleModelSelect = (model: AIModel, modules: AIModule[]) => {
    setActiveModel(model);
    setActiveModules(modules);
  };

  const handleVectorDBConnect = (config: VectorDBConfig) => {
    setVectorDBConnected(true);
  };

  const handleWorkflowComplete = (finalCode: string | null) => {
    setShowWorkflowProcessor(false);
    if (finalCode) {
      setCode(finalCode);
      setEditableCode(finalCode);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Navbar 
        aiStatus={aiStatus} 
        onSystemPromptChange={handleSystemPromptChange}
        onModelSelect={handleModelSelect}
        onVectorDBConnect={handleVectorDBConnect}
      />
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-4">
          <CodeEditor 
            code={code}
            editableCode={editableCode}
            isEditing={isEditing}
            onCodeEdit={handleCodeEdit}
            onCodeSubmit={handleCodeSubmit}
            onToggleEditing={handleToggleEditing}
            onValidationSubmit={handleValidationSubmit}
            onConfigUpdate={handleConfigUpdate}
            onDebugRequest={handleDebugRequest}
            onDownloadValidatedData={handleDownloadValidatedData}
            autoDebug={autoDebug}
            thinkingMode={thinkingMode}
            onAutoDebugToggle={handleAutoDebugToggle}
            onThinkingModeToggle={handleThinkingModeToggle}
            onCodeSelection={handleCodeSelection}
          />
        </div>
        <div className="w-96 bg-white border-l flex flex-col">
          {/* Tab Navigation */}
          <div className="flex border-b">
            <button
              className={`flex-1 py-3 px-4 flex items-center justify-center ${
                activeTab === 'chat' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'
              }`}
              onClick={() => setActiveTab('chat')}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat
            </button>
            <button
              className={`flex-1 py-3 px-4 flex items-center justify-center ${
                activeTab === 'automation' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'
              }`}
              onClick={() => setActiveTab('automation')}
            >
              <Workflow className="w-4 h-4 mr-2" />
              Automation
            </button>
          </div>
          
          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'chat' ? (
              <MessageList messages={messages} />
            ) : (
              <AutomationBuilder onCreateAutomation={handleAutomation} />
            )}
          </div>
          
          {/* Error and Input */}
          <div className="p-4 border-t">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span>{error}</span>
              </div>
            )}
            
            {vectorDBConnected && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded mb-4 flex items-center">
                <Database className="w-4 h-4 mr-2" />
                <span className="text-sm">Vector database connected</span>
              </div>
            )}
            
            {isInfiniteLoop && (
              <div className="bg-purple-100 border border-purple-400 text-purple-700 px-4 py-2 rounded mb-4 flex items-center">
                <Infinity className="w-4 h-4 mr-2" />
                <span className="text-sm">Running in infinite loop mode</span>
                <button 
                  onClick={() => setIsInfiniteLoop(false)} 
                  className="ml-auto text-xs bg-purple-200 px-2 py-1 rounded hover:bg-purple-300"
                >
                  Stop
                </button>
              </div>
            )}
            
            {completionSteps && completionSteps > 1 && (
              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-1">
                  Completing in {completionSteps} steps (Step {currentStep + 1}/{completionSteps})
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${((currentStep + 1) / completionSteps) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
            
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
      
      {showWorkflowProcessor && (
        <WorkflowProcessor 
          prompt={workflowPrompt}
          onComplete={handleWorkflowComplete}
          onCancel={() => setShowWorkflowProcessor(false)}
        />
      )}
    </div>
  );
}

export default App;