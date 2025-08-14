'use client';

import { useState } from 'react';

import { Type, AlignLeft, AlignCenter, AlignRight, Loader2, ChevronDown, ChevronRight, Zap } from 'lucide-react';
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
  const [showAdvanced, setShowAdvanced] = useState(false);

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

  const handlePropertyChange = (property: keyof TextLayer, value: string | number | TextLayer['shadow']) => {
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
              placeholder="Enter your text...\nPress Enter for new line"
              className="w-full p-2 border border-gray-300 rounded-md resize-none font-mono"
              rows={4}
            />
            <p className="text-xs text-gray-500 mt-1">
              Use Enter for line breaks. Text will wrap automatically on canvas.
            </p>
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

          {/* Line Height */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Line Height: {selectedLayer.lineHeight.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.8"
              max="2.5"
              step="0.1"
              value={selectedLayer.lineHeight}
              onChange={(e) => handlePropertyChange('lineHeight', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Advanced Features Toggle */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between py-2 px-3 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Advanced Features</span>
              </div>
              {showAdvanced ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>

          {/* Advanced Features Content */}
          {showAdvanced && (
            <>
              {/* Letter Spacing */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Letter Spacing: {(selectedLayer.letterSpacing || 0).toFixed(1)}px
                </label>
                <input
                  type="range"
                  min="-5"
                  max="20"
                  step="0.5"
                  value={selectedLayer.letterSpacing || 0}
                  onChange={(e) => handlePropertyChange('letterSpacing', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Text Shadow */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Text Shadow
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!selectedLayer.shadow}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handlePropertyChange('shadow', {
                            color: '#000000',
                            blur: 4,
                            offsetX: 2,
                            offsetY: 2,
                          });
                        } else {
                          handlePropertyChange('shadow', undefined);
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-600">Enable shadow</span>
                  </div>
                  
                  {selectedLayer.shadow && (
                    <div className="pl-6 space-y-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Shadow Color</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={selectedLayer.shadow.color}
                            onChange={(e) => handlePropertyChange('shadow', { 
                              color: e.target.value,
                              blur: selectedLayer.shadow!.blur,
                              offsetX: selectedLayer.shadow!.offsetX,
                              offsetY: selectedLayer.shadow!.offsetY
                            })}
                            className="w-8 h-6 border border-gray-300 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={selectedLayer.shadow.color}
                            onChange={(e) => handlePropertyChange('shadow', { 
                              color: e.target.value,
                              blur: selectedLayer.shadow!.blur,
                              offsetX: selectedLayer.shadow!.offsetX,
                              offsetY: selectedLayer.shadow!.offsetY
                            })}
                            className="flex-1 text-xs p-1 border border-gray-300 rounded font-mono"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Blur: {selectedLayer.shadow.blur}px
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          value={selectedLayer.shadow.blur}
                          onChange={(e) => handlePropertyChange('shadow', { 
                            color: selectedLayer.shadow!.color,
                            blur: parseInt(e.target.value),
                            offsetX: selectedLayer.shadow!.offsetX,
                            offsetY: selectedLayer.shadow!.offsetY
                          })}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">
                            X: {selectedLayer.shadow.offsetX}px
                          </label>
                          <input
                            type="range"
                            min="-20"
                            max="20"
                            value={selectedLayer.shadow.offsetX}
                            onChange={(e) => handlePropertyChange('shadow', { 
                              color: selectedLayer.shadow!.color,
                              blur: selectedLayer.shadow!.blur,
                              offsetX: parseInt(e.target.value),
                              offsetY: selectedLayer.shadow!.offsetY
                            })}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">
                            Y: {selectedLayer.shadow.offsetY}px
                          </label>
                          <input
                            type="range"
                            min="-20"
                            max="20"
                            value={selectedLayer.shadow.offsetY}
                            onChange={(e) => handlePropertyChange('shadow', { 
                              color: selectedLayer.shadow!.color,
                              blur: selectedLayer.shadow!.blur,
                              offsetX: selectedLayer.shadow!.offsetX,
                              offsetY: parseInt(e.target.value)
                            })}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};