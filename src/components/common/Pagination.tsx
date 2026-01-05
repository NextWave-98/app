import { ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  itemsPerPageOptions?: number[];
}

export default function Pagination({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange = () => {},
  itemsPerPageOptions = [5, 10, 15, 20, 30],
}: PaginationProps) {
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePrev = () => onPageChange(Math.max(1, currentPage - 1));
  const handleNext = () => onPageChange(Math.min(totalPages || 1, currentPage + 1));

  return (
    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700">Items per page:</span>
        <select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 cursor-pointer"
        >
          {itemsPerPageOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <span className="text-sm text-gray-700 ml-4">
          Showing {startIndex} to {endIndex} of {totalItems}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handlePrev}
          disabled={currentPage === 1}
          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors flex items-center gap-1 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages || 0 }, (_, i) => i + 1).map((page) => {
            const showPage =
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 1 && page <= currentPage + 1);

            const showEllipsis =
              (page === currentPage - 2 && currentPage > 3) ||
              (page === currentPage + 2 && currentPage < totalPages - 2);

            if (showEllipsis) {
              return (
                <span key={`e-${page}`} className="px-2 text-gray-500">
                  ...
                </span>
              );
            }

            if (!showPage) return null;

            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  currentPage === page
                    ? 'bg-orange-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleNext}
          disabled={currentPage === totalPages || totalPages === 0}
          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors flex items-center gap-1 cursor-pointer"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
