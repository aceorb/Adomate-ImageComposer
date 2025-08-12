'use client';

import { useState, useEffect } from 'react';
import { fabric } from 'fabric';
import { ImageUpload } from '@/components/ImageUpload';
import { CanvasEditor } from '@/components/CanvasEditor';
import { TextToolsPanel } from '@/components/TextToolsPanel';
import { LayersPanel } from '@/components/LayersPanel';
import { HistoryPanel } from '@/components/HistoryPanel';
import { AutosaveIndicator } from '@/components/AutosaveIndicator';
import { ExportPanel } from '@/components/ExportPanel';
import { TextLayer, CanvasState } from '@/types';
import { useCanvasHistory } from '@/hooks/useCanvasHistory';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export default function Home() {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600 });
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<TextLayer | null>(null);
  
  // History management
  const initialState: CanvasState = {
    backgroundImage: null,
    textLayers: [],
    canvasWidth: canvasDimensions.width,
    canvasHeight: canvasDimensions.height,
  };
  
  const {
    currentState,
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    historyLength,
  } = useCanvasHistory(initialState);
  
  // Autosave to localStorage
  const [savedState, setSavedState, removeSavedState] = useLocalStorage<CanvasState | null>('adomate-design', null);
  
  // Auto-save current state every 2 seconds when there are changes
  useEffect(() => {
    if (backgroundImage || textLayers.length > 0) {
      const currentState: CanvasState = {
        backgroundImage,
        textLayers,
        canvasWidth: canvasDimensions.width,
        canvasHeight: canvasDimensions.height,
      };
      
      const timeoutId = setTimeout(() => {
        setSavedState(currentState);
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [backgroundImage, textLayers, canvasDimensions, setSavedState]);
  
  // Load saved state on mount
  useEffect(() => {
    if (savedState && savedState.backgroundImage) {
      setBackgroundImage(savedState.backgroundImage);
      setCanvasDimensions({
        width: savedState.canvasWidth,
        height: savedState.canvasHeight,
      });
      setTextLayers(savedState.textLayers);
    }
  }, []);
  
  const handleResetDesign = () => {
    if (confirm('Are you sure you want to reset the design? This will clear everything and cannot be undone.')) {
      // Clear canvas
      if (fabricCanvas) {
        fabricCanvas.clear();
        fabricCanvas.requestRenderAll();
      }
      
      // Reset state
      setBackgroundImage(null);
      setTextLayers([]);
      setSelectedLayer(null);
      setCanvasDimensions({ width: 800, height: 600 });
      
      // Clear localStorage
      removeSavedState();
    }
  };
  
  const handleExport = async (): Promise<void> => {
    if (!fabricCanvas || !backgroundImage) {
      throw new Error('No canvas or background image available');
    }
    
    try {
      // Get original image dimensions
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = backgroundImage;
      });
      
      const originalWidth = img.width;
      const originalHeight = img.height;
      
      // Create a temporary canvas with original dimensions
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCanvas.width = originalWidth;
      tempCanvas.height = originalHeight;
      
      // Draw background image at full size
      tempCtx.drawImage(img, 0, 0, originalWidth, originalHeight);
      
      // Calculate scale factor from display canvas to original size
      const scaleX = originalWidth / canvasDimensions.width;
      const scaleY = originalHeight / canvasDimensions.height;
      
      // Render each text layer at original scale
      for (const layer of textLayers) {
        tempCtx.save();
        
        // Set font properties
        tempCtx.font = `${layer.fontWeight} ${layer.fontSize * scaleX}px ${layer.fontFamily}`;
        tempCtx.fillStyle = layer.color;
        tempCtx.globalAlpha = layer.opacity;
        tempCtx.textAlign = layer.alignment as CanvasTextAlign;
        tempCtx.textBaseline = 'top';
        
        // Calculate position at original scale
        const scaledX = layer.x * scaleX;
        const scaledY = layer.y * scaleY;
        
        // Apply transformations
        tempCtx.translate(scaledX, scaledY);
        if (layer.rotation) {
          tempCtx.rotate((layer.rotation * Math.PI) / 180);
        }
        if (layer.scaleX !== 1 || layer.scaleY !== 1) {
          tempCtx.scale(layer.scaleX, layer.scaleY);
        }
        
        // Draw text with line breaks
        const lines = layer.text.split('\n');
        const lineHeight = layer.fontSize * layer.lineHeight * scaleX;
        
        lines.forEach((line, index) => {
          tempCtx.fillText(line, 0, index * lineHeight);
        });
        
        tempCtx.restore();
      }
      
      // Convert to blob and download
      const blob = await new Promise<Blob>((resolve) => {
        tempCanvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/png', 1.0);
      });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `adomate-design-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Clean up
      tempCanvas.remove();
    } catch (error) {
      console.error('Export error:', error);
      throw new Error('Failed to export image');
    }
  };
  
  // Restore state when history changes (undo/redo)
  useEffect(() => {
    if (currentState && fabricCanvas) {
      // Update background image if different
      if (currentState.backgroundImage !== backgroundImage) {
        setBackgroundImage(currentState.backgroundImage);
      }
      
      // Clear current canvas objects
      fabricCanvas.clear();
      
      // Re-add background image if exists
      if (currentState.backgroundImage) {
        fabric.Image.fromURL(currentState.backgroundImage, (img) => {
          if (!fabricCanvas) return;
          
          const scaleX = currentState.canvasWidth / img.width!;
          const scaleY = currentState.canvasHeight / img.height!;
          const scale = Math.min(scaleX, scaleY);
          
          img.scale(scale);
          img.set({
            left: (currentState.canvasWidth - img.getScaledWidth()) / 2,
            top: (currentState.canvasHeight - img.getScaledHeight()) / 2,
            selectable: false,
            evented: false,
            hoverCursor: 'default',
            moveCursor: 'default',
          });
          
          fabricCanvas.setBackgroundImage(img, fabricCanvas.renderAll.bind(fabricCanvas));
        });
      }
      
      // Recreate text layers
      currentState.textLayers.forEach(layer => {
        const fabricText = new fabric.Textbox(layer.text, {
          left: layer.x,
          top: layer.y,
          fontSize: layer.fontSize,
          fontFamily: layer.fontFamily,
          fontWeight: layer.fontWeight,
          fill: layer.color,
          opacity: layer.opacity,
          textAlign: layer.alignment,
          width: 200,
          splitByGrapheme: false,
          editable: true,
          editingBorderColor: '#2563eb',
          cursorColor: '#2563eb',
          cursorWidth: 2,
          lineHeight: layer.lineHeight,
          hasControls: true,
          hasBorders: true,
          cornerSize: 12,
          cornerColor: '#2563eb',
          cornerStyle: 'circle',
          borderColor: '#2563eb',
          borderDashArray: [5, 5],
          transparentCorners: false,
          rotatingPointOffset: 20,
        });
        
        (fabricText as any).id = layer.id;
        fabricCanvas.add(fabricText);
      });
      
      fabricCanvas.requestRenderAll();
      
      // Update local state
      setTextLayers(currentState.textLayers);
      setCanvasDimensions({ 
        width: currentState.canvasWidth, 
        height: currentState.canvasHeight 
      });
      
      // Clear selection
      setSelectedLayer(null);
    }
  }, [currentState, fabricCanvas]);

  const handleImageUpload = (imageUrl: string, width: number, height: number) => {
    setBackgroundImage(imageUrl);
    
    // Calculate canvas dimensions to maintain aspect ratio
    const maxWidth = 800;
    const maxHeight = 600;
    const aspectRatio = width / height;
    
    let canvasWidth = maxWidth;
    let canvasHeight = maxWidth / aspectRatio;
    
    if (canvasHeight > maxHeight) {
      canvasHeight = maxHeight;
      canvasWidth = maxHeight * aspectRatio;
    }
    
    setCanvasDimensions({ width: Math.round(canvasWidth), height: Math.round(canvasHeight) });
  };

  const handleCanvasReady = (canvas: fabric.Canvas) => {
    setFabricCanvas(canvas);
    
    // Handle object selection
    canvas.on('selection:created', (e) => {
      const activeObject = e.selected?.[0];
      if (activeObject && activeObject.type === 'textbox') {
        const layer = textLayers.find(l => l.id === (activeObject as any).id);
        if (layer) setSelectedLayer(layer);
      }
    });
    
    canvas.on('selection:updated', (e) => {
      const activeObject = e.selected?.[0];
      if (activeObject && activeObject.type === 'textbox') {
        const layer = textLayers.find(l => l.id === (activeObject as any).id);
        if (layer) setSelectedLayer(layer);
      }
    });
    
    canvas.on('selection:cleared', () => {
      setSelectedLayer(null);
    });
    
    // Handle object modifications (drag, resize, rotate)
    canvas.on('object:modified', (e) => {
      const activeObject = e.target;
      if (activeObject && activeObject.type === 'textbox') {
        const layerId = (activeObject as any).id;
        const layer = textLayers.find(l => l.id === layerId);
        if (layer) {
          const updates = {
            x: activeObject.left || 0,
            y: activeObject.top || 0,
            rotation: activeObject.angle || 0,
            scaleX: activeObject.scaleX || 1,
            scaleY: activeObject.scaleY || 1,
          };
          setTextLayers(prev => 
            prev.map(l => l.id === layerId ? { ...l, ...updates } : l)
          );
          if (selectedLayer?.id === layerId) {
            setSelectedLayer(prev => prev ? { ...prev, ...updates } : null);
          }
        }
      }
    });
    
    // Keyboard controls for nudging and history
    const handleKeyDown = (e: KeyboardEvent) => {
      // History shortcuts
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
          return;
        }
        if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          redo();
          return;
        }
      }
      
      // Nudging controls
      if (!canvas.getActiveObject()) return;
      
      const activeObject = canvas.getActiveObject();
      const step = e.shiftKey ? 10 : 1;
      
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          activeObject?.set('top', (activeObject.top || 0) - step);
          break;
        case 'ArrowDown':
          e.preventDefault();
          activeObject?.set('top', (activeObject.top || 0) + step);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          activeObject?.set('left', (activeObject.left || 0) - step);
          break;
        case 'ArrowRight':
          e.preventDefault();
          activeObject?.set('left', (activeObject.left || 0) + step);
          break;
      }
      
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        canvas.requestRenderAll();
        canvas.fire('object:modified', { target: activeObject });
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  };
  
  const handleAddTextLayer = () => {
    if (!fabricCanvas) return;
    
    const newLayer: TextLayer = {
      id: `text-${Date.now()}`,
      text: 'New Text',
      x: canvasDimensions.width / 2,
      y: canvasDimensions.height / 2,
      fontSize: 32,
      fontFamily: 'Arial',
      fontWeight: 'normal',
      color: '#000000',
      opacity: 1,
      alignment: 'left',
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      zIndex: textLayers.length,
      lineHeight: 1.2
    };
    
    const fabricText = new fabric.Textbox(newLayer.text, {
      left: newLayer.x,
      top: newLayer.y,
      fontSize: newLayer.fontSize,
      fontFamily: newLayer.fontFamily,
      fontWeight: newLayer.fontWeight,
      fill: newLayer.color,
      opacity: newLayer.opacity,
      textAlign: newLayer.alignment,
      width: 200,
      splitByGrapheme: false,
      // Multi-line text support
      editable: true,
      editingBorderColor: '#2563eb',
      cursorColor: '#2563eb',
      cursorWidth: 2,
      lineHeight: newLayer.lineHeight,
      // Transform controls
      hasControls: true,
      hasBorders: true,
      cornerSize: 12,
      cornerColor: '#2563eb',
      cornerStyle: 'circle',
      borderColor: '#2563eb',
      borderDashArray: [5, 5],
      transparentCorners: false,
      rotatingPointOffset: 20,
    });
    
    (fabricText as any).id = newLayer.id;
    fabricCanvas.add(fabricText);
    fabricCanvas.setActiveObject(fabricText);
    fabricCanvas.renderAll();
    
    setTextLayers(prev => [...prev, newLayer]);
    setSelectedLayer(newLayer);
    
    // Add to history
    const newState: CanvasState = {
      backgroundImage,
      textLayers: [...textLayers, newLayer],
      canvasWidth: canvasDimensions.width,
      canvasHeight: canvasDimensions.height,
    };
    addToHistory(newState);
  };
  
  const handleUpdateTextLayer = (id: string, updates: Partial<TextLayer>) => {
    setTextLayers(prev => 
      prev.map(layer => 
        layer.id === id ? { ...layer, ...updates } : layer
      )
    );
    
    // Update fabric object
    if (fabricCanvas) {
      const fabricObject = fabricCanvas.getObjects().find(obj => (obj as any).id === id) as fabric.Textbox;
      if (fabricObject) {
        if (updates.text !== undefined) fabricObject.set('text', updates.text);
        if (updates.fontSize !== undefined) fabricObject.set('fontSize', updates.fontSize);
        if (updates.fontFamily !== undefined) fabricObject.set('fontFamily', updates.fontFamily);
        if (updates.fontWeight !== undefined) fabricObject.set('fontWeight', updates.fontWeight);
        if (updates.color !== undefined) fabricObject.set('fill', updates.color);
        if (updates.opacity !== undefined) fabricObject.set('opacity', updates.opacity);
        if (updates.alignment !== undefined) fabricObject.set('textAlign', updates.alignment);
        if (updates.lineHeight !== undefined) fabricObject.set('lineHeight', updates.lineHeight);
        
        fabricCanvas.renderAll();
      }
    }
    
    // Update selected layer if it's the one being updated
    if (selectedLayer?.id === id) {
      setSelectedLayer(prev => prev ? { ...prev, ...updates } : null);
    }
  };
  
  const handleSelectLayer = (layer: TextLayer) => {
    setSelectedLayer(layer);
    if (fabricCanvas) {
      const fabricObject = fabricCanvas.getObjects().find(obj => (obj as any).id === layer.id);
      if (fabricObject) {
        fabricCanvas.setActiveObject(fabricObject);
        fabricCanvas.requestRenderAll();
      }
    }
  };
  
  const handleReorderLayer = (layerId: string, direction: 'up' | 'down') => {
    const layerIndex = textLayers.findIndex(l => l.id === layerId);
    if (layerIndex === -1) return;
    
    const newLayers = [...textLayers];
    const [movedLayer] = newLayers.splice(layerIndex, 1);
    
    if (direction === 'up' && layerIndex < textLayers.length - 1) {
      newLayers.splice(layerIndex + 1, 0, { ...movedLayer, zIndex: movedLayer.zIndex + 1 });
      // Update other layer's zIndex
      newLayers[layerIndex].zIndex = movedLayer.zIndex;
    } else if (direction === 'down' && layerIndex > 0) {
      newLayers.splice(layerIndex - 1, 0, { ...movedLayer, zIndex: movedLayer.zIndex - 1 });
      // Update other layer's zIndex  
      newLayers[layerIndex].zIndex = movedLayer.zIndex;
    } else {
      newLayers.splice(layerIndex, 0, movedLayer);
      return;
    }
    
    setTextLayers(newLayers);
    
    // Update fabric canvas object order
    if (fabricCanvas) {
      const fabricObject = fabricCanvas.getObjects().find(obj => (obj as any).id === layerId);
      if (fabricObject) {
        if (direction === 'up') {
          fabricCanvas.bringForward(fabricObject);
        } else {
          fabricCanvas.sendBackwards(fabricObject);
        }
        fabricCanvas.requestRenderAll();
      }
    }
  };
  
  const handleDuplicateLayer = (layerId: string) => {
    const layer = textLayers.find(l => l.id === layerId);
    if (!layer || !fabricCanvas) return;
    
    const duplicatedLayer: TextLayer = {
      ...layer,
      id: `text-${Date.now()}`,
      x: layer.x + 20,
      y: layer.y + 20,
      zIndex: textLayers.length
    };
    
    const fabricText = new fabric.Textbox(duplicatedLayer.text, {
      left: duplicatedLayer.x,
      top: duplicatedLayer.y,
      fontSize: duplicatedLayer.fontSize,
      fontFamily: duplicatedLayer.fontFamily,
      fontWeight: duplicatedLayer.fontWeight,
      fill: duplicatedLayer.color,
      opacity: duplicatedLayer.opacity,
      textAlign: duplicatedLayer.alignment,
      width: 200,
      splitByGrapheme: false,
      // Multi-line text support
      editable: true,
      editingBorderColor: '#2563eb',
      cursorColor: '#2563eb',
      cursorWidth: 2,
      lineHeight: duplicatedLayer.lineHeight,
      // Transform controls
      hasControls: true,
      hasBorders: true,
      cornerSize: 12,
      cornerColor: '#2563eb',
      cornerStyle: 'circle',
      borderColor: '#2563eb',
      borderDashArray: [5, 5],
      transparentCorners: false,
      rotatingPointOffset: 20,
    });
    
    (fabricText as any).id = duplicatedLayer.id;
    fabricCanvas.add(fabricText);
    fabricCanvas.setActiveObject(fabricText);
    fabricCanvas.requestRenderAll();
    
    setTextLayers(prev => [...prev, duplicatedLayer]);
    setSelectedLayer(duplicatedLayer);
    
    // Add to history
    const newState: CanvasState = {
      backgroundImage,
      textLayers: [...textLayers, duplicatedLayer],
      canvasWidth: canvasDimensions.width,
      canvasHeight: canvasDimensions.height,
    };
    addToHistory(newState);
  };
  
  const handleDeleteLayer = (layerId: string) => {
    if (fabricCanvas) {
      const fabricObject = fabricCanvas.getObjects().find(obj => (obj as any).id === layerId);
      if (fabricObject) {
        fabricCanvas.remove(fabricObject);
        fabricCanvas.requestRenderAll();
      }
    }
    
    const newLayers = textLayers.filter(l => l.id !== layerId);
    setTextLayers(newLayers);
    
    if (selectedLayer?.id === layerId) {
      setSelectedLayer(null);
    }
    
    // Add to history
    const newState: CanvasState = {
      backgroundImage,
      textLayers: newLayers,
      canvasWidth: canvasDimensions.width,
      canvasHeight: canvasDimensions.height,
    };
    addToHistory(newState);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Adomate - Image Text Composer</h1>
          <p className="text-gray-600">Upload a PNG image and add customizable text overlays</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Tools */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Image</h2>
              <ImageUpload 
                onImageUpload={handleImageUpload} 
                disabled={false}
              />
            </div>
            
            {backgroundImage && (
              <>
                <TextToolsPanel
                  selectedLayer={selectedLayer}
                  onAddTextLayer={handleAddTextLayer}
                  onUpdateTextLayer={handleUpdateTextLayer}
                />
                
                <LayersPanel
                  layers={textLayers}
                  selectedLayer={selectedLayer}
                  onSelectLayer={handleSelectLayer}
                  onReorderLayer={handleReorderLayer}
                  onDuplicateLayer={handleDuplicateLayer}
                  onDeleteLayer={handleDeleteLayer}
                />
                
                <HistoryPanel
                  canUndo={canUndo}
                  canRedo={canRedo}
                  onUndo={undo}
                  onRedo={redo}
                  historyLength={historyLength}
                />
                
                <AutosaveIndicator
                  onReset={handleResetDesign}
                  hasContent={!!backgroundImage || textLayers.length > 0}
                />
                
                <ExportPanel
                  onExport={handleExport}
                  canExport={!!backgroundImage}
                />
              </>
            )}
          </div>

          {/* Main Canvas Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              {backgroundImage ? (
                <div className="flex justify-center">
                  <CanvasEditor
                    backgroundImage={backgroundImage}
                    canvasWidth={canvasDimensions.width}
                    canvasHeight={canvasDimensions.height}
                    onCanvasReady={handleCanvasReady}
                  />
                </div>
              ) : (
                <div className="text-center py-20 text-gray-500">
                  <p className="text-lg mb-2">No image uploaded</p>
                  <p className="text-sm">Upload a PNG image to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
