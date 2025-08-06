"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  Plus, 
  BookOpen, 
  Calendar, 
  Trash2, 
  Eye,
  Share2,
  Loader2,
  Heart 
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

interface Story {
  id: string;
  title: string;
  fearDescription: string;
  generationStatus: string;
  createdAt: string;
  child: {
    name: string;
    age: number;
  };
  pages: Array<{
    pageNumber: number;
    illustrationUrl?: string;
    userUploadedImageUrl?: string;
  }>;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetchStories();
    }
  }, [status, router]);

  // Poll for illustration updates if any stories are missing cover images
  useEffect(() => {
    if (!stories.length) return;

    const storiesWithoutCovers = stories.filter(
      story => !story.pages[0]?.illustrationUrl && !story.pages[0]?.userUploadedImageUrl
    );

    if (storiesWithoutCovers.length > 0) {
      const interval = setInterval(() => {
        fetchStories();
      }, 10000); // Poll every 10 seconds

      return () => clearInterval(interval);
    }
  }, [stories]);

  const fetchStories = async () => {
    try {
      console.log("🔄 Fetching stories from /api/stories...");
      const response = await fetch("/api/stories", {
        cache: 'no-store' // Ensure fresh data
      });
      console.log("📡 Response status:", response.status, response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log("📚 Stories received:", data?.length, "stories");
        setStories(data);
        console.log("✅ Stories set in state");
      } else if (response.status === 401) {
        console.error("🔒 Authentication failed - session may have expired");
        // Clear any cached stories first
        setStories([]);
        // Trigger re-authentication
        await signIn('google', { callbackUrl: '/dashboard' });
        return;
      } else {
        console.error("❌ Response not ok:", response.status, response.statusText);
        const errorText = await response.text();
        console.error("❌ Error response:", errorText);
        // For other errors, still set empty array to show "no stories" message
        setStories([]);
      }
    } catch (error) {
      console.error("❌ Failed to fetch stories:", error);
    } finally {
      setLoading(false);
      console.log("🏁 Loading set to false");
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!confirm("Are you sure you want to delete this story? This action cannot be undone.")) {
      return;
    }

    setDeletingId(storyId);
    
    try {
      const response = await fetch(`/api/stories/${storyId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setStories(stories.filter(story => story.id !== storyId));
      } else {
        alert("Failed to delete story. Please try again.");
      }
    } catch (error) {
      console.error("Failed to delete story:", error);
      alert("Failed to delete story. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleShare = async (story: Story) => {
    const shareUrl = `${window.location.origin}/shared/${story.id}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("Share link copied to clipboard!");
    } catch (err) {
      prompt("Copy this link to share:", shareUrl);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-pink-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading your stories...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col gradient-bg">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-fredoka text-4xl font-bold mb-2">
                Welcome back, {session.user?.name?.split(" ")[0]}!
              </h1>
              <p className="text-gray-600">
                Here are all the magical stories you've created
              </p>
            </div>
            <Link href="/story/create" className="btn-primary flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Create New Story
            </Link>
          </div>

          {/* Stories Grid */}
          {stories.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-pink-100 rounded-full flex items-center justify-center">
                <BookOpen className="h-12 w-12 text-pink-500" />
              </div>
              <h2 className="font-fredoka text-2xl font-bold mb-4">
                No stories yet!
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Create your first personalized story to help your child overcome their fears and become the hero of their own adventure.
              </p>
              <Link href="/story/create" className="btn-primary inline-flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Story
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.map((story) => (
                <div
                  key={story.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden card-hover"
                >
                  {/* Cover Image - Use first page image (user uploaded or generated) */}
                  <div className="h-48 bg-gradient-to-br from-pink-100 to-purple-100 relative">
                    {story.pages[0]?.userUploadedImageUrl || story.pages[0]?.illustrationUrl ? (
                      <Image
                        src={story.pages[0]?.userUploadedImageUrl || story.pages[0]?.illustrationUrl || ''}
                        alt={`${story.title} cover`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        {story.generationStatus === "GENERATING" ? (
                          <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-pink-500 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">Creating...</p>
                          </div>
                        ) : (
                          <BookOpen className="h-12 w-12 text-pink-300" />
                        )}
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          story.generationStatus === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : story.generationStatus === "GENERATING"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {story.generationStatus === "COMPLETED"
                          ? "Ready"
                          : story.generationStatus === "GENERATING"
                          ? "Creating"
                          : "Error"}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="font-fredoka text-xl font-bold mb-2 line-clamp-1">
                      {story.title}
                    </h3>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                      <Heart className="h-4 w-4 text-pink-500" />
                      <span>For {story.child.name}, age {story.child.age}</span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      A story about overcoming {story.fearDescription.toLowerCase()}
                    </p>
                    
                    <div className="flex items-center text-xs text-gray-500 mb-4">
                      <Calendar className="h-3 w-3 mr-1" />
                      Created {new Date(story.createdAt).toLocaleDateString()}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        {story.generationStatus === "COMPLETED" && (
                          <>
                            <Link
                              href={`/story/${story.id}`}
                              className="flex items-center px-3 py-1.5 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition-colors text-sm"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Link>
                            <button
                              onClick={() => handleShare(story)}
                              className="flex items-center px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm"
                            >
                              <Share2 className="h-3 w-3 mr-1" />
                              Share
                            </button>
                          </>
                        )}
                      </div>
                      
                      <button
                        onClick={() => handleDeleteStory(story.id)}
                        disabled={deletingId === story.id}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        {deletingId === story.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}