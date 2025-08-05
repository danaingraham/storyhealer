"use client";

import { useState } from "react";
import { X, Plus, Loader2 } from "lucide-react";

interface InsertPageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (position: "before" | "after", pageNumber: number) => Promise<void>;
  currentPage: number;
  totalPages: number;
}

export function InsertPageDialog({
  isOpen,
  onClose,
  onInsert,
  currentPage,
  totalPages,
}: InsertPageDialogProps) {
  const [selectedPosition, setSelectedPosition] = useState<"before" | "after">("after");
  const [selectedPageNumber, setSelectedPageNumber] = useState(currentPage);
  const [isInserting, setIsInserting] = useState(false);

  if (!isOpen) return null;

  const handleInsert = async () => {
    setIsInserting(true);
    try {
      await onInsert(selectedPosition, selectedPageNumber);
      onClose();
    } catch (error) {
      console.error("Failed to insert page:", error);
    } finally {
      setIsInserting(false);
    }
  };

  const getInsertionDescription = () => {
    if (selectedPosition === "before") {
      return `Insert new page before page ${selectedPageNumber}`;
    } else {
      return `Insert new page after page ${selectedPageNumber}`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-pink-100 rounded-lg">
              <Plus className="h-5 w-5 text-pink-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Insert New Page</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Insert Position
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="position"
                  value="before"
                  checked={selectedPosition === "before"}
                  onChange={(e) => setSelectedPosition(e.target.value as "before" | "after")}
                  className="mr-3 text-pink-600 focus:ring-pink-500"
                />
                <span className="text-gray-700">Before page</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="position"
                  value="after"
                  checked={selectedPosition === "after"}
                  onChange={(e) => setSelectedPosition(e.target.value as "before" | "after")}
                  className="mr-3 text-pink-600 focus:ring-pink-500"
                />
                <span className="text-gray-700">After page</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Page Number
            </label>
            <select
              value={selectedPageNumber}
              onChange={(e) => setSelectedPageNumber(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <option key={pageNum} value={pageNum}>
                  Page {pageNum}
                </option>
              ))}
            </select>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Preview:</strong> {getInsertionDescription()}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              AI will generate content that flows naturally with the surrounding pages.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            disabled={isInserting}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleInsert}
            disabled={isInserting}
            className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isInserting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Inserting...</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Insert Page</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}