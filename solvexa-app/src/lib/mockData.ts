import type { SolvexaUser } from '../types/user.types';
import type { Post } from '../types/post.types';
import type { SignalVideo } from '../types/signal.types';
import type { MomentWithAuthor } from '../types/moment.types';
import type { Space } from '../types/space.types';
import type { Conversation, Message } from '../types/message.types';
import type { Notification } from '../types/notification.types';

export const CURRENT_USER_MOCK: SolvexaUser = {
  uid: 'user_me_01',
  displayName: 'Alex Chen',
  username: 'alex_flow',
  email: 'alex.chen@solvexa.network',
  photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  coverPhotoURL: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
  bio: 'Building decentralized neural interfaces and signal architectures. Synthesizing next-gen social intelligence.',
  location: 'San Francisco, CA',
  website: 'https://alexchen.flow',
  createdAt: new Date('2025-01-10').toISOString(),
  updatedAt: new Date().toISOString(),
  followerCount: 2480,
  followingCount: 432,
  signalCount: 184,
  spaceCount: 12,
  resonanceScore: 942,
  isPrivate: false,
  onboardingComplete: true,
  privacySettings: {
    whoCanMessage: 'everyone',
    whoCanMention: 'everyone',
    whoCanComment: 'everyone',
    activityVisible: true,
  },
  notificationPrefs: {
    signals: true,
    comments: true,
    follows: true,
    mentions: true,
    messages: true,
    spaceActivity: true,
    momentReplies: true,
  },
  identityCards: [
    { id: '1', label: 'Signal Architect', icon: 'sensors', order: 1, category: 'role' },
    { id: '2', label: 'Neural Synthesizer', icon: 'psychology', order: 2, category: 'achievement' },
    { id: '3', label: 'Quantum Resonator', icon: 'hub', order: 3, category: 'vibe' },
    { id: '4', label: 'Core Contributor', icon: 'verified', order: 4, category: 'role' },
  ],
};

export const MOCK_USERS: SolvexaUser[] = [
  CURRENT_USER_MOCK,
  {
    uid: 'user_elena',
    displayName: 'Elena Vance',
    username: 'elena_v',
    email: 'elena@quantumflow.io',
    photoURL: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    coverPhotoURL: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&auto=format&fit=crop&q=80',
    bio: 'Quantum computing researcher @ MIT. Exploring topological quantum error correction and coherent state transfer.',
    location: 'Cambridge, MA',
    website: 'https://elenavance.io',
    createdAt: new Date('2024-11-12').toISOString(),
    updatedAt: new Date().toISOString(),
    followerCount: 14200,
    followingCount: 310,
    signalCount: 420,
    spaceCount: 8,
    resonanceScore: 1850,
    isPrivate: false,
    onboardingComplete: true,
    isFollowing: true,
    privacySettings: { whoCanMessage: 'everyone', whoCanMention: 'everyone', whoCanComment: 'everyone', activityVisible: true },
    notificationPrefs: { signals: true, comments: true, follows: true, mentions: true, messages: true, spaceActivity: true, momentReplies: true },
    identityCards: [
      { id: 'c1', label: 'Quantum Researcher', icon: 'all_inclusive', order: 1, category: 'role' },
      { id: 'c2', label: 'Top 1% Resonator', icon: 'award_star', order: 2, category: 'achievement' }
    ]
  },
  {
    uid: 'user_marcus',
    displayName: 'Marcus Thorne',
    username: 'marcus_ai',
    email: 'marcus@deepintelligence.ai',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    coverPhotoURL: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
    bio: 'Staff AI Researcher @ DeepMind. Scaling multi-agent coordination frameworks and autonomous reasoning trees.',
    location: 'London, UK',
    website: 'https://thorne.ai',
    createdAt: new Date('2024-08-15').toISOString(),
    updatedAt: new Date().toISOString(),
    followerCount: 32600,
    followingCount: 520,
    signalCount: 890,
    spaceCount: 15,
    resonanceScore: 3120,
    isPrivate: false,
    onboardingComplete: true,
    isFollowing: true,
    privacySettings: { whoCanMessage: 'everyone', whoCanMention: 'everyone', whoCanComment: 'everyone', activityVisible: true },
    notificationPrefs: { signals: true, comments: true, follows: true, mentions: true, messages: true, spaceActivity: true, momentReplies: true },
    identityCards: [
      { id: 'c3', label: 'AI Lead', icon: 'smart_toy', order: 1, category: 'role' },
      { id: 'c4', label: 'Prompt Artisan', icon: 'auto_awesome', order: 2, category: 'achievement' }
    ]
  },
  {
    uid: 'user_sophia',
    displayName: 'Sophia Lin',
    username: 'sophia_design',
    email: 'sophia@spatialdesign.studio',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    coverPhotoURL: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&auto=format&fit=crop&q=80',
    bio: 'Spatial UI / Glassmorphism pioneer. Design Systems lead crafting holographic ergonomics.',
    location: 'Tokyo, Japan',
    website: 'https://sophialin.design',
    createdAt: new Date('2025-02-01').toISOString(),
    updatedAt: new Date().toISOString(),
    followerCount: 18900,
    followingCount: 680,
    signalCount: 310,
    spaceCount: 9,
    resonanceScore: 2410,
    isPrivate: false,
    onboardingComplete: true,
    isFollowing: false,
    privacySettings: { whoCanMessage: 'everyone', whoCanMention: 'everyone', whoCanComment: 'everyone', activityVisible: true },
    notificationPrefs: { signals: true, comments: true, follows: true, mentions: true, messages: true, spaceActivity: true, momentReplies: true },
    identityCards: [
      { id: 'c5', label: 'Design Architect', icon: 'palette', order: 1, category: 'role' },
      { id: 'c6', label: 'Holo Pioneer', icon: 'view_in_ar', order: 2, category: 'vibe' }
    ]
  },
  {
    uid: 'user_kai',
    displayName: 'Kai Tanaka',
    username: 'kai_quantum',
    email: 'kai@orbitalmesh.org',
    photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    coverPhotoURL: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
    bio: 'Satellite swarm protocols & zero-latency edge mesh networks. Space enthusiast.',
    location: 'Kyoto, Japan',
    website: 'https://orbitalmesh.org',
    createdAt: new Date('2024-10-05').toISOString(),
    updatedAt: new Date().toISOString(),
    followerCount: 9400,
    followingCount: 290,
    signalCount: 175,
    spaceCount: 6,
    resonanceScore: 1290,
    isPrivate: false,
    onboardingComplete: true,
    isFollowing: false,
    privacySettings: { whoCanMessage: 'everyone', whoCanMention: 'everyone', whoCanComment: 'everyone', activityVisible: true },
    notificationPrefs: { signals: true, comments: true, follows: true, mentions: true, messages: true, spaceActivity: true, momentReplies: true },
    identityCards: [
      { id: 'c7', label: 'Orbital Mesh', icon: 'satellite_alt', order: 1, category: 'role' }
    ]
  }
];

export const MOCK_POSTS: Post[] = [
  {
    postId: 'post_01',
    authorId: 'user_elena',
    authorName: 'Elena Vance',
    authorUsername: 'elena_v',
    authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    content: 'Just deployed our newest benchmark on topological quantum coherence across distributed cryo-nodes! 🌌\n\nWe observed a 3.8x reduction in decoherence rates by applying adaptive phase-inversion pulses. Full open dataset and notebook below.',
    media: [
      {
        url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&auto=format&fit=crop&q=80',
        type: 'image'
      }
    ],
    mediaType: 'image',
    postType: 'image',
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    visibility: 'public',
    spaceId: 'space_quantum',
    spaceName: 'Quantum & Future',
    topics: ['QuantumComputing', 'TopologicalStates', 'PhysicsSignal'],
    commentCount: 42,
    signalCount: 318,
    shareCount: 89,
    saveCount: 145,
    location: 'MIT Quantum Labs',
    pollOptions: null,
    mySignal: 'insightful',
    isSaved: true
  },
  {
    postId: 'post_02',
    authorId: 'user_marcus',
    authorName: 'Marcus Thorne',
    authorUsername: 'marcus_ai',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    content: 'Which multi-agent coordination architecture will dominate autonomous agent workflows over the next 18 months?',
    media: [],
    mediaType: 'none',
    postType: 'poll',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    visibility: 'public',
    spaceId: 'space_ai',
    spaceName: 'AI & Engineering',
    topics: ['AI', 'MultiAgent', 'AutonomousSystems'],
    commentCount: 96,
    signalCount: 540,
    shareCount: 120,
    saveCount: 78,
    location: 'London AI Lab',
    pollOptions: [
      { id: 'opt1', text: 'Hierarchical Supervisor Trees', voteCount: 412, votedUserIds: ['user_me_01'] },
      { id: 'opt2', text: 'Peer-to-Peer Consensus Mesh', voteCount: 298, votedUserIds: [] },
      { id: 'opt3', text: 'Event-Driven Blackboard Memory', voteCount: 184, votedUserIds: [] },
      { id: 'opt4', text: 'Emergent Swarm Dynamics', voteCount: 320, votedUserIds: [] }
    ],
    mySignal: 'curious',
    isSaved: false
  },
  {
    postId: 'post_03',
    authorId: 'user_sophia',
    authorName: 'Sophia Lin',
    authorUsername: 'sophia_design',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    content: 'Refining the glassmorphism refraction shaders for the Solvexa Signal Flow redesign. Notice how the chromatic aberration responds dynamically to cursor velocity and background luminosity. ✨ Feedback welcome!',
    media: [
      {
        url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
        type: 'image'
      },
      {
        url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80',
        type: 'image'
      }
    ],
    mediaType: 'multi',
    postType: 'multi_image',
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    visibility: 'public',
    spaceId: 'space_creative',
    spaceName: 'Creative Flow',
    topics: ['DesignSystems', 'Glassmorphism', 'SpatialUI', 'WebGPU'],
    commentCount: 58,
    signalCount: 682,
    shareCount: 210,
    saveCount: 340,
    location: 'Tokyo Creative Studio',
    pollOptions: null,
    mySignal: 'inspiring',
    isSaved: true
  },
  {
    postId: 'post_04',
    authorId: 'user_kai',
    authorName: 'Kai Tanaka',
    authorUsername: 'kai_quantum',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    content: 'Live downlink telemetry from the LEO satellite mesh node 09. Transmission latency dropped to 4.2ms across the sub-orbital relay corridor! 🛰️ Signal integrity is holding at 99.98%.',
    media: [
      {
        url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&auto=format&fit=crop&q=80',
        type: 'image'
      }
    ],
    mediaType: 'image',
    postType: 'image',
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    visibility: 'public',
    spaceId: 'space_quantum',
    spaceName: 'Quantum & Future',
    topics: ['SpaceTech', 'SatelliteMesh', 'Downlink'],
    commentCount: 19,
    signalCount: 215,
    shareCount: 45,
    saveCount: 62,
    location: 'Kyoto Ground Station',
    pollOptions: null,
    mySignal: null,
    isSaved: false
  }
];

export const MOCK_MOMENTS: MomentWithAuthor[] = [
  {
    momentId: 'mom_01',
    authorId: 'user_elena',
    media: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&auto=format&fit=crop&q=80',
    mediaType: 'photo',
    text: 'Dilution refrigerator cooling down to 12 milliKelvin ❄️ Real magic happens here.',
    backgroundColor: 'linear-gradient(135deg, #0A0A0B 0%, #1c1b1c 100%)',
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 22).toISOString(),
    visibility: 'public',
    viewCount: 412,
    signalCount: 89,
    hasViewed: false,
    author: {
      uid: 'user_elena',
      displayName: 'Elena Vance',
      username: 'elena_v',
      photoURL: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80'
    }
  },
  {
    momentId: 'mom_02',
    authorId: 'user_marcus',
    media: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
    mediaType: 'photo',
    text: 'Training run reached 100k steps with zero gradient explosion 🚀',
    backgroundColor: 'linear-gradient(135deg, #7a00ff 0%, #0066ff 100%)',
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 20).toISOString(),
    visibility: 'public',
    viewCount: 680,
    signalCount: 145,
    hasViewed: false,
    author: {
      uid: 'user_marcus',
      displayName: 'Marcus Thorne',
      username: 'marcus_ai',
      photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
    }
  },
  {
    momentId: 'mom_03',
    authorId: 'user_sophia',
    media: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&auto=format&fit=crop&q=80',
    mediaType: 'photo',
    text: 'Live testing 3D volumetric token cards on Vision Pro 🕶️',
    backgroundColor: 'linear-gradient(135deg, #001f26 0%, #4cd7f6 100%)',
    createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 18).toISOString(),
    visibility: 'public',
    viewCount: 890,
    signalCount: 230,
    hasViewed: true,
    author: {
      uid: 'user_sophia',
      displayName: 'Sophia Lin',
      username: 'sophia_design',
      photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80'
    }
  },
  {
    momentId: 'mom_04',
    authorId: 'user_kai',
    media: 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=800&auto=format&fit=crop&q=80',
    mediaType: 'photo',
    text: 'Night launch countdown: T-minus 45 minutes! 🚀🌟',
    backgroundColor: 'linear-gradient(135deg, #0e0e0f 0%, #353436 100%)',
    createdAt: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 16).toISOString(),
    visibility: 'public',
    viewCount: 520,
    signalCount: 110,
    hasViewed: false,
    author: {
      uid: 'user_kai',
      displayName: 'Kai Tanaka',
      username: 'kai_quantum',
      photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80'
    }
  }
];

export const MOCK_SIGNALS: SignalVideo[] = [
  {
    id: 'sig_01',
    authorId: 'user_sophia',
    authorName: 'Sophia Lin',
    authorUsername: 'sophia_design',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-with-charts-and-data-31912-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
    caption: 'Dynamic volumetric glass UI with real-time blur reflection shaders #DesignSystems #Glassmorphism #SpatialUI',
    topics: ['DesignSystems', 'Glassmorphism', 'SpatialUI'],
    soundTitle: 'Electric Flow (Resonance Remix)',
    soundAuthor: 'Solvexa Audio Lab',
    resonanceCount: 1420,
    commentCount: 184,
    shareCount: 420,
    isResonated: true,
    isBookmarked: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString()
  },
  {
    id: 'sig_02',
    authorId: 'user_marcus',
    authorName: 'Marcus Thorne',
    authorUsername: 'marcus_ai',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-circuit-board-with-flowing-energy-and-light-31918-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    caption: 'Visualizing 1,000 autonomous subagents communicating over asynchronous websocket graph channels #MultiAgent #AI #NeuralSwarm',
    topics: ['MultiAgent', 'AI', 'NeuralSwarm'],
    soundTitle: 'Cybernetic Pulse 432Hz',
    soundAuthor: 'SynthLabs',
    resonanceCount: 2890,
    commentCount: 312,
    shareCount: 780,
    isResonated: false,
    isBookmarked: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString()
  },
  {
    id: 'sig_03',
    authorId: 'user_elena',
    authorName: 'Elena Vance',
    authorUsername: 'elena_v',
    authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-data-animation-with-abstract-elements-31916-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80',
    caption: 'Real-time quantum state tomography rendered at 120 FPS inside the browser with WebGPU! #Quantum #WebGPU #Physics',
    topics: ['Quantum', 'WebGPU', 'Physics'],
    soundTitle: 'Deep Space Tomography',
    soundAuthor: 'MIT Sound Engine',
    resonanceCount: 3410,
    commentCount: 420,
    shareCount: 950,
    isResonated: true,
    isBookmarked: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString()
  }
];

export const MOCK_SPACES: Space[] = [
  {
    id: 'space_ai',
    name: 'AI & Neural Systems',
    handle: 'ai-neural',
    description: 'Autonomous agents, foundation models, reinforcement learning, and neuromorphic architectures.',
    bannerUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&auto=format&fit=crop&q=80',
    iconUrl: 'smart_toy',
    memberCount: 28400,
    postCount: 1420,
    category: 'AI & Engineering',
    createdBy: 'user_marcus',
    createdAt: new Date('2024-06-01').toISOString(),
    isPrivate: false,
    isJoined: true,
    rules: [
      'Share benchmarks and reproducible code when possible.',
      'Constructive critique and technical debate encouraged.',
      'No low-effort hype or unsubstantiated claims.'
    ]
  },
  {
    id: 'space_quantum',
    name: 'Quantum & Future Physics',
    handle: 'quantum-future',
    description: 'Coherent computing, quantum error correction, photonics, and fundamental reality research.',
    bannerUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&auto=format&fit=crop&q=80',
    iconUrl: 'all_inclusive',
    memberCount: 19800,
    postCount: 890,
    category: 'Quantum & Future',
    createdBy: 'user_elena',
    createdAt: new Date('2024-07-15').toISOString(),
    isPrivate: false,
    isJoined: true,
    rules: [
      'Peer-reviewed and arXiv citations strongly encouraged.',
      'Focus on tangible breakthroughs and theoretical rigor.'
    ]
  },
  {
    id: 'space_creative',
    name: 'Creative Flow & Spatial UI',
    handle: 'creative-flow',
    description: 'Cinematic glassmorphism, WebGPU shaders, holographic ergonomics, and modern design systems.',
    bannerUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
    iconUrl: 'palette',
    memberCount: 34100,
    postCount: 2150,
    category: 'Creative Flow',
    createdBy: 'user_sophia',
    createdAt: new Date('2024-05-10').toISOString(),
    isPrivate: false,
    isJoined: false,
    rules: [
      'Always credit visual assets and shaders.',
      'Include design tokens and Figma/CSS references.'
    ]
  },
  {
    id: 'space_orbital',
    name: 'Orbital Mesh & Satellite Net',
    handle: 'orbital-mesh',
    description: 'Interplanetary networks, laser satellite relays, edge telemetry, and aerospace code.',
    bannerUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&auto=format&fit=crop&q=80',
    iconUrl: 'satellite_alt',
    memberCount: 12400,
    postCount: 610,
    category: 'Architecture',
    createdBy: 'user_kai',
    createdAt: new Date('2024-09-01').toISOString(),
    isPrivate: false,
    isJoined: false,
    rules: [
      'Real orbital physics and telemetry analysis only.',
      'Respect open protocols.'
    ]
  }
];

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    conversationId: 'conv_01',
    type: 'direct',
    participants: ['user_me_01', 'user_elena'],
    participantDetails: [
      {
        uid: 'user_elena',
        displayName: 'Elena Vance',
        username: 'elena_v',
        photoURL: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
        isOnline: true
      }
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    lastMessage: {
      content: 'I reviewed the phase-inversion paper. The results look super promising for the Q4 test run!',
      senderId: 'user_elena',
      sentAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      type: 'text'
    },
    unreadCounts: { user_me_01: 1 },
    groupName: null,
    groupAvatar: null,
    createdBy: 'user_elena'
  },
  {
    conversationId: 'conv_02',
    type: 'direct',
    participants: ['user_me_01', 'user_marcus'],
    participantDetails: [
      {
        uid: 'user_marcus',
        displayName: 'Marcus Thorne',
        username: 'marcus_ai',
        photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
        isOnline: false
      }
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    lastMessage: {
      content: 'Check out this agent framework PR when you get a chance.',
      senderId: 'user_marcus',
      sentAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      type: 'text'
    },
    unreadCounts: { user_me_01: 0 },
    groupName: null,
    groupAvatar: null,
    createdBy: 'user_me_01'
  },
  {
    conversationId: 'conv_03',
    type: 'group',
    participants: ['user_me_01', 'user_sophia', 'user_marcus', 'user_elena'],
    participantDetails: [
      {
        uid: 'user_sophia',
        displayName: 'Sophia Lin',
        username: 'sophia_design',
        photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
        isOnline: true
      }
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    lastMessage: {
      content: 'Sophia: Pushed the updated glassmorphism tokens to the shared repo!',
      senderId: 'user_sophia',
      sentAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
      type: 'text'
    },
    unreadCounts: { user_me_01: 0 },
    groupName: 'Solvexa Core Resonators',
    groupAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
    createdBy: 'user_sophia'
  }
];

export const MOCK_MESSAGES: Record<string, Message[]> = {
  conv_01: [
    {
      messageId: 'm1',
      conversationId: 'conv_01',
      senderId: 'user_me_01',
      content: 'Hey Elena! Did you check the new quantum decoherence dataset from the MIT lab?',
      type: 'text',
      sharedContent: null,
      sentAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      reactions: { '👍': ['user_elena'] }
    },
    {
      messageId: 'm2',
      conversationId: 'conv_01',
      senderId: 'user_elena',
      content: 'Yes! Just went through the benchmark graphs. Absolutely stellar results with the 3.8x coherence boost.',
      type: 'text',
      sharedContent: null,
      sentAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
    },
    {
      messageId: 'm3',
      conversationId: 'conv_01',
      senderId: 'user_elena',
      content: 'I reviewed the phase-inversion paper. The results look super promising for the Q4 test run!',
      type: 'text',
      sharedContent: null,
      sentAt: new Date(Date.now() - 1000 * 60 * 15).toISOString()
    }
  ]
};

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    notificationId: 'notif_01',
    recipientId: 'user_me_01',
    senderId: 'user_elena',
    senderDisplayName: 'Elena Vance',
    senderUsername: 'elena_v',
    senderPhotoURL: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    type: 'signal',
    targetId: 'post_01',
    targetType: 'post',
    contentPreview: 'resonated with your signal: "Topological coherence benchmarks"',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    linkUrl: '/post/post_01'
  },
  {
    notificationId: 'notif_02',
    recipientId: 'user_me_01',
    senderId: 'user_marcus',
    senderDisplayName: 'Marcus Thorne',
    senderUsername: 'marcus_ai',
    senderPhotoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    type: 'comment',
    targetId: 'post_02',
    targetType: 'post',
    contentPreview: 'commented: "We should integrate hierarchical supervisor trees into the core engine."',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    linkUrl: '/post/post_02'
  },
  {
    notificationId: 'notif_03',
    recipientId: 'user_me_01',
    senderId: 'user_sophia',
    senderDisplayName: 'Sophia Lin',
    senderUsername: 'sophia_design',
    senderPhotoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    type: 'follow',
    targetId: 'user_me_01',
    targetType: 'user',
    contentPreview: 'started following your signal orbit',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    linkUrl: '/profile/sophia_design'
  },
  {
    notificationId: 'notif_04',
    recipientId: 'user_me_01',
    senderId: 'user_kai',
    senderDisplayName: 'Kai Tanaka',
    senderUsername: 'kai_quantum',
    senderPhotoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    type: 'space',
    targetId: 'space_quantum',
    targetType: 'space',
    contentPreview: 'invited you to join Quantum & Future Physics space',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    linkUrl: '/spaces/space_quantum'
  }
];

export const MOCK_TRENDING_TOPICS = [
  { tag: '#QuantumFlow', postsCount: '14.2k signals', growth: '+38%' },
  { tag: '#AutonomousAgents', postsCount: '28.9k signals', growth: '+64%' },
  { tag: '#SpatialComputing', postsCount: '9.4k signals', growth: '+19%' },
  { tag: '#GlassmorphismV3', postsCount: '18.1k signals', growth: '+45%' },
  { tag: '#WebGPU_Shaders', postsCount: '6.7k signals', growth: '+82%' },
  { tag: '#OrbitalMesh', postsCount: '4.3k signals', growth: '+12%' }
];
