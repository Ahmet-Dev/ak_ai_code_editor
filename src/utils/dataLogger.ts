interface LogEntry {
  prompt: string;
  completion: {
    code: string | null;
    validated: boolean;
    validatePoint: number;
    debugged: boolean;
  };
  timestamp: number;
}

const STORAGE_KEY = 'ai_code_editor_logs';

export class DataLogger {
  private static instance: DataLogger;
  private data: LogEntry[] = [];

  private constructor() {
    this.loadData();
  }

  static getInstance(): DataLogger {
    if (!DataLogger.instance) {
      DataLogger.instance = new DataLogger();
    }
    return DataLogger.instance;
  }

  private loadData() {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        this.data = JSON.parse(storedData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      this.data = [];
    }
  }

  private saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  logInteraction(
    prompt: string,
    code: string | null,
    validated: boolean,
    validatePoint: number,
    debugged: boolean
  ) {
    const entry: LogEntry = {
      prompt,
      completion: {
        code,
        validated,
        validatePoint,
        debugged,
      },
      timestamp: Date.now(),
    };

    this.data.push(entry);
    this.saveData();
  }

  getData(): LogEntry[] {
    return this.data;
  }

  clearData() {
    this.data = [];
    localStorage.removeItem(STORAGE_KEY);
  }
}