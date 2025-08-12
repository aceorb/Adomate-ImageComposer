'use client';

import { Type, AlignLeft, AlignCenter, AlignRight, Loader2 } from 'lucide-react';
import { TextLayer } from '@/types';
import { useGoogleFonts } from '@/hooks/useGoogleFonts';

interface TextToolsPanelProps {
  selectedLayer: TextLayer | null;
  onAddTextLayer: () => void;
  onUpdateTextLayer: (id: string, updates: Partial<TextLayer>) => void;
}

export const TextToolsPanel: React.FC<TextToolsPanelProps> = ({
  selectedLayer,
  onAddTextLayer,
  onUpdateTextLayer
}) => {
  const { fonts, loading: fontsLoading, loadFont } = useGoogleFonts();

  const basicFonts = [
    'Arial',
    'Helvetica', 
    'Georgia',
    'Times New Roman',
    'Courier New',
    'Verdana',
    'Trebuchet MS',
    'Impact',
  ];


  const fontWeights = [
    { value: 'normal', label: 'Normal' },
    { value: 'bold', label: 'Bold' },
    { value: '300', label: 'Light' },
    { value: '600', label: 'Semi Bold' },
  ];

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (selectedLayer) {
      onUpdateTextLayer(selectedLayer.id, { text: value });
    }
  };

  const handlePropertyChange = (property: keyof TextLayer, value: string | number) => {
    if (selectedLayer) {
      // If changing font family and it's a Google Font, load it
      if (property === 'fontFamily' && typeof value === 'string' && !basicFonts.includes(value)) {
        loadFont(value, selectedLayer.fontWeight);
      }
      onUpdateTextLayer(selectedLayer.id, { [property]: value });
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Type className="w-5 h-5" />
          Text Tools
        </h2>
        <button 
          onClick={onAddTextLayer}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <Type className="w-4 h-4" />
          Add Text Layer
        </button>
      </div>

      {selectedLayer && (
        <>
          {/* Text Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Text Content
            </label>
            <textarea
              value={selectedLayer.text}
              onChange={handleTextChange}
              placeholder="Enter your text..."
              className="w-full p-2 border border-gray-300 rounded-md resize-none"
              rows={3}
            />
          </div>

          {/* Font Family */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              Font Family
              {fontsLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            </label>
            <select
              value={selectedLayer.fontFamily}
              onChange={(e) => handlePropertyChange('fontFamily', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              disabled={fontsLoading}
            >
              <optgroup label="System Fonts">
                {basicFonts.map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </optgroup>
              {!fontsLoading && fonts.length > 0 && (
                <optgroup label="Google Fonts">
                  {fonts.slice(0, 50).map(font => (
                    <option key={font.family} value={font.family} style={{ fontFamily: font.family }}>
                      {font.family}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Font Size: {selectedLayer.fontSize}px
            </label>
            <input
              type="range"
              min="12"
              max="120"
              value={selectedLayer.fontSize}
              onChange={(e) => handlePropertyChange('fontSize', parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Font Weight */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Font Weight
            </label>
            <select
              value={selectedLayer.fontWeight}
              onChange={(e) => handlePropertyChange('fontWeight', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              {fontWeights.map(weight => (
                <option key={weight.value} value={weight.value}>{weight.label}</option>
              ))}
            </select>
          </div>

          {/* Text Alignment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Text Alignment
            </label>
            <div className="flex gap-1">
              {[
                { value: 'left', icon: AlignLeft },
                { value: 'center', icon: AlignCenter },
                { value: 'right', icon: AlignRight },
              ].map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => handlePropertyChange('alignment', value)}
                  className={`p-2 rounded-md flex-1 flex items-center justify-center transition-colors ${
                    selectedLayer.alignment === value
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Text Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={selectedLayer.color}
                onChange={(e) => handlePropertyChange('color', e.target.value)}
                className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={selectedLayer.color}
                onChange={(e) => handlePropertyChange('color', e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-md text-sm font-mono"
                placeholder="#000000"
              />
            </div>
          </div>

          {/* Opacity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opacity: {Math.round(selectedLayer.opacity * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={selectedLayer.opacity}
              onChange={(e) => handlePropertyChange('opacity', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </>
      )}
    </div>
  );
};