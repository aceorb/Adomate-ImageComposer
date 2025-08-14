'use client';

import { useState, useEffect, useCallback } from 'react';
import { LeftToolbar } from '@/components/LeftToolbar';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { TextLayer, CanvasState } from '@/types';
import { useCanvasHistory } from '@/hooks/useCanvasHistory';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import Konva from 'konva';
import {CanvasEditor} from "@/components/CanvasEditor";


export const ImageTextComposer: React.FC = () => {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600 });
  const [konvaStage, setKonvaStage] = useState<Konva.Stage | null>(null);
  const [konvaTransformer, setKonvaTransformer] = useState<Konva.Transformer | null>(null);
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
    resetHistory,
    canUndo,
    canRedo,
    historyLength,
    isUndoRedo,
  } = useCanvasHistory(initialState);
  
  // Autosave to localStorage
  const [savedState, setSavedState, removeSavedState, loadSavedData] = useLocalStorage<CanvasState | null>('adomate-design', null);

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
    const loadedState = loadSavedData();
    console.log('mount', loadedState);
    if (loadedState && loadedState.backgroundImage) {
      // Update React state
      setBackgroundImage(loadedState.backgroundImage);
      setCanvasDimensions({
        width: loadedState.canvasWidth,
        height: loadedState.canvasHeight,
      });
      setTextLayers(loadedState.textLayers);
      
      // Reset history with loaded state - this will trigger the history restoration effect
      resetHistory(loadedState);
    }
  }, []);
  
  const handleResetDesign = () => {
    if (confirm('Are you sure you want to reset the design? This will clear everything and cannot be undone.')) {
      // Clear Konva stage
      if (konvaStage) {
        // Remove all text nodes from the stage
        const allTextNodes = konvaStage.find('Text') as Konva.Text[];
        allTextNodes.forEach((node) => {
          node.destroy();
        });
        
        // Redraw all layers to reflect changes
        konvaStage.getLayers().forEach((layer) => {
          layer.batchDraw();
        });
      }
      
      // Reset state
      setBackgroundImage(null);
      setTextLayers([]);
      setSelectedLayer(null);
      setCanvasDimensions({ width: 800, height: 600 });
      
      // Reset history to clean state
      const resetState: CanvasState = {
        backgroundImage: null,
        textLayers: [],
        canvasWidth: 800,
        canvasHeight: 600,
      };
      resetHistory(resetState);
      
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
  
  const handleImageUpload = (imageUrl: string, width: number, height: number) => {
    try {
      setAppError(null);
      setIsLoading(true);
      
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
      
      const newCanvasDimensions = { width: Math.round(canvasWidth), height: Math.round(canvasHeight) };
      
      // Update state
      setBackgroundImage(imageUrl);
      setCanvasDimensions(newCanvasDimensions);
      
      // Add image upload to history
      const newState: CanvasState = {
        backgroundImage: imageUrl,
        textLayers: textLayers, // Keep existing text layers
        canvasWidth: newCanvasDimensions.width,
        canvasHeight: newCanvasDimensions.height,
      };
      addToHistory(newState);
      
      setTimeout(() => setIsLoading(false), 500); // Brief loading for UX
    } catch (error) {
      console.error('Error uploading image:', error);
      setAppError('Failed to process uploaded image. Please try again.');
      setIsLoading(false);
    }
  };

  const handleCanvasReady = useCallback((stage: Konva.Stage) => {
    setKonvaStage(stage);
    console.log('Konva stage ready:', stage);

    // Create transformer for resizing and rotating text nodes
    const transformer = new Konva.Transformer({
      enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      rotateAnchorOffset: 30,
      borderStroke: '#0084ff',
      borderStrokeWidth: 2,
      anchorStroke: '#0084ff',
      anchorStrokeWidth: 2,
      anchorSize: 8,
      keepRatio: false, // Allow non-proportional scaling for text
    });
    
    const layer = stage.getLayers()[0];
    if (layer) {
      layer.add(transformer);
      setKonvaTransformer(transformer);
    }

    // 1. Selection handling - Click on empty canvas to deselect
    stage.on('click tap', (e) => {
      // If clicked on empty area (not a text node), deselect
      console.log('stage click tap', e.target);
      if (e.target === stage || e.target.getClassName() === 'Image') {
        setSelectedLayer(null);
        // Clear transformer
        transformer.nodes([]);
        // Remove selection styling from all text nodes
        const allTextNodes = stage.find('Text') as Konva.Text[];
        allTextNodes.forEach((node) => {
          node.stroke('');
          node.strokeWidth(0);
        });
        stage.batchDraw();
      }
    });
  }, [setKonvaStage, setSelectedLayer]);
  
  const handleAddTextLayer = () => {
    if (!konvaStage || !Konva) {
      setAppError('Canvas not ready. Please wait and try again.');
      return;
    }
    
    try {
      setAppError(null);
    
      // Create the new layer first
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
        zIndex: 0, // Will be set correctly in the setState
        lineHeight: 1.2,
        letterSpacing: 0
      };
      
      let updatedLayers: TextLayer[] = [];
      
      setTextLayers(prev => {
        // Fix the zIndex based on current array length
        const layerWithCorrectIndex = { ...newLayer, zIndex: prev.length };
        updatedLayers = [...prev, layerWithCorrectIndex];
        return updatedLayers;
      });
      setTimeout(() => {
        // Add Konva Text node to stage
        if (konvaStage) {
          const layer = konvaStage.getLayers()[0]; // Get the main layer
          // Use the layer with correct zIndex from updatedLayers
          console.log('handleAddTextLayer', updatedLayers);
          const finalLayer = updatedLayers[updatedLayers.length - 1]; // The newly added layer
          const textNode = new Konva.Text({
            id: finalLayer.id,
            x: finalLayer.x,
            y: finalLayer.y,
            text: finalLayer.text,
            fontSize: finalLayer.fontSize,
            fontFamily: finalLayer.fontFamily,
            fontStyle: finalLayer.fontWeight,
            fill: finalLayer.color,
            opacity: finalLayer.opacity,
            align: finalLayer.alignment,
            rotation: finalLayer.rotation,
            scaleX: finalLayer.scaleX,
            scaleY: finalLayer.scaleY,
            lineHeight: finalLayer.lineHeight,
            letterSpacing: finalLayer.letterSpacing,
            draggable: true,
          });

          // Add click event for selection
          textNode.on('click', () => {
            handleSelectLayer(finalLayer);
          });

          // Add drag event to update position
          textNode.on('dragend', () => {
            handleUpdateTextLayer(finalLayer.id, { x: textNode.x(), y: textNode.y() });
          });

          // Add transform event to update scale and rotation
          textNode.on('transform', () => {
            const scaleX = textNode.scaleX();
            const scaleY = textNode.scaleY();
            const rotation = textNode.rotation();
            
            handleUpdateTextLayer(finalLayer.id, {
              x: textNode.x(),
              y: textNode.y(),
              scaleX: scaleX,
              scaleY: scaleY,
              rotation: rotation,
            });
          });

          layer.add(textNode);
          layer.batchDraw();
        }

        setSelectedLayer(updatedLayers[updatedLayers.length - 1]);

        // Add to history - use setTimeout to ensure state has been updated

        const newState: CanvasState = {
          backgroundImage,
          textLayers: updatedLayers,
          canvasWidth: canvasDimensions.width,
          canvasHeight: canvasDimensions.height,
        };
        addToHistory(newState);
      }, 0);
    } catch (error) {
      console.error('Error adding text layer:', error);
      setAppError('Failed to add text layer. Please try again.');
    }
  };
  
  const handleUpdateTextLayer = (id: string, updates: Partial<TextLayer>) => {
    console.log('handleUpdateTextLayer', id, updates);
    let updatedLayers: TextLayer[] = [];
    
    setTextLayers(prev => {
      updatedLayers = prev.map(layer => 
        layer.id === id ? { ...layer, ...updates } : layer
      );
      return updatedLayers;
    });
    
    // Update Konva Text node
    if (konvaStage && Konva) {
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
    
    // Add to history - use setTimeout to ensure state has been updated
    setTimeout(() => {
      const newState: CanvasState = {
        backgroundImage,
        textLayers: updatedLayers,
        canvasWidth: canvasDimensions.width,
        canvasHeight: canvasDimensions.height,
      };
      addToHistory(newState);
    }, 0);
  };
  
  const handleSelectLayer = (layer: TextLayer) => {
    console.log('handleSelectTextLayer', layer);
    setSelectedLayer(layer);
    
    // Select Konva Text node and attach transformer
    if (konvaStage && konvaTransformer) {
      // First, deselect all nodes by removing any existing selection
      const allTextNodes = konvaStage.find('Text') as Konva.Text[];
      allTextNodes.forEach((node) => {
        node.stroke('');
        node.strokeWidth(0);
      });
      
      // Select the target text node
      const textNode = konvaStage.findOne(`#${layer.id}`) as Konva.Text;
      if (textNode) {
        // Attach transformer to the selected node
        konvaTransformer.nodes([textNode]);
        
        // Bring to front
        textNode.moveToTop();
        konvaTransformer.moveToTop();
        
        // Redraw the layer
        textNode.getLayer()?.batchDraw();
      }
    }
  };
  
  const handleReorderLayer = (layerId: string, direction: 'up' | 'down') => {
    try {
      setAppError(null);
      let updatedLayers: TextLayer[] = [];
      
      setTextLayers(prev => {
        const layerIndex = prev.findIndex(layer => layer.id === layerId);
        if (layerIndex === -1) return prev;
        
        const newIndex = direction === 'up' ? layerIndex + 1 : layerIndex - 1;
        if (newIndex < 0 || newIndex >= prev.length) return prev;
        
        // Reorder in state
        const newLayers = [...prev];
        [newLayers[layerIndex], newLayers[newIndex]] = [newLayers[newIndex], newLayers[layerIndex]];
        
        // Update zIndex values
        updatedLayers = newLayers.map((layer, index) => ({
          ...layer,
          zIndex: index
        }));
        
        return updatedLayers;
      });
      
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
      
      // Add to history - use setTimeout to ensure state has been updated
      setTimeout(() => {
        const newState: CanvasState = {
          backgroundImage,
          textLayers: updatedLayers,
          canvasWidth: canvasDimensions.width,
          canvasHeight: canvasDimensions.height,
        };
        addToHistory(newState);
      }, 0);
    } catch (error) {
      console.error('Error reordering layer:', error);
      setAppError('Failed to reorder layer. Please try again.');
    }
  };
  
  const handleDuplicateLayer = (layerId: string) => {
    try {
      if (!konvaStage || !Konva) return;
      setAppError(null);
      let updatedLayers: TextLayer[] = [];
      let duplicatedLayer: TextLayer | null = null;
      
      setTextLayers(prev => {
        const originalLayer = prev.find(layer => layer.id === layerId);
        if (!originalLayer) return prev;
        
        // Create duplicate layer with new ID and slight offset
        duplicatedLayer = {
          ...originalLayer,
          id: `text-${Date.now()}`,
          x: originalLayer.x + 20,
          y: originalLayer.y + 20,
          zIndex: prev.length,
        };
        
        updatedLayers = [...prev, duplicatedLayer];
        return updatedLayers;
      });
      

      setTimeout(() => {
        console.log('handleDuplicateLayer', layerId, updatedLayers, duplicatedLayer);
        // Get the final layer from updatedLayers to ensure we have the correct reference
        const finalDuplicatedLayer = updatedLayers[updatedLayers.length - 1];

        // Create Konva Text node for duplicate
        const layer = konvaStage.getLayers()[0];
        const textNode = new Konva.Text({
          id: finalDuplicatedLayer.id,
          x: finalDuplicatedLayer.x,
          y: finalDuplicatedLayer.y,
          text: finalDuplicatedLayer.text,
          fontSize: finalDuplicatedLayer.fontSize,
          fontFamily: finalDuplicatedLayer.fontFamily,
          fontStyle: finalDuplicatedLayer.fontWeight,
          fill: finalDuplicatedLayer.color,
          opacity: finalDuplicatedLayer.opacity,
          align: finalDuplicatedLayer.alignment,
          rotation: finalDuplicatedLayer.rotation,
          scaleX: finalDuplicatedLayer.scaleX,
          scaleY: finalDuplicatedLayer.scaleY,
          lineHeight: finalDuplicatedLayer.lineHeight,
          letterSpacing: finalDuplicatedLayer.letterSpacing,
          draggable: true,
        });

        // Add click event for selection
        textNode.on('click', () => {
          handleSelectLayer(finalDuplicatedLayer);
        });

        // Add drag event to update position
        textNode.on('dragend', () => {
          handleUpdateTextLayer(finalDuplicatedLayer.id, { x: textNode.x(), y: textNode.y() });
        });

        // Add transform event to update scale and rotation
        textNode.on('transform', () => {
          const scaleX = textNode.scaleX();
          const scaleY = textNode.scaleY();
          const rotation = textNode.rotation();
          
          handleUpdateTextLayer(finalDuplicatedLayer.id, {
            x: textNode.x(),
            y: textNode.y(),
            scaleX: scaleX,
            scaleY: scaleY,
            rotation: rotation,
          });
        });

        layer.add(textNode);
        layer.batchDraw();

        setSelectedLayer(finalDuplicatedLayer);

        // Add to history - use setTimeout to ensure state has been updated

        const newState: CanvasState = {
          backgroundImage,
          textLayers: updatedLayers,
          canvasWidth: canvasDimensions.width,
          canvasHeight: canvasDimensions.height,
        };
        addToHistory(newState);
      }, 0);
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
      const textNode = konvaStage.findOne(`#${layerId}`);
      if (textNode) {
        textNode.destroy();
        textNode.getLayer()?.batchDraw();
      }
      
      let reindexedLayers: TextLayer[] = [];
      
      setTextLayers(prev => {
        // Remove from state
        const updatedLayers = prev.filter(layer => layer.id !== layerId);
        
        // Update zIndex values after deletion
        reindexedLayers = updatedLayers.map((layer, index) => ({
          ...layer,
          zIndex: index
        }));
        
        return reindexedLayers;
      });
      
      // Clear selection if deleted layer was selected
      if (selectedLayer?.id === layerId) {
        setSelectedLayer(null);
      }
      
      // Add to history - use setTimeout to ensure state has been updated
      setTimeout(() => {
        const newState: CanvasState = {
          backgroundImage,
          textLayers: reindexedLayers,
          canvasWidth: canvasDimensions.width,
          canvasHeight: canvasDimensions.height,
        };
        addToHistory(newState);
      }, 0);
    } catch (error) {
      console.error('Error deleting layer:', error);
      setAppError('Failed to delete layer. Please try again.');
    }
  };

  // Keyboard shortcuts handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Only handle if canvas has focus or no input is focused
    const activeElement = document.activeElement;
    const isInputFocused = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      (activeElement as HTMLElement).contentEditable === 'true'
    );

    if (!isInputFocused) {
      // Delete selected layer
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (selectedLayer) {
          handleDeleteLayer(selectedLayer.id);
        }
      }

      // Duplicate selected layer (Ctrl+D)
      if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (selectedLayer) {
          handleDuplicateLayer(selectedLayer.id);
        }
      }

      // Undo (Ctrl+Z)
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) {
          undo();
        }
      }

      // Redo (Ctrl+Shift+Z or Ctrl+Y)
      if (
        (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) ||
        (e.key === 'y' && (e.ctrlKey || e.metaKey))
      ) {
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
  }, [selectedLayer, canUndo, canRedo, undo, redo]);

  // Effect to manage keyboard event listener
  useEffect(() => {
    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // History restoration effect - restore state when currentState changes (undo/redo)
  useEffect(() => {
    if (currentState && konvaStage && isUndoRedo) {
      // Use a flag to prevent state updates during history restoration
      let isRestoringHistory = true;
      
      // Update background image if different
      if (currentState.backgroundImage !== backgroundImage) {
        setBackgroundImage(currentState.backgroundImage);
      }
      
      // Update canvas dimensions if different
      if (currentState.canvasWidth !== canvasDimensions.width || 
          currentState.canvasHeight !== canvasDimensions.height) {
        setCanvasDimensions({
          width: currentState.canvasWidth,
          height: currentState.canvasHeight
        });
      }
      
      // Update text layers state
      setTextLayers(currentState.textLayers);
      
      // Clear current canvas objects and recreate with Konva Layer management
      const layer = konvaStage.getLayers()[0];
      if (layer) {
        // Remove all existing text nodes
        const allTextNodes = layer.find('Text') as Konva.Text[];
        allTextNodes.forEach(node => node.destroy());
        
        // Recreate text nodes from history state
        currentState.textLayers.forEach(textLayer => {
          const textNode = new Konva.Text({
            id: textLayer.id,
            x: textLayer.x,
            y: textLayer.y,
            text: textLayer.text,
            fontSize: textLayer.fontSize,
            fontFamily: textLayer.fontFamily,
            fontStyle: textLayer.fontWeight,
            fill: textLayer.color,
            opacity: textLayer.opacity,
            align: textLayer.alignment,
            rotation: textLayer.rotation,
            scaleX: textLayer.scaleX,
            scaleY: textLayer.scaleY,
            lineHeight: textLayer.lineHeight,
            letterSpacing: textLayer.letterSpacing,
            draggable: true,
          });

          // Add click event for selection (using current layer data, not closure)
          textNode.on('click', () => {
            handleSelectLayer(textLayer);
          });

          // Add drag event to update position
          textNode.on('dragend', () => {
            handleUpdateTextLayer(textLayer.id, { x: textNode.x(), y: textNode.y() });
          });

          // Add transform event to update scale and rotation
          textNode.on('transform', () => {
            const scaleX = textNode.scaleX();
            const scaleY = textNode.scaleY();
            const rotation = textNode.rotation();

            handleUpdateTextLayer(textLayer.id, {
              x: textNode.x(),
              y: textNode.y(),
              scaleX: scaleX,
              scaleY: scaleY,
              rotation: rotation,
            });
          });


          layer.add(textNode);
        });
        
        // Clear selection as we're restoring from history
        setSelectedLayer(null);
        
        // Clear transformer selection
        if (konvaTransformer) {
          konvaTransformer.nodes([]);
        }
        
        // Redraw the layer
        layer.batchDraw();
      }
      
      // Reset flag after restoration is complete
      setTimeout(() => {
        isRestoringHistory = false;
      }, 0);
    }
  }, [currentState, konvaStage, isUndoRedo, konvaTransformer]);

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 text-center py-4 px-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Adomate - Image Text Composer</h1>
        <p className="text-sm text-gray-600">Upload a PNG image and add customizable text overlays</p>
      </header>

      {/* Error Display */}
      {appError && (
        <div className="flex-shrink-0 mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
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

      {/* Main Content */}
      <div className="flex-1 flex gap-4 px-4 pb-4 min-h-0 overflow-hidden">
        {/* Left Sidebar - Scrollable Tools */}
        <div className="w-80 flex-shrink-0">
          <LeftToolbar
            onImageUpload={handleImageUpload}
            selectedLayer={selectedLayer}
            onAddTextLayer={handleAddTextLayer}
            onUpdateTextLayer={handleUpdateTextLayer}
            layers={textLayers}
            onSelectLayer={handleSelectLayer}
            onReorderLayer={handleReorderLayer}
            onDuplicateLayer={handleDuplicateLayer}
            onDeleteLayer={handleDeleteLayer}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undo}
            onRedo={redo}
            historyLength={historyLength}
            onReset={handleResetDesign}
            hasContent={!!backgroundImage || textLayers.length > 0}
            onExport={handleExport}
            canExport={!!backgroundImage}
            backgroundImage={backgroundImage}
          />
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 bg-white rounded-lg p-4 shadow-sm min-h-0 flex flex-col overflow-hidden">
          {backgroundImage ? (
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              <CanvasEditor
                backgroundImage={backgroundImage}
                canvasWidth={canvasDimensions.width}
                canvasHeight={canvasDimensions.height}
                onCanvasReady={handleCanvasReady}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p className="text-lg mb-2">No image uploaded</p>
                <p className="text-sm">Upload a PNG image to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <LoadingOverlay isVisible={isLoading} message="Processing..." />
    </div>
  );
};