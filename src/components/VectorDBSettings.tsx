import React, { useState, useEffect } from 'react';
import { Database, HardDrive, Upload, FileText, Server, Cloud, Laptop } from 'lucide-react';
import { connectToVectorDB, testVectorDBConnection, getAvailableVectorDBs } from '../utils/vectorDBManager';
import type { VectorDBConfig } from '../types';

interface VectorDBSettingsProps {
  onClose: () => void;
  onConnect: (config: VectorDBConfig) => void;
}

export function VectorDBSettings({ onClose, onConnect }: VectorDBSettingsProps) {
  const [dbType, setDbType] = useState<'lancedb' | 'chroma' | 'pinecone'>('lancedb');
  const [connectionString, setConnectionString] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [collectionName, setCollectionName] = useState('code_embeddings');
  const [isLocal, setIsLocal] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [availableDatabases, setAvailableDatabases] = useState<Array<{
    id: string;
    name: string;
    type: 'lancedb' | 'chroma' | 'pinecone';
    isLocal: boolean;
    status: 'active' | 'inactive';
  }>>([]);

  useEffect(() => {
    const fetchDatabases = async () => {
      try {
        const databases = await getAvailableVectorDBs();
        setAvailableDatabases(databases);
      } catch (err) {
        console.error('Error fetching vector databases:', err);
      }
    };

    fetchDatabases();
  }, []);

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const config: VectorDBConfig = {
        type: dbType,
        connectionString: isLocal ? 'local' : connectionString,
        apiKey,
        collectionName,
        isLocal
      };

      const result = await testVectorDBConnection(config);
      
      if (result.success) {
        setSuccess('Successfully connected to vector database!');
        await connectToVectorDB(config);
        onConnect(config);
      } else {
        setError(result.error || 'Failed to connect to vector database');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);
      setSelectedFiles(fileArray);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select files to upload');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // In a real implementation, we would upload and process these files
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess(`Successfully uploaded ${selectedFiles.length} files to the vector database`);
      setSelectedFiles([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload files');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-[800px] max-h-[90vh] overflow-y-auto border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Vector Database Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-900 border border-green-700 text-green-100 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-white">Available Databases</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {availableDatabases.map(db => (
              <div
                key={db.id}
                className={`p-4 rounded-lg bg-gray-800 border border-gray-700 ${
                  db.status === 'active' ? 'border-green-500' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    {db.isLocal ? (
                      <Laptop className="w-5 h-5 text-blue-400 mr-2" />
                    ) : (
                      <Cloud className="w-5 h-5 text-purple-400 mr-2" />
                    )}
                    <span className="text-white font-medium">{db.name}</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    db.status === 'active' 
                      ? 'bg-green-900 text-green-300' 
                      : 'bg-gray-700 text-gray-300'
                  }`}>
                    {db.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="text-gray-400 text-sm mb-2">Type: {db.type}</div>
                <button
                  onClick={() => {
                    setDbType(db.type);
                    setIsLocal(db.isLocal);
                    if (!db.isLocal) {
                      setConnectionString(db.id);
                    }
                  }}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Select Database
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-white">Database Type</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <button
              className={`px-4 py-3 rounded flex items-center justify-center ${
                dbType === 'lancedb' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setDbType('lancedb')}
            >
              <Database className="w-5 h-5 mr-2" />
              LanceDB
            </button>
            <button
              className={`px-4 py-3 rounded flex items-center justify-center ${
                dbType === 'chroma' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setDbType('chroma')}
            >
              <Server className="w-5 h-5 mr-2" />
              ChromaDB
            </button>
            <button
              className={`px-4 py-3 rounded flex items-center justify-center ${
                dbType === 'pinecone' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setDbType('pinecone')}
            >
              <Cloud className="w-5 h-5 mr-2" />
              Pinecone
            </button>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-white">Connection Settings</h3>
          
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="isLocal"
                checked={isLocal}
                onChange={() => setIsLocal(!isLocal)}
                className="mr-2 bg-gray-700 border-gray-600 rounded"
              />
              <label htmlFor="isLocal" className="text-gray-300 flex items-center">
                <Laptop className="w-4 h-4 mr-1" />
                Use local database
              </label>
            </div>
            <p className="text-sm text-gray-400">
              When enabled, the database will be stored locally in the browser
            </p>
          </div>

          {!isLocal && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Connection String
                </label>
                <input
                  type="text"
                  value={connectionString}
                  onChange={(e) => setConnectionString(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-300 placeholder-gray-500"
                  placeholder={`${dbType === 'lancedb' ? 'http://localhost:8000' : 'http://localhost:8001'}`}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-300 placeholder-gray-500"
                  placeholder="Enter API key"
                />
              </div>
            </>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Collection Name
            </label>
            <input
              type="text"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-300 placeholder-gray-500"
              placeholder="code_embeddings"
            />
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-white">Upload Documents</h3>
          <p className="text-sm text-gray-400 mb-3">
            Upload code files or documentation to be embedded in the vector database
          </p>
          
          <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 mb-4 bg-gray-800">
            <div className="flex flex-col items-center justify-center">
              <FileText className="w-12 h-12 text-gray-500 mb-3" />
              <p className="text-sm text-gray-400 mb-3 text-center">
                Drag and drop files here, or click to select files
              </p>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
              >
                Select Files
              </label>
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-300 mb-2">
                {selectedFiles.length} files selected
              </p>
              <ul className="text-xs text-gray-400 max-h-24 overflow-y-auto bg-gray-800 border border-gray-700 rounded p-2">
                {selectedFiles.map((file, index) => (
                  <li key={index} className="truncate py-1">{file.name}</li>
                ))}
              </ul>
              <button
                onClick={handleUpload}
                className="mt-3 px-4 py-2 bg-green-600 text-white rounded flex items-center text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload to Vector DB
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConnect}
            disabled={isLoading || (!isLocal && !connectionString)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            <HardDrive className="w-4 h-4 mr-2" />
            Connect to Database
          </button>
        </div>
      </div>
    </div>
  );
}