"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Share2, 
  MessageCircle,
  Home,
  Loader2,
  Plus,
  Trash2,
  Grid3X3
} from "lucide-react";
import Link from "next/link";
import { PageImageUpload } from "./PageImageUpload";
import { InsertPageDialog } from "./InsertPageDialog";
import { DeletePageDialog } from "./DeletePageDialog";
import { EditStoryModal } from "./EditStoryModal";
import { AIAgent } from "./AIAgent";
import { PageOverview } from "./PageOverview";
import { BookViewer } from "./BookViewer";

interface StoryPage {
  id: string;
  pageNumber: number;
  text: string;
  illustrationUrl?: string;
  illustrationPrompt: string;
  charactersInScene: string[];
  userUploadedImageUrl?: string | null;
}

interface Story {
  id: string;
  title: string;
  fearDescription: string;
  generationStatus: string;
  child: {
    id: string;
    name: string;
    age: number;
    appearanceDescription: string;
  };
  pages: StoryPage[];
}

interface StoryViewerProps {
  storyId: string;
  isPublic?: boolean;
  shareToken?: string;
}

export function StoryViewer({ storyId, isPublic = false, shareToken }: StoryViewerProps) {
  const { data: session } = useSession();
  const [story, setStory] = useState<Story | null>(null);
  const [currentSpread, setCurrentSpread] = useState(0); // Track which spread we're on
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInsertDialog, setShowInsertDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPageOverview, setShowPageOverview] = useState(false);
  const [illustrationsLoading, setIllustrationsLoading] = useState<Set<number>>(new Set());
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchStory();
  }, [storyId]);

  // Check for illustration updates
  useEffect(() => {
    if (!story || isPublic) return;

    // Find pages without illustrations
    const pagesWithoutIllustrations = story.pages.filter(
      page => !page.illustrationUrl && !page.userUploadedImageUrl
    );

    if (pagesWithoutIllustrations.length > 0) {
      // Mark these pages as loading
      setIllustrationsLoading(new Set(pagesWithoutIllustrations.map(p => p.pageNumber)));
      
      // Start polling for updates
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/stories/${storyId}`, {
            cache: 'no-store',
          });
          
          if (response.ok) {
            const updatedStory = await response.json();
            setStory(updatedStory);
            
            // Check if all illustrations are done
            const stillMissing = updatedStory.pages.filter(
              (page: StoryPage) => !page.illustrationUrl && !page.userUploadedImageUrl
            );
            
            if (stillMissing.length === 0) {
              // All done, stop polling
              clearInterval(interval);
              setIllustrationsLoading(new Set());
            } else {
              // Update loading set
              setIllustrationsLoading(new Set(stillMissing.map((p: StoryPage) => p.pageNumber)));
            }
          }
        } catch (error) {
          console.error("Error polling for illustrations:", error);
        }
      }, 5000); // Poll every 5 seconds

      setPollingInterval(interval);

      return () => {
        clearInterval(interval);
      };
    } else {
      setIllustrationsLoading(new Set());
    }
  }, [story, storyId, isPublic]);

  // Add keyboard navigation for spreads
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!story) return;
      
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (currentSpread > 0) {
          setCurrentSpread(currentSpread - 1);
        }
      } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        const maxSpread = Math.floor((story.pages.length - 1) / 2);
        if (currentSpread < maxSpread) {
          setCurrentSpread(currentSpread + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentSpread, story]);

  const fetchStory = async () => {
    try {
      console.log("Fetching story data...");
      const url = shareToken 
        ? `/api/stories/${storyId}?token=${shareToken}`
        : `/api/stories/${storyId}`;
        
      const response = await fetch(url, {
        // Disable caching to ensure we get fresh data
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to load story");
      }

      const storyData = await response.json();
      console.log("Story data refreshed:", storyData.pages?.length, "pages");
      
      // Log the current page text for debugging
      const currentPageData = storyData.pages?.find((p: any) => p.pageNumber === currentPage);
      console.log(`Current page ${currentPage} text after refresh:`, currentPageData?.text);
      
      setStory(storyData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load story");
    } finally {
      setLoading(false);
    }
  };

  const handleSpreadChange = (newSpread: number) => {
    setCurrentSpread(newSpread);
  };

  const handleShare = async () => {
    if (!story) return;

    const shareUrl = `${window.location.origin}/shared/${story.id}?token=${shareToken || ""}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("Share link copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
      prompt("Copy this link to share:", shareUrl);
    }
  };

  const handleDownloadPDF = async () => {
    if (!story) return;

    try {
      const response = await fetch(`/api/stories/${story.id}/pdf`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${story.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("PDF download failed:", err);
      alert("Failed to download PDF. Please try again.");
    }
  };

  const handleImageUploaded = (imageUrl: string) => {
    // Update the local state to show the uploaded image immediately
    if (story && currentPageData) {
      const updatedPages = story.pages.map(page => 
        page.pageNumber === currentPage 
          ? { ...page, userUploadedImageUrl: imageUrl }
          : page
      );
      setStory({ ...story, pages: updatedPages });
    }
  };

  const handleImageRemoved = () => {
    // Update the local state to remove the uploaded image
    if (story && currentPageData) {
      const updatedPages = story.pages.map(page => 
        page.pageNumber === currentPage 
          ? { ...page, userUploadedImageUrl: null }
          : page
      );
      setStory({ ...story, pages: updatedPages });
    }
  };

  const handleInsertPage = async (position: "before" | "after", pageNumber: number) => {
    if (!story) return;

    try {
      const response = await fetch(`/api/stories/${story.id}/pages/insert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          position,
          pageNumber,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to insert page");
      }

      const result = await response.json();
      
      // Refresh the story to get the updated pages
      await fetchStory();
      
      // Navigate to the newly inserted page
      const newPageNumber = position === "before" ? pageNumber : pageNumber + 1;
      setCurrentPage(newPageNumber);
    } catch (error) {
      console.error("Failed to insert page:", error);
      alert("Failed to insert page. Please try again.");
    }
  };

  const handleDeletePage = async (pageNumber: number) => {
    if (!story) return;

    try {
      const response = await fetch(`/api/stories/${story.id}/pages/${pageNumber}/delete`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to delete page");
      }

      const result = await response.json();
      
      // Refresh the story to get the updated pages
      await fetchStory();
      
      // Adjust current page if necessary
      if (currentPage > result.totalPages) {
        setCurrentPage(result.totalPages);
      } else if (currentPage >= pageNumber && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      console.error("Failed to delete page:", error);
      alert(error instanceof Error ? error.message : "Failed to delete page. Please try again.");
    }
  };

  const handleReorderPages = async (newOrder: StoryPage[]) => {
    if (!story) return;

    try {
      console.log("Reordering pages:", newOrder.map(p => `${p.pageNumber}: ${p.text?.substring(0, 30)}...`));
      
      const requestBody = {
        pageOrder: newOrder.map(page => ({
          id: page.id,
          pageNumber: page.pageNumber
        }))
      };
      console.log("Request body:", requestBody);
      
      const response = await fetch(`/api/stories/${story.id}/pages/reorder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Reorder response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Reorder error response:", errorData);
        throw new Error(errorData.details || errorData.error || "Failed to reorder pages");
      }

      // Update local state immediately for smooth UX
      setStory({ ...story, pages: newOrder });
      
      // Refresh story from server to ensure consistency
      setTimeout(() => {
        fetchStory();
      }, 500);
      
    } catch (error) {
      console.error("Failed to reorder pages:", error);
      alert(error instanceof Error ? error.message : "Failed to reorder pages. Please try again.");
      // Refresh story to revert any local changes
      fetchStory();
    }
  };

  const handlePageClick = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    setShowPageOverview(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-pink-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading your magical story...</p>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Story Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            {error || "The story you're looking for doesn't exist."}
          </p>
          <Link href="/" className="btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const currentPageData = story.pages.find(p => p.pageNumber === currentPage);

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href={isPublic ? "/" : "/dashboard"} className="btn-secondary">
                <Home className="h-4 w-4 mr-2" />
                {isPublic ? "Home" : "Dashboard"}
              </Link>
              <div>
                <h1 className="font-fredoka text-xl font-bold">{story.title}</h1>
                <p className="text-sm text-gray-600">
                  A story for {story.child.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {!isPublic && session && (
                <>
                  <button
                    onClick={() => setShowPageOverview(true)}
                    className="btn-secondary flex items-center"
                  >
                    <Grid3X3 className="h-4 w-4 mr-2" />
                    Overview
                  </button>
                  <button
                    onClick={() => setShowInsertDialog(true)}
                    className="btn-secondary flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Insert Page
                  </button>
                  <button
                    onClick={() => setShowDeleteDialog(true)}
                    className="btn-secondary flex items-center text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Page
                  </button>
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="btn-secondary flex items-center"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Edit Page
                  </button>
                </>
              )}
              <button
                onClick={handleShare}
                className="btn-secondary flex items-center"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </button>
              <button
                onClick={handleDownloadPDF}
                className="btn-primary flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* New Book Viewer */}
      <BookViewer
        pages={story.pages}
        currentSpread={currentSpread}
        onSpreadChange={handleSpreadChange}
      />
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-8 flex flex-col">
                <div className="flex-1 flex items-center justify-center">
                  {currentPageData?.userUploadedImageUrl ? (
                    <div className="relative w-full h-full max-w-md max-h-md">
                      <Image
                        src={currentPageData.userUploadedImageUrl}
                        alt={`Your photo for page ${currentPage}`}
                        fill
                        className="object-contain rounded-lg"
                      />
                    </div>
                  ) : currentPageData?.illustrationUrl ? (
                    <div className="relative w-full h-full max-w-md max-h-md">
                      <Image
                        src={currentPageData.illustrationUrl}
                        alt={`Page ${currentPage} illustration`}
                        fill
                        className="object-contain rounded-lg"
                      />
                    </div>
                  ) : illustrationsLoading.has(currentPage) ? (
                    <div className="w-full h-64 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center animate-pulse">
                      <div className="text-center">
                        <Loader2 className="h-10 w-10 animate-spin mx-auto mb-3 text-purple-600" />
                        <p className="text-purple-700 font-medium">Creating your illustration...</p>
                        <p className="text-purple-600 text-sm mt-1">This may take a moment</p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <p className="text-sm">Illustration pending</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Image Upload Section - Only show for authenticated users */}
                {!isPublic && session && (
                  <PageImageUpload
                    storyId={story.id}
                    pageNumber={currentPage}
                    currentImage={currentPageData?.userUploadedImageUrl}
                    onImageUploaded={handleImageUploaded}
                    onImageRemoved={handleImageRemoved}
                  />
                )}
              </div>

              {/* Right side - Story Text */}
              <div className="p-8 flex flex-col justify-center">
                <div className="text-center mb-6">
                  <span className={`text-sm text-gray-500 transition-opacity duration-300`}>
                    Page {currentPage} of {story.pages.length}
                  </span>
                </div>
                
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-lg md:text-xl leading-relaxed text-gray-800 text-center">
                    {(() => {
                      const text = currentPageData?.text;
                      console.log("Displaying page text:", text, typeof text);
                      
                      if (!text) return "Loading story text...";
                      if (text === "[object Object]") return "Text corrupted - please use the AI editor to fix this page";
                      if (typeof text === 'object') return JSON.stringify(text);
                      return text;
                    })()}
                  </p>
                </div>

                {/* Page Navigation */}
                <div className="flex justify-between items-center mt-8">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1 || isTransitioning}
                    className="flex items-center px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </button>

                  {/* Page Indicators */}
                  <div className="flex space-x-2">
                    {story.pages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => handlePageJump(index + 1)}
                        disabled={isTransitioning}
                        className={`w-3 h-3 rounded-full transition-all duration-200 ${
                          currentPage === index + 1
                            ? "bg-pink-500 scale-125"
                            : "bg-gray-300 hover:bg-gray-400 hover:scale-110"
                        } ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === story.pages.length || isTransitioning}
                    className="flex items-center px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Story Modal */}
      {showEditModal && !isPublic && story && (
        <EditStoryModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          story={story}
          currentPage={currentPage}
          onStoryUpdate={fetchStory}
        />
      )}

      {/* AI Agent - Always available for holistic changes */}
      {!isPublic && story && (
        <AIAgent
          story={story}
          onStoryUpdate={fetchStory}
        />
      )}

      {/* Insert Page Dialog */}
      {story && (
        <InsertPageDialog
          isOpen={showInsertDialog}
          onClose={() => setShowInsertDialog(false)}
          onInsert={handleInsertPage}
          currentPage={currentPage}
          totalPages={story.pages.length}
        />
      )}

      {/* Delete Page Dialog */}
      {story && currentPageData && (
        <DeletePageDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onDelete={handleDeletePage}
          pageNumber={currentPage}
          totalPages={story.pages.length}
          pageText={currentPageData.text || "No text available"}
        />
      )}

      {/* Page Overview */}
      {story && (
        <PageOverview
          isOpen={showPageOverview}
          onClose={() => setShowPageOverview(false)}
          pages={story.pages}
          onReorderPages={handleReorderPages}
          onPageClick={handlePageClick}
        />
      )}
    </div>
  );
}