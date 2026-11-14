import Navbar from './Navbar';
import Footer from './Footer';
import ErrorBoundary from '../common/ErrorBoundary';
import ImpersonationBanner from './ImpersonationBanner';

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Above the navbar and outside the ErrorBoundary: a page that crashes
          must not be able to hide the fact that you are inside someone
          else's account. */}
      <ImpersonationBanner />
      <Navbar />
      <main className="flex-grow">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
