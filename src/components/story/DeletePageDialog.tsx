"use client";

import { useState } from "react";
import { X, Trash2, AlertTriangle, Loader2 } from "lucide-react";

interface DeletePageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: (pageNumber: number) => Promise<void>;
  pageNumber: number;
  totalPages: number;
  pageText: string;
}

export function DeletePageDialog({
  isOpen,
  onClose,
  onDelete,
  pageNumber,
  totalPages,
  pageText,
}: DeletePageDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(pageNumber);
      onClose();
    } catch (error) {
      console.error("Failed to delete page:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const canDelete = totalPages > 1;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Delete Page</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {!canDelete ? (
            <div className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Cannot Delete Last Page
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  A story must have at least one page. Add more pages before deleting this one.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Are you sure you want to delete page {pageNumber}?
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    This action cannot be undone. All subsequent pages will be renumbered.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Page Content:</p>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 italic">
                    "{pageText.length > 150 ? pageText.substring(0, 150) + "..." : pageText}"
                  </p>
                </div>
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <p>• Page {pageNumber} will be permanently deleted</p>
                <p>• Pages {pageNumber + 1} through {totalPages} will be renumbered</p>
                <p>• Story will have {totalPages - 1} pages after deletion</p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Page</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}