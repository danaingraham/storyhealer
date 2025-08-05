"use client";

import { useState } from "react";
import { X, GripVertical, ArrowLeft } from "lucide-react";
import Image from "next/image";

interface StoryPage {
  id: string;
  pageNumber: number;
  text: string;
  illustrationUrl?: string;
  illustrationPrompt: string;
  charactersInScene: string[];
  userUploadedImageUrl?: string | null;
}

interface PageOverviewProps {
  isOpen: boolean;
  onClose: () => void;
  pages: StoryPage[];
  onReorderPages: (newOrder: StoryPage[]) => void;
  onPageClick: (pageNumber: number) => void;
}

export function PageOverview({ 
  isOpen, 
  onClose, 
  pages, 
  onReorderPages, 
  onPageClick 
}: PageOverviewProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newPages = [...pages];
    const draggedPage = newPages[draggedIndex];
    
    // Remove dragged page
    newPages.splice(draggedIndex, 1);
    
    // Insert at new position
    newPages.splice(dropIndex, 0, draggedPage);
    
    // Update page numbers
    const reorderedPages = newPages.map((page, index) => ({
      ...page,
      pageNumber: index + 1
    }));

    onReorderPages(reorderedPages);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-pink-500 to-purple-500 text-white">
          <div className="flex items-center space-x-3">
            <ArrowLeft className="h-6 w-6" />
            <div>
              <h3 className="text-xl font-semibold">Page Overview</h3>
              <p className="text-sm opacity-90">Drag pages to reorder • Click to jump to page</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Pages Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {pages.map((page, index) => (
              <div
                key={page.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => onPageClick(page.pageNumber)}
                className={`
                  relative bg-white border-2 rounded-xl shadow-lg transition-all duration-200 cursor-pointer
                  hover:shadow-xl hover:scale-105 group
                  ${draggedIndex === index ? 'opacity-50 scale-95' : ''}
                  ${dragOverIndex === index ? 'border-pink-400 bg-pink-50' : 'border-gray-200'}
                  ${draggedIndex !== null ? 'cursor-grabbing' : 'cursor-grab'}
                `}
              >
                {/* Drag Handle */}
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white/90 p-1 rounded shadow-sm">
                    <GripVertical className="h-4 w-4 text-gray-600" />
                  </div>
                </div>

                {/* Page Number Badge */}
                <div className="absolute top-2 left-2 z-10">
                  <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {page.pageNumber}
                  </div>
                </div>

                {/* Page Content */}
                <div className="p-4">
                  {/* Image */}
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3 relative">
                    {page.userUploadedImageUrl ? (
                      <Image
                        src={page.userUploadedImageUrl}
                        alt={`Page ${page.pageNumber} user image`}
                        fill
                        className="object-cover"
                      />
                    ) : page.illustrationUrl ? (
                      <Image
                        src={page.illustrationUrl}
                        alt={`Page ${page.pageNumber} illustration`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg mx-auto mb-2"></div>
                          <p className="text-xs">Generating...</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Text Preview */}
                  <div className="text-xs text-gray-700 leading-relaxed">
                    <p className="line-clamp-4">
                      {page.text || "Loading text..."}
                    </p>
                  </div>
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none">
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2">
                      <p className="text-xs font-medium text-gray-800">Click to view</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {pages.length} pages • Drag to reorder, click to navigate
            </p>
            <button
              onClick={onClose}
              className="btn-primary"
            >
              Close Overview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}