import { MapPin, Bed, Bath, Home, Heart, Eye, CalendarClock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import useAuthStore from '../store/authStore';
import { visitAPI } from '../services/api';
import toast from 'react-hot-toast';

const PropertyCard = ({ property }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [visitOpen, setVisitOpen] = useState(false);
  const [visitDateTime, setVisitDateTime] = useState('');
  const [visitNote, setVisitNote] = useState('');
  const [visitLoading, setVisitLoading] = useState(false);

  // Format price with commas
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Primary image from list serializer or fallback to first image if present
  const primaryImage = property.primary_image || (property.images && property.images.length > 0 ? property.images[0].image : '/placeholder-property.jpg');

  // Status badge color
  const statusColors = {
    available: 'bg-green-100 text-green-800',
    rented: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="card group hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Image Container */}
      <div className="relative h-64 overflow-hidden">
        <Link to={`/properties/${property.id}`}>
          <img
            src={primaryImage}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        </Link>

        {/* Favorite Button */}
        <button
          onClick={() => setIsFavorite(!isFavorite)}
          className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-sm transition-all ${
            isFavorite
              ? 'bg-red-500 text-white'
              : 'bg-white/80 text-dark-600 hover:bg-white'
          }`}
        >
          <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>

        {/* Status Badge */}
        <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-medium ${statusColors[property.status]}`}>
          {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
        </div>

        {/* View Count */}
        <div className="absolute bottom-4 right-4 flex items-center space-x-1 bg-dark-900/70 text-white px-2 py-1 rounded-full text-xs backdrop-blur-sm">
          <Eye size={14} />
          <span>{property.views_count || 0}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Property Type */}
        <div className="flex items-center space-x-2 mb-2">
          <Home size={16} className="text-primary" />
          <span className="text-sm text-dark-600 font-medium">{property.property_type}</span>
        </div>

        {/* Title */}
        <Link to={`/properties/${property.id}`}>
          <h3 className="text-xl font-semibold text-dark-900 mb-2 hover:text-primary transition-colors line-clamp-2">
            {property.title}
          </h3>
        </Link>

        {/* Location */}
        <div className="flex items-center space-x-2 text-dark-600 mb-4">
          <MapPin size={16} className="text-primary" />
          <span className="text-sm">
            {property.address}{property.address ? ', ' : ''}
            {property.lga?.name || property.lga_name || property.state?.name || property.area}
          </span>
        </div>

        {/* Features */}
        <div className="flex items-center space-x-4 mb-4 text-dark-700">
          <div className="flex items-center space-x-1">
            <Bed size={18} className="text-primary" />
            <span className="text-sm">{property.bedrooms} Beds</span>
          </div>
          <div className="flex items-center space-x-1">
            <Bath size={18} className="text-primary" />
            <span className="text-sm">{property.bathrooms} Baths</span>
          </div>
          {property.square_feet && (
            <div className="text-sm text-dark-600">
              {property.square_feet} ft²
            </div>
          )}
        </div>

        {/* Price Section */}
        <div className="border-t pt-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-dark-600 mb-1">Rent Amount</p>
              <p className="text-2xl font-bold text-primary">
                {formatPrice(property.rent_amount)}
                <span className="text-sm text-dark-600 font-normal">/year</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-dark-600 mb-1">Caution Fee</p>
              <p className="text-sm font-semibold text-accent">
                {formatPrice(property.caution_fee)}
              </p>
              <p className="text-xs text-green-600">+5% interest</p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="mt-4 space-y-2">
          <Link
            to={`/properties/${property.id}`}
            className="btn btn-primary w-full flex items-center justify-center group"
          >
            View Details
            <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
          </Link>
          <button
            className="btn btn-secondary w-full inline-flex items-center justify-center"
            onClick={() => { if (!isAuthenticated) navigate('/login'); else setVisitOpen(true); }}
          >
            <CalendarClock size={18} className="mr-2" /> Schedule Visit
          </button>
        </div>

        {/* Landlord Info (optional) */}
        {property.landlord && (
          <div className="mt-4 pt-4 border-t flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary font-semibold">
              {property.landlord.first_name?.charAt(0) || 'L'}
            </div>
            <div>
              <p className="text-sm font-medium text-dark-900">
                {property.landlord.first_name} {property.landlord.last_name}
              </p>
              <p className="text-xs text-dark-600">Property Owner</p>
            </div>
          </div>
        )}
      </div>
      {visitOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-xl shadow-xl w-[92vw] max-w-md p-5">
            <h3 className="text-lg font-semibold text-dark-900 mb-3">Schedule a Visit</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!visitDateTime) { toast.error('Please choose date and time'); return; }
              try {
                setVisitLoading(true);
                await visitAPI.create(property.id, new Date(visitDateTime).toISOString(), visitNote);
                toast.success('Visit requested! The landlord will confirm.');
                setVisitOpen(false);
                setVisitDateTime('');
                setVisitNote('');
              } catch (err) {
                toast.error(err?.response?.data?.detail || 'Failed to request visit');
              } finally {
                setVisitLoading(false);
              }
            }} className="space-y-3">
              <div>
                <label className="label">Preferred Date & Time</label>
                <input type="datetime-local" className="input w-full" value={visitDateTime} onChange={(e) => setVisitDateTime(e.target.value)} required />
              </div>
              <div>
                <label className="label">Note (optional)</label>
                <textarea className="input w-full min-h-[90px]" value={visitNote} onChange={(e) => setVisitNote(e.target.value)} placeholder="Any notes for the landlord" />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" className="btn" onClick={() => setVisitOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={visitLoading}>{visitLoading ? 'Sending...' : 'Request Visit'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyCard;
