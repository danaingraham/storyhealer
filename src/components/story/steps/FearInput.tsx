"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface FearInputProps {
  initialFear: string;
  onComplete: (fear: string) => void;
  onBack: () => void;
}

const COMMON_FEARS = [
  "The dark",
  "Swimming",
  "Starting school",
  "Monsters under the bed",
  "Thunderstorms",
  "Going to the doctor",
  "Being alone",
  "Meeting new people",
  "Heights",
  "Dogs or other animals",
  "Loud noises",
  "Nightmares",
];

export function FearInput({ initialFear, onComplete, onBack }: FearInputProps) {
  const [fearText, setFearText] = useState(initialFear);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleQuickSelect = (fear: string) => {
    setFearText(fear);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fearText.trim()) {
      setErrors({ fear: "Please describe what your child is afraid of" });
      return;
    }

    if (fearText.trim().length < 3) {
      setErrors({ fear: "Please provide more details about the fear" });
      return;
    }

    onComplete(fearText.trim());
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h3 className="font-fredoka text-3xl font-bold mb-4">
          What is your child afraid of?
        </h3>
        <p className="text-gray-600">
          Tell us about their fear so we can create a story to help them overcome it
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Quick Select Common Fears
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {COMMON_FEARS.map((fear) => (
              <button
                key={fear}
                type="button"
                onClick={() => handleQuickSelect(fear)}
                className={`p-3 text-sm rounded-lg border transition-colors text-left ${
                  fearText === fear
                    ? "bg-pink-500 text-white border-pink-500"
                    : "bg-white text-gray-700 border-gray-300 hover:border-pink-500 hover:bg-pink-50"
                }`}
              >
                {fear}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Or describe the fear in your own words *
          </label>
          <textarea
            value={fearText}
            onChange={(e) => setFearText(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
            placeholder="Tell us what your child is afraid of and any specific details that might help..."
          />
          {errors.fear && (
            <p className="text-red-500 text-sm mt-1">{errors.fear}</p>
          )}
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">
            💝 How stories help overcome fears:
          </h4>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Stories provide a safe way to explore fears</li>
            <li>• Seeing themselves as the hero builds confidence</li>
            <li>• Repeated reading reinforces positive outcomes</li>
            <li>• Creates bonding moments during story time</li>
          </ul>
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
            Create Story
            <ChevronRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}