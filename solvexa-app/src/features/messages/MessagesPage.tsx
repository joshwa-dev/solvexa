import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { dataStore } from '../../services/store/dataStore';
import { useAuth } from '../auth/AuthContext';
import type { Conversation, Message } from '../../types/message.types';
import { Avatar } from '../../components/common/Avatar';
import { EmptyState } from '../../components/common/EmptyState';
import { MediaViewer, type MediaViewerItem } from '../../components/common/MediaViewer';
import { Modal } from '../../components/common/Modal';
import { uploadMediaFile } from '../../services/storage/mediaUpload';

export default function MessagesPage() {
  const { solvexaUser, dataMode } = useAuth();
  const { conversationId: routeConvId } = useParams<{ conversationId?: string }>();
  const [searchParams] = useSearchParams();
  const queryConvId = searchParams.get('id');
  const targetUserId = searchParams.get('user');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    routeConvId || queryConvId || null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // WhatsApp-style message delete target
  const [selectedMessageForDelete, setSelectedMessageForDelete] = useState<Message | null>(null);

  // Attached media state
  const [attachedFile, setAttachedFile] = useState<{ url: string; type: 'image' | 'video'; name: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Lightbox Media Viewer
  const [lightboxMedia, setLightboxMedia] = useState<MediaViewerItem | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Load and subscribe to conversations
  useEffect(() => {
    const syncConvs = () => {
      const convList = dataStore.getConversations();
      setConversations(convList);

      if (targetUserId) {
        const target = dataStore.getUser(targetUserId);
        if (target) {
          const conv = dataStore.getOrCreateConversation({
            uid: target.uid,
            displayName: target.displayName,
            username: target.username,
            photoURL: target.photoURL,
          });
          setActiveConversationId(conv.conversationId);
        }
      } else if (!activeConversationId && convList.length > 0 && window.innerWidth >= 768) {
        setActiveConversationId(convList[0].conversationId);
      }
    };

    syncConvs();
    const unsub = dataStore.subscribe(syncConvs);
    return () => unsub();
  }, [targetUserId]);

  // Load messages for the active conversation
  useEffect(() => {
    if (activeConversationId) {
      dataStore.markConversationAsRead(activeConversationId);
      const msgs = dataStore.getMessages(activeConversationId);
      setMessages(msgs);

      // Auto-focus input
      setTimeout(() => {
        textInputRef.current?.focus();
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 100);
    } else {
      setMessages([]);
    }
  }, [activeConversationId, location.search]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const activeConv = conversations.find((c) => c.conversationId === activeConversationId);
  const currentUid = solvexaUser?.uid || 'user_anonymous';
  const otherParticipant = activeConv?.participantDetails?.find(
    (p) => p.uid !== currentUid
  );

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageInput.trim() && !attachedFile) || !activeConversationId) return;

    const text = messageInput.trim();
    const mediaPayload = attachedFile ? { url: attachedFile.url, type: attachedFile.type } : undefined;

    dataStore.sendMessage(activeConversationId, text, {
      type: attachedFile ? 'media' : 'text',
      media: mediaPayload,
    });

    setMessageInput('');
    setAttachedFile(null);

    // Simulate mock auto-reply for DEMO mode only
    if (dataMode === 'DEMO' && activeConversationId && otherParticipant) {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const autoReplies = [
          'Signal received! The telemetry looks solid.',
          'Resonating with this analysis. Let me check the neural latency metrics.',
          'Synthesizing this node into our local quantum cluster now.',
        ];
        const randomReply = autoReplies[Math.floor(Math.random() * autoReplies.length)];
        dataStore.sendMessage(activeConversationId, randomReply);
      }, 2000);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const uploaded = await uploadMediaFile(file, 'messages');
      setAttachedFile(uploaded);
      setIsUploading(false);
    } catch (err: unknown) {
      const e = err as Error;
      alert(e.message || 'Media attachment error');
      setIsUploading(false);
    }
  };

  const handleDeleteForMe = () => {
    if (
      activeConversationId &&
      selectedMessageForDelete &&
      selectedMessageForDelete.senderId === currentUid
    ) {
      dataStore.deleteMessageForMe(activeConversationId, selectedMessageForDelete.messageId);
      setSelectedMessageForDelete(null);
    }
  };

  const handleDeleteForEveryone = () => {
    if (
      activeConversationId &&
      selectedMessageForDelete &&
      selectedMessageForDelete.senderId === currentUid
    ) {
      dataStore.deleteMessageForEveryone(activeConversationId, selectedMessageForDelete.messageId);
      setSelectedMessageForDelete(null);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] md:h-screen w-full flex bg-[#0A0A0B] text-white overflow-hidden select-none">
      {/* 1. Left Panel: Conversations List */}
      <div
        className={`w-full md:w-80 flex-shrink-0 border-r border-white/10 flex flex-col bg-[#141416]/90 backdrop-blur-xl ${
          activeConversationId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-xl">forum</span>
            <h1 className="text-base font-extrabold tracking-tight text-white">Nexus Transmissions</h1>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-zinc-400">
            {conversations.length} Threads
          </span>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/5 custom-scrollbar">
          {conversations.length === 0 ? (
            <div className="p-4 flex flex-col items-center justify-center h-full" style={{ minHeight: 240 }}>
              <EmptyState
                variant="messages"
                compact
                onAction={() => navigate('/explore')}
                actionLabel="Find People"
              />
            </div>
          ) : (
            conversations.map((conv) => {
              const other = conv.participantDetails?.find((p) => p.uid !== currentUid);
              const isActive = conv.conversationId === activeConversationId;
              const unread = conv.unreadCounts[currentUid] || 0;

              return (
                <div
                  key={conv.conversationId}
                  onClick={() => setActiveConversationId(conv.conversationId)}
                  className={`p-4 flex items-center gap-3 cursor-pointer transition-all ${
                    isActive
                      ? 'bg-primary/10 border-l-4 border-primary'
                      : 'hover:bg-white/5 border-l-4 border-transparent'
                  }`}
                >
                  <Avatar
                    src={other?.photoURL}
                    name={other?.displayName || 'Peer'}
                    size="md"
                    hasStory={false}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs truncate ${isActive ? 'font-bold text-white' : 'font-semibold text-zinc-200'}`}>
                        {other?.displayName || 'Pioneer'}
                      </span>
                      {conv.lastMessage && (
                        <span className="text-[10px] text-zinc-500 flex-shrink-0">
                          {new Date(conv.lastMessage.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-zinc-400 truncate pr-2">
                        {conv.lastMessage?.content || 'Started a new transmission'}
                      </p>
                      {unread > 0 && (
                        <span className="w-4 h-4 rounded-full bg-primary text-black font-extrabold text-[9px] flex items-center justify-center flex-shrink-0">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Right Panel: Active Chat Thread */}
      <div
        className={`flex-1 min-w-0 flex flex-col bg-[#0A0A0B] h-full ${
          !activeConversationId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {activeConv && otherParticipant ? (
          <>
            {/* Chat Header */}
            <div className="h-16 px-4 sm:px-6 border-b border-white/10 bg-[#141416]/80 backdrop-blur-xl flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setActiveConversationId(null)}
                  className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white"
                >
                  <span className="material-symbols-outlined text-xl">arrow_back</span>
                </button>

                <Avatar
                  src={otherParticipant.photoURL}
                  name={otherParticipant.displayName}
                  size="sm"
                  hasStory
                />

                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-white truncate">
                    {otherParticipant.displayName}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Active on Signal Mesh</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/profile/${otherParticipant.username}`)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 hover:text-white border border-white/10 transition-all flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">person</span>
                  <span className="hidden sm:inline">Profile</span>
                </button>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 text-xs space-y-2">
                  <span className="material-symbols-outlined text-3xl text-zinc-600">chat</span>
                  <p className="font-semibold text-zinc-400">No messages in this transmission yet.</p>
                  <p>Send a message below to start the conversation.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === currentUid;
                  const isDeleted = msg.isDeletedForEveryone;

                  return (
                    <div
                      key={msg.messageId}
                      className={`flex flex-col w-full group ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2 max-w-[min(82%,680px)]">
                        {/* Delete action trigger ONLY for sent messages */}
                        {!isDeleted && isMe && (
                          <button
                            type="button"
                            onClick={() => setSelectedMessageForDelete(msg)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-white/5 hover:bg-error/20 text-zinc-500 hover:text-error transition-all"
                            title="Delete Sent Message"
                            aria-label="Delete Sent Message"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        )}

                        <div
                          className={`min-w-0 p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed space-y-2 break-words whitespace-pre-wrap ${
                            isDeleted
                              ? 'bg-white/5 text-zinc-500 border border-white/5 italic'
                              : isMe
                              ? 'bg-gradient-to-r from-[#7a00ff] to-[#0066ff] text-white rounded-br-none shadow-lg shadow-purple-900/30'
                              : 'bg-[#1c1b1c] text-zinc-200 border border-white/10 rounded-bl-none'
                          }`}
                        >
                          {isDeleted ? (
                            <div className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-sm">block</span>
                              <span>This message was deleted</span>
                            </div>
                          ) : (
                            <>
                              {/* Shared Content / Context Share Card */}
                              {msg.sharedContent && (
                                <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                                    Shared Signal Node
                                  </span>
                                  <p className="text-zinc-300 text-xs italic line-clamp-2">
                                    {msg.sharedContent.preview}
                                  </p>
                                </div>
                              )}

                              {/* Image media attachment with Lightbox trigger */}
                              {msg.media && (
                                <div
                                  onClick={() =>
                                    setLightboxMedia({
                                      url: msg.media!.url,
                                      type: msg.media!.type,
                                      authorName: isMe ? 'You' : otherParticipant?.displayName,
                                    })
                                  }
                                  className="rounded-xl overflow-hidden max-h-56 max-w-sm border border-white/10 cursor-pointer hover:opacity-90 transition-opacity bg-black/40"
                                >
                                  <img
                                    src={msg.media.url}
                                    alt="Attachment"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />

                                </div>
                              )}

                              {msg.content && <p>{msg.content}</p>}
                            </>
                          )}
                        </div>
                      </div>

                      <span className="text-[10px] text-zinc-500 mt-1 px-1">
                        {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-center gap-2 p-2 px-3 rounded-xl bg-[#1c1b1c] border border-white/10 w-fit text-xs text-zinc-400 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                  <span>{otherParticipant?.displayName || 'Peer'} is typing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 sm:p-4 border-t border-white/10 bg-[#141416]/95 backdrop-blur-xl flex-shrink-0 space-y-2">
              {/* Attachment Preview Chip */}
              {attachedFile && (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10 w-fit text-xs text-white">
                  <span className="material-symbols-outlined text-primary text-base">image</span>
                  <span className="max-w-xs truncate">{attachedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setAttachedFile(null)}
                    className="p-1 text-zinc-400 hover:text-white"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="flex items-center gap-2 sm:gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*,video/*"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="p-2.5 sm:p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-all flex items-center justify-center"
                  title="Attach Photo or Video"
                  aria-label="Attach Photo or Video"
                >
                  <span className="material-symbols-outlined text-lg sm:text-xl">
                    {isUploading ? 'hourglass_top' : 'attach_file'}
                  </span>
                </button>

                <input
                  type="text"
                  ref={textInputRef}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 min-w-0 bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />

                <button
                  type="submit"
                  disabled={!messageInput.trim() && !attachedFile}
                  className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-[#7a00ff] to-[#0066ff] text-white hover:opacity-90 transition-all shadow-md shadow-purple-900/30 disabled:opacity-40 flex items-center justify-center flex-shrink-0"
                  title="Send Message"
                  aria-label="Send Message"
                >
                  <span className="material-symbols-outlined text-lg sm:text-xl">send</span>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <EmptyState
              icon="forum"
              title={conversations.length === 0 ? 'No conversations yet' : 'Select a conversation'}
              description={
                conversations.length === 0
                  ? 'Start a transmission with pioneers and researchers across the Solvexa mesh.'
                  : 'Choose a thread from the left panel to continue your conversation.'
              }
              actionLabel={conversations.length === 0 ? 'Find Pioneers' : undefined}
              onAction={conversations.length === 0 ? () => navigate('/explore') : undefined}
            />
          </div>
        )}
      </div>

      {/* WhatsApp-Style Delete Message Options Modal */}
      <Modal
        isOpen={!!selectedMessageForDelete}
        onClose={() => setSelectedMessageForDelete(null)}
        title="Delete Message"
      >
        <div className="space-y-4 py-2 text-white">
          <p className="text-xs text-zinc-300 leading-relaxed">
            Choose how you would like to delete this message:
          </p>

          <div className="space-y-2 pt-1">
            {/* Delete for everyone (Only for sender) */}
            {selectedMessageForDelete?.senderId === currentUid && (
              <button
                type="button"
                onClick={handleDeleteForEveryone}
                className="w-full p-3 rounded-xl bg-error/15 hover:bg-error/25 border border-error/30 text-error font-bold text-xs flex items-center justify-between transition-all text-left"
              >
                <div>
                  <div className="font-bold">Delete for everyone</div>
                  <div className="text-[11px] text-zinc-400 font-normal mt-0.5">
                    Replaces the message with "This message was deleted" for all participants.
                  </div>
                </div>
                <span className="material-symbols-outlined text-base flex-shrink-0 ml-2">delete_forever</span>
              </button>
            )}

            {/* Delete for me */}
            <button
              type="button"
              onClick={handleDeleteForMe}
              className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs flex items-center justify-between transition-all text-left"
            >
              <div>
                <div className="font-bold">Delete for me</div>
                <div className="text-[11px] text-zinc-400 font-normal mt-0.5">
                  Removes the message only from your device. Other participants can still see it.
                </div>
              </div>
              <span className="material-symbols-outlined text-base flex-shrink-0 ml-2 text-zinc-400">delete</span>
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setSelectedMessageForDelete(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Shared Lightbox Media Viewer */}
      <MediaViewer
        isOpen={!!lightboxMedia}
        onClose={() => setLightboxMedia(null)}
        media={lightboxMedia}
      />
    </div>
  );
}
