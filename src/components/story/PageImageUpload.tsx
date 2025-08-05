"use client";

import { useState, useRef } from "react";
import { Upload, X, Camera, Loader2 } from "lucide-react";
import Image from "next/image";

interface PageImageUploadProps {
  storyId: string;
  pageNumber: number;
  currentImage?: string | null;
  onImageUploaded: (imageUrl: string) => void;
  onImageRemoved: () => void;
}

export function PageImageUpload({
  storyId,
  pageNumber,
  currentImage,
  onImageUploaded,
  onImageRemoved,
}: PageImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(
        `/api/stories/${storyId}/pages/${pageNumber}/upload-image`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload failed:", response.status, errorText);
        throw new Error(errorText || "Failed to upload image");
      }

      const result = await response.json();
      onImageUploaded(result.userUploadedImageUrl);
    } catch (err) {
      console.error("Upload failed:", err);
      setError("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    setIsUploading(true);
    try {
      const response = await fetch(
        `/api/stories/${storyId}/pages/${pageNumber}/upload-image`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove image");
      }

      onImageRemoved();
    } catch (err) {
      console.error("Remove failed:", err);
      setError("Failed to remove image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mt-4">
      {!currentImage ? (
        <>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">Add Your Photo</h4>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
          <div
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-pink-500 transition-colors ${
              isUploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            ) : (
              <>
                <Camera className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-xs text-gray-600 text-center">
                  Click to upload your own photo
                  <br />
                  <span className="text-xs text-gray-500">JPG, PNG up to 5MB</span>
                </p>
              </>
            )}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-pink-100 rounded-lg">
              <Camera className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Your photo uploaded</p>
              <p className="text-xs text-gray-500">Click remove to use AI illustration</p>
            </div>
          </div>
          <button
            onClick={handleRemoveImage}
            disabled={isUploading}
            className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}