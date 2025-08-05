"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MethodSelection } from "./steps/MethodSelection";
import { ManualCharacterForm } from "./steps/ManualCharacterForm";
import { PhotoUploadForm } from "./steps/PhotoUploadForm";
import { FearInput } from "./steps/FearInput";
import { StoryGeneration } from "./steps/StoryGeneration";

export type CreationMethod = "manual" | "photo" | null;

export interface CharacterData {
  name: string;
  age: number;
  gender?: string;
  hairColor?: string;
  photoUrl?: string;
  appearanceDescription?: string;
}

export interface StoryData {
  childId?: string;
  fearDescription: string;
}

const STEPS = {
  METHOD: 1,
  CHARACTER: 2,
  FEAR: 3,
  GENERATE: 4,
};

export function StoryCreationWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(STEPS.METHOD);
  const [method, setMethod] = useState<CreationMethod>(null);
  const [characterData, setCharacterData] = useState<CharacterData>({
    name: "",
    age: 5,
  });
  const [storyData, setStoryData] = useState<StoryData>({
    fearDescription: "",
  });

  const handleMethodSelect = (selectedMethod: CreationMethod) => {
    setMethod(selectedMethod);
    setCurrentStep(STEPS.CHARACTER);
  };

  const handleCharacterComplete = (data: CharacterData) => {
    setCharacterData(data);
    setCurrentStep(STEPS.FEAR);
  };

  const handleFearComplete = (fear: string) => {
    setStoryData({ ...storyData, fearDescription: fear });
    setCurrentStep(STEPS.GENERATE);
  };

  const handleBack = () => {
    if (currentStep === STEPS.CHARACTER) {
      setCurrentStep(STEPS.METHOD);
    } else if (currentStep === STEPS.FEAR) {
      setCurrentStep(STEPS.CHARACTER);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case STEPS.METHOD:
        return <MethodSelection onSelect={handleMethodSelect} />;
      case STEPS.CHARACTER:
        return method === "manual" ? (
          <ManualCharacterForm
            initialData={characterData}
            onComplete={handleCharacterComplete}
            onBack={handleBack}
          />
        ) : (
          <PhotoUploadForm
            initialData={characterData}
            onComplete={handleCharacterComplete}
            onBack={handleBack}
          />
        );
      case STEPS.FEAR:
        return (
          <FearInput
            initialFear={storyData.fearDescription}
            onComplete={handleFearComplete}
            onBack={handleBack}
          />
        );
      case STEPS.GENERATE:
        return (
          <StoryGeneration
            characterData={characterData}
            storyData={storyData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen gradient-bg py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-fredoka text-2xl font-semibold">
                Create Your Story
              </h2>
              <span className="text-sm text-gray-600">
                Step {currentStep} of 4
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-300"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
            {renderStep()}
          </div>
        </div>
      </div>
    </div>
  );
}