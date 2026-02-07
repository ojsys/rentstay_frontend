import { Link } from 'react-router-dom';
import { Home, LogIn, Search, ArrowLeft } from 'lucide-react';
import useAuthStore from '../store/authStore';

const NotFound = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12">
      <div className="container-custom">
        <div className="max-w-lg mx-auto text-center">
          {/* Animated 404 */}
          <div className="relative mb-8">
            <h1 className="text-[150px] font-display font-bold text-primary-100 leading-none select-none">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white rounded-2xl shadow-card px-6 py-3">
                <p className="text-lg font-semibold text-dark-900">Page Not Found</p>
              </div>
            </div>
          </div>

          {/* Message */}
          <h2 className="text-2xl font-display font-bold text-dark-900 mb-3">
            Oops! Lost your way?
          </h2>
          <p className="text-dark-500 mb-8 max-w-md mx-auto leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
            Don't worry, let's get you back on track.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="btn btn-primary btn-lg inline-flex items-center justify-center gap-2"
            >
              <Home size={20} />
              Go Home
            </Link>

            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="btn bg-white border border-gray-200 text-dark-700 hover:bg-gray-50 btn-lg inline-flex items-center justify-center gap-2"
              >
                <ArrowLeft size={20} />
                Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                className="btn bg-white border border-gray-200 text-dark-700 hover:bg-gray-50 btn-lg inline-flex items-center justify-center gap-2"
              >
                <LogIn size={20} />
                Login
              </Link>
            )}

            <Link
              to="/properties"
              className="btn bg-white border border-gray-200 text-dark-700 hover:bg-gray-50 btn-lg inline-flex items-center justify-center gap-2"
            >
              <Search size={20} />
              Browse Properties
            </Link>
          </div>

          {/* Subtle help text */}
          <p className="mt-10 text-sm text-dark-400">
            If you think this is an error, please{' '}
            <Link to="/contact" className="text-primary hover:text-primary-600 underline">
              contact support
            </Link>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
