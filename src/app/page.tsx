'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const CanvasEditor = dynamic(() => import('@/components/CanvasEditor').then(mod => ({ default: mod.CanvasEditor })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
});

import { ImageUpload } from '@/components/ImageUpload';
import { TextToolsPanel } from '@/components/TextToolsPanel';
import { LayersPanel } from '@/components/LayersPanel';
import { HistoryPanel } from '@/components/HistoryPanel';
import { AutosaveIndicator } from '@/components/AutosaveIndicator';
import { ExportPanel } from '@/components/ExportPanel';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { TextLayer, CanvasState } from '@/types';
import { useCanvasHistory } from '@/hooks/useCanvasHistory';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import Konva from "konva";

export default function Home() {

  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600 });
  const [konvaStage, setKonvaStage] = useState<any>(null);
  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<TextLayer | null>(null);
  const [appError, setAppError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
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

  // Cleanup effect for removing event listeners
  useEffect(() => {
    return () => {
      // Clean up keyboard event listeners when component unmounts
      if (konvaStage && (konvaStage as any)._keydownHandler) {
        document.removeEventListener('keydown', (konvaStage as any)._keydownHandler);
      }
    };
  }, [konvaStage]);

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
      // Clear Konva stage
      if (konvaStage) {
        // Remove all text nodes from the stage
        const allTextNodes = konvaStage.find('Text') as Konva.Text[];
        allTextNodes.forEach(node => {
          node.destroy();
        });
        
        // Redraw all layers to reflect changes
        konvaStage.getLayers().forEach(layer => {
          layer.batchDraw();
        });
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
    if (!konvaStage || !backgroundImage) {
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
  
  // // Implement Konva.js history restoration
  // // Restore state when history changes (undo/redo)
  // useEffect(() => {
  //   if (currentState && konvaStage) {
  //     // Update background image if different
  //     if (currentState.backgroundImage !== backgroundImage) {
  //       setBackgroundImage(currentState.backgroundImage);
  //     }
  //
  //     // Update canvas dimensions if different
  //     if (currentState.canvasWidth !== canvasDimensions.width ||
  //         currentState.canvasHeight !== canvasDimensions.height) {
  //       setCanvasDimensions({
  //         width: currentState.canvasWidth,
  //         height: currentState.canvasHeight
  //       });
  //     }
  //
  //     // Clear current canvas objects and recreate with Konva Layer management
  //     const layer = konvaStage.getLayers()[0];
  //     if (layer) {
  //       // Remove all existing text nodes
  //       const allTextNodes = layer.find('Text') as Konva.Text[];
  //       allTextNodes.forEach(node => node.destroy());
  //
  //       // Recreate text nodes from history state
  //       currentState.textLayers.forEach(textLayer => {
  //         const textNode = new Konva.Text({
  //           id: textLayer.id,
  //           x: textLayer.x,
  //           y: textLayer.y,
  //           text: textLayer.text,
  //           fontSize: textLayer.fontSize,
  //           fontFamily: textLayer.fontFamily,
  //           fontStyle: textLayer.fontWeight,
  //           fill: textLayer.color,
  //           opacity: textLayer.opacity,
  //           align: textLayer.alignment,
  //           rotation: textLayer.rotation,
  //           scaleX: textLayer.scaleX,
  //           scaleY: textLayer.scaleY,
  //           lineHeight: textLayer.lineHeight,
  //           letterSpacing: textLayer.letterSpacing,
  //           draggable: true,
  //         });
  //
  //         // Add click event for selection
  //         textNode.on('click', () => {
  //           handleSelectLayer(textLayer);
  //         });
  //
  //         // Add drag event to update position
  //         textNode.on('dragend', () => {
  //           handleUpdateTextLayer(textLayer.id, { x: textNode.x(), y: textNode.y() });
  //         });
  //
  //         layer.add(textNode);
  //       });
  //
  //       // Update React state to match history
  //       setTextLayers(currentState.textLayers);
  //
  //       // Clear selection as we're restoring from history
  //       setSelectedLayer(null);
  //
  //       // Redraw the layer
  //       layer.batchDraw();
  //     }
  //   }
  // }, [currentState, konvaStage]);

  const handleImageUpload = (imageUrl: string, width: number, height: number) => {
    try {
      setAppError(null);
      setIsLoading(true);
      
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
      
      setTimeout(() => setIsLoading(false), 500); // Brief loading for UX
    } catch (error) {
      console.error('Error uploading image:', error);
      setAppError('Failed to process uploaded image. Please try again.');
      setIsLoading(false);
    }
  };

  const handleCanvasReady = (stage: any) => {
    setKonvaStage(stage);
    console.log('Konva stage ready:', stage);
    
    // Implement Konva event handlers
    
    // 1. Selection handling - Click on empty canvas to deselect
    stage.on('click tap', (e: any) => {
      // If clicked on empty area (not a text node), deselect
      if (e.target === stage || e.target.getClassName() === 'Layer') {
        setSelectedLayer(null);
        // Remove selection styling from all text nodes
        const allTextNodes = stage.find('Text') as Konva.Text[];
        allTextNodes.forEach((node: any) => {
          node.stroke('');
          node.strokeWidth(0);
        });
        stage.batchDraw();
      }
    });
    
    // 2. Object modification tracking - Track drag operations for history
    let dragStartState: CanvasState | null = null;
    
    stage.on('dragstart', (e: any) => {
      if (e.target.getClassName() === 'Text') {
        // Save state before drag for history
        dragStartState = {
          backgroundImage,
          textLayers: [...textLayers],
          canvasWidth: canvasDimensions.width,
          canvasHeight: canvasDimensions.height,
        };
      }
    });
    
    stage.on('dragend', (e: any) => {
      if (e.target.getClassName() === 'Text' && dragStartState) {
        // Add drag operation to history
        const currentCanvasState: CanvasState = {
          backgroundImage,
          textLayers: textLayers.map(layer => 
            layer.id === e.target.id() 
              ? { ...layer, x: e.target.x(), y: e.target.y() }
              : layer
          ),
          canvasWidth: canvasDimensions.width,
          canvasHeight: canvasDimensions.height,
        };
        addToHistory(currentCanvasState);
        dragStartState = null;
      }
    });
    
    // 3. Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if canvas has focus or no input is focused
      const activeElement = document.activeElement;
      const isInputFocused = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true'
      );
      
      if (!isInputFocused) {
        // Delete selected layer
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          if (selectedLayer) {
            handleDeleteLayer(selectedLayer.id);
          }
        }
        
        // Duplicate selected layer
        if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          if (selectedLayer) {
            handleDuplicateLayer(selectedLayer.id);
          }
        }
        
        // Undo
        if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
          e.preventDefault();
          if (canUndo) {
            undo();
          }
        }
        
        // Redo
        if (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
          e.preventDefault();
          if (canRedo) {
            redo();
          }
        }
        
        // Arrow keys for fine positioning
        if (selectedLayer && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          let newX = selectedLayer.x;
          let newY = selectedLayer.y;
          
          switch (e.key) {
            case 'ArrowUp': newY -= step; break;
            case 'ArrowDown': newY += step; break;
            case 'ArrowLeft': newX -= step; break;
            case 'ArrowRight': newX += step; break;
          }
          
          handleUpdateTextLayer(selectedLayer.id, { x: newX, y: newY });
        }
      }
    };
    
    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyDown);
    
    // Store cleanup function in stage for later removal
    (stage as any)._keydownHandler = handleKeyDown;
  };
  
  const handleAddTextLayer = () => {
    if (!konvaStage) {
      setAppError('Canvas not ready. Please wait and try again.');
      return;
    }
    
    try {
      setAppError(null);
    
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
        lineHeight: 1.2,
        letterSpacing: 0
      };
      
      // Add Konva Text node to stage
      if (konvaStage) {
        const layer = konvaStage.getLayers()[0]; // Get the main layer
        const textNode = new Konva.Text({
          id: newLayer.id,
          x: newLayer.x,
          y: newLayer.y,
          text: newLayer.text,
          fontSize: newLayer.fontSize,
          fontFamily: newLayer.fontFamily,
          fontStyle: newLayer.fontWeight,
          fill: newLayer.color,
          opacity: newLayer.opacity,
          align: newLayer.alignment,
          rotation: newLayer.rotation,
          scaleX: newLayer.scaleX,
          scaleY: newLayer.scaleY,
          lineHeight: newLayer.lineHeight,
          letterSpacing: newLayer.letterSpacing,
          draggable: true,
        });

        // Add click event for selection
        textNode.on('click', () => {
          handleSelectLayer(newLayer);
        });

        // Add drag event to update position
        textNode.on('dragend', () => {
          handleUpdateTextLayer(newLayer.id, { x: textNode.x(), y: textNode.y() });
        });

        layer.add(textNode);
        layer.batchDraw();
      }
      
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
    } catch (error) {
      console.error('Error adding text layer:', error);
      setAppError('Failed to add text layer. Please try again.');
    }
  };
  
  const handleUpdateTextLayer = (id: string, updates: Partial<TextLayer>) => {
    setTextLayers(prev => 
      prev.map(layer => 
        layer.id === id ? { ...layer, ...updates } : layer
      )
    );
    
    // Update Konva Text node
    if (konvaStage) {
      const textNode = konvaStage.findOne(`#${id}`) as Konva.Text;
      if (textNode) {
        // Update text node properties
        if (updates.text !== undefined) textNode.text(updates.text);
        if (updates.x !== undefined) textNode.x(updates.x);
        if (updates.y !== undefined) textNode.y(updates.y);
        if (updates.fontSize !== undefined) textNode.fontSize(updates.fontSize);
        if (updates.fontFamily !== undefined) textNode.fontFamily(updates.fontFamily);
        if (updates.fontWeight !== undefined) textNode.fontStyle(updates.fontWeight);
        if (updates.color !== undefined) textNode.fill(updates.color);
        if (updates.opacity !== undefined) textNode.opacity(updates.opacity);
        if (updates.alignment !== undefined) textNode.align(updates.alignment);
        if (updates.rotation !== undefined) textNode.rotation(updates.rotation);
        if (updates.scaleX !== undefined) textNode.scaleX(updates.scaleX);
        if (updates.scaleY !== undefined) textNode.scaleY(updates.scaleY);
        if (updates.lineHeight !== undefined) textNode.lineHeight(updates.lineHeight);
        if (updates.letterSpacing !== undefined) textNode.letterSpacing(updates.letterSpacing);
        
        // Redraw the layer
        textNode.getLayer()?.batchDraw();
      }
    }
    
    // Update selected layer if it's the one being updated
    if (selectedLayer?.id === id) {
      setSelectedLayer(prev => prev ? { ...prev, ...updates } : null);
    }
  };
  
  const handleSelectLayer = (layer: TextLayer) => {
    setSelectedLayer(layer);
    
    // Select Konva Text node and add visual selection feedback
    if (konvaStage) {
      // First, deselect all nodes by removing any existing selection
      const allTextNodes = konvaStage.find('Text') as Konva.Text[];
      allTextNodes.forEach(node => {
        node.stroke('');
        node.strokeWidth(0);
      });
      
      // Select the target text node
      const textNode = konvaStage.findOne(`#${layer.id}`) as Konva.Text;
      if (textNode) {
        // Add visual selection feedback (stroke border)
        textNode.stroke('#007bff');
        textNode.strokeWidth(2);
        
        // Bring to front
        textNode.moveToTop();
        
        // Redraw the layer
        textNode.getLayer()?.batchDraw();
      }
    }
  };
  
  const handleReorderLayer = (layerId: string, direction: 'up' | 'down') => {
    try {
      setAppError(null);
      
      const layerIndex = textLayers.findIndex(layer => layer.id === layerId);
      if (layerIndex === -1) return;
      
      const newIndex = direction === 'up' ? layerIndex + 1 : layerIndex - 1;
      if (newIndex < 0 || newIndex >= textLayers.length) return;
      
      // Reorder in state
      const newLayers = [...textLayers];
      [newLayers[layerIndex], newLayers[newIndex]] = [newLayers[newIndex], newLayers[layerIndex]];
      
      // Update zIndex values
      const updatedLayers = newLayers.map((layer, index) => ({
        ...layer,
        zIndex: index
      }));
      
      // Reorder Konva nodes
      if (konvaStage) {
        const textNode = konvaStage.findOne(`#${layerId}`) as Konva.Text;
        if (textNode) {
          if (direction === 'up') {
            textNode.moveUp();
          } else {
            textNode.moveDown();
          }
          textNode.getLayer()?.batchDraw();
        }
      }
      
      setTextLayers(updatedLayers);
      
      // Add to history
      const newState: CanvasState = {
        backgroundImage,
        textLayers: updatedLayers,
        canvasWidth: canvasDimensions.width,
        canvasHeight: canvasDimensions.height,
      };
      addToHistory(newState);
    } catch (error) {
      console.error('Error reordering layer:', error);
      setAppError('Failed to reorder layer. Please try again.');
    }
  };
  
  const handleDuplicateLayer = (layerId: string) => {
    try {
      setAppError(null);
      
      const originalLayer = textLayers.find(layer => layer.id === layerId);
      if (!originalLayer || !konvaStage) return;
      
      // Create duplicate layer with new ID and slight offset
      const duplicatedLayer: TextLayer = {
        ...originalLayer,
        id: `text-${Date.now()}`,
        x: originalLayer.x + 20,
        y: originalLayer.y + 20,
        zIndex: textLayers.length,
      };
      
      // Create Konva Text node for duplicate
      const layer = konvaStage.getLayers()[0];
      const textNode = new Konva.Text({
        id: duplicatedLayer.id,
        x: duplicatedLayer.x,
        y: duplicatedLayer.y,
        text: duplicatedLayer.text,
        fontSize: duplicatedLayer.fontSize,
        fontFamily: duplicatedLayer.fontFamily,
        fontStyle: duplicatedLayer.fontWeight,
        fill: duplicatedLayer.color,
        opacity: duplicatedLayer.opacity,
        align: duplicatedLayer.alignment,
        rotation: duplicatedLayer.rotation,
        scaleX: duplicatedLayer.scaleX,
        scaleY: duplicatedLayer.scaleY,
        lineHeight: duplicatedLayer.lineHeight,
        letterSpacing: duplicatedLayer.letterSpacing,
        draggable: true,
      });

      // Add click event for selection
      textNode.on('click', () => {
        handleSelectLayer(duplicatedLayer);
      });

      // Add drag event to update position
      textNode.on('dragend', () => {
        handleUpdateTextLayer(duplicatedLayer.id, { x: textNode.x(), y: textNode.y() });
      });

      layer.add(textNode);
      layer.batchDraw();
      
      const updatedLayers = [...textLayers, duplicatedLayer];
      setTextLayers(updatedLayers);
      setSelectedLayer(duplicatedLayer);
      
      // Add to history
      const newState: CanvasState = {
        backgroundImage,
        textLayers: updatedLayers,
        canvasWidth: canvasDimensions.width,
        canvasHeight: canvasDimensions.height,
      };
      addToHistory(newState);
    } catch (error) {
      console.error('Error duplicating layer:', error);
      setAppError('Failed to duplicate layer. Please try again.');
    }
  };
  
  const handleDeleteLayer = (layerId: string) => {
    try {
      setAppError(null);
      
      if (!konvaStage) return;
      
      // Remove Konva Text node
      const textNode = konvaStage.findOne(`#${layerId}`) as Konva.Text;
      if (textNode) {
        textNode.destroy();
        textNode.getLayer()?.batchDraw();
      }
      
      // Remove from state
      const updatedLayers = textLayers.filter(layer => layer.id !== layerId);
      
      // Update zIndex values after deletion
      const reindexedLayers = updatedLayers.map((layer, index) => ({
        ...layer,
        zIndex: index
      }));
      
      setTextLayers(reindexedLayers);
      
      // Clear selection if deleted layer was selected
      if (selectedLayer?.id === layerId) {
        setSelectedLayer(null);
      }
      
      // Add to history
      const newState: CanvasState = {
        backgroundImage,
        textLayers: reindexedLayers,
        canvasWidth: canvasDimensions.width,
        canvasHeight: canvasDimensions.height,
      };
      addToHistory(newState);
    } catch (error) {
      console.error('Error deleting layer:', error);
      setAppError('Failed to delete layer. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Adomate - Image Text Composer</h1>
          <p className="text-gray-600">Upload a PNG image and add customizable text overlays</p>
        </header>

        {/* Error Display */}
        {appError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-red-800 text-sm font-medium">{appError}</p>
              <button
                onClick={() => setAppError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                ×
              </button>
            </div>
          </div>
        )}

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
      
      <LoadingOverlay isVisible={isLoading} message="Processing..." />
    </div>
  );
}
