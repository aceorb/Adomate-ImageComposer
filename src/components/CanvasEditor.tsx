'use client';

import { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import useImage from 'use-image';
import ImageConfig = Konva.ImageConfig;

interface CanvasEditorProps {
  backgroundImage: string | null;
  canvasWidth: number;
  canvasHeight: number;
  onCanvasReady?: (stage: Konva.Stage) => void;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({
  backgroundImage,
  canvasWidth,
  canvasHeight,
  onCanvasReady
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const [image] = useImage(backgroundImage || '');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (stageRef.current && onCanvasReady) {
      onCanvasReady(stageRef.current);
    }
  }, [onCanvasReady]);

  useEffect(() => {
    if (backgroundImage) {
      setIsLoading(true);
    }
  }, [backgroundImage]);

  useEffect(() => {
    if (image) {
      setIsLoading(false);
    }
  }, [image]);

  const getImageProps = (): ImageConfig | null => {
    if (!image) return null;
    
    // Calculate scale to fit canvas while maintaining aspect ratio
    const scaleX = canvasWidth / image.width;
    const scaleY = canvasHeight / image.height;
    const scale = Math.min(scaleX, scaleY);
    
    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;
    
    return {
      image,
      width: image.width,
      height: image.height,
      scaleX: scale,
      scaleY: scale,
      x: (canvasWidth - scaledWidth) / 2,
      y: (canvasHeight - scaledHeight) / 2,
    };
  };

  return (
    <div className="relative border border-gray-300 rounded-lg overflow-hidden bg-white">
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      <Stage
        ref={stageRef}
        width={canvasWidth}
        height={canvasHeight}
        className="block max-w-full max-h-full"
      >
        <Layer>
          {(() => {
            const imageProps = getImageProps();
            return imageProps && <KonvaImage {...imageProps} />;
          })()}
        </Layer>
      </Stage>
    </div>
  );
};