/**
 * Utility functions for safe image handling
 */

// Trusted domains from next.config.ts
const TRUSTED_DOMAINS = [
  'images.unsplash.com',
  'amazonaws.com',
  'res.cloudinary.com',
  // Add more trusted domains here as needed
];

/**
 * Check if an image URL is from a trusted domain
 * @param url - The image URL to validate
 * @returns true if the domain is trusted, false otherwise
 */
export function isTrustedImageDomain(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    return TRUSTED_DOMAINS.some(trustedDomain => {
      // Check for exact match or subdomain match
      return hostname === trustedDomain || hostname.endsWith('.' + trustedDomain);
    });
  } catch (error) {
    // Invalid URL
    return false;
  }
}

/**
 * Get a safe image source or null if not trusted
 * @param thumbnail - The thumbnail URL from API
 * @returns The thumbnail URL if trusted, null otherwise
 */
export function getSafeImageSrc(thumbnail?: string): string | null {
  if (!thumbnail) {
    return null;
  }

  // Allow data URLs (base64 images)
  if (thumbnail.startsWith('data:image/')) {
    return thumbnail;
  }

  // Allow relative URLs (local images)
  if (thumbnail.startsWith('/')) {
    return thumbnail;
  }

  // Check if domain is trusted
  if (isTrustedImageDomain(thumbnail)) {
    return thumbnail;
  }

  // Untrusted domain
  return null;
}

/**
 * Component for safe image rendering with fallback
 */
export interface SafeImageProps {
  src?: string;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
}