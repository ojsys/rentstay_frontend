import { Link } from 'react-router-dom';
import { Star, Zap, Home, DoorOpen, BedDouble, ArrowRight } from 'lucide-react';

const TYPE_LABELS = { entire: 'Entire place', private_room: 'Private room', shared_room: 'Shared room' };
const TYPE_ICONS = { entire: Home, private_room: DoorOpen, shared_room: BedDouble };

const StayCard = ({ listing, checkIn, checkOut, guests = 1 }) => {
  const TypeIcon = TYPE_ICONS[listing.listing_type] || Home;
  const to = `/stays/listings/${listing.id}${checkIn && checkOut ? `?check_in=${checkIn}&check_out=${checkOut}&guests=${guests}` : ''}`;

  return (
    <Link to={to} className="group block">
      {/* Image */}
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 mb-3">
        <img
          src={listing.primary_image || '/placeholder-property.jpg'}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {listing.instant_book && (
          <span className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-white/90 backdrop-blur-sm text-dark-800 text-[11px] font-semibold px-2 py-1 rounded-full shadow-sm">
            <Zap size={11} className="text-primary" /> Instant
          </span>
        )}
      </div>

      {/* Info */}
      <div className="space-y-0.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-dark-900 text-sm line-clamp-1 flex-1">{listing.title}</h3>
          <div className="flex items-center gap-0.5 text-xs text-dark-600 flex-shrink-0">
            <Star size={12} className="fill-dark-800 text-dark-800" />
            <span>New</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-dark-500">
          <TypeIcon size={11} />
          <span className="capitalize">{TYPE_LABELS[listing.listing_type] || listing.listing_type}</span>
          <span>·</span>
          <span>{listing.capacity_adults} guest{listing.capacity_adults !== 1 ? 's' : ''}</span>
          <span>·</span>
          <span>{listing.beds} bed{listing.beds !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center justify-between pt-1">
          <p className="text-sm text-dark-900">
            <span className="font-semibold">₦{Number(listing.nightly_rate).toLocaleString()}</span>
            <span className="text-dark-500 font-normal"> / night</span>
          </p>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-primary hover:bg-primary-600 px-3 py-1.5 rounded-lg transition-colors">
            View <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </Link>
  );
};

export default StayCard;
