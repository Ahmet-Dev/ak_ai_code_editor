import { useState, useEffect } from 'react';
import { secureStorage } from '../utils/security';

export interface APIConfig {
  apiUrl: string;
  apiKey: string;
}

const CONFIG_KEY = 'ai_code_editor_config';

export function getStoredConfig(): APIConfig | null {
  const stored = secureStorage.getItem(CONFIG_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function saveConfig(config: APIConfig): void {
  secureStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export function clearConfig(): void {
  secureStorage.removeItem(CONFIG_KEY);
}