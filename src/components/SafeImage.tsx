'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getSafeImageSrc } from '@/utils/imageUtils';

interface SafeImageProps {
  src?: string;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  fallbackMessage?: string;
}

export default function SafeImage({
  src,
  alt,
  className = '',
  fill = false,
  sizes,
  fallbackMessage = 'No image available'
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);

  // Validate image source before attempting to load
  const safeSrc = getSafeImageSrc(src);

  // Show fallback if no valid source or if image failed to load
  if (!safeSrc || hasError) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${fill ? 'absolute inset-0' : 'w-full h-full'}`}>
        <span className="text-gray-500 text-sm text-center px-2">
          {!safeSrc ? 'Image source not allowed' : fallbackMessage}
        </span>
      </div>
    );
  }

  // For Next.js Image with fill
  if (fill) {
    return (
      <Image
        src={safeSrc}
        alt={alt}
        fill
        className={className}
        sizes={sizes}
        onError={() => setHasError(true)}
        onLoad={() => setHasError(false)}
      />
    );
  }

  // For regular Next.js Image (you'd need to specify width/height)
  return (
    <Image
      src={safeSrc}
      alt={alt}
      width={300}
      height={200}
      className={className}
      onError={() => setHasError(true)}
      onLoad={() => setHasError(false)}
    />
  );
}