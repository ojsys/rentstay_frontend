import { useEffect, useMemo, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { messagingAPI } from '../../services/api';
import { Loader2, Mail, Bell, Send, MessageSquare, ArrowRight } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const LandlordDashboardMessages = () => {
  const { user } = useAuthStore();
  const [activeSection, setActiveSection] = useState('inbox');
  const [activeId, setActiveId] = useState(null);
  const [text, setText] = useState('');
  const [params] = useSearchParams();
  const [localMsgs, setLocalMsgs] = useState([]);
  const pendingMapRef = useRef({});

  const { data: conversations, isLoading: loadingConvos } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messagingAPI.getConversations().then(res => res.data),
  });

  const { data: messages, isLoading: loadingMessages, refetch: refetchMessages } = useQuery({
    queryKey: ['messages', activeId],
    queryFn: () => activeId ? messagingAPI.getMessages(activeId).then(res => res.data) : Promise.resolve([]),
    enabled: !!activeId,
  });

  const { data: notifications, isLoading: loadingNotifs } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => messagingAPI.getNotifications().then(res => res.data),
  });

  const convos = conversations?.results || conversations || [];
  const notifs = (notifications?.results || notifications || []).slice(0, 30);

  // Initialize active conversation
  useEffect(() => {
    const cid = params.get('conversation');
    if (cid && convos.length) {
      const cidNum = Number(cid);
      if (convos.some(c => c.id === cidNum)) {
        setActiveId(cidNum);
        return;
      }
    }
    if (convos.length && !activeId) {
      setActiveId(convos[0].id);
    }
  }, [convos, params, activeId]);

  // Sync server messages to local
  useEffect(() => {
    const pendings = Object.values(pendingMapRef.current).filter(p => p.conversation === activeId);
    setLocalMsgs([...(messages || []), ...pendings]);
  }, [messages, activeId]);

  // Poll for new messages
  useEffect(() => {
    if (!activeId) return;
    const t = setInterval(() => refetchMessages(), 5000);
    return () => clearInterval(t);
  }, [activeId, refetchMessages]);

  const onSend = async (e) => {
    e?.preventDefault?.();
    if (!text.trim() || !activeId) return;
    const content = text.trim();
    const tempId = `tmp-${Date.now()}`;
    const temp = {
      id: tempId,
      conversation: activeId,
      sender: user,
      content,
      is_read: false,
      created_at: new Date().toISOString(),
      _pending: true,
    };
    pendingMapRef.current[tempId] = temp;
    setLocalMsgs(prev => [...prev, temp]);
    setText('');
    try {
      const res = await messagingAPI.sendMessage(activeId, content);
      const real = res.data;
      delete pendingMapRef.current[tempId];
      setLocalMsgs(prev => prev.map(m => (m.id === tempId ? real : m)));
      refetchMessages();
    } catch {
      delete pendingMapRef.current[tempId];
      setLocalMsgs(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const markNotifRead = async (id) => {
    try {
      await messagingAPI.markAsRead(id);
    } catch {}
  };

  const currentConvo = useMemo(() => convos.find(c => c.id === activeId), [convos, activeId]);
  const otherUser = useMemo(() => {
    if (!currentConvo || !user) return null;
    return (currentConvo.participants || []).find(p => p.id !== user.id) || null;
  }, [currentConvo, user]);

  const sections = [
    { key: 'inbox', label: 'Inbox' },
    { key: 'notifications', label: 'Notifications' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-dark-900">Messages & Notifications</h2>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {sections.map(s => (
          <button key={s.key} onClick={() => setActiveSection(s.key)} className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all ${activeSection === s.key ? 'bg-white shadow-sm text-dark-900' : 'text-dark-600 hover:text-dark-900'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Inbox */}
      {activeSection === 'inbox' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Conversation list */}
          <div className="card">
            <div className="flex items-center mb-4">
              <MessageSquare className="text-primary mr-2" size={18} />
              <h3 className="text-lg font-semibold text-dark-900">Conversations</h3>
            </div>
            {loadingConvos ? (
              <div className="text-dark-500 text-sm flex items-center"><Loader2 className="animate-spin mr-2" size={16} /> Loading...</div>
            ) : convos.length === 0 ? (
              <p className="text-dark-600 text-sm">No conversations yet.</p>
            ) : (
              <ul className="space-y-2 max-h-[500px] overflow-y-auto">
                {convos.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => setActiveId(c.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${activeId === c.id ? 'border-primary bg-primary-50' : 'border-gray-200 hover:bg-gray-50'}`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-dark-900 text-sm truncate">{c.property?.title || 'Conversation'}</p>
                        {c.unread_count > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">{c.unread_count}</span>
                        )}
                      </div>
                      <p className="text-xs text-dark-500 mt-0.5 truncate">{c.last_message?.content || c.last_message || 'No messages'}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Messages panel */}
          <div className="md:col-span-2 card flex flex-col min-h-[400px]">
            {currentConvo && (
              <div className="flex items-center justify-between pb-3 border-b mb-3">
                <div>
                  <p className="font-semibold text-dark-900">{currentConvo.property?.title || 'Conversation'}</p>
                  <p className="text-xs text-dark-500">With {otherUser?.full_name || otherUser?.email || 'participant'}</p>
                </div>
              </div>
            )}
            {loadingMessages ? (
              <div className="flex-1 flex items-center justify-center text-dark-500"><Loader2 className="animate-spin mr-2" /> Loading messages...</div>
            ) : !activeId ? (
              <div className="flex-1 flex items-center justify-center text-dark-500 text-sm">Select a conversation</div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-[50vh] pr-2">
                  {(localMsgs || []).map((m) => {
                    const mine = m.sender?.id === user?.id;
                    return (
                      <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`px-3 py-2 rounded-lg max-w-[75%] ${mine ? 'bg-primary text-white' : 'bg-gray-100 text-dark-800'}`}>
                          {!mine && (
                            <p className="text-[11px] font-medium mb-0.5 text-dark-700">{m.sender?.full_name || m.sender?.email || 'User'}</p>
                          )}
                          <p className="text-sm">{m.content}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className={`text-[10px] ${mine ? 'text-white/80' : 'text-dark-500'}`}>{new Date(m.created_at).toLocaleString()}</p>
                            {mine && (
                              <p className="text-[10px] ml-3">{m._pending ? 'sending...' : (m.is_read ? 'read' : 'sent')}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <form onSubmit={onSend} className="flex items-center gap-2">
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="input flex-1"
                    placeholder="Type a message..."
                  />
                  <button type="submit" className="btn btn-primary"><Send size={16} /></button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Notifications */}
      {activeSection === 'notifications' && (
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
            <ul className="space-y-2 max-h-[600px] overflow-y-auto">
              {notifs.map((n) => (
                <li
                  key={n.id}
                  className={`p-3 rounded-lg border text-sm cursor-pointer transition-colors ${n.is_read ? 'bg-white' : 'bg-blue-50 border-blue-200'}`}
                  onClick={() => !n.is_read && markNotifRead(n.id)}
                >
                  <p className="font-medium text-dark-900">{n.title}</p>
                  <p className="text-dark-600 text-xs mt-0.5">{n.message}</p>
                  <p className="text-dark-400 text-xs mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default LandlordDashboardMessages;
