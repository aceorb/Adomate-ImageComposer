'use client';

import { useState } from 'react';
import { fabric } from 'fabric';
import { ImageUpload } from '@/components/ImageUpload';
import { CanvasEditor } from '@/components/CanvasEditor';

export default function Home() {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600 });
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);

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
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Text Tools</h2>
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                  Add Text Layer
                </button>
              </div>
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
