/**
 * Get the full URL for a media file
 * @param {string} path - The relative path from the backend (e.g., /media/profiles/image.jpg)
 * @returns {string} - The full URL
 */
export const getMediaUrl = (path) => {
  if (!path) return null;

  // If path is already a full URL, return it
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Get the base URL from environment (remove /api from the end if present)
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
};

/**
 * Get initials from a name for avatar placeholder
 * @param {string} name - Full name or email
 * @returns {string} - Initials (e.g., "JD" for "John Doe")
 */
export const getInitials = (name) => {
  if (!name) return '?';

  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  return name.substring(0, 2).toUpperCase();
};
