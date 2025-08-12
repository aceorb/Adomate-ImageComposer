'use client';

import { Save, RotateCcw } from 'lucide-react';

interface AutosaveIndicatorProps {
  onReset: () => void;
  hasContent: boolean;
}

export const AutosaveIndicator: React.FC<AutosaveIndicatorProps> = ({
  onReset,
  hasContent
}) => {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Save className="w-5 h-5 text-green-600" />
          <span className="text-sm font-medium text-gray-900">Auto-save</span>
        </div>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Auto-saving enabled"></div>
      </div>
      
      <p className="text-xs text-gray-600 mb-3">
        Your design is automatically saved every 2 seconds and restored when you return.
      </p>
      
      {hasContent && (
        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Design
        </button>
      )}
    </div>
  );
};