import { getStoredConfig } from './config/apiConfig';
import { getActiveModel, getModelEndpoint } from './utils/modelManager';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Function to preprocess the user prompt
function preprocessPrompt(prompt: string, moduleId?: string): string {
  const { model } = getActiveModel();
  
  let processedPrompt = prompt;
  
  if (model) {
    if (moduleId === 'chat') {
      processedPrompt = `As an AI assistant using ${model.name}, please analyze and respond to the following request: "${prompt}". 
                If this involves code generation, please provide a high-level approach.`;
    } else if (moduleId === 'think') {
      processedPrompt = `As an AI assistant using ${model.name}, please think step by step about this problem: "${prompt}". 
                Break down the task into logical phases, considering token limits. Explain your reasoning process.`;
    } else if (moduleId === 'code') {
      processedPrompt = `As an AI code assistant using ${model.name}, please generate code for the following request: "${prompt}". 
                Provide clean, well-documented code following SOLID principles and design patterns.`;
    } else if (moduleId === 'debug') {
      processedPrompt = `As an AI debugging assistant using ${model.name}, please analyze the following code for bugs, inefficiencies, and potential improvements: "${prompt}". 
                Maintain the existing system structure while suggesting improvements.`;
    } else {
      processedPrompt = `As an AI assistant using ${model.name}, please analyze and respond to the following request: "${prompt}". 
                If this involves code generation, please provide the solution in clear, well-documented chunks.`;
    }
  } else {
    processedPrompt = `As an AI assistant, please analyze and respond to the following request: "${prompt}". 
            If this involves code generation, please provide the solution in clear, well-documented chunks.`;
  }
  
  return processedPrompt;
}

// Function to split code into chunks of approximately 128 tokens
function splitIntoChunks(code: string): string[] {
  const averageCharsPerToken = 4;
  const chunkSize = 128 * averageCharsPerToken;
  const chunks: string[] = [];
  
  let currentChunk = '';
  
  code.split('\n').forEach(line => {
    if ((currentChunk + line).length > chunkSize && currentChunk) {
      chunks.push(currentChunk);
      currentChunk = '';
    }
    currentChunk += (currentChunk ? '\n' : '') + line;
  });
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

async function fetchWithRetry(url: string, options: RequestInit, retries = 3, backoff = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }
      
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await delay(backoff * Math.pow(2, i));
    }
  }
  throw new Error('All retry attempts failed');
}

export async function getTokenLimit(message: string) {
  const config = getStoredConfig();
  if (!config) {
    throw new Error('API configuration not found. Please configure the API first.');
  }

  try {
    const tokenInfoPrompt = `I need to complete the following task: "${message}". What is the token limit for this request and how many steps would you recommend to complete it? Please respond in JSON format with "tokenLimit" and "steps" fields.`;
    
    const { model } = getActiveModel();
    const apiUrl = model ? getModelEndpoint(model) : config.apiUrl;
    
    const response = await fetchWithRetry(
      apiUrl,
      {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: tokenInfoPrompt,
          mode: 'query',
          sessionId: 'code-editor-session',
        }),
      },
      3,
      1000
    );

    const text = await response.text();
    
    try {
      // Extract JSON from the response if it's embedded in text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : text;
      const tokenInfo = JSON.parse(jsonStr);
      
      if (tokenInfo.tokenLimit && tokenInfo.steps) {
        return {
          tokenLimit: tokenInfo.tokenLimit,
          steps: tokenInfo.steps
        };
      }
    } catch (e) {
      console.error('Failed to parse token info:', e);
    }
    
    // Default values if parsing fails
    return {
      tokenLimit: 4000,
      steps: 1
    };
  } catch (error) {
    console.error('Error getting token limit:', error);
    // Default values if request fails
    return {
      tokenLimit: 4000,
      steps: 1
    };
  }
}

