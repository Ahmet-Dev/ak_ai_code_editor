import React from 'react';
import { Brain } from 'lucide-react';

type AIStatus = 'idle' | 'working' | 'waiting' | 'error';

interface AIStatusIndicatorProps {
  status: AIStatus;
}

export function AIStatusIndicator({ status }: AIStatusIndicatorProps) {
  const getStatusConfig = (status: AIStatus) => {
    switch (status) {
      case 'working':
        return {
          color: 'text-blue-500',
          bgColor: 'bg-blue-100',
          text: 'AI Working',
          animate: true
        };
      case 'waiting':
        return {
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-100',
          text: 'AI Waiting',
          animate: false
        };
      case 'error':
        return {
          color: 'text-red-500',
          bgColor: 'bg-red-100',
          text: 'AI Error',
          animate: false
        };
      default:
        return {
          color: 'text-green-500',
          bgColor: 'bg-green-100',
          text: 'AI Ready',
          animate: false
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div className={`flex items-center px-3 py-1.5 rounded-full ${config.bgColor}`}>
      <Brain className={`w-4 h-4 ${config.color} ${config.animate ? 'animate-pulse' : ''} mr-2`} />
      <span className={`text-sm font-medium ${config.color}`}>{config.text}</span>
    </div>
  );
}