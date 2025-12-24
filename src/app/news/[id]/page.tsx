'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';

export const dynamic = 'force-dynamic';

interface NewsDetail {
  id: string;
  title: string;
  author: string;
  published_at: string;
  content: string;
  url: string;
  thumbnail?: string;
  status: string;
}

interface NewsDetailResponse {
  data: NewsDetail;
}

export default function NewsDetailPage() {
  const [newsDetail, setNewsDetail] = useState<NewsDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; newsId: string; newsTitle: string }>({
    isOpen: false,
    newsId: '',
    newsTitle: ''
  });
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const params = useParams();
  const { showError, showSuccess } = useToast();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:40000/api/v1';

  const newsId = params.id as string;

  const fetchNewsDetail = async () => {
    if (!newsId) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/news/${newsId}`);

      if (!response.ok) {
        if (response.status === 404) {
          router.push('/error?code=404&message=News article not found');
          return;
        }
        router.push(`/error?code=${response.status}&message=${encodeURIComponent(response.statusText)}`);
        return;
      }

      const data: NewsDetailResponse = await response.json();
      setNewsDetail(data.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network connection failed';
      router.push(`/error?code=503&message=${encodeURIComponent(errorMessage)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewsDetail();
  }, [newsId]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const handleDeleteNews = () => {
    if (newsDetail) {
      setDeleteModal({
        isOpen: true,
        newsId: newsDetail.id,
        newsTitle: newsDetail.title
      });
    }
  };

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

      showSuccess('News article deleted successfully!');
      setDeleteModal({ isOpen: false, newsId: '', newsTitle: '' });
      router.push('/');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network connection failed';
      router.push(`/error?code=503&message=${encodeURIComponent(errorMessage)}`);
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ isOpen: false, newsId: '', newsTitle: '' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading news article...</div>
      </div>
    );
  }

  if (!newsDetail) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">News article not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to News
        </button>

        {/* Article Content */}
        <article className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                newsDetail.status === 'synced'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {newsDetail.status}
              </span>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {newsDetail.url && (
                  <a
                    href={newsDetail.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Read Original
                  </a>
                )}

                <button
                  onClick={handleDeleteNews}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
              {newsDetail.title}
            </h1>

            <div className="flex items-center text-gray-600 text-sm space-x-4">
              {newsDetail.author && (
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>By {newsDetail.author}</span>
                </div>
              )}

              {newsDetail.published_at && (
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{formatDate(newsDetail.published_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Thumbnail */}
          {newsDetail.thumbnail && (
            <div className="relative h-64 md:h-96">
              <img
                src={newsDetail.thumbnail}
                alt={newsDetail.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            <div className="prose max-w-none">
              {newsDetail.content ? (
                <div
                  className="text-gray-800 leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: newsDetail.content }}
                />
              ) : (
                <p className="text-gray-600 italic">No content available. Please visit the original article for full details.</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              <span>Article ID: {newsDetail.id}</span>
            </div>
          </div>
        </article>

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