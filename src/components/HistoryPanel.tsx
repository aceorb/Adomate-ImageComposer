'use client';

import { Undo2, Redo2, History } from 'lucide-react';

interface HistoryPanelProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  historyLength: number;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  historyLength
}) => {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-5 h-5" />
        <h2 className="text-lg font-semibold text-gray-900">History</h2>
        <span className="text-sm text-gray-500">({historyLength} states)</span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-colors ${
            canUndo
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-gray-50 text-gray-400 cursor-not-allowed'
          }`}
          title={`Undo${canUndo ? ' (Ctrl+Z)' : ''}`}
        >
          <Undo2 className="w-4 h-4" />
          <span className="text-sm font-medium">Undo</span>
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-colors ${
            canRedo
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-gray-50 text-gray-400 cursor-not-allowed'
          }`}
          title={`Redo${canRedo ? ' (Ctrl+Y)' : ''}`}
        >
          <Redo2 className="w-4 h-4" />
          <span className="text-sm font-medium">Redo</span>
        </button>
      </div>

      <div className="mt-3 text-xs text-gray-500 text-center">
        Keyboard: Ctrl+Z (Undo) • Ctrl+Y (Redo)
      </div>
    </div>
  );
};