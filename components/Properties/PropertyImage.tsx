"use client";

import { useState, useEffect } from "react";
import NextImage from "next/image";

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

function checkImageExists(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

export default function PropertyImage(props: {
  src: string | null | undefined;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const {
    src,
    alt,
    fill = false,
    className = "",
    sizes,
    priority = false,
  } = props;

  const [imageUrl, setImageUrl] = useState<string>("/siniya.png");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!src) {
      setImageUrl("/siniya.png");
      setLoading(false);
      return;
    }

    if (
      src.startsWith("http") ||
      IMAGE_EXTENSIONS.some((ext) => src.toLowerCase().endsWith(ext))
    ) {
      setImageUrl(src);
      setLoading(false);
      return;
    }

    const checkImage = async () => {
      for (const ext of IMAGE_EXTENSIONS) {
        const testUrl = `${src}${ext}`;
        const exists = await checkImageExists(testUrl);
        if (exists) {
          setImageUrl(testUrl);
          setLoading(false);
          return;
        }
      }
      setImageUrl("/siniya.png");
      setLoading(false);
    };

    checkImage();
  }, [src]);

  if (loading) {
    return (
      <div
        className={`animate-pulse bg-gray-100 ${className}`}
        style={fill ? { position: "absolute", inset: 0 } : {}}
      />
    );
  }

  if (fill) {
    return (
      <NextImage
        src={imageUrl}
        alt={alt}
        fill
        className={`object-cover ${className}`}
        sizes={sizes || "100vw"}
        priority={priority}
        unoptimized={imageUrl.startsWith("/upload/")}
      />
    );
  }

  return <img src={imageUrl} alt={alt} className={className} />;
}