import type { AIModel, AIModule } from '../types';

// In-memory storage for active model and modules
let activeModel: AIModel | null = null;
let activeModules: AIModule[] = [];

// Function to get available models from Ollama
async function fetchOllamaModels(): Promise<AIModel[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('http://localhost:11434/api/list', {
      signal: controller.signal,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      throw new Error(`Failed to fetch Ollama models: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (data && Array.isArray(data.models)) {
      return data.models.map((model: any) => ({
        id: model.name,
        name: model.name,
        description: `${model.digest ? 'Custom model' : 'Base model'}`,
        provider: 'ollama'
      }));
    }
    
    throw new Error('Invalid response format from Ollama API');
  } catch (error) {
    console.warn('Falling back to default Ollama models:', error);
    return [
      { id: 'codellama', name: 'CodeLlama', description: 'Specialized for code generation', provider: 'ollama' },
      { id: 'llama2', name: 'Llama 2', description: 'General purpose model', provider: 'ollama' },
      { id: 'mistral', name: 'Mistral', description: 'Mistral 7B model', provider: 'ollama' },
      { id: 'neural-chat', name: 'Neural Chat', description: 'Optimized for dialogue', provider: 'ollama' },
      { id: 'starling-lm', name: 'Starling', description: 'Starling LM model', provider: 'ollama' }
    ];
  }
}

// Function to get available models from LM Studio
async function fetchLMStudioModels(): Promise<AIModel[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('http://localhost:1234/v1/models', {
      signal: controller.signal,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      throw new Error(`Failed to fetch LM Studio models: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (data && Array.isArray(data.data)) {
      return data.data.map((model: any) => ({
        id: model.id,
        name: model.name || model.id,
        description: model.description || 'LM Studio model',
        provider: 'lmstudio'
      }));
    }
    
    throw new Error('Invalid response format from LM Studio API');
  } catch (error) {
    console.warn('Falling back to default LM Studio models:', error);
    return [
      { id: 'wizardcoder', name: 'WizardCoder', description: 'Specialized for code generation', provider: 'lmstudio' },
      { id: 'openchat', name: 'OpenChat', description: 'Conversational model', provider: 'lmstudio' },
      { id: 'deepseek', name: 'DeepSeek', description: 'DeepSeek Coder model', provider: 'lmstudio' },
      { id: 'solar', name: 'Solar', description: 'Upstage Solar model', provider: 'lmstudio' }
    ];
  }
}

// Function to get available models from OpenAI
async function fetchOpenAIModels(): Promise<AIModel[]> {
  try {
    const apiKey = localStorage.getItem('openai_api_key');
    if (!apiKey) {
      throw new Error('OpenAI API key not found');
    }

    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch OpenAI models: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data
      .filter((model: any) => model.id.includes('gpt'))
      .map((model: any) => ({
        id: model.id,
        name: model.id,
        description: 'OpenAI GPT model',
        provider: 'openai'
      }));
  } catch (error) {
    console.warn('Falling back to default OpenAI models:', error);
    return [
      { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo', description: 'Most capable GPT-4 model', provider: 'openai' },
      { id: 'gpt-4', name: 'GPT-4', description: 'Most capable GPT-4 model', provider: 'openai' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Most capable GPT-3.5 model', provider: 'openai' }
    ];
  }
}

// Function to get available models from Anthropic (Claude)
async function fetchClaudeModels(): Promise<AIModel[]> {
  try {
    const apiKey = localStorage.getItem('claude_api_key');
    if (!apiKey) {
      throw new Error('Claude API key not found');
    }

    const response = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Claude models: ${response.statusText}`);
    }

    const data = await response.json();
    return data.models.map((model: any) => ({
      id: model.id,
      name: model.name || model.id,
      description: model.description || 'Anthropic Claude model',
      provider: 'claude'
    }));
  } catch (error) {
    console.warn('Falling back to default Claude models:', error);
    return [
      { id: 'claude-3-opus', name: 'Claude 3 Opus', description: 'Most capable Claude model', provider: 'claude' },
      { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', description: 'Balanced performance and speed', provider: 'claude' },
      { id: 'claude-3-haiku', name: 'Claude 3 Haiku', description: 'Fast and efficient', provider: 'claude' }
    ];
  }
}

// Function to get available models from the selected provider
export async function getAvailableModels(provider: 'ollama' | 'lmstudio' | 'openai' | 'claude'): Promise<AIModel[]> {
  try {
    switch (provider) {
      case 'ollama':
        return await fetchOllamaModels();
      case 'lmstudio':
        return await fetchLMStudioModels();
      case 'openai':
        return await fetchOpenAIModels();
      case 'claude':
        return await fetchClaudeModels();
      default:
        throw new Error('Invalid provider');
    }
  } catch (error) {
    console.error('Error fetching models:', error);
    throw new Error('Failed to fetch available models');
  }
}

// Function to set the active model and modules
export async function setActiveModel(model: AIModel, modules: AIModule[]): Promise<void> {
  try {
    activeModel = model;
    activeModules = modules;
    
    localStorage.setItem('ai_code_editor_active_model', JSON.stringify(model));
    localStorage.setItem('ai_code_editor_active_modules', JSON.stringify(modules));
    
    console.log(`Activated model: ${model.name} with modules:`, modules.map(m => m.name).join(', '));
    return Promise.resolve();
  } catch (error) {
    console.error('Error setting active model:', error);
    throw new Error('Failed to set active model');
  }
}

// Function to get the active model
export function getActiveModel(): { model: AIModel | null, modules: AIModule[] } {
  if (!activeModel) {
    try {
      const storedModel = localStorage.getItem('ai_code_editor_active_model');
      const storedModules = localStorage.getItem('ai_code_editor_active_modules');
      
      if (storedModel) {
        activeModel = JSON.parse(storedModel);
      }
      
      if (storedModules) {
        activeModules = JSON.parse(storedModules);
      }
    } catch (error) {
      console.error('Error loading stored model:', error);
      activeModel = null;
      activeModules = [];
    }
  }
  
  return { model: activeModel, modules: activeModules };
}

// Function to check if a specific module is active
export function isModuleActive(moduleId: string): boolean {
  return activeModules.some(module => module.id === moduleId);
}

// Function to get the API endpoint for a specific model
export function getModelEndpoint(model: AIModel): string {
  switch (model.provider) {
    case 'lmstudio':
      return 'http://localhost:1234/v1/chat/completions';
    case 'ollama':
      return 'http://localhost:11434/api/chat';
    case 'openai':
      return 'https://api.openai.com/v1/chat/completions';
    case 'claude':
      return 'https://api.anthropic.com/v1/messages';
    default:
      throw new Error('Invalid model provider');
  }
}

// Function to format a prompt based on active modules and system prompt
export function formatPrompt(prompt: string, moduleId?: string): string {
  const { model } = getActiveModel();
  const systemPrompt = localStorage.getItem('ai_code_editor_system_prompt');
  
  let formattedPrompt = prompt;
  
  // Add system prompt if available
  if (systemPrompt) {
    formattedPrompt = `${systemPrompt}\n\n${formattedPrompt}`;
  }
  
  if (!model) {
    return formattedPrompt;
  }
  
  // Add module-specific instructions
  if (moduleId === 'debug') {
    formattedPrompt = `As a code debugging assistant, analyze the following code for bugs, inefficiencies, and potential improvements. Maintain the existing system structure and architecture while suggesting improvements:\n\n${formattedPrompt}`;
  } else if (moduleId === 'think') {
    formattedPrompt = `Think step by step about this problem. Break down the request into logical phases based on token limits. Each phase should use approximately 75% of the available tokens. Explain your reasoning process for each phase and how they connect. If vector search or embeddings are available, use them to enhance your analysis:\n\n${formattedPrompt}`;
  } else if (moduleId === 'code') {
    formattedPrompt = `Generate clean, efficient, and well-documented code for the following request. Follow SOLID principles and design patterns. Ensure the code is production-ready. This is step ${getCurrentStep()} of the implementation:\n\n${formattedPrompt}`;
  } else if (moduleId === 'chat') {
    formattedPrompt = `As a helpful assistant, respond to the following request with clear explanations. If the user asks about coding, explain the approach you would take:\n\n${formattedPrompt}`;
  }
  
  return formattedPrompt;
}

// Function to get current step number
function getCurrentStep(): number {
  try {
    const step = localStorage.getItem('ai_code_editor_current_step');
    return step ? parseInt(step, 10) : 1;
  } catch {
    return 1;
  }
}

// Function to estimate token count for a message
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

// Function to break down a task into multiple steps based on token limits
export function breakIntoSteps(task: string, maxTokensPerStep: number = 2000): string[] {
  const estimatedTokens = estimateTokenCount(task);
  const targetTokensPerStep = Math.floor(maxTokensPerStep * 0.75); // Use 75% of max tokens
  
  if (estimatedTokens <= targetTokensPerStep) {
    return [task];
  }
  
  const numSteps = Math.ceil(estimatedTokens / targetTokensPerStep);
  
  return Array(numSteps).fill(0).map((_, i) => 
    `Step ${i + 1}/${numSteps}: ${task.substring(0, 100)}... (continued)`
  );
}