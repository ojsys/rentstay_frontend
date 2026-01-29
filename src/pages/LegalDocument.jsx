import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { legalAPI } from '../services/api';
import { Loader2, FileText, Calendar, ArrowLeft, Tag } from 'lucide-react';

const LegalDocument = () => {
  const { slug } = useParams();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await legalAPI.getDocument(slug);
        setDocument(response.data);

        // Update document title
        if (response.data.title) {
          window.document.title = `${response.data.title} | RentStay`;
        }
      } catch (err) {
        console.error('Error fetching legal document:', err);
        setError('Document not found or unavailable.');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchDocument();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <FileText className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-display font-bold text-dark-900 mb-2">Document Not Found</h2>
        <p className="text-dark-600 mb-6">{error}</p>
        <Link to="/legal" className="btn btn-primary">
          <ArrowLeft size={18} />
          <span>View All Documents</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-accent-50 py-12 md:py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <Link to="/legal" className="inline-flex items-center text-primary hover:text-primary-600 mb-6">
              <ArrowLeft size={18} className="mr-2" />
              <span>All Legal Documents</span>
            </Link>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-dark-900 mb-4">
              {document.title}
            </h1>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-dark-600">
              {document.category_display && (
                <span className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-700 rounded-full">
                  <Tag size={14} className="mr-1" />
                  {document.category_display}
                </span>
              )}
              {document.version && (
                <span className="inline-flex items-center">
                  <FileText size={14} className="mr-1" />
                  Version {document.version}
                </span>
              )}
              {document.effective_date && (
                <span className="inline-flex items-center">
                  <Calendar size={14} className="mr-1" />
                  Effective: {new Date(document.effective_date).toLocaleDateString()}
                </span>
              )}
            </div>

            {document.summary && (
              <p className="mt-4 text-lg text-dark-600">
                {document.summary}
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
              className="bg-white rounded-2xl shadow-soft p-8 md:p-12 prose prose-lg max-w-none
                prose-headings:font-display prose-headings:text-dark-900
                prose-p:text-dark-700 prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-strong:text-dark-900 prose-ul:text-dark-700 prose-ol:text-dark-700
                prose-li:marker:text-primary"
              dangerouslySetInnerHTML={{ __html: document.content }}
            />

            {/* Last updated */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-sm text-dark-500">
              <p>Last updated: {new Date(document.updated_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LegalDocument;
