'use client';

import { useRef, useState } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  onImageUpload: (imageUrl: string, width: number, height: number) => void;
  disabled?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onImageUpload, disabled = false }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type
    if (!file.type.includes('image/png')) {
      alert('Please upload a PNG file only.');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB.');
      return;
    }

    setUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        onImageUpload(e.target?.result as string, img.width, img.height);
        setUploading(false);
      };
      img.onerror = () => {
        alert('Error loading image. Please try a different file.');
        setUploading(false);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      alert('Error reading file. Please try again.');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled || uploading) return;
    
    handleFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled && !uploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
        dragActive
          ? 'border-blue-400 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
      } ${
        disabled || uploading
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer hover:bg-gray-50'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,image/png"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || uploading}
      />
      
      <div className="flex flex-col items-center space-y-4">
        {uploading ? (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        ) : (
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100">
            {dragActive ? <Upload className="w-6 h-6 text-blue-600" /> : <ImageIcon className="w-6 h-6 text-gray-600" />}
          </div>
        )}
        
        <div>
          <p className="text-sm font-medium text-gray-900">
            {uploading ? 'Processing image...' : 'Upload a PNG image'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Drag and drop or click to select • PNG only • Max 10MB
          </p>
        </div>
      </div>
    </div>
  );
};