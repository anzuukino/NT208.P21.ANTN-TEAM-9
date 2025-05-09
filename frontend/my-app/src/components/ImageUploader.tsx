// components/ImageUploader.tsx
'use client';
import { useState, useRef, ChangeEvent } from 'react';
import Image from 'next/image';

const ImageUploader = () => {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [];
    const fileArray = Array.from(files).slice(0, 1); // Limit to first 4 files

    fileArray.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newImages.push(event.target.result as string);
          
          // Only update state when all files are processed
          if (newImages.length === fileArray.length) {
            setSelectedImages(prev => {
              const combined = [...prev, ...newImages];
              return combined.slice(0, 1); // Ensure max 4 images
            });
          }
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Image Upload</h2>
      
      {/* Upload area */}
      <div className="mb-6">
        <label 
          htmlFor="image-upload" 
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg className="w-8 h-8 mb-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
            <p className="text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Upload an image in PNG, JPG, GIF 
            </p>
          </div>
          <input 
            id="image-upload" 
            type="file" 
            className="hidden" 
            accept="image/*" 
            multiple 
            onChange={handleImageUpload}
            ref={fileInputRef}
          />
        </label>
      </div>
      
      {/* Preview area */}
      <div className="flex justify-center">
        {selectedImages.length > 0 ? (
          selectedImages.map((src, index) => (
            <div key={index} className="relative w-full h-[30vh] rounded-lg overflow-hidden border border-gray-200">
              <Image 
                src={src} 
                alt={`Selected image ${index + 1}`} 
                fill 
                style={{ objectFit: 'cover' }} 
              />
              <button 
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center py-8 text-gray-500">
            No images selected
          </div>
        )}
        
        {/* Empty slots */}
      </div>
    </div>
  );
};

export default ImageUploader;