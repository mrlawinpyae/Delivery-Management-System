import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getImageUrl(imagePath: string | undefined | null): string {
  if (!imagePath) return '';
  if (imagePath.startsWith('http') || imagePath.startsWith('data:') || imagePath.startsWith('blob:') || imagePath.startsWith('/')) {
    return imagePath;
  }
  return `${import.meta.env.VITE_BACKEND_IP}/images/${imagePath}`;
}
