import { useQuery } from '@tanstack/react-query';
import { messagingAPI } from '../services/api';
import { Bell, Check } from 'lucide-react';
import DashboardShell from '../components/dashboard/DashboardShell';

const Notifications = () => {
  const { data, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => messagingAPI.getNotifications().then(res => res.data),
  });

  const markRead = async (id) => {
    await messagingAPI.markAsRead(id);
    refetch();
  };

  return (
    <DashboardShell>
      <div className="card">
        <div className="flex items-center mb-4">
          <Bell className="text-primary mr-2" />
          <h1 className="text-lg font-semibold text-dark-900">Notifications</h1>
        </div>
        {(data || []).length === 0 ? (
          <p className="text-dark-600 text-sm">No notifications.</p>
        ) : (
          <ul className="divide-y">
            {data.map((n) => (
              <li key={n.id} className="py-3 flex items-start justify-between">
                <div>
                  <p className="font-medium text-dark-900">{n.title}</p>
                  <p className="text-sm text-dark-600">{n.message}</p>
                  <p className="text-xs text-dark-500">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  {!n.is_read && (
                    <button onClick={() => markRead(n.id)} className="btn btn-secondary btn-sm"><Check size={14} /> Mark read</button>
                  )}
                  {n.link && (
                    <a href={n.link} className="btn btn-primary btn-sm" rel="noreferrer">Open</a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardShell>
  );
};

export default Notifications;
