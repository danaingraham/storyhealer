"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, BookOpen, Image, CheckCircle, AlertCircle } from "lucide-react";
import { CharacterData, StoryData } from "../StoryCreationWizard";

interface StoryGenerationProps {
  characterData: CharacterData;
  storyData: StoryData;
}

interface GenerationStep {
  id: string;
  title: string;
  icon: React.ReactNode;
  status: "pending" | "in-progress" | "completed" | "error";
}

export function StoryGeneration({ characterData, storyData }: StoryGenerationProps) {
  const router = useRouter();
  const [steps, setSteps] = useState<GenerationStep[]>([
    {
      id: "character",
      title: "Creating character profile",
      icon: <Sparkles className="h-5 w-5" />,
      status: "pending",
    },
    {
      id: "story",
      title: "Generating story text",
      icon: <BookOpen className="h-5 w-5" />,
      status: "pending",
    },
    {
      id: "illustrations",
      title: "Creating illustrations",
      icon: <Image className="h-5 w-5" />,
      status: "pending",
    },
  ]);
  const [storyId, setStoryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateStory();
  }, []);

  const updateStepStatus = (stepId: string, status: GenerationStep["status"]) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
  };

  // Helper function to add timeout to fetch requests
  const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 30000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch (error: any) {
      clearTimeout(id);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    }
  };

  const generateStory = async () => {
    try {
      // Step 1: Create character profile
      updateStepStatus("character", "in-progress");
      
      const characterResponse = await fetchWithTimeout("/api/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(characterData),
      }, 10000);

      if (!characterResponse.ok) {
        throw new Error("Failed to create character");
      }

      const child = await characterResponse.json();
      updateStepStatus("character", "completed");

      // Step 2: Generate story
      updateStepStatus("story", "in-progress");
      
      const storyResponse = await fetchWithTimeout("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: child.id,
          fearDescription: storyData.fearDescription,
        }),
      }, 60000); // 60 second timeout for story generation

      if (!storyResponse.ok) {
        const errorData = await storyResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to generate story (${storyResponse.status})`);
      }

      const story = await storyResponse.json();
      setStoryId(story.id);
      updateStepStatus("story", "completed");

      // Step 3: Start generating illustrations in background
      updateStepStatus("illustrations", "in-progress");
      
      // Fire off illustration generation but don't wait for it
      fetch(`/api/stories/${story.id}/illustrations`, {
        method: "POST",
      }).then(() => {
        console.log("Illustration generation started in background");
      }).catch((error) => {
        console.error("Failed to start illustration generation:", error);
      });

      // Mark as completed (they'll generate in background)
      updateStepStatus("illustrations", "completed");

      // Redirect to story viewer immediately
      setTimeout(() => {
        router.push(`/story/${story.id}`);
      }, 1500);

    } catch (error) {
      console.error("Story generation failed:", error);
      setError(error instanceof Error ? error.message : "Something went wrong");
      
      // Mark current step as error
      const currentStep = steps.find(step => step.status === "in-progress");
      if (currentStep) {
        updateStepStatus(currentStep.id, "error");
      }
    }
  };

  const retryGeneration = () => {
    setError(null);
    setSteps(prev => prev.map(step => ({ ...step, status: "pending" })));
    generateStory();
  };

  if (error) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="font-fredoka text-2xl font-bold mb-4">
          Oops! Something went wrong
        </h3>
        <p className="text-gray-600 mb-6">{error}</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={retryGeneration}
            className="btn-primary"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="btn-secondary"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const allCompleted = steps.every(step => step.status === "completed");

  return (
    <div className="text-center">
      <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
        <Sparkles className="h-10 w-10 text-white" />
      </div>
      
      <h3 className="font-fredoka text-3xl font-bold mb-4">
        Creating Your Magical Story!
      </h3>
      
      <p className="text-gray-600 mb-8">
        Our AI is crafting a personalized adventure for {characterData.name}
      </p>

      <div className="max-w-md mx-auto space-y-4 mb-8">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-center p-4 rounded-lg border-2 transition-all ${
              step.status === "completed"
                ? "border-green-500 bg-green-50"
                : step.status === "in-progress"
                ? "border-pink-500 bg-pink-50"
                : step.status === "error"
                ? "border-red-500 bg-red-50"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            <div className="flex-shrink-0 mr-4">
              {step.status === "completed" ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : step.status === "error" ? (
                <AlertCircle className="h-6 w-6 text-red-500" />
              ) : step.status === "in-progress" ? (
                <div className="loading-spinner w-6 h-6" />
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className={`font-medium ${
                step.status === "completed" 
                  ? "text-green-700"
                  : step.status === "error"
                  ? "text-red-700"
                  : step.status === "in-progress"
                  ? "text-pink-700"
                  : "text-gray-700"
              }`}>
                {step.title}
              </p>
            </div>
            <div className="flex-shrink-0 ml-4">
              {React.isValidElement(step.icon) && React.cloneElement(step.icon, {
                className: `h-5 w-5 ${
                  step.status === "completed"
                    ? "text-green-500"
                    : step.status === "error"
                    ? "text-red-500"
                    : step.status === "in-progress"
                    ? "text-pink-500"
                    : "text-gray-400"
                }`,
              } as any)}
            </div>
          </div>
        ))}
      </div>

      {allCompleted && (
        <div className="animate-bounce-in">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h4 className="font-fredoka text-2xl font-bold text-green-700 mb-2">
            Story Complete!
          </h4>
          <p className="text-gray-600">
            Redirecting you to your magical story...
          </p>
        </div>
      )}
    </div>
  );
}