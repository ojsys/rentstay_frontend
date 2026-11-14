import { useEffect, useMemo, useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { messagingAPI } from '../services/api';
import { Loader2, Send, MessageSquare, Check, CheckCheck, User as UserIcon, Bed, Building2, Search } from 'lucide-react';
import useAuthStore from '../store/authStore';
import DashboardShell from '../components/dashboard/DashboardShell';
import { useSearchParams, Navigate } from 'react-router-dom';

/** Compact "when" for the conversation list. */
const relativeTime = (iso) => {
  if (!iso) return '';
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const Messages = () => {
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState(null);
  const [text, setText] = useState('');
  const [params, setParams] = useSearchParams();
  const [localMsgs, setLocalMsgs] = useState([]);
  const [filter, setFilter] = useState('');
  const pendingMapRef = useRef({});

  const { data: conversations, isLoading: loadingConvos } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messagingAPI.getConversations().then(res => res.data),
    enabled: isAuthenticated,
  });

  const totalUnread = useMemo(
    () => (conversations || []).reduce((sum, c) => sum + (c.unread_count || 0), 0),
    [conversations],
  );

  const visibleConversations = useMemo(() => {
    const list = conversations || [];
    const needle = filter.trim().toLowerCase();
    if (!needle) return list;
    // Match on who it is with and what it is about — the two things people
    // actually remember about a thread.
    return list.filter((c) =>
      (c.other_party?.full_name || '').toLowerCase().includes(needle)
      || (c.subject_title || '').toLowerCase().includes(needle));
  }, [conversations, filter]);

  const { data: messages, isLoading: loadingMessages, refetch: refetchMessages } = useQuery({
    queryKey: ['messages', activeId],
    queryFn: () => activeId ? messagingAPI.getMessages(activeId).then(res => res.data) : Promise.resolve([]),
    enabled: !!activeId,
  });

  // Initialize active conversation from query param
  useEffect(() => {
    const cid = params.get('conversation');
    if (cid && conversations?.length) {
      const cidNum = Number(cid);
      const exists = conversations.some((c) => c.id === cidNum);
      if (exists) {
        setActiveId(cidNum);
        return;
      }
    }
    if (conversations?.length && !activeId) {
      setActiveId(conversations[0].id);
    }
  }, [conversations, params, activeId]);

  // Sync server messages to local, preserving pending ones for this conversation
  useEffect(() => {
    const pendings = Object.values(pendingMapRef.current).filter(p => p.conversation === activeId);
    setLocalMsgs([...(messages || []), ...pendings]);
  }, [messages, activeId]);

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
      // Keep URL param synced
      const url = new URL(window.location.href);
      url.searchParams.set('conversation', String(activeId));
      window.history.replaceState({}, '', url.toString());
      // Refresh to reflect any server-side changes
      refetchMessages();
    } catch (_) {
      delete pendingMapRef.current[tempId];
      setLocalMsgs(prev => prev.filter(m => m.id !== tempId));
    }
  };

  // Poll for updates while a conversation is active
  useEffect(() => {
    if (!activeId) return;
    const t = setInterval(() => refetchMessages(), 5000);
    return () => clearInterval(t);
  }, [activeId, refetchMessages]);

  const currentConvo = useMemo(() => (conversations || []).find(c => c.id === activeId), [conversations, activeId]);
  const otherUser = useMemo(() => {
    if (!currentConvo || !user) return null;
    return (currentConvo.participants || []).find(p => p.id !== user.id) || null;
  }, [currentConvo, user]);

  if (user?.user_type === 'landlord') return <Navigate to="/dashboard/messages" replace />;

  return (
    <DashboardShell>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Conversations */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center min-w-0">
              <MessageSquare className="text-primary mr-2 flex-shrink-0" />
              <h2 className="text-lg font-semibold truncate">Inbox</h2>
            </div>
            {totalUnread > 0 && (
              <span className="text-xs font-semibold bg-red-500 text-white rounded-full px-2 py-0.5 flex-shrink-0">
                {totalUnread} new
              </span>
            )}
          </div>

          {(conversations || []).length > 6 && (
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="input w-full pl-9 py-2 text-sm"
                placeholder="Search by name or property"
              />
            </div>
          )}

          {loadingConvos ? (
            <div className="text-dark-500 text-sm">Loading...</div>
          ) : visibleConversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare size={26} className="mx-auto text-dark-200 mb-2" />
              <p className="text-sm text-dark-500">
                {filter ? 'No conversations match that.' : 'No conversations yet.'}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {visibleConversations.map((c) => {
                // A stay thread has no `property`, which is why every one of
                // them used to render as the literal word "Conversation".
                const isStay = c.subject_kind === 'stay';
                const KindIcon = isStay ? Bed : Building2;
                const who = c.other_party?.full_name || 'Conversation';
                const about = c.subject_title || (isStay ? 'Short stay' : 'Property');
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => setActiveId(c.id)}
                      className={`w-full text-left p-3 rounded-lg border transition ${activeId === c.id ? 'border-primary bg-primary-50' : 'border-gray-200 hover:bg-gray-50'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-dark-900 truncate ${c.unread_count ? 'font-bold' : 'font-medium'}`}>
                          {who}
                        </p>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {c.unread_count > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                              {c.unread_count > 9 ? '9+' : c.unread_count}
                            </span>
                          )}
                          <span className="text-[10px] text-dark-400 whitespace-nowrap">
                            {relativeTime(c.last_message_at)}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-dark-500 flex items-center gap-1 mt-0.5 truncate">
                        <KindIcon size={11} className="flex-shrink-0 text-dark-400" />
                        <span className="truncate">{about}</span>
                        <span className={`ml-1 flex-shrink-0 text-[9px] uppercase tracking-wide font-semibold px-1.5 rounded ${isStay ? 'bg-amber-50 text-amber-700' : 'bg-sky-50 text-sky-700'}`}>
                          {isStay ? 'Stay' : 'Rent'}
                        </span>
                      </p>
                      <p className="text-xs text-dark-400 truncate mt-1">
                        {c.last_sender?.full_name ? `${c.last_sender.full_name.split(' ')[0]}: ` : ''}
                        {c.last_message || 'No messages yet'}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Messages */}
        <div className="md:col-span-2 card flex flex-col">
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
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-[60vh] pr-2">
                {(localMsgs || []).map((m) => {
                  const mine = m.sender?.id === user?.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`px-3 py-2 rounded-lg max-w-[75%] ${mine ? 'bg-primary text-white' : 'bg-gray-100 text-dark-800'}`}>
                        {!mine && (
                          <p className={`text-[11px] font-medium mb-0.5 ${mine ? 'text-white' : 'text-dark-700'}`}>{m.sender?.full_name || m.sender?.email || 'User'}</p>
                        )}
                        <p className="text-sm">{m.content}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className={`text-[10px] ${mine ? 'text-white/80' : 'text-dark-500'}`}>{new Date(m.created_at).toLocaleString()}</p>
                          {/* Read receipt — one tick sent, two ticks seen */}
                          {mine && (
                            <span
                              className="text-[10px] ml-3 flex items-center gap-0.5 whitespace-nowrap"
                              title={m.read_at ? `Seen ${new Date(m.read_at).toLocaleString()}` : undefined}
                            >
                              {m._pending ? (
                                'sending…'
                              ) : m.is_read ? (
                                <><CheckCheck size={12} /> Seen</>
                              ) : (
                                <><Check size={12} /> Sent</>
                              )}
                            </span>
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
                <button className="btn btn-primary"><Send size={16} /></button>
              </form>
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  );
};

export default Messages;
