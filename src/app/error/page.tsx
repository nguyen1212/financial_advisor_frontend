'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code') || '500';
  const message = searchParams.get('message') || 'Internal Server Error';

  const getErrorTitle = (code: string) => {
    switch (code) {
      case '404':
        return 'Page Not Found';
      case '500':
        return 'Internal Server Error';
      case '503':
        return 'Service Unavailable';
      default:
        return 'Error';
    }
  };

  const getErrorDescription = (code: string) => {
    switch (code) {
      case '404':
        return 'The page you are looking for does not exist.';
      case '500':
        return 'Something went wrong on our end. Please try again later.';
      case '503':
        return 'The service is temporarily unavailable. Please try again later.';
      default:
        return 'An unexpected error occurred.';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-800 mb-2">
            Error {code}
          </h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            {getErrorTitle(code)}
          </h2>
          <p className="text-gray-600 mb-2">
            {getErrorDescription(code)}
          </p>
          {message !== getErrorDescription(code) && (
            <p className="text-sm text-gray-500 mb-6">
              {message}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Go Back Home
          </Link>
          <div>
            <button
              onClick={() => window.location.reload()}
              className="inline-block bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium ml-4"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-xl">Loading...</div></div>}>
      <ErrorContent />
    </Suspense>
  );
}