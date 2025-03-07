import type { Automation } from '../types';

const AUTOMATIONS_KEY = 'ai_code_editor_automations';

// Get all saved automations
export function getAutomations(): Automation[] {
  try {
    const stored = localStorage.getItem(AUTOMATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading automations:', error);
    return [];
  }
}

// Save a new or update an existing automation
export function saveAutomation(automation: Automation): void {
  try {
    const automations = getAutomations();
    const existingIndex = automations.findIndex(a => a.id === automation.id);
    
    if (existingIndex >= 0) {
      automations[existingIndex] = automation;
    } else {
      automations.push(automation);
    }
    
    localStorage.setItem(AUTOMATIONS_KEY, JSON.stringify(automations));
  } catch (error) {
    console.error('Error saving automation:', error);
  }
}

// Delete an automation by ID
export function deleteAutomation(id: string): void {
  try {
    const automations = getAutomations();
    const filteredAutomations = automations.filter(a => a.id !== id);
    localStorage.setItem(AUTOMATIONS_KEY, JSON.stringify(filteredAutomations));
  } catch (error) {
    console.error('Error deleting automation:', error);
  }
}

// Export automations to JSON
export function exportAutomations(): string {
  try {
    const automations = getAutomations();
    return JSON.stringify(automations, null, 2);
  } catch (error) {
    console.error('Error exporting automations:', error);
    return '[]';
  }
}

// Import automations from JSON
export function importAutomations(jsonData: string): boolean {
  try {
    const automations = JSON.parse(jsonData);
    if (Array.isArray(automations)) {
      localStorage.setItem(AUTOMATIONS_KEY, JSON.stringify(automations));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error importing automations:', error);
    return false;
  }
}