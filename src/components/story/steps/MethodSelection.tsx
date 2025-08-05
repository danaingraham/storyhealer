import { Camera, Edit3 } from "lucide-react";
import { CreationMethod } from "../StoryCreationWizard";

interface MethodSelectionProps {
  onSelect: (method: CreationMethod) => void;
}

export function MethodSelection({ onSelect }: MethodSelectionProps) {
  return (
    <div className="text-center">
      <h3 className="font-fredoka text-3xl font-bold mb-4">
        How would you like to create your character?
      </h3>
      <p className="text-gray-600 mb-8">
        Choose how you'd like to personalize your child's hero character
      </p>

      <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <button
          onClick={() => onSelect("manual")}
          className="group relative p-8 rounded-xl border-2 border-gray-200 hover:border-pink-500 transition-all duration-300 card-hover"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-4 bg-pink-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Edit3 className="h-10 w-10 text-pink-500" />
            </div>
            <h4 className="font-fredoka text-xl font-semibold mb-2">
              Describe Your Child
            </h4>
            <p className="text-gray-600">
              Enter details about your child's appearance to create their character
            </p>
          </div>
        </button>

        <button
          onClick={() => onSelect("photo")}
          className="group relative p-8 rounded-xl border-2 border-gray-200 hover:border-purple-500 transition-all duration-300 card-hover"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Camera className="h-10 w-10 text-purple-500" />
            </div>
            <h4 className="font-fredoka text-xl font-semibold mb-2">
              Upload a Photo
            </h4>
            <p className="text-gray-600">
              Upload your child's photo and our AI will create their character
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}