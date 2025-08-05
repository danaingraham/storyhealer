"use client";

import { useState } from "react";
import { X, MessageCircle, Image as ImageIcon, FileText, Send, Loader2 } from "lucide-react";

interface EditStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: any;
  currentPage: number;
  onStoryUpdate: () => void;
}

export function EditStoryModal({
  isOpen,
  onClose,
  story,
  currentPage,
  onStoryUpdate,
}: EditStoryModalProps) {
  const [activeTab, setActiveTab] = useState<"text" | "image">("text");
  const [textFeedback, setTextFeedback] = useState("");
  const [imageFeedback, setImageFeedback] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (type: "text" | "image") => {
    const feedback = type === "text" ? textFeedback : imageFeedback;
    if (!feedback.trim() || isProcessing) return;

    console.log(`[EditModal] Starting ${type} update with feedback:`, feedback);
    setIsProcessing(true);
    setLastResponse(null);

    try {
      console.log(`[EditModal] Sending request to /api/stories/${story.id}/chat`);
      const response = await fetch(`/api/stories/${story.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: feedback,
          pageNumber: currentPage,
          forceUpdateType: type, // Force the specific update type
        }),
      });

      console.log(`[EditModal] Response status:`, response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[EditModal] API error:`, response.status, errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`[EditModal] Response data:`, data);
      console.log(`[EditModal] storyUpdated flag:`, data.storyUpdated);
      console.log(`[EditModal] API response message:`, data.response);
      setLastResponse(data.response);

      // Clear the feedback input
      if (type === "text") {
        setTextFeedback("");
      } else {
        setImageFeedback("");
      }

      // Refresh story if changes were made
      if (data.storyUpdated) {
        console.log(`[EditModal] Story was updated, refreshing...`);
        setTimeout(() => {
          onStoryUpdate();
        }, 500);
      } else {
        console.log(`[EditModal] No story updates made`);
      }
    } catch (error) {
      console.error("Edit request failed:", error);
      setLastResponse(`Error: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const currentPageData = story.pages.find((p: any) => p.pageNumber === currentPage);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-pink-500 to-purple-500 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Edit Story Page</h3>
              <p className="text-sm opacity-90">Page {currentPage} of {story.pages.length}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex h-[600px]">
          {/* Left side - Current Page Preview */}
          <div className="w-1/2 p-6 border-r bg-gray-50">
            <h4 className="font-semibold text-gray-800 mb-4">Current Page Content</h4>
            
            {/* Current Image */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-600 mb-2">Current Illustration:</p>
              <div className="w-full h-48 bg-gray-200 rounded-lg overflow-hidden">
                {currentPageData?.userUploadedImageUrl ? (
                  <img
                    src={currentPageData.userUploadedImageUrl}
                    alt="Current page illustration"
                    className="w-full h-full object-cover"
                  />
                ) : currentPageData?.illustrationUrl ? (
                  <img
                    src={currentPageData.illustrationUrl}
                    alt="Current page illustration"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Current Text */}
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Current Text:</p>
              <div className="p-4 bg-white rounded-lg border">
                <p className="text-gray-800 leading-relaxed">
                  {currentPageData?.text || "Loading text..."}
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Edit Interface */}
          <div className="w-1/2 flex flex-col">
            {/* Tabs */}
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab("text")}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === "text"
                    ? "text-pink-600 border-b-2 border-pink-600 bg-pink-50"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                <FileText className="h-4 w-4 inline mr-2" />
                Edit Text
              </button>
              <button
                onClick={() => setActiveTab("image")}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === "image"
                    ? "text-purple-600 border-b-2 border-purple-600 bg-purple-50"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                <ImageIcon className="h-4 w-4 inline mr-2" />
                Edit Image
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6">
              {activeTab === "text" ? (
                <div className="h-full flex flex-col">
                  <div className="mb-4">
                    <h5 className="font-medium text-gray-800 mb-2">Text Editing Options</h5>
                    <p className="text-sm text-gray-600 mb-4">
                      Either describe changes you want made, or provide exact text to replace the current page.
                    </p>
                    <div className="text-xs text-gray-500 space-y-1 mb-3">
                      <p><strong>Modification examples:</strong></p>
                      <p>• "Make it more exciting and adventurous"</p>
                      <p>• "Add more dialogue between characters"</p>
                      <p>• "Make the character feel more confident"</p>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p><strong>Exact text replacement:</strong></p>
                      <p>• Start with "Change the text to: " then paste your exact text</p>
                      <p>• Example: "Change the text to: Hannah took a deep breath and jumped into the pool with a big splash!"</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    <textarea
                      value={textFeedback}
                      onChange={(e) => setTextFeedback(e.target.value)}
                      placeholder="Either describe changes OR start with 'Change the text to: ' followed by your exact text..."
                      className="flex-1 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                      disabled={isProcessing}
                    />
                    
                    <button
                      onClick={() => handleSubmit("text")}
                      disabled={!textFeedback.trim() || isProcessing}
                      className="mt-4 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Updating Text...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Update Text
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  <div className="mb-4">
                    <h5 className="font-medium text-gray-800 mb-2">Image Editing Instructions</h5>
                    <p className="text-sm text-gray-600 mb-4">
                      Describe how you want to change the illustration. Focus on visual elements, colors, and scene details.
                    </p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>• "Add a rainbow in the background"</p>
                      <p>• "Make the character look happier"</p>
                      <p>• "Change the scene to be outdoors"</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    <textarea
                      value={imageFeedback}
                      onChange={(e) => setImageFeedback(e.target.value)}
                      placeholder="Describe how you want to change the illustration..."
                      className="flex-1 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      disabled={isProcessing}
                    />
                    
                    <button
                      onClick={() => handleSubmit("image")}
                      disabled={!imageFeedback.trim() || isProcessing}
                      className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Updating Image...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Update Image
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Response Display */}
              {lastResponse && (
                <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-700">{lastResponse}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}