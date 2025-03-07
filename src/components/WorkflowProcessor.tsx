import React, { useState, useEffect } from 'react';
import { processWorkflow } from '../api';
import { Brain, Code, MessageSquare, Bug, Loader, CheckCircle, AlertCircle } from 'lucide-react';

interface WorkflowProcessorProps {
  prompt: string;
  onComplete: (finalCode: string | null) => void;
  onCancel: () => void;
}

export function WorkflowProcessor({ prompt, onComplete, onCancel }: WorkflowProcessorProps) {
  const [status, setStatus] = useState<'idle' | 'chat' | 'think' | 'code' | 'debug' | 'complete' | 'error'>('idle');
  const [chatResponse, setChatResponse] = useState<string>('');
  const [thinkResponse, setThinkResponse] = useState<string>('');
  const [codeResponses, setCodeResponses] = useState<Array<{ response: string; code: string | null }>>([]);
  const [debugResponse, setDebugResponse] = useState<string>('');
  const [finalCode, setFinalCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [totalSteps, setTotalSteps] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<number>(0);

  useEffect(() => {
    if (prompt) {
      processWorkflowSteps();
    }
  }, [prompt]);

  const processWorkflowSteps = async () => {
    setStatus('chat');
    setError(null);
    
    await processWorkflow(
      prompt,
      {
        onChatResponse: (response) => {
          setChatResponse(response);
          setStatus('think');
        },
        onThinkResponse: (response, steps) => {
          setThinkResponse(response);
          setTotalSteps(steps);
          setStatus('code');
        },
        onCodeResponse: (response, code, step, total) => {
          setCodeResponses(prev => [...prev, { response, code }]);
          setCurrentStep(step);
          if (step === total) {
            setStatus('debug');
          }
        },
        onDebugResponse: (response, code) => {
          setDebugResponse(response);
          setFinalCode(code);
          setStatus('complete');
          onComplete(code);
        },
        onError: (errorMsg) => {
          setError(errorMsg);
          setStatus('error');
        }
      }
    );
  };

  const renderStepIcon = (stepStatus: string, currentStatus: string) => {
    if (currentStatus === stepStatus) {
      return <Loader className="w-5 h-5 animate-spin text-blue-500" />;
    } else if (
      (stepStatus === 'chat' && ['think', 'code', 'debug', 'complete'].includes(currentStatus)) ||
      (stepStatus === 'think' && ['code', 'debug', 'complete'].includes(currentStatus)) ||
      (stepStatus === 'code' && ['debug', 'complete'].includes(currentStatus)) ||
      (stepStatus === 'debug' && currentStatus === 'complete')
    ) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else {
      return <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[800px] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">AI Workflow Processor</h2>
          <button 
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center mb-4">
            <div className="flex-1 flex items-center">
              <div className="mr-3">
                {renderStepIcon('chat', status)}
              </div>
              <div className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-blue-500" />
                <span className="font-medium">Chat Analysis</span>
              </div>
            </div>
            <div className="flex-1 flex items-center">
              <div className="mr-3">
                {renderStepIcon('think', status)}
              </div>
              <div className="flex items-center">
                <Brain className="w-5 h-5 mr-2 text-purple-500" />
                <span className="font-medium">Think & Plan</span>
              </div>
            </div>
            <div className="flex-1 flex items-center">
              <div className="mr-3">
                {renderStepIcon('code', status)}
              </div>
              <div className="flex items-center">
                <Code className="w-5 h-5 mr-2 text-green-500" />
                <span className="font-medium">Code Generation</span>
              </div>
            </div>
            <div className="flex-1 flex items-center">
              <div className="mr-3">
                {renderStepIcon('debug', status)}
              </div>
              <div className="flex items-center">
                <Bug className="w-5 h-5 mr-2 text-orange-500" />
                <span className="font-medium">Debug & Optimize</span>
              </div>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
              style={{ 
                width: status === 'idle' ? '0%' : 
                       status === 'chat' ? '25%' : 
                       status === 'think' ? '50%' : 
                       status === 'code' ? `${50 + (currentStep / totalSteps) * 25}%` : 
                       status === 'debug' ? '90%' : '100%' 
              }}
            ></div>
          </div>
        </div>

        <div className="space-y-4">
          {status !== 'idle' && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center mb-2">
                <MessageSquare className="w-5 h-5 mr-2 text-blue-500" />
                <h3 className="font-semibold">Chat Analysis</h3>
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                {chatResponse || (status === 'chat' ? 'Processing...' : '')}
              </div>
            </div>
          )}

          {(status === 'think' || status === 'code' || status === 'debug' || status === 'complete' || status === 'error') && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Brain className="w-5 h-5 mr-2 text-purple-500" />
                <h3 className="font-semibold">Think & Plan</h3>
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                {thinkResponse || (status === 'think' ? 'Processing...' : '')}
              </div>
            </div>
          )}

          {(status === 'code' || status === 'debug' || status === 'complete' || status === 'error') && codeResponses.length > 0 && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Code className="w-5 h-5 mr-2 text-green-500" />
                <h3 className="font-semibold">Code Generation ({currentStep}/{totalSteps})</h3>
              </div>
              <div className="text-sm text-gray-700 max-h-40 overflow-y-auto">
                {codeResponses.map((response, index) => (
                  <div key={index} className="mb-2">
                    <div className="font-medium text-xs text-gray-500 mb-1">Step {index + 1}:</div>
                    <div className="whitespace-pre-wrap">{response.response}</div>
                  </div>
                ))}
                {status === 'code' && currentStep < totalSteps && <div>Processing step {currentStep + 1}...</div>}
              </div>
            </div>
          )}

          {(status === 'debug' || status === 'complete' || status === 'error') && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Bug className="w-5 h-5 mr-2 text-orange-500" />
                <h3 className="font-semibold">Debug & Optimize</h3>
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                {debugResponse || (status === 'debug' ? 'Processing...' : '')}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {status === 'complete' ? 'Close' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}