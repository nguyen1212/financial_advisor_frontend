'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface NewsItem {
  id: string;
  title: string;
  thumbnail?: string;
  status: string;
  published_at?: string;
  author?: string;
  content?: string;
}

interface SearchResponse {
  data: NewsItem[];
  pagination?: {
    page: number;
    size: number;
    total: number;
    total_pages: number;
  };
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [results, setResults] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(30);
  const [hasMore, setHasMore] = useState(true);
  const [pagination, setPagination] = useState<SearchResponse['pagination'] | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:40000/api/v1';

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSuggestions([]);
      setResults([]);
      setLoading(false);
      setLoadingSuggestions(false);
      setLoadingMore(false);
      setCurrentPage(1);
      setHasMore(true);
      setPagination(null);
      // Clear any pending debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    }
  }, [isOpen]);

  // Fetch suggestions from API
  const fetchSuggestions = async (keywords: string) => {
    if (!keywords.trim()) {
      setSuggestions([]);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const params = new URLSearchParams();
      // Split keywords by space and add each as a separate parameter
      const keywordList = keywords.trim().split(/\s+/);
      keywordList.forEach(keyword => {
        if (keyword) {
          params.append('keywords', keyword);
        }
      });

      const response = await fetch(`${API_BASE_URL}/news/search/suggestions?${params.toString()}`);

      if (response.ok) {
        const data = await response.json();
        // Assuming API returns { data: string[] }
        setSuggestions(data.data || []);
      } else {
        console.error('Failed to fetch suggestions:', response.statusText);
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Fetch search results from API
  const fetchResults = async (keywords: string, page: number = 1, append: boolean = false) => {
    if (!keywords.trim()) {
      setResults([]);
      setPagination(null);
      setHasMore(true);
      return;
    }

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setResults([]);
      setPagination(null);
      setHasMore(true);
    }

    try {
      const params = new URLSearchParams();
      // Split keywords by space and add each as a separate parameter
      const keywordList = keywords.trim().split(/\s+/);
      keywordList.forEach(keyword => {
        if (keyword) {
          params.append('keywords', keyword);
        }
      });

      // Add pagination parameters
      params.append('page', String(page));
      params.append('size', String(pageSize));

      const response = await fetch(`${API_BASE_URL}/news/search?${params.toString()}`);

      if (response.ok) {
        const data: SearchResponse = await response.json();
        const newResults = data.data || [];

        // Check if there are more results - if empty, no more results
        if (newResults.length === 0) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }

        if (append) {
          // Append to existing results, filtering out duplicates
          setResults(prev => {
            const existingIds = new Set(prev.map(item => item.id).filter(Boolean));
            const uniqueNewResults = newResults.filter(item => item.id && !existingIds.has(item.id));
            return [...prev, ...uniqueNewResults];
          });
        } else {
          // Replace results
          setResults(newResults);
        }

        setPagination(data.pagination || null);
        setCurrentPage(page);
      } else {
        console.error('Failed to fetch results:', response.statusText);
        if (!append) {
          setResults([]);
          setPagination(null);
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      if (!append) {
        setResults([]);
        setPagination(null);
        setHasMore(false);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!query.trim()) {
      setSuggestions([]);
      setResults([]);
      return;
    }

    // Set up debounced API call (100ms = 0.1s)
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, 100);
  };

  // Handle Enter key to perform search
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setCurrentPage(1);
      fetchResults(searchQuery, 1, false);
    }
  };

  // Handle scroll to load more results
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100; // 100px threshold

    // Check if we should load more - now based on hasMore instead of total
    if (
      bottom &&
      !loading &&
      !loadingMore &&
      hasMore &&
      results.length > 0
    ) {
      const nextPage = currentPage + 1;
      fetchResults(searchQuery, nextPage, true);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-start justify-center z-50 pt-[10vh]">
      <style jsx>{`
        .search-result-content mark {
          background-color: #fef3c7;
          color: #92400e;
          font-weight: 600;
          padding: 1px 2px;
          border-radius: 2px;
        }
      `}</style>
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="bg-white rounded-lg shadow-2xl max-w-3xl w-full mx-4 relative z-10 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar Section */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {/* Search Icon */}
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>

            {/* Search Input */}
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search news articles... (Press Enter to search)"
              className="flex-1 text-lg outline-none"
            />

            {/* Keyboard Hint */}
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-300 rounded">
              ESC
            </kbd>
          </div>

          {/* Suggestions Section */}
          {loadingSuggestions && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="text-xs font-medium text-gray-500 mb-2">Loading suggestions...</div>
            </div>
          )}
          {!loadingSuggestions && suggestions.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="text-xs font-medium text-gray-500 mb-2">Suggestions</div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSearchQuery(suggestion);
                      fetchResults(suggestion, 1, false);
                    }}
                    className="px-3 py-1 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div
          ref={resultsContainerRef}
          className="flex-1 overflow-y-auto min-h-0"
          onScroll={handleScroll}
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Searching...
              </div>
            </div>
          ) : searchQuery.trim() === '' ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <svg
                className="w-16 h-16 mb-4 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <p className="text-lg font-medium">Start typing to search</p>
              <p className="text-sm mt-1">Search for news articles, titles, or content</p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <svg
                className="w-16 h-16 mb-4 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-lg font-medium">No results found</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="p-4">
              {results.length > 0 && (
                <div className="text-sm text-gray-600 mb-4">
                  Showing {results.length} result{results.length !== 1 ? 's' : ''}
                </div>
              )}
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div
                    key={result.id || `result-${index}`}
                    onClick={() => {
                      // Build query params with keywords
                      const keywords = searchQuery.trim().split(/\s+/).filter(k => k);
                      const params = new URLSearchParams();
                      keywords.forEach(keyword => params.append('highlight_keywords', keyword));
                      router.push(`/news/${result.id}?${params.toString()}`);
                      onClose();
                    }}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
                  >
                    {/* Title */}
                    <h3 className="font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                      {result.title}
                    </h3>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                      {result.published_at && (
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{formatDate(result.published_at)}</span>
                        </div>
                      )}
                      {result.author && (
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>{result.author}</span>
                        </div>
                      )}
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        result.status === 'synced'
                          ? 'bg-green-100 text-green-800'
                          : result.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : result.status === 'added'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {result.status}
                      </span>
                    </div>

                    {/* Content Preview with Highlights */}
                    {result.content && (
                      <div
                        className="text-sm text-gray-600 line-clamp-3 search-result-content"
                        dangerouslySetInnerHTML={{ __html: result.content }}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Loading more indicator */}
              {loadingMore && (
                <div className="flex items-center justify-center py-6">
                  <div className="inline-flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Loading more results...
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex items-center justify-between rounded-b-lg">
          <div className="flex items-center gap-4">
            <span>Press ESC to close</span>
            <span>Press Enter to search</span>
          </div>
          <span>Cmd+K to reopen</span>
        </div>
      </div>
    </div>
  );
}
