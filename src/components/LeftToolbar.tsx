'use client';

import { TextLayer } from '@/types';
import { ImageUpload } from '@/components/ImageUpload';
import { TextToolsPanel } from '@/components/TextToolsPanel';
import { LayersPanel } from '@/components/LayersPanel';
import { HistoryPanel } from '@/components/HistoryPanel';
import { AutosaveIndicator } from '@/components/AutosaveIndicator';
import { ExportPanel } from '@/components/ExportPanel';

interface LeftToolbarProps {
  // Image upload props
  onImageUpload: (imageUrl: string, width: number, height: number) => void;
  
  // Text tools props
  selectedLayer: TextLayer | null;
  onAddTextLayer: () => void;
  onUpdateTextLayer: (id: string, updates: Partial<TextLayer>) => void;
  
  // Layers panel props
  layers: TextLayer[];
  onSelectLayer: (layer: TextLayer) => void;
  onReorderLayer: (layerId: string, direction: 'up' | 'down') => void;
  onDuplicateLayer: (layerId: string) => void;
  onDeleteLayer: (layerId: string) => void;
  
  // History panel props
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  historyLength: number;
  
  // Autosave props
  onReset: () => void;
  hasContent: boolean;
  
  // Export props
  onExport: () => Promise<void>;
  canExport: boolean;
  
  // State props
  backgroundImage: string | null;
}

export const LeftToolbar: React.FC<LeftToolbarProps> = ({
  onImageUpload,
  selectedLayer,
  onAddTextLayer,
  onUpdateTextLayer,
  layers,
  onSelectLayer,
  onReorderLayer,
  onDuplicateLayer,
  onDeleteLayer,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  historyLength,
  onReset,
  hasContent,
  onExport,
  canExport,
  backgroundImage,
}) => {
  return (
    <div className="h-full flex flex-col">
      {/* Fixed header */}
      <div className="flex-shrink-0 bg-white rounded-lg p-4 shadow-sm mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Image</h2>
        <ImageUpload 
          onImageUpload={onImageUpload} 
          disabled={false}
        />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {backgroundImage && (
          <>
            <TextToolsPanel
              selectedLayer={selectedLayer}
              onAddTextLayer={onAddTextLayer}
              onUpdateTextLayer={onUpdateTextLayer}
            />
            
            <LayersPanel
              layers={layers}
              selectedLayer={selectedLayer}
              onSelectLayer={onSelectLayer}
              onReorderLayer={onReorderLayer}
              onDuplicateLayer={onDuplicateLayer}
              onDeleteLayer={onDeleteLayer}
            />
            
            <HistoryPanel
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={onUndo}
              onRedo={onRedo}
              historyLength={historyLength}
            />
            
            <AutosaveIndicator
              onReset={onReset}
              hasContent={hasContent}
            />
            
            <ExportPanel
              onExport={onExport}
              canExport={canExport}
            />
          </>
        )}
        
        {/* Bottom padding for better scrolling */}
        <div className="h-8" />
      </div>
    </div>
  );
};