'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import DateRangePicker from '@/components/DateRangePicker';
import AddNewsModal from '@/components/AddNewsModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { useToast } from '@/context/ToastContext';

interface NewsItem {
  id: string;
  title: string;
  thumbnail: string;
  status: string;
  published_at?: string;
  author?: string;
}

interface NewsResponse {
  data: NewsItem[];
}

export default function Home() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pollingNewsId, setPollingNewsId] = useState<string | null>(null);
  const [activePollingInterval, setActivePollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; newsId: string; newsTitle: string }>({
    isOpen: false,
    newsId: '',
    newsTitle: ''
  });
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const { showError, showSuccess } = useToast();

  const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:40000/api/v1';

  const fetchNews = async (from?: string, to?: string) => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/news`;
      const params = new URLSearchParams();

      // Convert YYYY-MM-DD to RFC3339 format for Go time.Time parsing
      if (from) {
        const fromDateTime = `${from}T00:00:00Z`;
        params.append('from', fromDateTime);
      }
      if (to) {
        const toDateTime = `${to}T23:59:59Z`;
        params.append('to', toDateTime);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        router.push(`/error?code=${response.status}&message=${encodeURIComponent(response.statusText)}`);
        return;
      }

      const data: NewsResponse = await response.json();
      setNews(data.data);
      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network connection failed';
      router.push(`/error?code=503&message=${encodeURIComponent(errorMessage)}`);
    }
  };

  const handleFilter = () => {
    fetchNews(dateRange.from, dateRange.to);
  };

  const handleClearFilter = () => {
    setDateRange({ from: '', to: '' });
    fetchNews();
  };

  // Function to check status of a specific news item
  const checkNewsStatus = async (newsId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/news/${newsId}`);

      if (response.ok) {
        const newsData = await response.json();
        const updatedNewsItem = newsData.data;
        const newStatus = updatedNewsItem.status;

        // Update the news item with all the latest data
        if (newStatus !== 'added') {
          setNews(prevNews =>
            prevNews.map(item =>
              item.id === newsId ? {
                id: updatedNewsItem.id,
                title: updatedNewsItem.title || item.title,
                thumbnail: updatedNewsItem.thumbnail || item.thumbnail,
                status: updatedNewsItem.status
              } : item
            )
          );
          return newStatus;
        }
      }
      return 'added';
    } catch (error) {
      console.error('Error checking news status:', error);
      return 'added';
    }
  };

  // Start polling for news status updates
  const startPollingNewsStatus = (newsId: string) => {
    // Clear any existing polling interval
    if (activePollingInterval) {
      clearInterval(activePollingInterval);
    }

    setPollingNewsId(newsId);
    let pollCount = 0;
    const maxPolls = 12; // 12 polls × 5 seconds = 1 minute

    const pollInterval = setInterval(async () => {
      pollCount++;

      const status = await checkNewsStatus(newsId);

      // Stop polling if status changed from 'added' or max time reached
      if (status !== 'added' || pollCount >= maxPolls) {
        clearInterval(pollInterval);
        setPollingNewsId(null);
        setActivePollingInterval(null);
      }
    }, 5000); // Poll every 5 seconds

    // Store the interval ID for cleanup
    setActivePollingInterval(pollInterval);
  };

  const handleAddNews = async (newsData: { url: string; category: string }) => {
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/news`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: newsData.url,
          category: newsData.category
        }),
      });

      if (!response.ok) {
        if (response.status === 409) {
          showError('This news article already exists.');
          return;
        }

        // Handle specific error codes
        try {
          const errorData = await response.json();
          if (errorData.errors && errorData.errors[0]) {
            if (errorData.errors[0].code === 'CODE_PUBLISHER_NOT_FOUND') {
              showError('The publisher domain is not existed. Try to add publisher first.');
              return;
            }
            if (errorData.errors[0].code === 'CODE_URL_TOO_LONG') {
              showError('The URL is too long. Please use a shorter URL.');
              return;
            }
            if (errorData.errors[0].code === 'CODE_URL_INVALID') {
              showError('The URL format is invalid. Please enter a valid URL.');
              return;
            }
          }
        } catch (parseError) {
          // If we can't parse the response, fall through to generic error handling
        }

        router.push(`/error?code=${response.status}&message=${encodeURIComponent(response.statusText)}`);
        return;
      }

      // Get the created news item ID from response
      const responseData = await response.json();
      const createdNewsId = responseData.data?.id;

      // Refresh the news list after successful creation
      await fetchNews(dateRange.from, dateRange.to);
      showSuccess('News article added successfully!');
      setIsModalOpen(false);

      // Start polling for status updates if we have a news ID
      if (createdNewsId) {
        startPollingNewsStatus(createdNewsId);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network connection failed';
      router.push(`/error?code=503&message=${encodeURIComponent(errorMessage)}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete news item
  const handleDeleteNews = (newsId: string, newsTitle: string) => {
    setDeleteModal({
      isOpen: true,
      newsId,
      newsTitle
    });
  };

  // Confirm delete news item
  const confirmDeleteNews = async () => {
    if (!deleteModal.newsId) return;

    setDeleting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/news/${deleteModal.newsId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        if (response.status === 409) {
          showError('Cannot delete this news item due to a conflict.');
          return;
        }

        // Handle specific error codes if needed
        try {
          const errorData = await response.json();
          if (errorData.errors && errorData.errors[0]) {
            showError(`Failed to delete news item: ${errorData.errors[0].message || 'Unknown error'}`);
            return;
          }
        } catch (parseError) {
          // Fall through to generic error handling
        }

        router.push(`/error?code=${response.status}&message=${encodeURIComponent(response.statusText)}`);
        return;
      }

      // Remove the news item from the local state
      setNews(prevNews => prevNews.filter(item => item.id !== deleteModal.newsId));
      showSuccess('News article deleted successfully!');

      // Close the modal
      setDeleteModal({ isOpen: false, newsId: '', newsTitle: '' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network connection failed';
      router.push(`/error?code=503&message=${encodeURIComponent(errorMessage)}`);
    } finally {
      setDeleting(false);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setDeleteModal({ isOpen: false, newsId: '', newsTitle: '' });
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

  useEffect(() => {
    fetchNews();
  }, []);

  // Cleanup polling interval on component unmount
  useEffect(() => {
    return () => {
      if (activePollingInterval) {
        clearInterval(activePollingInterval);
      }
    };
  }, [activePollingInterval]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading news...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">News Feed</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add News
          </button>
        </div>

        {/* Filters Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Filters</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                disabled={loading}
              />
            </div>

            {/* Placeholder for additional filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status Filter
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                defaultValue=""
              >
                <option value="">All Status</option>
                <option value="synced">Synced</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6 pt-4 border-t border-gray-200">
            <div className="flex gap-3">
              <button
                onClick={handleFilter}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Loading...' : 'Apply Filters'}
              </button>
              <button
                onClick={handleClearFilter}
                disabled={loading}
                className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Clear All
              </button>
            </div>

            {/* Active Filters Display */}
            {(dateRange.from || dateRange.to) && (
              <div className="flex items-center text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-md">
                <span className="mr-2">Active filters:</span>
                {dateRange.from && dateRange.to ? (
                  <span className="bg-blue-100 px-2 py-1 rounded text-blue-800">
                    {dateRange.from} to {dateRange.to}
                  </span>
                ) : dateRange.from ? (
                  <span className="bg-blue-100 px-2 py-1 rounded text-blue-800">
                    From {dateRange.from}
                  </span>
                ) : (
                  <span className="bg-blue-100 px-2 py-1 rounded text-blue-800">
                    To {dateRange.to}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {news.length === 0 ? (
          <div className="text-center text-gray-600">
            {loading ? 'Loading news...' : 'No news articles found'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((item, index) => (
              <div
                key={item.id || `news-${index}`}
                onClick={() => router.push(`/news/${item.id}`)}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="relative h-48">
                  {item.thumbnail ? (
                    <Image
                      src={item.thumbnail}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-sm">No image</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-semibold text-gray-800 hover:text-blue-600 transition-colors flex-1">{item.title}</h2>
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click navigation
                        handleDeleteNews(item.id, item.title);
                      }}
                      className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      title="Delete news item"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Published Date */}
                  {item.published_at && (
                    <div className="flex items-center text-gray-500 text-sm mb-2">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{formatDate(item.published_at)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                      item.status === 'synced'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.status}
                    </span>

                    {/* Author */}
                    {item.author && (
                      <div className="flex items-center text-gray-500 text-sm">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{item.author}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <AddNewsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAddNews}
          loading={submitting}
        />

        <DeleteConfirmModal
          isOpen={deleteModal.isOpen}
          onClose={cancelDelete}
          onConfirm={confirmDeleteNews}
          title="Delete News Article"
          message={`Are you sure you want to delete "${deleteModal.newsTitle}"? This action cannot be undone.`}
          loading={deleting}
        />
      </div>
    </div>
  );
}
