'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface NewsItem {
  title: string;
  thumbnail: string;
  status: string;
}

interface NewsResponse {
  data: NewsItem[];
}

export default function Home() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch('http://localhost:40000/api/v1/news');

        if (!response.ok) {
          const errorCode = response.status;
          const errorMessage = response.statusText;

          router.push(`/error?code=${errorCode}&message=${encodeURIComponent(errorMessage)}`);
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

    fetchNews();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading news...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">News Feed</h1>

        {news.length === 0 ? (
          <div className="text-center text-gray-600">No news articles found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((item, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48">
                  <Image
                    src={item.thumbnail}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <div className="p-4">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">{item.title}</h2>
                  <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                    item.status === 'synced'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
