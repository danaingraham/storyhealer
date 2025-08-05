"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  ChevronLeft, 
  ChevronRight, 
  Home,
  ArrowRight
} from "lucide-react";

const SAMPLE_STORY = {
  id: "sample",
  title: "Emma's Brave Night",
  child: {
    name: "Emma",
    age: 6,
  },
  pages: [
    {
      pageNumber: 1,
      text: "Emma loved playing during the day, but when bedtime came, she felt scared of the dark. The shadows in her room seemed to move and whisper.",
      illustrationPrompt: "A 6-year-old girl with brown hair in pajamas looking worried at her dark bedroom",
    },
    {
      pageNumber: 2,
      text: "One night, Emma's room began to glow softly. A friendly star fairy appeared, sparkling with gentle light. 'Hello Emma,' she said. 'I'm Luna, and I'm here to help.'",
      illustrationPrompt: "A magical star fairy with golden light meeting a young girl in a softly glowing bedroom",
    },
    {
      pageNumber: 3,
      text: "Luna showed Emma that the scary shadows were just her toys and furniture. 'See? That monster is really your teddy bear!' Luna giggled, making the room brighter.",
      illustrationPrompt: "A star fairy pointing at shadows that transform into familiar toys and furniture, with the girl laughing",
    },
    {
      pageNumber: 4,
      text: "Emma learned to make her own light by thinking happy thoughts. Luna taught her that brave thoughts could chase away any darkness.",
      illustrationPrompt: "Emma glowing with confidence and inner light, standing bravely in her room with the fairy beside her",
    },
    {
      pageNumber: 5,
      text: "From that night on, Emma felt brave in the dark. She knew that even when Luna wasn't there, she had her own special light inside her heart.",
      illustrationPrompt: "Emma sleeping peacefully in her bed with a gentle glow around her, looking confident and happy",
    },
    {
      pageNumber: 6,
      text: "Emma became known as the bravest girl in her neighborhood. She even helped other children learn to be brave in the dark, just like Luna taught her.",
      illustrationPrompt: "Emma confidently helping other children, all surrounded by warm, gentle light",
    },
  ],
};

export default function SampleStoryPage() {
  const [currentPage, setCurrentPage] = useState(1);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < SAMPLE_STORY.pages.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  const currentPageData = SAMPLE_STORY.pages.find(p => p.pageNumber === currentPage);

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="btn-secondary">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Link>
              <div>
                <h1 className="font-fredoka text-xl font-bold">{SAMPLE_STORY.title}</h1>
                <p className="text-sm text-gray-600">
                  Sample Story - See how StoryHealer works
                </p>
              </div>
            </div>
            
            <Link href="/story/create" className="btn-primary flex items-center">
              Create Your Own Story
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Story Book */}
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-8">
            <div className="grid md:grid-cols-2 min-h-[600px]">
              {/* Left side - Illustration Placeholder */}
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-8 flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="w-64 h-64 mx-auto bg-white rounded-lg shadow-md flex items-center justify-center mb-4">
                    <div className="text-gray-400 text-center">
                      <Image
                        src="/sample-illustration.jpg"
                        alt="Sample illustration"
                        width={200}
                        height={200}
                        className="rounded-lg opacity-75"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden">
                        <div className="text-6xl mb-2">🌟</div>
                        <p className="text-sm">Beautiful AI-generated illustration would appear here</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 italic">
                    {currentPageData?.illustrationPrompt}
                  </p>
                </div>
              </div>

              {/* Right side - Story Text */}
              <div className="p-8 flex flex-col justify-center">
                <div className="text-center mb-6">
                  <span className="text-sm text-gray-500">
                    Page {currentPage} of {SAMPLE_STORY.pages.length}
                  </span>
                </div>
                
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-lg md:text-xl leading-relaxed text-gray-800 text-center">
                    {currentPageData?.text}
                  </p>
                </div>

                {/* Page Navigation */}
                <div className="flex justify-between items-center mt-8">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="flex items-center px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </button>

                  {/* Page Indicators */}
                  <div className="flex space-x-2">
                    {SAMPLE_STORY.pages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPage(index + 1)}
                        className={`w-3 h-3 rounded-full transition-colors ${
                          currentPage === index + 1
                            ? "bg-pink-500"
                            : "bg-gray-300 hover:bg-gray-400"
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === SAMPLE_STORY.pages.length}
                    className="flex items-center px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="font-fredoka text-3xl font-bold mb-4">
              Love This Story?
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Create a personalized story just like this one for your child! 
              Choose their appearance, describe their fear, and watch as our AI 
              creates a magical adventure where they become the brave hero.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/story/create" className="btn-primary">
                Create Your Child's Story
              </Link>
              <Link href="/" className="btn-secondary">
                Learn More About StoryHealer
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}