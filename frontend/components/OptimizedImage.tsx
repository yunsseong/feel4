'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  quality?: number;
}

/**
 * Optimized Image Component with lazy loading and WebP support
 * Automatically handles image optimization for web and mobile
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  loading = 'lazy',
  quality = 85,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-muted text-muted-foreground ${className}`}
        style={{ width, height }}
      >
        <span className="text-sm">이미지를 불러올 수 없습니다</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Skeleton loader */}
      {!isLoaded && (
        <div
          className="absolute inset-0 bg-muted animate-pulse"
          style={{ width, height }}
        />
      )}

      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        priority={priority}
        loading={loading}
        quality={quality}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        // Automatically use WebP if supported
        unoptimized={false}
      />
    </div>
  );
}

/**
 * Avatar Image Component with fallback
 */
interface AvatarImageProps {
  src?: string | null;
  alt: string;
  size?: number;
  fallback?: string;
}

export function AvatarImage({
  src,
  alt,
  size = 40,
  fallback = '👤',
}: AvatarImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className="flex items-center justify-center bg-muted rounded-full"
        style={{ width: size, height: size }}
      >
        <span style={{ fontSize: size * 0.6 }}>{fallback}</span>
      </div>
    );
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="rounded-full object-cover"
        onError={() => setHasError(true)}
      />
    </div>
  );
}
