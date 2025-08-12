'use client';

import { Download, FileImage } from 'lucide-react';
import { useState } from 'react';

interface ExportPanelProps {
  onExport: () => Promise<void>;
  canExport: boolean;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
  onExport,
  canExport
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!canExport || isExporting) return;
    
    setIsExporting(true);
    try {
      await onExport();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <FileImage className="w-5 h-5" />
        <h2 className="text-lg font-semibold text-gray-900">Export</h2>
      </div>

      <div className="space-y-3">
        <div className="text-sm text-gray-600">
          <p className="mb-2">Export your design as a PNG image with text overlay.</p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• Original image dimensions preserved</li>
            <li>• High-quality text rendering</li>
            <li>• Transparent background where no image</li>
          </ul>
        </div>

        <button
          onClick={handleExport}
          disabled={!canExport || isExporting}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-md transition-colors font-medium ${
            canExport && !isExporting
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Export as PNG</span>
            </>
          )}
        </button>

        {!canExport && (
          <p className="text-xs text-gray-500 text-center">
            Upload an image to enable export
          </p>
        )}
      </div>
    </div>
  );
};