import { useState, useEffect } from 'react';
import { siteSettingsAPI } from '../services/api';

/**
 * Custom hook to fetch and manage site settings (logo, favicon, etc.)
 * @returns {Object} { settings, loading, error }
 */
export const useSiteSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await siteSettingsAPI.get();
        setSettings(response.data);
        setError(null);

        // Update favicon dynamically
        if (response.data.favicon_url) {
          const link = document.querySelector("link[rel~='icon']");
          if (link) {
            link.href = response.data.favicon_url;
          } else {
            // Create favicon link if it doesn't exist
            const newLink = document.createElement('link');
            newLink.rel = 'icon';
            newLink.href = response.data.favicon_url;
            document.head.appendChild(newLink);
          }
        }

        // Update document title if site name exists
        if (response.data.site_name) {
          document.title = response.data.site_name;
        }

        // Update primary color as CSS variable (optional)
        if (response.data.primary_color) {
          document.documentElement.style.setProperty(
            '--site-primary-color',
            response.data.primary_color
          );
        }
      } catch (err) {
        console.error('Failed to load site settings:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, loading, error };
};

export default useSiteSettings;
