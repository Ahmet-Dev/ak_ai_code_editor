const PROMPTS_KEY = 'ai_code_editor_prompts';
const SYSTEM_PROMPT_KEY = 'ai_code_editor_system_prompt';

// Default system prompts
const DEFAULT_PROMPTS: Record<string, string> = {
  default: "You are an AI assistant specialized in helping with coding tasks. Provide clear, concise, and helpful responses. Follow SOLID principles and design patterns. Consider performance, security, and maintainability in your solutions.",
  javascript: "You are a JavaScript expert. Provide modern, efficient JavaScript code with ES6+ features. Include explanations for complex parts.",
  python: "You are a Python expert. Provide Pythonic code following PEP 8 guidelines. Focus on readability and best practices.",
  react: "You are a React expert. Provide functional components with hooks. Follow React best practices and patterns.",
  debugging: "You are a debugging expert. Analyze code carefully, identify issues, and suggest fixes with explanations."
};

export function getSystemPrompts(): Record<string, string> {
  try {
    const storedPrompts = localStorage.getItem(PROMPTS_KEY);
    if (storedPrompts) {
      return { ...DEFAULT_PROMPTS, ...JSON.parse(storedPrompts) };
    }
    return DEFAULT_PROMPTS;
  } catch (error) {
    console.error('Error loading system prompts:', error);
    return DEFAULT_PROMPTS;
  }
}

export function saveSystemPrompt(name: string, prompt: string): void {
  try {
    const existingPrompts = getSystemPrompts();
    const customPrompts = { ...existingPrompts, [name]: prompt };
    
    // Save to localStorage
    localStorage.setItem(PROMPTS_KEY, JSON.stringify(customPrompts));
    
    // Also save as current system prompt
    localStorage.setItem(SYSTEM_PROMPT_KEY, prompt);
  } catch (error) {
    console.error('Error saving system prompt:', error);
  }
}

export function getCurrentSystemPrompt(): string {
  try {
    return localStorage.getItem(SYSTEM_PROMPT_KEY) || DEFAULT_PROMPTS.default;
  } catch {
    return DEFAULT_PROMPTS.default;
  }
}

export function deleteSystemPrompt(name: string): void {
  try {
    if (DEFAULT_PROMPTS[name]) {
      return;
    }
    
    const storedPrompts = localStorage.getItem(PROMPTS_KEY);
    if (storedPrompts) {
      const prompts = JSON.parse(storedPrompts);
      delete prompts[name];
      localStorage.setItem(PROMPTS_KEY, JSON.stringify(prompts));
    }
  } catch (error) {
    console.error('Error deleting system prompt:', error);
  }
}