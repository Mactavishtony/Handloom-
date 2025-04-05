import React, { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

interface PrivatePattern {
  id: string;
  name: string;
  description: string;
  style: string;
  image_url: string;
  created_at: string;
}

const PrivateUploads = () => {
  const { user } = useAuthStore();
  const [patterns, setPatterns] = useState<PrivatePattern[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newPattern, setNewPattern] = useState({
    name: '',
    description: '',
    style: '',
  });

  useEffect(() => {
    fetchPrivatePatterns();
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image size should be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeUploadedImage = () => {
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const fetchPrivatePatterns = async () => {
    const { data, error } = await supabase
      .from('patterns')
      .select('*')
      .eq('user_id', user?.id)
      .eq('is_private', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching private patterns:', error);
      return;
    }

    setPatterns(data);
  };

  const uploadPattern = async () => {
    if (!newPattern.name || !uploadedImage) {
      alert('Please provide a pattern name and upload an image');
      return;
    }

    const { error } = await supabase
      .from('patterns')
      .insert([
        {
          ...newPattern,
          image_url: uploadedImage,
          user_id: user?.id,
          is_private: true,
        },
      ]);

    if (error) {
      console.error('Error uploading pattern:', error);
      return;
    }

    setNewPattern({
      name: '',
      description: '',
      style: '',
    });
    setUploadedImage(null);
    setIsUploading(false);
    fetchPrivatePatterns();
  };

  const deletePattern = async (patternId: string) => {
    const { error } = await supabase
      .from('patterns')
      .delete()
      .eq('id', patternId);

    if (error) {
      console.error('Error deleting pattern:', error);
      return;
    }

    fetchPrivatePatterns();
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Private Uploads</h1>
        <button
          onClick={() => setIsUploading(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <Upload className="h-5 w-5 mr-2" />
          Upload Pattern
        </button>
      </div>

      {isUploading && (
        <div className="mb-6 p-6 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Upload New Pattern</h2>
          <input
            type="text"
            value={newPattern.name}
            onChange={(e) => setNewPattern({ ...newPattern, name: e.target.value })}
            placeholder="Pattern name"
            className="w-full p-2 border rounded-md mb-3"
          />
          <textarea
            value={newPattern.description}
            onChange={(e) => setNewPattern({ ...newPattern, description: e.target.value })}
            placeholder="Description"
            className="w-full p-2 border rounded-md mb-3"
            rows={3}
          />
          <input
            type="text"
            value={newPattern.style}
            onChange={(e) => setNewPattern({ ...newPattern, style: e.target.value })}
            placeholder="Style"
            className="w-full p-2 border rounded-md mb-3"
          />
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload pattern image
            </label>
            <div className="mt-1 flex items-center gap-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Upload className="h-5 w-5 mr-2" />
                Choose Image
              </button>
              {uploadedImage && (
                <div className="relative inline-block">
                  <img
                    src={uploadedImage}
                    alt="Preview"
                    className="h-20 w-20 object-cover rounded-md"
                  />
                  <button
                    onClick={removeUploadedImage}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Upload an image for your pattern. Max size: 5MB
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setIsUploading(false);
                setUploadedImage(null);
                setNewPattern({
                  name: '',
                  description: '',
                  style: '',
                });
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={uploadPattern}
              disabled={!newPattern.name || !uploadedImage}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
            >
              Upload
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {patterns.map((pattern) => (
          <div key={pattern.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <img
              src={pattern.image_url}
              alt={pattern.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{pattern.name}</h3>
                  <p className="text-sm text-gray-600">{pattern.style}</p>
                </div>
                <button
                  onClick={() => deletePattern(pattern.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-2 text-gray-700">{pattern.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrivateUploads;