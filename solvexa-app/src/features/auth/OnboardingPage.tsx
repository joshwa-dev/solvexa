import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { dataStore } from '../../services/store/dataStore';

export default function OnboardingPage() {
  const { solvexaUser, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [username, setUsername] = useState(solvexaUser?.username || '');
  const [displayName, setDisplayName] = useState(solvexaUser?.displayName || '');
  const [bio, setBio] = useState(solvexaUser?.bio || '');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([
    'QuantumFlow',
    'AutonomousAgents',
    'SpatialUI'
  ]);
  const [selectedSpaces, setSelectedSpaces] = useState<string[]>(['space_ai', 'space_creative']);
  const [selectedBadges, setSelectedBadges] = useState<string[]>(['1', '2']);

  const topicsList = [
    { id: 'QuantumFlow', label: 'Quantum Flow', icon: 'all_inclusive' },
    { id: 'AutonomousAgents', label: 'Autonomous Agents', icon: 'smart_toy' },
    { id: 'SpatialUI', label: 'Spatial UI & Shaders', icon: 'view_in_ar' },
    { id: 'DesignSystems', label: 'Design Systems V3', icon: 'palette' },
    { id: 'OrbitalMesh', label: 'Orbital Mesh', icon: 'satellite_alt' },
    { id: 'ZeroLatency', label: 'Zero-Latency Protocols', icon: 'bolt' },
    { id: 'Neuromorphic', label: 'Neuromorphic Chips', icon: 'memory' },
    { id: 'CryptoSignal', label: 'Decentralized Identity', icon: 'fingerprint' }
  ];

  const availableBadges = [
    { id: '1', label: 'Signal Architect', icon: 'sensors', category: 'role' },
    { id: '2', label: 'Neural Synthesizer', icon: 'psychology', category: 'achievement' },
    { id: '3', label: 'Quantum Resonator', icon: 'hub', category: 'vibe' },
    { id: '4', label: 'Core Contributor', icon: 'verified', category: 'role' },
    { id: '5', label: 'Holo Pioneer', icon: 'view_in_ar', category: 'vibe' },
  ];

  const handleFinish = async () => {
    const identityCards = availableBadges
      .filter((b) => selectedBadges.includes(b.id))
      .map((b, i) => ({ id: b.id, label: b.label, icon: b.icon, order: i + 1, category: b.category as any }));

    dataStore.updateCurrentUser({
      username: username.replace('@', '').trim().toLowerCase(),
      displayName,
      bio,
      identityCards,
      onboardingComplete: true,
    });

    selectedSpaces.forEach((sId) => {
      const sp = dataStore.getSpaceById(sId);
      if (sp && !sp.isJoined) {
        dataStore.toggleJoinSpace(sId);
      }
    });

    await refreshProfile();
    navigate('/pulse');
  };

  const nextStep = () => setStep((s) => Math.min(5, s + 1));
  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-purple-600/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-600/15 rounded-full blur-[130px] pointer-events-none" />

      <div className="w-full max-w-xl bg-[#141416]/95 border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-2xl relative z-10">
        {/* Progress header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center signal-glow" style={{ background: 'linear-gradient(135deg, #7a00ff, #0066ff)' }}>
              <span className="material-symbols-outlined text-white text-xl icon-filled">sensors</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Node Calibration</h2>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Step {step} of 5</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-6 bg-primary signal-glow' : i < step ? 'w-3 bg-secondary-container' : 'w-2 bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: Choose Username */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Claim your Signal Handle</h3>
              <p className="text-sm text-zinc-400">Your unique identifier across the Solvexa resonance network.</p>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold text-base">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_handle"
                className="w-full bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl pl-10 pr-4 py-3 text-base font-semibold text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
              <span className="material-symbols-outlined text-cyan-400 text-lg">check_circle</span>
              <span className="text-xs text-zinc-300">
                Handle <strong className="text-white">@{username || 'handle'}</strong> is available for synchronization.
              </span>
            </div>
          </div>
        )}

        {/* STEP 2: Profile & Bio */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Identity & Resonance</h3>
              <p className="text-sm text-zinc-400">Tell the network about your focus area and research background.</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                Bio / Signal Summary
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>
          </div>
        )}

        {/* STEP 3: Topic Interests */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Tune Frequency Frequencies</h3>
              <p className="text-sm text-zinc-400">Select topics you want to prioritize in your Pulse feed.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
              {topicsList.map((topic) => {
                const isSelected = selectedTopics.includes(topic.id);
                return (
                  <button
                    key={topic.id}
                    onClick={() => {
                      setSelectedTopics((prev) =>
                        isSelected ? prev.filter((t) => t !== topic.id) : [...prev, topic.id]
                      );
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-primary/15 border-primary text-white shadow-[0_0_12px_rgba(208,188,255,0.2)]'
                        : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg text-primary">{topic.icon}</span>
                    <span className="text-xs font-semibold">{topic.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: Spaces */}
        {step === 4 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Join Research Spaces</h3>
              <p className="text-sm text-zinc-400">Collaborative spaces aligned with your interests.</p>
            </div>
            <div className="space-y-3">
              {dataStore.getSpaces().map((space) => {
                const isJoined = selectedSpaces.includes(space.id);
                return (
                  <div
                    key={space.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                        <span className="material-symbols-outlined">{space.iconUrl}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white truncate">{space.name}</div>
                        <div className="text-xs text-zinc-400 truncate">{space.category} • {space.memberCount.toLocaleString()} members</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedSpaces((prev) =>
                          isJoined ? prev.filter((id) => id !== space.id) : [...prev, space.id]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isJoined ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {isJoined ? 'Joined' : 'Join Space'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5: Identity Badges */}
        {step === 5 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Select Identity Cards</h3>
              <p className="text-sm text-zinc-400">Display your capabilities and vibe badges on your Nexus profile.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {availableBadges.map((badge) => {
                const isSelected = selectedBadges.includes(badge.id);
                return (
                  <button
                    key={badge.id}
                    onClick={() => {
                      setSelectedBadges((prev) =>
                        isSelected ? prev.filter((id) => id !== badge.id) : [...prev, badge.id]
                      );
                    }}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-primary text-white shadow-lg'
                        : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-primary text-xl">{badge.icon}</span>
                    <div>
                      <div className="text-xs font-bold text-white">{badge.label}</div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{badge.category}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
          {step > 1 ? (
            <button
              onClick={prevStep}
              className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
            >
              Back
            </button>
          ) : <div />}

          {step < 5 ? (
            <button
              onClick={nextStep}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#7a00ff] to-[#0066ff] hover:opacity-90 transition-all shadow-lg shadow-purple-900/30"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-8 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#7a00ff] via-[#4f46e5] to-[#0066ff] hover:opacity-90 transition-all shadow-xl shadow-purple-900/50 flex items-center gap-2 signal-glow"
            >
              <span>Initialize Node</span>
              <span className="material-symbols-outlined text-base">check</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
