import { useEffect, useMemo, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { messagingAPI } from '../../services/api';
import { Loader2, Bell, Send, MessageSquare, ArrowRight, ArrowLeft, ChevronRight } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const LandlordDashboardMessages = () => {
  const { user } = useAuthStore();
  const [activeSection, setActiveSection] = useState('inbox');
  const [activeId, setActiveId] = useState(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [text, setText] = useState('');
  const [params] = useSearchParams();
  const [localMsgs, setLocalMsgs] = useState([]);
  const pendingMapRef = useRef({});
  const messagesEndRef = useRef(null);

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
  const unreadNotifs = notifs.filter(n => !n.is_read).length;

  useEffect(() => {
    const cid = params.get('conversation');
    if (cid && convos.length) {
      const cidNum = Number(cid);
      if (convos.some(c => c.id === cidNum)) {
        setActiveId(cidNum);
        setMobileShowChat(true);
        return;
      }
    }
    if (convos.length && !activeId) {
      setActiveId(convos[0].id);
    }
  }, [convos, params, activeId]);

  useEffect(() => {
    const pendings = Object.values(pendingMapRef.current).filter(p => p.conversation === activeId);
    setLocalMsgs([...(messages || []), ...pendings]);
  }, [messages, activeId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMsgs]);

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
    try { await messagingAPI.markAsRead(id); } catch {}
  };

  const openConvo = (id) => {
    setActiveId(id);
    setMobileShowChat(true);
  };

  const currentConvo = useMemo(() => convos.find(c => c.id === activeId), [convos, activeId]);
  const otherUser = useMemo(() => {
    if (!currentConvo || !user) return null;
    return (currentConvo.participants || []).find(p => p.id !== user.id) || null;
  }, [currentConvo, user]);

  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="text-lg md:text-xl font-bold text-gray-900">Messages & Notifications</h2>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {[
          { key: 'inbox', label: 'Inbox' },
          { key: 'notifications', label: `Notifications${unreadNotifs > 0 ? ` (${unreadNotifs})` : ''}` },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeSection === s.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Inbox ───────────────────────────────────────────────── */}
      {activeSection === 'inbox' && (
        <>
          {/* MOBILE: show either list or chat */}
          <div className="md:hidden">
            {!mobileShowChat ? (
              /* Conversation list */
              <div className="space-y-2">
                {loadingConvos ? (
                  <div className="flex items-center justify-center py-10 text-gray-400">
                    <Loader2 className="animate-spin mr-2" size={16} /> Loading...
                  </div>
                ) : convos.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                    <MessageSquare size={28} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm">No conversations yet</p>
                  </div>
                ) : (
                  convos.map((c) => {
                    const other = (c.participants || []).find(p => p.id !== user?.id);
                    const initial = (other?.full_name || other?.email || 'U')[0].toUpperCase();
                    return (
                      <button
                        key={c.id}
                        onClick={() => openConvo(c.id)}
                        className="w-full flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm text-left hover:bg-gray-50 transition"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#0C3B2E] text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                          {initial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="font-semibold text-gray-900 text-sm truncate">{c.property?.title || 'Conversation'}</p>
                            {c.unread_count > 0 && (
                              <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 flex-shrink-0 ml-2">
                                {c.unread_count}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 truncate">{other?.full_name || other?.email || 'User'}</p>
                          <p className="text-xs text-gray-400 truncate mt-0.5">{c.last_message?.content || 'No messages'}</p>
                        </div>
                        <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                      </button>
                    );
                  })
                )}
              </div>
            ) : (
              /* Chat panel */
              <div className="bg-white rounded-2xl shadow-sm flex flex-col" style={{ height: 'calc(100vh - 280px)', minHeight: '400px' }}>
                {/* Chat header */}
                <div className="flex items-center gap-3 p-4 border-b border-gray-100 flex-shrink-0">
                  <button
                    onClick={() => setMobileShowChat(false)}
                    className="p-1.5 rounded-xl hover:bg-gray-100 transition"
                  >
                    <ArrowLeft size={20} className="text-gray-600" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{currentConvo?.property?.title || 'Conversation'}</p>
                    <p className="text-xs text-gray-400">{otherUser?.full_name || otherUser?.email || 'Participant'}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <Loader2 className="animate-spin mr-2" size={16} /> Loading...
                    </div>
                  ) : (localMsgs || []).length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                      No messages yet — start the conversation!
                    </div>
                  ) : (
                    (localMsgs || []).map((m) => {
                      const mine = m.sender?.id === user?.id;
                      return (
                        <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`px-4 py-2.5 rounded-2xl max-w-[78%] ${mine ? 'bg-[#0C3B2E] text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                            {!mine && (
                              <p className="text-[10px] font-semibold mb-1 text-gray-500">{m.sender?.full_name || m.sender?.email}</p>
                            )}
                            <p className="text-sm leading-relaxed">{m.content}</p>
                            <p className={`text-[10px] mt-1 ${mine ? 'text-white/60' : 'text-gray-400'}`}>
                              {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {mine && <> · {m._pending ? 'sending…' : m.is_read ? ' read' : ' sent'}</>}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={onSend} className="flex items-center gap-2 p-4 border-t border-gray-100 flex-shrink-0">
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C3B2E]/20"
                    placeholder="Type a message..."
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
                  />
                  <button
                    type="submit"
                    disabled={!text.trim()}
                    className="w-10 h-10 bg-[#0C3B2E] text-white rounded-xl flex items-center justify-center hover:bg-[#0a3226] transition disabled:opacity-40"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* DESKTOP: split layout */}
          <div className="hidden md:grid grid-cols-3 gap-6">
            {/* Conversation list */}
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare size={18} className="text-[#0C3B2E]" />
                <h3 className="text-base font-semibold text-gray-900">Conversations</h3>
              </div>
              {loadingConvos ? (
                <div className="text-gray-400 text-sm flex items-center">
                  <Loader2 className="animate-spin mr-2" size={16} /> Loading...
                </div>
              ) : convos.length === 0 ? (
                <p className="text-gray-400 text-sm">No conversations yet.</p>
              ) : (
                <ul className="space-y-2 max-h-[500px] overflow-y-auto">
                  {convos.map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => setActiveId(c.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-colors ${activeId === c.id ? 'border-[#0C3B2E] bg-[#0C3B2E]/5' : 'border-gray-100 hover:bg-gray-50'}`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900 text-sm truncate">{c.property?.title || 'Conversation'}</p>
                          {c.unread_count > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ml-1">
                              {c.unread_count}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{c.last_message?.content || 'No messages'}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Messages panel */}
            <div className="col-span-2 bg-white rounded-2xl shadow-sm flex flex-col" style={{ height: '600px' }}>
              {currentConvo && (
                <div className="flex items-center gap-3 p-4 border-b border-gray-100 flex-shrink-0">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{currentConvo.property?.title || 'Conversation'}</p>
                    <p className="text-xs text-gray-400">With {otherUser?.full_name || otherUser?.email || 'participant'}</p>
                  </div>
                </div>
              )}
              {loadingMessages ? (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  <Loader2 className="animate-spin mr-2" /> Loading messages...
                </div>
              ) : !activeId ? (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Select a conversation</div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {(localMsgs || []).map((m) => {
                      const mine = m.sender?.id === user?.id;
                      return (
                        <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`px-4 py-2.5 rounded-2xl max-w-[75%] ${mine ? 'bg-[#0C3B2E] text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                            {!mine && (
                              <p className="text-[10px] font-semibold mb-1 text-gray-500">{m.sender?.full_name || m.sender?.email}</p>
                            )}
                            <p className="text-sm">{m.content}</p>
                            <p className={`text-[10px] mt-1 ${mine ? 'text-white/60' : 'text-gray-400'}`}>
                              {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {mine && <> · {m._pending ? 'sending…' : m.is_read ? ' read' : ' sent'}</>}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                  <form onSubmit={onSend} className="flex items-center gap-2 p-4 border-t border-gray-100">
                    <input
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                      placeholder="Type a message..."
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
                    />
                    <button
                      type="submit"
                      disabled={!text.trim()}
                      className="w-10 h-10 bg-[#0C3B2E] text-white rounded-xl flex items-center justify-center hover:bg-[#0a3226] transition disabled:opacity-40"
                    >
                      <Send size={16} />
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Notifications ──────────────────────────────────────── */}
      {activeSection === 'notifications' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-gray-500">{notifs.length} notification{notifs.length !== 1 ? 's' : ''}</p>
            <Link to="/notifications" className="text-[#0C3B2E] text-sm font-medium inline-flex items-center gap-1">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          {loadingNotifs ? (
            <div className="flex items-center justify-center py-10 text-gray-400">
              <Loader2 className="animate-spin mr-2" /> Loading...
            </div>
          ) : notifs.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <Bell size={28} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">No notifications</p>
            </div>
          ) : (
            notifs.map((n) => (
              <div
                key={n.id}
                className={`bg-white rounded-2xl shadow-sm p-4 cursor-pointer transition-colors ${!n.is_read ? 'ring-2 ring-[#0C3B2E]/20' : ''}`}
                onClick={() => !n.is_read && markNotifRead(n.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.is_read ? 'bg-gray-200' : 'bg-[#0C3B2E]'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default LandlordDashboardMessages;
