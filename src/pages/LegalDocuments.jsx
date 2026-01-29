import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { legalAPI } from '../services/api';
import { Loader2, FileText, Calendar, ChevronRight, Tag, Filter } from 'lucide-react';

const LegalDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');

  const categories = [
    { value: '', label: 'All Documents' },
    { value: 'agreement', label: 'Agreements' },
    { value: 'policy', label: 'Policies' },
    { value: 'terms', label: 'Terms & Conditions' },
    { value: 'disclosure', label: 'Disclosures' },
    { value: 'notice', label: 'Notices' },
    { value: 'other', label: 'Other' },
  ];

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const response = await legalAPI.listDocuments(selectedCategory || undefined);
        setDocuments(response.data);
      } catch (err) {
        console.error('Error fetching legal documents:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
    document.title = 'Legal Documents | RentStay';
  }, [selectedCategory]);

  const getCategoryColor = (category) => {
    const colors = {
      agreement: 'bg-blue-100 text-blue-700',
      policy: 'bg-green-100 text-green-700',
      terms: 'bg-purple-100 text-purple-700',
      disclosure: 'bg-orange-100 text-orange-700',
      notice: 'bg-red-100 text-red-700',
      other: 'bg-gray-100 text-gray-700',
    };
    return colors[category] || colors.other;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-accent-50 py-16 md:py-24">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-dark-900 mb-4">
              Legal Documents
            </h1>
            <p className="text-xl text-dark-600 max-w-2xl mx-auto">
              Important agreements, policies, and disclosures governing the use of RentStay services.
            </p>
          </div>
        </div>
      </section>

      {/* Filter and Content Section */}
      <section className="py-12 md:py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            {/* Category Filter */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Filter size={18} className="text-dark-500" />
                <span className="font-medium text-dark-700">Filter by category:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all
                      ${selectedCategory === cat.value
                        ? 'bg-primary text-white'
                        : 'bg-white text-dark-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Documents List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-dark-700">No documents found</h3>
                <p className="text-dark-500">No legal documents are available in this category.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {documents.map((doc) => (
                  <Link
                    key={doc.slug}
                    to={`/legal/${doc.slug}`}
                    className="block bg-white rounded-xl shadow-soft p-6 hover:shadow-lg transition-shadow group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(doc.category)}`}>
                            <Tag size={12} className="mr-1" />
                            {doc.category.charAt(0).toUpperCase() + doc.category.slice(1)}
                          </span>
                          {doc.version && (
                            <span className="text-xs text-dark-500">v{doc.version}</span>
                          )}
                          {doc.requires_acceptance && (
                            <span className="inline-flex items-center px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                              Acceptance Required
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-semibold text-dark-900 group-hover:text-primary transition-colors mb-2">
                          {doc.title}
                        </h3>

                        {doc.summary && (
                          <p className="text-dark-600 text-sm line-clamp-2 mb-3">
                            {doc.summary}
                          </p>
                        )}

                        {doc.effective_date && (
                          <div className="flex items-center text-xs text-dark-500">
                            <Calendar size={14} className="mr-1" />
                            Effective: {new Date(doc.effective_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      <ChevronRight className="w-5 h-5 text-dark-400 group-hover:text-primary transition-colors flex-shrink-0 ml-4" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LegalDocuments;
