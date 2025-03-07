import type { VectorDBConfig } from '../types';

// In-memory storage for vector DB configuration
let activeVectorDB: VectorDBConfig | null = null;

// Function to get available vector databases
export async function getAvailableVectorDBs() {
  try {
    // Check for local databases
    const localDatabases = [
      {
        id: 'local-lancedb',
        name: 'Local LanceDB',
        type: 'lancedb' as const,
        isLocal: true,
        status: 'active' as const
      },
      {
        id: 'local-chroma',
        name: 'Local ChromaDB',
        type: 'chroma' as const,
        isLocal: true,
        status: 'inactive' as const
      }
    ];

    // Check for remote databases (simulated)
    const remoteDatabases = [
      {
        id: 'pinecone-prod',
        name: 'Pinecone Production',
        type: 'pinecone' as const,
        isLocal: false,
        status: 'active' as const
      },
      {
        id: 'chroma-cloud',
        name: 'ChromaDB Cloud',
        type: 'chroma' as const,
        isLocal: false,
        status: 'active' as const
      }
    ];

    // Try to detect running local instances
    try {
      const lanceResponse = await fetch('http://localhost:8000/health');
      if (lanceResponse.ok) {
        localDatabases[0].status = 'active';
      }
    } catch {}

    try {
      const chromaResponse = await fetch('http://localhost:8001/api/v1/heartbeat');
      if (chromaResponse.ok) {
        localDatabases[1].status = 'active';
      }
    } catch {}

    return [...localDatabases, ...remoteDatabases];
  } catch (error) {
    console.error('Error fetching vector databases:', error);
    return [];
  }
}

// Function to test connection to vector database
export async function testVectorDBConnection(config: VectorDBConfig): Promise<{ success: boolean; error?: string }> {
  try {
    if (config.isLocal) {
      // For local databases, check if the service is running
      const port = config.type === 'lancedb' ? '8000' : '8001';
      const response = await fetch(`http://localhost:${port}/health`);
      return { success: response.ok };
    }

    // For remote databases, validate connection string and API key
    if (!config.connectionString) {
      return { success: false, error: 'Connection string is required for remote databases' };
    }

    if (!config.apiKey && config.type === 'pinecone') {
      return { success: false, error: 'API key is required for Pinecone' };
    }

    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { success: true };
  } catch (error) {
    console.error('Error testing vector DB connection:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Function to connect to vector database
export async function connectToVectorDB(config: VectorDBConfig): Promise<void> {
  try {
    // Store the configuration
    activeVectorDB = config;
    localStorage.setItem('ai_code_editor_vector_db', JSON.stringify(config));
    
    console.log(`Connected to ${config.type} vector database`);
    return Promise.resolve();
  } catch (error) {
    console.error('Error connecting to vector DB:', error);
    throw new Error('Failed to connect to vector database');
  }
}

// Function to get the active vector database configuration
export function getActiveVectorDB(): VectorDBConfig | null {
  if (!activeVectorDB) {
    const storedConfig = localStorage.getItem('ai_code_editor_vector_db');
    if (storedConfig) {
      activeVectorDB = JSON.parse(storedConfig);
    }
  }
  return activeVectorDB;
}

// Function to disconnect from vector database
export function disconnectVectorDB(): void {
  activeVectorDB = null;
  localStorage.removeItem('ai_code_editor_vector_db');
  console.log('Disconnected from vector database');
}

// Function to search the vector database
export async function searchVectorDB(query: string, limit: number = 5): Promise<any[]> {
  if (!activeVectorDB) {
    throw new Error('No active vector database connection');
  }
  
  try {
    // Simulate vector search with different response times based on database type
    const delay = activeVectorDB.isLocal ? 200 : 500;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return [
      { content: 'Example code snippet 1', similarity: 0.92 },
      { content: 'Example code snippet 2', similarity: 0.85 },
      { content: 'Example code snippet 3', similarity: 0.78 },
      { content: 'Example documentation 1', similarity: 0.72 },
      { content: 'Example documentation 2', similarity: 0.65 }
    ];
  } catch (error) {
    console.error('Error searching vector DB:', error);
    throw new Error('Failed to search vector database');
  }
}

// Function to add documents to the vector database
export async function addToVectorDB(documents: any[]): Promise<void> {
  if (!activeVectorDB) {
    throw new Error('No active vector database connection');
  }
  
  try {
    // Simulate adding documents with different processing times based on database type
    const delay = activeVectorDB.isLocal ? 500 : 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    console.log(`Added ${documents.length} documents to vector database`);
    return Promise.resolve();
  } catch (error) {
    console.error('Error adding to vector DB:', error);
    throw new Error('Failed to add documents to vector database');
  }
}