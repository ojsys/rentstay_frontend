import { useState, useEffect } from 'react';
import { pagesAPI } from '../services/api';
import { Loader2 } from 'lucide-react';

const StaticPage = ({ slug, fallbackTitle, fallbackContent }) => {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        const response = await pagesAPI.getPage(slug);
        setPage(response.data);

        // Update document title
        if (response.data.title) {
          document.title = `${response.data.title} | RentStay`;
        }
      } catch (err) {
        console.error(`Error fetching page "${slug}":`, err);
        setError(err);
        // Use fallback content if API fails
        setPage({
          title: fallbackTitle,
          subtitle: '',
          content: fallbackContent,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug, fallbackTitle, fallbackContent]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-accent-50 py-16 md:py-24">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-dark-900 mb-4">
              {page?.title || fallbackTitle}
            </h1>
            {page?.subtitle && (
              <p className="text-xl text-dark-600 max-w-2xl mx-auto">
                {page.subtitle}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 md:py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div
              className="bg-white rounded-2xl shadow-soft p-8 md:p-12 prose prose-slate prose-sm md:prose-base lg:prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: page?.content || fallbackContent }}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default StaticPage;
