'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AddPublisherModal from '@/components/AddPublisherModal';
import SearchModal from '@/components/SearchModal';
import { useToast } from '@/context/ToastContext';

interface Publisher {
  id: string;
  name: string;
  description: string;
  domain: string;
  website?: string;
}

interface PublishersResponse {
  data: Publisher[];
  pagination?: {
    page: number;
    size: number;
    total: number;
    total_pages: number;
  };
}

export default function Publishers() {
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(30);
  const [pagination, setPagination] = useState<PublishersResponse['pagination'] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { showError, showSuccess } = useToast();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:40000/api/v1';

  const fetchPublishers = async (page: number = 1, append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setPublishers([]);
      setPagination(null);
    }

    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('size', String(pageSize));

      const response = await fetch(`${API_BASE_URL}/publishers?${params.toString()}`);

      if (!response.ok) {
        router.push(`/error?code=${response.status}&message=${encodeURIComponent(response.statusText)}`);
        return;
      }

      const data: PublishersResponse = await response.json();

      if (append) {
        setPublishers(prev => [...prev, ...(data.data || [])]);
      } else {
        setPublishers(data.data || []);
      }

      setPagination(data.pagination || null);
      setCurrentPage(page);
      setLoading(false);
      setLoadingMore(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network connection failed';
      router.push(`/error?code=503&message=${encodeURIComponent(errorMessage)}`);
    }
  };

  // Handle scroll to load more
  const handleScroll = () => {
    if (
      !loading &&
      !loadingMore &&
      pagination &&
      publishers.length < pagination.total
    ) {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;

      // Load more when within 300px of bottom
      if (scrollTop + clientHeight >= scrollHeight - 300) {
        const nextPage = currentPage + 1;
        fetchPublishers(nextPage, true);
      }
    }
  };

  const handleAddPublisher = async (publisherData: { name: string; domain: string; description?: string }) => {
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/publishers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(publisherData),
      });

      if (!response.ok) {
        if (response.status === 409) {
          showError('A publisher with this name or domain already exists.');
          return;
        }

        // Handle specific error codes
        try {
          const errorData = await response.json();
          if (errorData.errors && errorData.errors[0]) {
            if (errorData.errors[0].code === 'CODE_URL_INVALID') {
              showError('The domain format is invalid. Please enter a valid domain.');
              return;
            }
            if (errorData.errors[0].code === 'CODE_PUBLISHER_NOT_FOUND') {
              showError('The publisher was not found.');
              return;
            }
            if (errorData.errors[0].code === 'CODE_URL_TOO_LONG') {
              showError('The domain is too long. Please use a shorter domain.');
              return;
            }
          }
        } catch (parseError) {
          // If we can't parse the response, fall through to generic error handling
        }

        router.push(`/error?code=${response.status}&message=${encodeURIComponent(response.statusText)}`);
        return;
      }

      // Refresh the publishers list after successful creation
      setCurrentPage(1);
      await fetchPublishers(1, false);
      showSuccess('Publisher added successfully!');
      setIsModalOpen(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network connection failed';
      router.push(`/error?code=503&message=${encodeURIComponent(errorMessage)}`);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchPublishers(1, false);
  }, []);

  // Add scroll listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, loadingMore, pagination, publishers.length, currentPage]);

  // Handle Cmd+K / Ctrl+K to open search modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-heading-sm">Loading publishers...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-title font-bold text-gray-800">Publishers</h1>
          <div className="flex items-center gap-3">
            {/* Search Button */}
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="hidden sm:inline">Search</span>
            </button>

            {/* Add Publisher Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Publisher
            </button>
          </div>
        </div>

        {pagination && (
          <div className="mb-4 text-sm text-gray-600">
            Showing {publishers.length} of {pagination.total} publisher{pagination.total !== 1 ? 's' : ''}
          </div>
        )}

        {publishers.length === 0 && !loading ? (
          <div className="text-center text-gray-600">
            No publishers found
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publishers.map((publisher, index) => (
              <div
                key={publisher.id || `publisher-${index}`}
                onClick={() => router.push(`/publishers/${publisher.id}`)}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="mb-4">
                  <h2 className="text-heading-sm font-semibold text-gray-800 mb-2">{publisher.name}</h2>
                  <p className="text-blue-600 text-body-sm font-medium mb-2">{publisher.domain}</p>
                  <p className="text-gray-600 text-body-sm mb-3">{publisher.description}</p>

                  {publisher.website && (
                    <a
                      href={publisher.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-body-sm underline"
                    >
                      Visit Website
                    </a>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Loading more indicator */}
        {loadingMore && (
          <div className="flex items-center justify-center py-8">
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
              Loading more publishers...
            </div>
          </div>
        )}

        {/* End of results indicator */}
        {!loadingMore && pagination && publishers.length >= pagination.total && publishers.length > 0 && (
          <div className="text-center py-8 text-sm text-gray-500">
            <div className="inline-flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              All publishers loaded
            </div>
          </div>
        )}

        <AddPublisherModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAddPublisher}
          loading={submitting}
        />

        <SearchModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
        />
      </div>
    </div>
  );
}