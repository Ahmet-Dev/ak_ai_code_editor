import React from 'react';
import type { Message } from '../types';

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  // Function to process message content to remove code blocks
  const processMessageContent = (content: string): string => {
    // Remove code blocks (content between triple backticks)
    return content.replace(/```[\s\S]*?```/g, '[Code has been moved to the code panel]');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No messages yet. Start by typing a prompt below.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`p-3 mb-2 rounded-lg ${
                message.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'
              }`}
            >
              <div className="text-xs text-gray-500 mb-1">
                {message.role === 'user' ? 'You' : 'AI Assistant'}
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">
                {message.role === 'assistant' 
                  ? processMessageContent(message.content) 
                  : message.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}