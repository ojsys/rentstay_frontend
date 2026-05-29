import { useEffect, useState } from 'react';
import { staffAPI } from '../../services/api';
import { Loader2, CheckCircle, EyeOff, BadgeCheck, Search, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const CONFIG = {
  rentals: {
    statuses: ['pending', 'submitted', 'draft', 'available', 'rented', 'maintenance'],
    ownerLabel: 'Landlord',
    list: (params) => staffAPI.listProperties(params),
    moderate: (id, action) => staffAPI.moderateProperty(id, action),
    isLive: (row) => row.status === 'available',
    ownerName: (row) => row.landlord_name || '—',
    ownerVerified: (row) => row.is_verified,
    detailPath: (row) => `/properties/${row.slug || row.id}`,
    subtitle: (row) => [row.area, row.state_name].filter(Boolean).join(', '),
  },
  stays: {
    statuses: ['draft', 'published', 'suspended'],
    ownerLabel: 'Host',
    list: (params) => staffAPI.listListings(params),
    moderate: (id, action) => staffAPI.moderateListing(id, action),
    isLive: (row) => row.is_published,
    ownerName: (row) => `${row.owner?.first_name || ''} ${row.owner?.last_name || ''}`.trim() || '—',
    ownerVerified: (row) => row.owner?.is_verified,
    detailPath: (row) => `/stays/listings/${row.id}`,
    subtitle: (row) => row.location || [row.area, row.state_name].filter(Boolean).join(', '),
  },
};

const ListingModerationTable = ({ type }) => {
  const cfg = CONFIG[type];
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (query) params.search = query;
      const res = await cfg.list(params);
      setItems(res.data || []);
    } catch {
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, statusFilter, query]);

  const moderate = async (id, action) => {
    try {
      setBusyId(id);
      await cfg.moderate(id, action);
      toast.success(action === 'publish' ? 'Verified & published' : 'Unpublished');
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form
          onSubmit={(e) => { e.preventDefault(); setQuery(search.trim()); }}
          className="relative flex-1"
        >
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            className="input pl-9 w-full"
            placeholder={`Search by title or ${cfg.ownerLabel.toLowerCase()} email…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
        <select
          className="input sm:w-48"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          {cfg.statuses.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-dark-500 flex items-center py-12 justify-center">
          <Loader2 className="animate-spin mr-2" /> Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-dark-500">
          <p className="font-medium">Nothing here</p>
          <p className="text-sm mt-1">No listings match the current filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((row) => {
            const live = cfg.isLive(row);
            return (
              <div
                key={row.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 border rounded-xl p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-dark-900 truncate">{row.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      live ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {live ? 'Live' : 'Awaiting review'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-dark-500 mt-1 flex-wrap">
                    <span>{cfg.ownerLabel}: <span className="text-dark-700">{cfg.ownerName(row)}</span></span>
                    {cfg.ownerVerified(row) && (
                      <span className="inline-flex items-center gap-1 text-green-600">
                        <BadgeCheck size={14} /> verified
                      </span>
                    )}
                  </div>
                  {cfg.subtitle(row) && (
                    <p className="text-xs text-dark-400 mt-0.5 truncate">{cfg.subtitle(row)}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={cfg.detailPath(row)}
                    target="_blank"
                    className="btn btn-secondary btn-sm inline-flex items-center"
                    title="Preview"
                  >
                    <ExternalLink size={14} className="mr-1" /> View
                  </Link>
                  {live ? (
                    <button
                      className="btn btn-secondary btn-sm inline-flex items-center"
                      disabled={busyId === row.id}
                      onClick={() => moderate(row.id, 'unpublish')}
                    >
                      {busyId === row.id
                        ? <Loader2 size={14} className="animate-spin mr-1" />
                        : <EyeOff size={14} className="mr-1" />}
                      Unpublish
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm inline-flex items-center"
                      disabled={busyId === row.id}
                      onClick={() => moderate(row.id, 'publish')}
                    >
                      {busyId === row.id
                        ? <Loader2 size={14} className="animate-spin mr-1" />
                        : <CheckCircle size={14} className="mr-1" />}
                      Verify &amp; Publish
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ListingModerationTable;
