import React from 'react';
import { X, Download } from 'lucide-react';

interface ImageModalProps {
  imageUrl: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, title, isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="absolute top-4 right-4 flex items-center space-x-2 z-10">
          <button
            onClick={handleDownload}
            className="p-2 rounded-full bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 transition-colors shadow-lg"
            title="Download image"
          >
            <Download className="h-6 w-6" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 transition-colors shadow-lg"
            title="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-4 bg-gradient-to-b from-black/50 to-transparent absolute top-0 left-0 right-0">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
        </div>

        <div className="relative aspect-square max-h-[80vh]">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default ImageModal; 