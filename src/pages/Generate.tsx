import React, { useState, useRef } from 'react';
import { Sparkles, Download, Upload, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import axios from 'axios';

interface GeneratePayload {
  prompt: string;
  output_format: string;
  init_image?: string;
}

// Get environment variable
const STABILITY_API_KEY = import.meta.env.VITE_STABILITY_API_KEY;

const Generate = () => {
  const { user } = useAuthStore();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image size should be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setReferenceImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeReferenceImage = () => {
    setReferenceImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generatePattern = async () => {
    if (!STABILITY_API_KEY) {
      setError('API key not configured');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const payload: GeneratePayload = {
        prompt: prompt,
        output_format: "jpeg"
      };

      // If there's a reference image, add it to the payload
      if (referenceImage) {
        // Remove the data:image/jpeg;base64, prefix
        const base64Image = referenceImage.split(',')[1];
        payload.init_image = base64Image;
      }

      const response = await axios.postForm(
        `https://api.stability.ai/v2beta/stable-image/generate/sd3`,
        axios.toFormData(payload),
        {
          validateStatus: undefined,
          responseType: "arraybuffer",
          headers: { 
            Authorization: `Bearer ${STABILITY_API_KEY}`, 
            Accept: "image/*" 
          },
        },
      );

      if (response.status === 402) {
        throw new Error('API credit limit reached. Please check your Stability AI account balance.');
      } else if (response.status === 401) {
        throw new Error('Invalid or expired API key. Please check your API key configuration.');
      } else if (response.status !== 200) {
        throw new Error(`API Error: ${response.status} - Please try again later.`);
      }

      // Convert array buffer to base64
      const arrayBuffer = response.data;
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Image = btoa(binary);
      const imageUrl = `data:image/jpeg;base64,${base64Image}`;
      setGeneratedImage(imageUrl);
    } catch (err: any) {
      if (err.message.includes('credit limit')) {
        setError('Your API credit limit has been reached. Please check your Stability AI account balance at https://platform.stability.ai/account');
      } else if (err.message.includes('API key')) {
        setError('Invalid or expired API key. Please check your API key configuration.');
      } else {
        setError('Failed to generate pattern. Please try again later.');
      }
      console.error('Error generating pattern:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveToPrivateUploads = async () => {
    if (!generatedImage) return;

    try {
      const { error } = await supabase
        .from('patterns')
        .insert([
          {
            name: `Generated Pattern - ${new Date().toLocaleDateString()}`,
            description: prompt,
            style: 'AI Generated',
            image_url: generatedImage,
            user_id: user?.id,
            is_private: true,
          },
        ]);

      if (error) throw error;

      alert('Pattern saved to private uploads!');
    } catch (err) {
      console.error('Error saving pattern:', err);
      alert('Failed to save pattern');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Generate Handloom Patterns</h1>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload a reference image (optional)
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
            {referenceImage && (
              <div className="relative inline-block">
                <img
                  src={referenceImage}
                  alt="Reference"
                  className="h-20 w-20 object-cover rounded-md"
                />
                <button
                  onClick={removeReferenceImage}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Upload an image to use as reference for the pattern generation. Max size: 5MB
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Describe the pattern you want to generate
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="w-full p-3 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="E.g., A traditional South Indian handloom pattern with peacock motifs in blue and gold..."
          />
        </div>

        <button
          onClick={generatePattern}
          disabled={loading || !prompt.trim()}
          className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
        >
          {loading ? (
            'Generating...'
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" />
              Generate Pattern
            </>
          )}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {generatedImage && (
          <div className="mt-8">
            <div className="relative">
              <img
                src={generatedImage}
                alt="Generated pattern"
                className="w-full rounded-lg shadow-lg"
              />
              <button
                onClick={saveToPrivateUploads}
                className="absolute top-4 right-4 flex items-center px-4 py-2 bg-white text-indigo-600 rounded-md shadow hover:bg-indigo-50"
              >
                <Download className="h-5 w-5 mr-2" />
                Save to Private Uploads
              </button>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Prompt: {prompt}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Generate;