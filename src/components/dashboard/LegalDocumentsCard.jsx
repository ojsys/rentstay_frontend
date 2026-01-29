import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { legalAPI } from '../../services/api';
import { FileText, ChevronRight, Loader2, Gavel, ExternalLink } from 'lucide-react';

const LegalDocumentsCard = ({ showRequired = false, title = "Legal Documents & Agreements" }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        // Fetch either required documents or all documents
        const response = showRequired
          ? await legalAPI.getRequiredDocuments()
          : await legalAPI.listDocuments();
        setDocuments(response.data || []);
      } catch (err) {
        console.error('Error fetching legal documents:', err);
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [showRequired]);

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

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gavel className="text-primary" size={20} />
            <h3 className="text-lg font-semibold text-dark-900">{title}</h3>
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Gavel className="text-primary" size={20} />
          <h3 className="text-lg font-semibold text-dark-900">{title}</h3>
        </div>
        <Link to="/legal" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
          View All <ExternalLink size={14} />
        </Link>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-6">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-dark-600 text-sm">No documents available.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.slice(0, 5).map((doc) => (
            <Link
              key={doc.slug}
              to={`/legal/${doc.slug}`}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50/50 transition-all group"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="text-primary" size={18} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-medium text-dark-900 group-hover:text-primary transition-colors truncate">
                    {doc.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(doc.category)}`}>
                      {doc.category}
                    </span>
                    {doc.version && (
                      <span className="text-xs text-dark-500">v{doc.version}</span>
                    )}
                    {doc.requires_acceptance && (
                      <span className="text-xs text-amber-600 font-medium">Required</span>
                    )}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-dark-400 group-hover:text-primary flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {documents.length > 5 && (
        <div className="mt-4 pt-3 border-t border-gray-100 text-center">
          <Link to="/legal" className="text-primary text-sm font-medium hover:underline">
            View all {documents.length} documents
          </Link>
        </div>
      )}
    </div>
  );
};

export default LegalDocumentsCard;
