'use client';

import { useState } from 'react';
import { Canvas, Textbox } from 'fabric';
import { ImageUpload } from '@/components/ImageUpload';
import { CanvasEditor } from '@/components/CanvasEditor';
import { TextToolsPanel } from '@/components/TextToolsPanel';
import { TextLayer } from '@/types';

export default function Home() {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600 });
  const [fabricCanvas, setFabricCanvas] = useState<Canvas | null>(null);
  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<TextLayer | null>(null);

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

  const handleCanvasReady = (canvas: Canvas) => {
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
    
    // Keyboard controls for nudging
    const handleKeyDown = (e: KeyboardEvent) => {
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
    
    const fabricText = new Textbox(newLayer.text, {
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
  };
  
  const handleUpdateTextLayer = (id: string, updates: Partial<TextLayer>) => {
    setTextLayers(prev => 
      prev.map(layer => 
        layer.id === id ? { ...layer, ...updates } : layer
      )
    );
    
    // Update fabric object
    if (fabricCanvas) {
      const fabricObject = fabricCanvas.getObjects().find(obj => (obj as any).id === id) as Textbox;
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
              <TextToolsPanel
                selectedLayer={selectedLayer}
                onAddTextLayer={handleAddTextLayer}
                onUpdateTextLayer={handleUpdateTextLayer}
              />
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
