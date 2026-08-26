import { useState } from 'react';
import { dataStore } from '../../services/store/dataStore';
import type { Post } from '../../types/post.types';
import { Modal } from '../common/Modal';
import { Avatar } from '../common/Avatar';

interface ContextShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
}

export function ContextShareModal({ isOpen, onClose, post }: ContextShareModalProps) {
  const conversations = dataStore.getConversations();
  const [selectedConvId, setSelectedConvId] = useState(conversations[0]?.conversationId || '');
  const [contextOption, setContextOption] = useState<
    'thought_you_like' | 'reminded_me' | 'lets_discuss' | 'check_this_out' | 'custom'
  >('thought_you_like');
  const [customNote, setCustomNote] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);

  const contextOptions = [
    { id: 'thought_you_like', label: 'Thought you’d resonate with this', icon: 'favorite' },
    { id: 'reminded_me', label: 'Reminded me of our talk', icon: 'lightbulb' },
    { id: 'lets_discuss', label: 'Let’s discuss this signal', icon: 'forum' },
    { id: 'check_this_out', label: 'Essential signal', icon: 'grade' },
    { id: 'custom', label: 'Custom note', icon: 'edit_note' },
  ] as const;

  const handleShare = () => {
    if (!selectedConvId) return;

    dataStore.shareContext(
      {
        context: contextOption,
        customMessage: customNote,
        sharedContent: {
          type: 'post',
          id: post.postId,
          preview: post.content.slice(0, 100) + '...',
          authorName: post.authorName,
          title: post.spaceName || 'Solvexa Broadcast',
        },
      },
      selectedConvId
    );

    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Context Share • Signal Direct">
      <div className="space-y-5 py-2 text-white">
        <p className="text-xs text-zinc-400">
          Transmit this signal directly to a peer with a meaningful context layer.
        </p>

        {/* Destination conversation */}
        <div>
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
            Send To Peer / Group
          </label>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
            {conversations.map((conv) => {
              const other = conv.participantDetails?.[0];
              const isSelected = selectedConvId === conv.conversationId;
              return (
                <div
                  key={conv.conversationId}
                  onClick={() => setSelectedConvId(conv.conversationId)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-primary/20 border-primary text-white'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-zinc-300'
                  }`}
                >
                  <Avatar
                    src={other?.photoURL || conv.groupAvatar}
                    name={conv.groupName || other?.displayName || 'Chat'}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate">
                      {conv.groupName || other?.displayName || 'Direct Chat'}
                    </div>
                  </div>
                  {isSelected && (
                    <span className="material-symbols-outlined text-primary text-base">check_circle</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Context options */}
        <div>
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
            Why are you sharing this?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {contextOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setContextOption(opt.id)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                  contextOption === opt.id
                    ? 'bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-primary text-white shadow-md'
                    : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-sm text-primary">{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {contextOption === 'custom' && (
          <div>
            <textarea
              rows={2}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Add your note..."
              className="w-full bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl p-3 text-xs text-white focus:outline-none resize-none"
            />
          </div>
        )}

        {/* Post snippet */}
        <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-zinc-400">
          <strong className="text-white block mb-1">Signal snippet:</strong>
          <span className="line-clamp-2">{post.content}</span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={sentSuccess}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7a00ff] to-[#0066ff] hover:opacity-90 transition-all shadow-lg shadow-purple-900/40 flex items-center gap-2"
          >
            {sentSuccess ? (
              <>
                <span className="material-symbols-outlined text-base">check</span>
                <span>Transmitted!</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">send</span>
                <span>Context Transmit</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
