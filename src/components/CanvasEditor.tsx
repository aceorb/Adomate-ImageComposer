'use client';

import { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';

interface CanvasEditorProps {
  backgroundImage: string | null;
  canvasWidth: number;
  canvasHeight: number;
  onCanvasReady?: (canvas: fabric.Canvas) => void;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({
  backgroundImage,
  canvasWidth,
  canvasHeight,
  onCanvasReady
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Fabric.js canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: 'transparent',
      preserveObjectStacking: true,
      // Snap and selection settings
      snapAngle: 15,
      snapThreshold: 10,
    });

    fabricCanvasRef.current = canvas;
    onCanvasReady?.(canvas);

    return () => {
      canvas.dispose();
    };
  }, [canvasWidth, canvasHeight, onCanvasReady]);

  useEffect(() => {
    if (!fabricCanvasRef.current || !backgroundImage) return;

    setIsLoading(true);
    
    // Load background image
    fabric.Image.fromURL(backgroundImage, (img) => {
      if (!fabricCanvasRef.current) return;
      
      // Scale image to fit canvas while maintaining aspect ratio
      const canvas = fabricCanvasRef.current;
      const scaleX = canvasWidth / img.width!;
      const scaleY = canvasHeight / img.height!;
      const scale = Math.min(scaleX, scaleY);
      
      img.scale(scale);
      img.set({
        left: (canvasWidth - img.getScaledWidth()) / 2,
        top: (canvasHeight - img.getScaledHeight()) / 2,
        selectable: false,
        evented: false,
        hoverCursor: 'default',
        moveCursor: 'default',
      });

      // Set as background
      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
      setIsLoading(false);
    });
  }, [backgroundImage, canvasWidth, canvasHeight]);

  return (
    <div className="relative border border-gray-300 rounded-lg overflow-hidden bg-white">
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="block max-w-full max-h-full"
        style={{
          width: canvasWidth,
          height: canvasHeight,
        }}
      />
    </div>
  );
};