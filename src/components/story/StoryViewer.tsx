"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { 
  Download, 
  Share2, 
  MessageCircle,
  Home,
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
  const [currentPage, setCurrentPage] = useState(1); // Track which page we're on
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

  // Add keyboard navigation for pages
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!story) return;
      
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        if (currentPage < story.pages.length) {
          setCurrentPage(currentPage + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPage, story]);

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
      
      setStory(storyData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load story");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
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
    try {
      const response = await fetch(`/api/stories/${storyId}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${story?.title || 'story'}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const handleDeleteStory = async () => {
    if (!confirm("Are you sure you want to delete this entire story? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/stories/${storyId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        window.location.href = "/dashboard";
      } else {
        alert("Failed to delete story. Please try again.");
      }
    } catch (error) {
      console.error("Failed to delete story:", error);
      alert("Failed to delete story. Please try again.");
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading story...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <MessageCircle className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/dashboard" className="btn-primary">
            <Home className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Story not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center text-gray-600 hover:text-gray-800">
                <Home className="h-5 w-5 mr-2" />
                Dashboard
              </Link>
              <div className="text-gray-300">•</div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800 truncate max-w-xs md:max-w-md">
                {story.title}
              </h1>
            </div>

            <div className="flex items-center space-x-2">
              {!isPublic && session && (
                <>
                  <button
                    onClick={() => setShowPageOverview(true)}
                    className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200"
                    title="Page Overview"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => setShowEditModal(true)}
                    className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200"
                    title="Edit Story"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </button>

                  <button
                    onClick={handleDeleteStory}
                    className="flex items-center px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                    title="Delete Story"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}

              <button
                onClick={handleShare}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200"
                title="Share"
              >
                <Share2 className="h-4 w-4" />
              </button>

              <button
                onClick={handleDownloadPDF}
                className="btn-primary"
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
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />

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

      {/* Page Overview Modal */}
      {showPageOverview && story && (
        <PageOverview
          story={story}
          isOpen={showPageOverview}
          onClose={() => setShowPageOverview(false)}
          onPageSelect={(pageNumber) => {
            setCurrentPage(pageNumber);
            setShowPageOverview(false);
          }}
          currentPage={currentPage}
        />
      )}

      {/* Insert Page Dialog */}
      {story && (
        <InsertPageDialog
          isOpen={showInsertDialog}
          onClose={() => setShowInsertDialog(false)}
          storyId={story.id}
          currentPage={currentPage}
          totalPages={story.pages.length}
          onStoryUpdate={fetchStory}
        />
      )}

      {/* AI Agent */}
      {!isPublic && session && story && (
        <AIAgent
          storyId={story.id}
          currentPage={currentPage}
          onStoryUpdate={fetchStory}
        />
      )}
    </div>
  );
}