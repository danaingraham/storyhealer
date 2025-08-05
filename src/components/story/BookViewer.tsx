"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

interface StoryPage {
  id: string;
  pageNumber: number;
  text: string;
  illustrationUrl?: string;
  userUploadedImageUrl?: string;
}

interface BookViewerProps {
  pages: StoryPage[];
  currentPage: number; // Which page (1, 2, 3, etc.)
  onPageChange: (page: number) => void;
}

export function BookViewer({ pages, currentPage, onPageChange }: BookViewerProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'forward' | 'backward' | null>(null);
  const bookRef = useRef<HTMLDivElement>(null);

  // Get current page data
  const currentPageData = pages.find(p => p.pageNumber === currentPage) || pages[currentPage - 1];

  const canGoBackward = currentPage > 1;
  const canGoForward = currentPage < pages.length;

  const handlePageTurn = (direction: 'forward' | 'backward') => {
    if (isTransitioning) return;
    
    const newPage = direction === 'forward' 
      ? Math.min(pages.length, currentPage + 1)
      : Math.max(1, currentPage - 1);
    
    if (newPage === currentPage) return;

    // Instant page change - no animation
    onPageChange(newPage);
  };

  // Touch/swipe handling
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && canGoForward) {
      handlePageTurn('forward');
    } else if (isRightSwipe && canGoBackward) {
      handlePageTurn('backward');
    }
  };

  return (
    <div className="book-container">
      {/* Book */}
      <div 
        ref={bookRef}
        className="book"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Single Page */}
        <div className={`single-page ${
          isTransitioning && transitionDirection === 'forward' ? 'page-turning-forward' :
          isTransitioning && transitionDirection === 'backward' ? 'page-turning-backward' :
          'page-static'
        }`}>
          {currentPageData && <BookPage page={currentPageData} side="center" />}
        </div>

        {/* Click zones for page turning */}
        {canGoBackward && (
          <button 
            className="page-turn-zone left-zone"
            onClick={() => handlePageTurn('backward')}
            disabled={isTransitioning}
            aria-label="Previous page"
          />
        )}
        
        {canGoForward && (
          <button 
            className="page-turn-zone right-zone"
            onClick={() => handlePageTurn('forward')}
            disabled={isTransitioning}
            aria-label="Next page"
          />
        )}
      </div>

      {/* Navigation Controls */}
      <div className="book-controls">
        <button
          onClick={() => handlePageTurn('backward')}
          disabled={!canGoBackward || isTransitioning}
          className="nav-button prev-button"
        >
          <ChevronLeft size={24} />
          <span>Previous</span>
        </button>

        <div className="page-indicator">
          Page {currentPage} of {pages.length}
        </div>

        <button
          onClick={() => handlePageTurn('forward')}
          disabled={!canGoForward || isTransitioning}
          className="nav-button next-button"
        >
          <span>Next</span>
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
}

// Individual page component
function BookPage({ page, side }: { page: StoryPage; side: 'left' | 'right' | 'center' }) {
  const imageUrl = page.userUploadedImageUrl || page.illustrationUrl;

  return (
    <div className={`page-content ${side}`}>
      {/* Image section */}
      <div className="page-image">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`Page ${page.pageNumber} illustration`}
            fill
            className="object-contain"
          />
        ) : (
          <div className="placeholder-image">
            <div className="placeholder-text">Illustration</div>
          </div>
        )}
      </div>

      {/* Text section */}
      <div className="page-text">
        <p>{page.text}</p>
      </div>
    </div>
  );
}