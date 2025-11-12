import { useEffect, useMemo, useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { messagingAPI } from '../services/api';
import { Loader2, Send, MessageSquare } from 'lucide-react';
import useAuthStore from '../store/authStore';
import DashboardShell from '../components/dashboard/DashboardShell';
import { useSearchParams } from 'react-router-dom';

const Messages = () => {
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState(null);
  const [text, setText] = useState('');
  const [params, setParams] = useSearchParams();

  const { data: conversations, isLoading: loadingConvos } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messagingAPI.getConversations().then(res => res.data),
    enabled: isAuthenticated,
  });

  const { data: messages, isLoading: loadingMessages, refetch: refetchMessages } = useQuery({
    queryKey: ['messages', activeId],
    queryFn: () => activeId ? messagingAPI.getMessages(activeId).then(res => res.data) : Promise.resolve([]),
    enabled: !!activeId,
  });
  const [localMsgs, setLocalMsgs] = useState([]);
  const pendingMapRef = useRef({});

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

  return (
    <DashboardShell>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Conversations */}
        <div className="card">
          <div className="flex items-center mb-4">
            <MessageSquare className="text-primary mr-2" />
            <h2 className="text-lg font-semibold">Conversations</h2>
          </div>
          {loadingConvos ? (
            <div className="text-dark-500 text-sm">Loading...</div>
          ) : (
            <ul className="space-y-2">
              {(conversations || []).map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => setActiveId(c.id)}
                    className={`w-full text-left p-3 rounded-lg border ${activeId === c.id ? 'border-primary bg-primary-50' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <p className="font-medium text-dark-900">{c.property?.title || 'Conversation'}</p>
                    <p className="text-xs text-dark-500">{c.last_sender?.full_name ? `${c.last_sender.full_name}: ` : ''}{c.last_message || ''}</p>
                  </button>
                </li>
              ))}
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
                          {mine && (
                            <p className="text-[10px] ml-3">{m._pending ? 'sending…' : (m.is_read ? 'read' : 'sent')}</p>
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
