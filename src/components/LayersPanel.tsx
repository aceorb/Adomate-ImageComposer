'use client';

import { Layers, Eye, ChevronUp, ChevronDown, Copy, Trash2 } from 'lucide-react';
import { TextLayer } from '@/types';

interface LayersPanelProps {
  layers: TextLayer[];
  selectedLayer: TextLayer | null;
  onSelectLayer: (layer: TextLayer) => void;
  onReorderLayer: (layerId: string, direction: 'up' | 'down') => void;
  onDuplicateLayer: (layerId: string) => void;
  onDeleteLayer: (layerId: string) => void;
  onToggleLayerVisibility?: (layerId: string) => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  selectedLayer,
  onSelectLayer,
  onReorderLayer,
  onDuplicateLayer,
  onDeleteLayer,
  onToggleLayerVisibility
}) => {
  // Sort layers by zIndex (highest first for display)
  const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);

  const truncateText = (text: string, maxLength: number = 20) => {
    const singleLine = text.replace(/\n/g, ' ').trim();
    return singleLine.length > maxLength 
      ? singleLine.substring(0, maxLength) + '...'
      : singleLine || 'Empty text';
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-5 h-5" />
        <h2 className="text-lg font-semibold text-gray-900">Layers</h2>
        <span className="text-sm text-gray-500">({layers.length})</span>
      </div>

      {layers.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          No text layers yet. Add some text to get started.
        </p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {sortedLayers.map((layer, index) => (
            <div
              key={layer.id}
              className={`group flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-all ${
                selectedLayer?.id === layer.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => onSelectLayer(layer)}
            >
              {/* Layer visibility toggle */}
              {onToggleLayerVisibility && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLayerVisibility(layer.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}

              {/* Layer content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {truncateText(layer.text)}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">
                    {layer.fontSize}px
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {layer.fontFamily} • {layer.fontWeight}
                </div>
              </div>

              {/* Layer controls */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Move up/down */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReorderLayer(layer.id, 'up');
                  }}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  title="Move up"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReorderLayer(layer.id, 'down');
                  }}
                  disabled={index === sortedLayers.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  title="Move down"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>

                {/* Duplicate */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicateLayer(layer.id);
                  }}
                  className="p-1 text-gray-400 hover:text-blue-600"
                  title="Duplicate"
                >
                  <Copy className="w-3 h-3" />
                </button>

                {/* Delete */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteLayer(layer.id);
                  }}
                  className="p-1 text-gray-400 hover:text-red-600"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};