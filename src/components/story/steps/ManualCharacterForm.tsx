"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CharacterData } from "../StoryCreationWizard";

interface ManualCharacterFormProps {
  initialData: CharacterData;
  onComplete: (data: CharacterData) => void;
  onBack: () => void;
}

const HAIR_COLORS = [
  "Blonde",
  "Brown",
  "Black",
  "Red",
  "Auburn",
  "Gray",
  "White",
];

const GENDERS = [
  { value: "boy", label: "Boy" },
  { value: "girl", label: "Girl" },
  { value: "non-binary", label: "Non-binary" },
];

export function ManualCharacterForm({
  initialData,
  onComplete,
  onBack,
}: ManualCharacterFormProps) {
  const [formData, setFormData] = useState<CharacterData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!formData.age || formData.age < 2 || formData.age > 12) {
      newErrors.age = "Age must be between 2 and 12";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Generate appearance description from form data
    const appearanceDescription = generateAppearanceDescription(formData);
    
    onComplete({
      ...formData,
      appearanceDescription,
    });
  };

  const generateAppearanceDescription = (data: CharacterData): string => {
    const parts = [];
    
    if (data.age) {
      parts.push(`${data.age} year old`);
    }
    
    if (data.gender) {
      parts.push(data.gender);
    }
    
    if (data.hairColor) {
      parts.push(`with ${data.hairColor.toLowerCase()} hair`);
    }
    
    parts.push("with a friendly smile and bright eyes");
    
    return parts.join(" ");
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h3 className="font-fredoka text-3xl font-bold mb-4">
          Tell us about your child
        </h3>
        <p className="text-gray-600">
          Help us create the perfect character for your story
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
            Gender
          </label>
          <div className="grid grid-cols-3 gap-2">
            {GENDERS.map((gender) => (
              <button
                key={gender.value}
                type="button"
                onClick={() =>
                  setFormData({ ...formData, gender: gender.value })
                }
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  formData.gender === gender.value
                    ? "bg-pink-500 text-white border-pink-500"
                    : "bg-white text-gray-700 border-gray-300 hover:border-pink-500"
                }`}
              >
                {gender.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hair Color
          </label>
          <select
            value={formData.hairColor || ""}
            onChange={(e) =>
              setFormData({ ...formData, hairColor: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="">Select hair color</option>
            {HAIR_COLORS.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
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
            className="flex-1 btn-primary flex items-center justify-center"
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}