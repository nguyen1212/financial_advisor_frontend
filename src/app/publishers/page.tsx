'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AddPublisherModal from '@/components/AddPublisherModal';
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
}

export default function Publishers() {
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { showError, showSuccess } = useToast();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:40000/api/v1';

  const fetchPublishers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/publishers`);

      if (!response.ok) {
        router.push(`/error?code=${response.status}&message=${encodeURIComponent(response.statusText)}`);
        return;
      }

      const data: PublishersResponse = await response.json();
      setPublishers(data.data);
      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network connection failed';
      router.push(`/error?code=503&message=${encodeURIComponent(errorMessage)}`);
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
      await fetchPublishers();
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
    fetchPublishers();
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

        {publishers.length === 0 ? (
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

        <AddPublisherModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAddPublisher}
          loading={submitting}
        />
      </div>
    </div>
  );
}