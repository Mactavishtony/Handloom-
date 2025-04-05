import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Upload, X, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import ImageModal from '../components/ImageModal';

interface Album {
  id: string;
  name: string;
  category: string;
  preview_image?: string;
  created_at: string;
}

interface Pattern {
  id: string;
  name: string;
  description: string;
  style: string;
  image_url: string;
  created_at: string;
}

const Patterns = () => {
  const { user } = useAuthStore();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [isUploadingPattern, setIsUploadingPattern] = useState(false);
  const [selectedImage, setSelectedImage] = useState<Pattern | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newPattern, setNewPattern] = useState({
    name: '',
    description: '',
    style: '',
  });

  useEffect(() => {
    fetchAlbums();
  }, []);

  useEffect(() => {
    if (albums.length > 0) {
      const uniqueCategories = Array.from(new Set(albums.map(album => album.category || 'Uncategorized')));
      setCategories(uniqueCategories);
    }
  }, [albums]);

  useEffect(() => {
    if (selectedAlbum) {
      fetchPatterns(selectedAlbum);
    }
  }, [selectedAlbum]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePreviewImage = () => {
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const fetchAlbums = async () => {
    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching albums:', error);
      return;
    }

    setAlbums(data);
  };

  const fetchPatterns = async (albumId: string) => {
    const { data, error } = await supabase
      .from('patterns')
      .select('*')
      .eq('album_id', albumId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching patterns:', error);
      return;
    }

    setPatterns(data);
  };

  const createAlbum = async () => {
    if (!newAlbumName.trim()) return;
    if (!user?.id) {
      console.error('No user ID found');
      return;
    }

    try {
      // Prepare the data
      const albumData: {
        name: string;
        category: string;
        user_id: string;
        preview_image: string | null;
      } = {
        name: newAlbumName.trim(),
        category: 'custom',
        user_id: user.id,
        preview_image: null
      };

      // If there's a preview image, validate its size
      if (previewImage) {
        // Check if base64 string is too large (max 1MB after encoding)
        if (previewImage.length > 1024 * 1024) {
          const compressedImage = await compressImage(previewImage);
          albumData.preview_image = compressedImage;
        } else {
          albumData.preview_image = previewImage;
        }
      }

      console.log('Creating album with data:', { 
        ...albumData, 
        preview_image: albumData.preview_image ? 'base64_image_data' : null 
      });

      const { data, error } = await supabase
        .from('albums')
        .insert(albumData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      console.log('Album created successfully:', data);

      setNewAlbumName('');
      setPreviewImage(null);
      setIsCreatingAlbum(false);
      fetchAlbums();
    } catch (error) {
      console.error('Error creating album:', error);
    }
  };

  // Helper function to compress image
  const compressImage = async (base64String: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        // Calculate new dimensions (max 800px width/height)
        let width = img.width;
        let height = img.height;
        const maxSize = 800;

        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6)); // Compress with 0.6 quality
      };
      img.src = base64String;
    });
  };

  const deleteAlbum = async (albumId: string) => {
    const { error } = await supabase
      .from('albums')
      .delete()
      .eq('id', albumId);

    if (error) {
      console.error('Error deleting album:', error);
      return;
    }

    fetchAlbums();
    if (selectedAlbum === albumId) {
      setSelectedAlbum(null);
      setPatterns([]);
    }
  };

  const uploadPattern = async () => {
    if (!selectedAlbum || !previewImage || !newPattern.name) return;

    const { error } = await supabase
      .from('patterns')
      .insert([
        {
          ...newPattern,
          image_url: previewImage,
          album_id: selectedAlbum,
          user_id: user?.id,
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
    setPreviewImage(null);
    setIsUploadingPattern(false);
    fetchPatterns(selectedAlbum);
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

    fetchPatterns(selectedAlbum!);
  };

  const filteredAlbums = selectedCategory
    ? albums.filter(album => album.category === selectedCategory)
    : albums;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Pattern Albums</h2>
          <button
            onClick={() => setIsCreatingAlbum(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Album
          </button>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by Category:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedCategory === null
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedCategory === category
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {(category || 'Uncategorized').split('-').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </button>
            ))}
          </div>
        </div>

        {isCreatingAlbum && (
          <div className="mb-4 p-6 bg-white rounded-lg shadow">
            <input
              type="text"
              value={newAlbumName}
              onChange={(e) => setNewAlbumName(e.target.value)}
              placeholder="Album name"
              className="w-full p-2 border rounded-md mb-4"
            />
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload album preview image (optional)
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
                {previewImage && (
                  <div className="relative inline-block">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="h-20 w-20 object-cover rounded-md"
                    />
                    <button
                      onClick={removePreviewImage}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsCreatingAlbum(false);
                  setPreviewImage(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={createAlbum}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Create
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredAlbums.map((album) => (
            <div
              key={album.id}
              className={`p-4 bg-white rounded-lg shadow cursor-pointer transition-all ${
                selectedAlbum === album.id ? 'ring-2 ring-indigo-500' : ''
              }`}
              onClick={() => setSelectedAlbum(album.id)}
            >
              {album.preview_image && (
                <div className="mb-3">
                  <img
                    src={album.preview_image}
                    alt={album.name}
                    className="w-full h-32 object-cover rounded-md"
                  />
                </div>
              )}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{album.name}</h3>
                  <p className="text-sm text-gray-500">
                    {(album.category || 'Uncategorized').split('-').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </p>
                </div>
                {album.category === 'custom' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteAlbum(album.id);
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedAlbum && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Patterns</h2>
            <button
              onClick={() => setIsUploadingPattern(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <Upload className="h-5 w-5 mr-2" />
              Upload Pattern
            </button>
          </div>

          {isUploadingPattern && (
            <div className="mb-6 p-6 bg-white rounded-lg shadow">
              <input
                type="text"
                value={newPattern.name}
                onChange={(e) => setNewPattern({ ...newPattern, name: e.target.value })}
                placeholder="Pattern name"
                className="w-full p-2 border rounded-md mb-2"
              />
              <textarea
                value={newPattern.description}
                onChange={(e) => setNewPattern({ ...newPattern, description: e.target.value })}
                placeholder="Description"
                className="w-full p-2 border rounded-md mb-2"
              />
              <input
                type="text"
                value={newPattern.style}
                onChange={(e) => setNewPattern({ ...newPattern, style: e.target.value })}
                placeholder="Style"
                className="w-full p-2 border rounded-md mb-4"
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
                  {previewImage && (
                    <div className="relative inline-block">
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="h-20 w-20 object-cover rounded-md"
                      />
                      <button
                        onClick={removePreviewImage}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setIsUploadingPattern(false);
                    setPreviewImage(null);
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
                  disabled={!newPattern.name || !previewImage}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
                >
                  Upload
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {patterns.map((pattern) => (
              <div 
                key={pattern.id} 
                className="bg-white rounded-lg shadow-lg overflow-hidden hover-card cursor-pointer"
                onClick={() => setSelectedImage(pattern)}
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={pattern.image_url}
                    alt={pattern.name}
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{pattern.name}</h3>
                      <p className="text-sm text-gray-600">{pattern.style}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePattern(pattern.id);
                      }}
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
      )}

      <ImageModal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        imageUrl={selectedImage?.image_url || ''}
        title={selectedImage?.name || ''}
      />
    </div>
  );
};

export default Patterns;