import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Add the backend URL configuration
export const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || 'http://localhost:4100';
