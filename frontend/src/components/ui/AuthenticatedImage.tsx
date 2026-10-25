'use client';

import React, { useState, useEffect } from 'react';
import { ImageIcon } from 'lucide-react';

export interface AuthenticatedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt?: string;
  className?: string;
  fallback?: React.ReactNode;
}

/**
 * Normalizes backend API base URL from NEXT_PUBLIC_API_URL (which may include /graphql)
 */
function getBackendBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!envUrl) {
    return 'http://localhost:4000';
  }
  return envUrl.replace(/\/graphql\/?$/, '').replace(/\/+$/, '');
}

/**
 * Checks if a given URL represents a protected attachment endpoint that requires
 * backend authentication headers. Public demo assets and external URLs are excluded.
 */
function isProtectedAttachment(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('blob:') || url.startsWith('data:')) return false;
  if (url.startsWith('/demo-assets/') || url.startsWith('demo-assets/')) return false;
  if (url.startsWith('/assets/') || url.startsWith('assets/')) return false;
  if (url.includes('/api/attachments/demo/')) return false;

  return url.startsWith('/api/attachments/') || url.includes('/api/attachments/');
}

/**
 * Resolves relative attachment paths against the authoritative backend origin.
 */
function getFullAttachmentUrl(src: string): string {
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  const baseUrl = getBackendBaseUrl();
  const path = src.startsWith('/') ? src : `/${src}`;
  return `${baseUrl}${path}`;
}

/**
 * AuthenticatedImage component:
 * Safely loads protected attachment images using the backend API URL and existing JWT from localStorage.
 * Renders fetched images through temporary Blob URLs, revoking them on unmount to prevent leaks.
 * Public demo assets and external images pass through natively.
 */
export function AuthenticatedImage({
  src,
  alt = '',
  className,
  fallback,
  ...restProps
}: AuthenticatedImageProps) {
  const [displaySrc, setDisplaySrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    if (!src) {
      setDisplaySrc('');
      setIsLoading(false);
      setHasError(false);
      return;
    }

    // Direct render for non-protected images (blob preview, demo asset, external URL)
    if (!isProtectedAttachment(src)) {
      setDisplaySrc(src);
      setIsLoading(false);
      setHasError(false);
      return;
    }

    let isMounted = true;
    let currentBlobUrl: string | null = null;
    setIsLoading(true);
    setHasError(false);

    async function loadProtectedAttachment() {
      try {
        const token =
          typeof window !== 'undefined' ? localStorage.getItem('fixflow_token') : null;
        const targetUrl = getFullAttachmentUrl(src);

        const response = await fetch(targetUrl, {
          method: 'GET',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to load attachment: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        if (!isMounted) return;

        currentBlobUrl = URL.createObjectURL(blob);
        setDisplaySrc(currentBlobUrl);
        setIsLoading(false);
      } catch {
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    }

    loadProtectedAttachment();

    return () => {
      isMounted = false;
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [src]);

  if (hasError) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div
        className={`flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700/60 ${className || ''}`}
        title={alt || 'Image attachment could not be loaded'}
      >
        <ImageIcon className="w-5 h-5 opacity-40 mb-0.5" />
        <span className="text-[10px] text-slate-400 font-medium">Unavailable</span>
      </div>
    );
  }

  if (isLoading && !displaySrc) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 dark:bg-slate-800/80 animate-pulse ${className || ''}`}
        aria-busy="true"
        aria-label={alt || 'Loading evidence'}
      >
        <span className="sr-only">{alt || 'Loading image'}</span>
      </div>
    );
  }

  return (
    <img
      src={displaySrc}
      alt={alt}
      className={className}
      {...restProps}
    />
  );
}
