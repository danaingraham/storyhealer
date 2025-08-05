"use client";

import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Upload, Camera, X } from "lucide-react";
import { CharacterData } from "../StoryCreationWizard";
import Image from "next/image";

interface PhotoUploadFormProps {
  initialData: CharacterData;
  onComplete: (data: CharacterData) => void;
  onBack: () => void;
}

export function PhotoUploadForm({
  initialData,
  onComplete,
  onBack,
}: PhotoUploadFormProps) {
  const [formData, setFormData] = useState<CharacterData>(initialData);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors({ photo: "Please select a valid image file" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors({ photo: "Image size must be less than 5MB" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPhotoPreview(dataUrl);
      setFormData({ ...formData, photoUrl: dataUrl });
      analyzePhoto(file);
    };
    reader.readAsDataURL(file);
  };

  const analyzePhoto = async (file: File) => {
    setIsAnalyzing(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("photo", file);

      const response = await fetch("/api/analyze-photo", {
        method: "POST",
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error("Failed to analyze photo");
      }

      const result = await response.json();
      setFormData((prev) => ({
        ...prev,
        appearanceDescription: result.description,
      }));
    } catch (error) {
      console.error("Photo analysis failed:", error);
      setErrors({ photo: "Failed to analyze photo. Please try again." });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setFormData({ ...formData, photoUrl: undefined, appearanceDescription: undefined });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!formData.age || formData.age < 2 || formData.age > 12) {
      newErrors.age = "Age must be between 2 and 12";
    }

    if (!photoPreview) {
      newErrors.photo = "Please upload a photo";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onComplete(formData);
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h3 className="font-fredoka text-3xl font-bold mb-4">
          Upload your child's photo
        </h3>
        <p className="text-gray-600">
          Our AI will analyze the photo to create their character
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="Enter your child's name"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Age *
          </label>
          <input
            type="number"
            min="2"
            max="12"
            value={formData.age}
            onChange={(e) =>
              setFormData({ ...formData, age: parseInt(e.target.value) || 0 })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="Enter age (2-12)"
          />
          {errors.age && (
            <p className="text-red-500 text-sm mt-1">{errors.age}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Photo *
          </label>
          
          {!photoPreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-pink-500 transition-colors"
            >
              <Camera className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 text-center">
                Click to upload a photo
                <br />
                <span className="text-sm text-gray-500">
                  JPG, PNG up to 5MB
                </span>
              </p>
            </div>
          ) : (
            <div className="relative">
              <div className="w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={photoPreview}
                  alt="Uploaded photo"
                  width={300}
                  height={192}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={removePhoto}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="loading-spinner mb-2" />
                    <p className="text-sm">Analyzing photo...</p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {errors.photo && (
            <p className="text-red-500 text-sm mt-1">{errors.photo}</p>
          )}
          
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-1">Photo Tips:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use a clear, well-lit photo</li>
              <li>• Face should be clearly visible</li>
              <li>• Avoid group photos or busy backgrounds</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-4 pt-6">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 btn-secondary flex items-center justify-center"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </button>
          <button
            type="submit"
            disabled={isAnalyzing}
            className="flex-1 btn-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}