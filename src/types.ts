import { ReactNode } from 'react';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
}

export interface Automation {
  id: string;
  name: string;
  prompts: string[];
  infiniteLoop?: boolean;
}

export interface APIResponse {
  code?: string;
  response: string;
  codeChunks?: string[];
}

export interface CodeChunk {
  id: string;
  content: string;
  index: number;
  validated: boolean;
}

export interface ValidationScore {
  score: number;
  feedback?: string;
}

export interface APIConfig {
  apiUrl: string;
  apiKey: string;
}

export interface AIModel {
  id: string;
  name: string;
  description?: string;
  provider?: 'ollama' | 'lmstudio';
}

export interface AIModule {
  id: string;
  name: string;
  description: string;
  icon: ReactNode;
}

export interface VectorDBConfig {
  type: 'lancedb' | 'chroma';
  connectionString: string;
  apiKey?: string;
  collectionName: string;
  isLocal: boolean;
}