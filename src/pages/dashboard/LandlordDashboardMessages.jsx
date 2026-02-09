import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { messagingAPI } from '../../services/api';
import { Loader2, Mail, Bell, ArrowRight } from 'lucide-react';

const LandlordDashboardMessages = () => {
  const { data: conversations, isLoading: loadingConvos } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messagingAPI.getConversations().then(res => res.data),
  });
  const { data: notifications, isLoading: loadingNotifs } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => messagingAPI.getNotifications().then(res => res.data),
  });

  const convos = conversations?.results || conversations || [];
  const notifs = (notifications?.results || notifications || []).slice(0, 20);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-dark-900">Messages & Notifications</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversations */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-dark-900 inline-flex items-center gap-2"><Mail size={18} /> Messages</h3>
            <Link to="/messages" className="text-primary text-sm font-medium inline-flex items-center gap-1">Open Inbox <ArrowRight size={14} /></Link>
          </div>
          {loadingConvos ? (
            <div className="flex items-center justify-center py-8 text-dark-500"><Loader2 className="animate-spin mr-2" /> Loading...</div>
          ) : convos.length === 0 ? (
            <p className="text-dark-600 text-sm py-4">No conversations yet.</p>
          ) : (
            <ul className="space-y-2 max-h-[400px] overflow-y-auto">
              {convos.slice(0, 10).map((c) => (
                <li key={c.id}>
                  <Link to={`/messages?conversation=${c.id}`} className="block p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-dark-900 text-sm truncate">{c.property?.title || 'Conversation'}</p>
                      {c.unread_count > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">{c.unread_count}</span>
                      )}
                    </div>
                    <p className="text-xs text-dark-500 mt-0.5 truncate">{c.last_message?.content || 'No messages'}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-dark-900 inline-flex items-center gap-2"><Bell size={18} /> Notifications</h3>
            <Link to="/notifications" className="text-primary text-sm font-medium inline-flex items-center gap-1">View All <ArrowRight size={14} /></Link>
          </div>
          {loadingNotifs ? (
            <div className="flex items-center justify-center py-8 text-dark-500"><Loader2 className="animate-spin mr-2" /> Loading...</div>
          ) : notifs.length === 0 ? (
            <p className="text-dark-600 text-sm py-4">No notifications.</p>
          ) : (
            <ul className="space-y-2 max-h-[400px] overflow-y-auto">
              {notifs.map((n) => (
                <li key={n.id} className={`p-3 rounded-lg border text-sm ${n.is_read ? 'bg-white' : 'bg-blue-50 border-blue-200'}`}>
                  <p className="font-medium text-dark-900">{n.title}</p>
                  <p className="text-dark-600 text-xs mt-0.5">{n.message}</p>
                  <p className="text-dark-400 text-xs mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default LandlordDashboardMessages;