export async function sendMessage(
  message: string, 
  validationScore?: number | null, 
  mode: 'query' | 'chat' | 'think' | 'code' | 'debug' = 'chat', 
  selectedCode?: string | null
) {
  const config = getStoredConfig();
  if (!config) {
    throw new Error('API configuration not found. Please configure the API first.');
  }

  try {
    let processedMessage = preprocessPrompt(message, mode);
    
    // If there's selected code and it's a debug request, include it in the message
    if (selectedCode && mode === 'debug') {
      processedMessage = `Please debug the following code:\n\n${selectedCode}\n\nAnalyze for issues, potential bugs, and suggest improvements while maintaining the existing system structure.`;
    }
    
    // If it's a think request, modify the prompt
    if (mode === 'think') {
      processedMessage = `I want you to think step by step about this problem: "${message}". 
                          Break down your thought process, consider different approaches, and explain your reasoning.
                          Also, break down the task into logical phases based on token limits.`;
    }
    
    const { model } = getActiveModel();
    const apiUrl = model ? getModelEndpoint(model) : config.apiUrl;
    
    const response = await fetchWithRetry(
      apiUrl,
      {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: processedMessage,
          mode,
          sessionId: 'code-editor-session',
          validationScore,
          model: model?.id,
        }),
      },
      3,
      1000
    );

    const text = await response.text();
    console.log('Raw API Response:', text);

    try {
      const data = JSON.parse(text);
      console.log('Parsed API Response:', data);
      
      if (data.type === 'textResponse' && data.textResponse) {
        const codeBlocks = data.textResponse.match(/```[\s\S]*?```/g);
        if (codeBlocks && codeBlocks.length > 0) {
          const code = codeBlocks[0].replace(/```(?:\w+)?\n([\s\S]*?)```/, '$1').trim();
          const codeChunks = splitIntoChunks(code);
          
          return {
            code,
            codeChunks,
            response: data.textResponse
          };
        }
        
        return {
          response: data.textResponse,
          code: null,
          codeChunks: []
        };
      }

      if (typeof data === 'string') {
        return { response: data, code: null, codeChunks: [] };
      }

      throw new Error('Unexpected response format');
    } catch (e) {
      if (text.trim()) {
        // Try to extract code blocks from raw text
        const codeBlocks = text.match(/```[\s\S]*?```/g);
        if (codeBlocks && codeBlocks.length > 0) {
          const code = codeBlocks[0].replace(/```(?:\w+)?\n([\s\S]*?)```/, '$1').trim();
          const codeChunks = splitIntoChunks(code);
          
          return {
            code,
            codeChunks,
            response: text
          };
        }
        
        return { response: text, code: null, codeChunks: [] };
      }
      throw new Error('Failed to parse API response');
    }
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to the API. Please check your internet connection and try again.');
    }
    console.error('API Error:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

// Function to process a multi-step workflow
export async function processWorkflow(
  initialPrompt: string,
  callbacks: {
    onChatResponse: (response: string) => void;
    onThinkResponse: (response: string, steps: number) => void;
    onCodeResponse: (response: string, code: string | null, step: number, totalSteps: number) => void;
    onDebugResponse: (response: string, code: string | null) => void;
    onError: (error: string) => void;
  }
) {
  try {
    // Step 1: Chat module - Get initial response
    const chatResponse = await sendMessage(initialPrompt, null, 'chat');
    callbacks.onChatResponse(chatResponse.response);
    
    // Step 2: Think module - Break down the task
    const thinkPrompt = `${initialPrompt}\n\nThink about this request and break it down into logical steps based on token limits.`;
    const thinkResponse = await sendMessage(thinkPrompt, null, 'think');
    
    // Try to extract the number of steps from the think response
    const stepsMatch = thinkResponse.response.match(/(\d+)\s+steps?/i);
    const numSteps = stepsMatch ? parseInt(stepsMatch[1]) : 3; // Default to 3 steps if not found
    
    callbacks.onThinkResponse(thinkResponse.response, numSteps);
    
    // Step 3: Code module - Generate code in steps
    let cumulativeCode = '';
    
    for (let step = 1; step <= numSteps; step++) {
      let codePrompt = '';
      
      if (step === 1) {
        codePrompt = `${initialPrompt}\n\nBased on the analysis: ${thinkResponse.response}\n\nImplement only the first phase of this request.`;
      } else {
        codePrompt = `${initialPrompt}\n\nBased on the analysis: ${thinkResponse.response}\n\nHere's what we have so far:\n\n${cumulativeCode}\n\nNow implement phase ${step} of the request.`;
      }
      
      const codeResponse = await sendMessage(codePrompt, null, 'code');
      
      if (codeResponse.code) {
        cumulativeCode += (cumulativeCode ? '\n\n' : '') + codeResponse.code;
      }
      
      callbacks.onCodeResponse(
        codeResponse.response, 
        codeResponse.code, 
        step, 
        numSteps
      );
    }
    
    // Step 4: Debug module - Debug the final code
    if (cumulativeCode) {
      const debugPrompt = `Debug this final code while maintaining the existing system structure:\n\n${cumulativeCode}`;
      const debugResponse = await sendMessage(debugPrompt, null, 'debug');
      
      callbacks.onDebugResponse(debugResponse.response, debugResponse.code || cumulativeCode);
    }
    
    return true;
  } catch (error) {
    callbacks.onError(error instanceof Error ? error.message : 'An unknown error occurred');
    return false;
  }
}