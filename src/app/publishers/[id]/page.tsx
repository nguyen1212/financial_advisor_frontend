'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/context/ToastContext';

export const dynamic = 'force-dynamic';

interface PublisherDetail {
  id: string;
  name: string;
  description: string;
  domain: string;
  website?: string;
  created_at?: string;
  updated_at?: string;
}

interface PublisherDetailResponse {
  data: PublisherDetail;
}

export default function PublisherDetailPage() {
  const [publisherDetail, setPublisherDetail] = useState<PublisherDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const { showError } = useToast();

  const publisherId = params.id as string;

  const fetchPublisherDetail = async () => {
    if (!publisherId) return;

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:40000/api/v1/publishers/${publisherId}`);

      if (!response.ok) {
        if (response.status === 404) {
          router.push('/error?code=404&message=Publisher not found');
          return;
        }
        router.push(`/error?code=${response.status}&message=${encodeURIComponent(response.statusText)}`);
        return;
      }

      const data: PublisherDetailResponse = await response.json();
      setPublisherDetail(data.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network connection failed';
      router.push(`/error?code=503&message=${encodeURIComponent(errorMessage)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublisherDetail();
  }, [publisherId]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading publisher...</div>
      </div>
    );
  }

  if (!publisherDetail) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Publisher not found</div>
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
          Back to Publishers
        </button>

        {/* Publisher Content */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-end mb-4">
              {/* External Link */}
              {publisherDetail.website && (
                <a
                  href={publisherDetail.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Visit Website
                </a>
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
              {publisherDetail.name}
            </h1>

            <div className="flex items-center text-gray-600 text-sm space-x-4">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0 0V3" />
                </svg>
                <span>{publisherDetail.domain}</span>
              </div>

              {publisherDetail.created_at && (
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Created {formatDate(publisherDetail.created_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Description</h2>
              {publisherDetail.description ? (
                <p className="text-gray-700 leading-relaxed">
                  {publisherDetail.description}
                </p>
              ) : (
                <p className="text-gray-500 italic">No description available.</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Domain</h3>
                  <p className="mt-1 text-gray-900">{publisherDetail.domain}</p>
                </div>

                {publisherDetail.website && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Website</h3>
                    <a
                      href={publisherDetail.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 text-blue-600 hover:text-blue-800 underline break-all"
                    >
                      {publisherDetail.website}
                    </a>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {publisherDetail.updated_at && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Last Updated</h3>
                    <p className="mt-1 text-gray-900">{formatDate(publisherDetail.updated_at)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              <span>Publisher ID: {publisherDetail.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}