// components/ImageUploader.tsx
'use client';
import { useState, useRef, ChangeEvent, useCallback } from 'react';
import Image from 'next/image';
import { FiUpload, FiX } from 'react-icons/fi';

interface ImageUploaderProps {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedFormats?: string[];
}

const ImageUploader = ({
  onFilesChange,
  maxFiles = 1,
  maxSizeMB = 5,
  acceptedFormats = ['image/png', 'image/jpeg', 'image/webp']
}: ImageUploaderProps) => {
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate file count
    if (files.length > maxFiles) {
      setError(`You can upload up to ${maxFiles} file${maxFiles > 1 ? 's' : ''}`);
      return;
    }

    const validFiles: File[] = [];
    const newPreviewUrls: string[] = [];

    Array.from(files).forEach(file => {
      // Validate file type
      if (!acceptedFormats.includes(file.type)) {
        setError(`Invalid file type: ${file.name}. Please upload ${acceptedFormats.join(', ')}`);
        return;
      }

      // Validate file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File too large: ${file.name} (max ${maxSizeMB}MB)`);
        return;
      }

      validFiles.push(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newPreviewUrls.push(event.target.result as string);
          
          // Update state when all files are processed
          if (newPreviewUrls.length === validFiles.length) {
            setPreviewUrls(prev => {
              const combined = [...prev, ...newPreviewUrls];
              return combined.slice(0, maxFiles);
            });
            onFilesChange(validFiles.slice(0, maxFiles));
          }
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [maxFiles, maxSizeMB, acceptedFormats, onFilesChange]);

  const removeImage = (index: number) => {
    setPreviewUrls(prev => {
      const newUrls = prev.filter((_, i) => i !== index);
      return newUrls;
    });
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(previewUrls[index]);
  };

  return (
    <div className="w-full space-y-4">
      {/* Upload area */}
      <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
        <div className="flex flex-col items-center justify-center p-5">
          <FiUpload className="w-8 h-8 mb-3 text-gray-400" />
          <p className="text-sm text-gray-500 text-center">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {`${acceptedFormats.join(', ')} (max ${maxFiles} file${maxFiles > 1 ? 's' : ''}, ${maxSizeMB}MB each)`}
          </p>
        </div>
        <input 
          type="file" 
          className="hidden" 
          accept={acceptedFormats.join(',')} 
          multiple={maxFiles > 1}
          onChange={handleImageUpload}
          ref={fileInputRef}
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="text-red-500 text-sm p-2 bg-red-50 rounded">
          {error}
        </div>
      )}

      {/* Preview area */}
      <div className="grid grid-cols-1 gap-4">
        {previewUrls.length > 0 ? (
          previewUrls.map((src, index) => (
            <div key={index} className="relative w-full h-64 rounded-lg overflow-hidden border border-gray-200">
              <Image
                src={src}
                alt={`Preview ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                aria-label="Remove image"
              >
                <FiX className="w-3 h-3" />
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-gray-400">
            No images selected
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;