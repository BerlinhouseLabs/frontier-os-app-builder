/**
 * Context sources for the "Create New App" flow.
 *
 * These provide DOMAIN KNOWLEDGE about Frontier Tower — the physical spaces,
 * business model, community structure, and existing apps.
 *
 * They intentionally DO NOT duplicate SDK API details, which are already loaded
 * by the /fos:new-app workflow via per-module SDK refs (references/sdk/),
 * module-index.md, and app-patterns.md. Instead, these answer: "What does the developer need to know
 * about the BUSINESS to build a great app?"
 */

export interface ContextSource {
  id: string;
  label: string;
  description: string;
  /** Domain context block injected into the prompt when selected. */
  context: string;
}

export interface ContextCategory {
  id: string;
  label: string;
  icon: string;
  sources: ContextSource[];
}

export const CONTEXT_CATEGORIES: ContextCategory[] = [
  {
    id: 'tower',
    label: 'The Tower',
    icon: '🏢',
    sources: [
      {
        id: 'floor-layout',
        label: 'Floors & Spaces',
        description: '16 themed floors, labs, and amenities',
        context: `Frontier Tower: 16-floor vertical village at 995 Market St, SF (built 1908, acquired 2025 for $11M by Deep Ink Ventures).

Themed floors:
- F1: Lobby (CVS tenant on ground floor)
- F2 "The Spaceship": Main events space (200 standing / 120 seated), town halls, wellness/workouts
- F3: Private offices (at capacity, $700-$2,800/mo)
- F4: Robotics Lab (capacity 80) — houses Unitree G1 humanoid ($50K) and Boston Dynamics Spot ($75K, borrowable)
- F5: Fitness Center
- F6: Arts & Music (recording studio planned, interactive tech displays)
- F7: Makerspace
- F8: Biotech & Neurotech (BSL-2 lab with centrifuges, microscopes)
- F9: AI Floor
- F10: Accelerate
- F11: Health & Longevity
- F12: Ethereum & Decentralized Tech — permanent hub for Ethereum builders in SF
- F14: Human Flourishing / "Embodied Workshop"
- F16: Rooftop Lounge (skyline views — dinners, panels, demo days)
- Basement: Nightclub + storage

Amenities: gym, meditation space, kitchen, focus zones, implant studio (NFC chips), kombucha/coffee/snacks, AV setup in every room.
Each floor has 2 designated leads with $2K budget and full programming autonomy.

Interactive floor maps: frontiertower.space (Next.js SVG app).`,
      },
      {
        id: 'superhero-hotel',
        label: 'Superhero Hotel',
        description: 'Co-living at 825 Sutter St, residency programs',
        context: `Superhero Hotel: 110-room 1924 historic building at 825 Sutter St, Nob Hill SF. "Two buildings, one key" — sleep at hotel, work at Tower.

Stay options:
- Standard Stay: Private room + hotel amenities + free Frontier Tower access
- Citizen Stay: 25% discount + lab access + event hosting + exclusive events
- Superhero Residency Batch 0: 2-month intensive (Apr-Jun 2026), 10 founders, ~$20K for 2% equity. Includes accommodation, meals, workspace, gym, personal training, investor intros, demo day.

650+ active community members. Rooms have private bathrooms, walk-in closets, high-speed internet.
Contact: superhero@frontiertower.io, 415.969.9904.
Listed on Expedia, Hotels.com, TripAdvisor.`,
      },
    ],
  },
  {
    id: 'membership',
    label: 'Membership',
    icon: '🎫',
    sources: [
      {
        id: 'membership-tiers',
        label: 'Tiers & Pricing',
        description: 'Who the citizens are, what they pay, what they get',
        context: `Membership tiers:
- Founding Citizen: $190/mo or $1,800/yr. Limited to 300. Lifetime privileges. Required for office leases. This is the core membership.
- Standard: Common area access during operating hours.
- Subcommunity: Access to specific floors/designated groups.
- Digital Ambassador: Remote participation in Frontier Tower technology (not physically in SF).
- Scholarship: Reduced-price standard access, requires continuous re-approval.
- Internship: Managed via the Communities SDK module. Auto-creates accounts for new interns.

Private offices: $1,000-$4,000/mo (on top of citizenship).
Current community: 450-650+ citizens across AI, crypto, biotech, robotics, longevity, neurotech, human flourishing, arts & music.
Members get 24/7 secure access (mobile app controls floor access and elevators), all meeting rooms, event spaces, wellness perks.
Guest policy: up to 3 guests per member, max 3 visits per guest per month.

The SDK's subscriptionType field returns: crypto, stripe, grant, office, or internship.
The SDK's subscriptionPlan field identifies the specific plan (e.g. citizen, network-society).
The SDK's addOns array includes extras like "globetrotter".
The SDK's communities/managedCommunities arrays show community affiliations.`,
      },
    ],
  },
  {
    id: 'economy',
    label: 'Token Economy',
    icon: '💰',
    sources: [
      {
        id: 'token-context',
        label: 'FND & iFND Business Context',
        description: 'How tokens are used in the tower economy (not API details)',
        context: `Frontier Tower runs an internal token economy on Base chain (Base Sepolia for testnet):

- FND (Frontier Network Dollar): The primary payment token. Think of it as the tower's currency. Fiat-convertible — citizens can on-ramp USD (via ACH) or EUR (via SEPA) and off-ramp to linked bank accounts. KYC approval required for fiat operations.
- iFND (Internal FND): Internal circulation token — used for rewards, credits, internal transfers. Only convertible to FND by Frontier Tower reps. Think of it as "house money." iFND is preferred for transfers (the SDK's transferOverallFrontierDollar uses iFND first, then FND).
- USDC and WETH are available for swaps but FND/iFND are the primary tokens.

Smart accounts: Every citizen has a smart account (contract wallet) that's deployed on first use. This is their on-chain identity.

Typical use cases for FND: event ticket purchases, office rent, services between citizens, tipping, bounties (Frontier-Xchange marketplace uses bounties for maker tasks), sponsor pass billing.

20% of event profits flow into a Community Treasury co-governed by humans and AI.`,
      },
    ],
  },
  {
    id: 'events-domain',
    label: 'Events & Programs',
    icon: '📅',
    sources: [
      {
        id: 'events-context',
        label: 'Event Culture',
        description: 'What events happen, where, and how they work',
        context: `Frontier Tower hosts 1,086+ events on Luma (luma.com/frontiertower). Daily programming includes:
- Fitness Field Days, Build Days, Intellectual Salons, Community Lunches
- Vibe Coding Nights (AI-assisted coding meetups, 13+ sessions)
- Aging Journal Club, Consciousness Research, BioPunk Raves
- Robot Fights (from F4 robotics lab)
- ACCELR8 Tower Talks (founder presentations)
- Open Houses, Town Halls, Hackathons, Demo Days
- Blood on the Clocktower (social deduction game nights)

Key venues: Spaceship (F2, up to 200), Rooftop Lounge (F16, flexible), individual floor event spaces.
Rooms have warmup/cooldown buffers (e.g. 10min setup, 15min teardown).
Event types: public, members_plus_one, members_only, community_only.

Programs:
- Viva Frontier Tower: 6-week popup village (Jun-Aug). Tracks: Crypto, Longevity, AI, Neurotech, Robotics, Flourishing, Arts & Music. $950 access.
- Funding the Commons: 36-hour festival, 1000+ attendees, $20.5K+ prizes.
- Superhero Residency: 2-month founder intensive (see Hotel context).

Also uses Social Layer (app.sola.day) for daily coordination.`,
      },
    ],
  },
  {
    id: 'community',
    label: 'Community & Governance',
    icon: '👥',
    sources: [
      {
        id: 'governance',
        label: 'Self-Governance',
        description: 'How the tower governs itself — floor leads, treasury, town halls',
        context: `Frontier Tower operates as "an OS for high-agency, self-governed collaboration — constantly iterating in public."

Governance model:
- Each floor has 2 designated leads with $2K budget and full autonomy over programming and spending
- One condition: floor leads must document and publish their governance mechanism
- Weekly town halls with community participation
- 20% of event profits flow into a Community Treasury co-governed by humans and AI
- frontier-forge app (github.com/frontiertower/frontier-forge, Svelte): citizens share and vote on ideas to improve the tower

Community structure:
- 8+ themed communities mapping to floors (AI, crypto/Ethereum, biotech, robotics, longevity, neurotech, human flourishing, arts & music)
- Communities are managed via the SDK — each has an ID, slug, name, description, icon
- Members can be reassigned between communities (requires community manager approval)
- Internship passes provide temporary community access

The manifesto describes Frontier Tower as "the first working node in a global experiment: a decentralized network of community-governed spaces." Vision: 10 towers by end of next year, 100 by 2027, London location already announced.`,
      },
    ],
  },
  {
    id: 'apps',
    label: 'Existing Apps',
    icon: '📱',
    sources: [
      {
        id: 'reference-apps',
        label: 'Tower Apps (GitHub)',
        description: 'Existing apps built for Frontier Tower — use for inspiration',
        context: `Existing apps in the frontiertower GitHub org (use as inspiration, not as code to copy):

Built for Frontier OS (iframe + SDK pattern):
- kickstarter: Demo app showing Frontier Wallet interaction (vanilla TS + SDK)
- openbook: Meeting room booking app

Standalone web apps (not using Frontier SDK):
- ft0sh (ft0.sh): URL shortener + QR code generator for the tower (Deno + React). Has floor names, citizen resource links, SOPs, WiFi info.
- Frontier-Xchange: Makerspace task marketplace — clients post bounty-backed missions, makers accept them (React + Supabase). Has pending MetaMask/USDC payment integration.
- floorfinder: Internal tower maps (HTML)
- frontier-forge: Ideas voting platform (Svelte)
- tower-perks: Perks package for citizens
- timeline: Prototype event viewer
- frontier-arcade: TypeScript arcade games

Community-built projects (not in the org):
- frontier-tower-agent: AI building superintendent (voice + text)
- frontier-atlas: Members directory
- tower-social-engine: Social connections across the tower
- frontier-events: Event ticketing replacement for Luma
- frontier-tower-coordination-bot: Community coordination

The torbo.bot concierge bot (torbo2 repo) bridges Discord + Telegram, syncs events from api.berlinhouse.com, runs Gemini AI for Q&A, and manages OAuth citizen verification.`,
      },
    ],
  },
  {
    id: 'infra',
    label: 'Platform & Auth',
    icon: '🔧',
    sources: [
      {
        id: 'auth-pattern',
        label: 'Authentication',
        description: 'How Frontier Tower auth works (OAuth, API endpoints)',
        context: `Frontier Tower authentication:
- Backend API: api.frontiertower.io (Django REST Framework on Google Cloud, Bearer token auth)
- OAuth2 PKCE flow against api.berlinhouse.com:
  - Authorize: https://api.berlinhouse.com/o/authorize/
  - Token: https://api.berlinhouse.com/o/token/
  - User info: https://api.berlinhouse.com/o/userinfo/
  - Scopes: read write openid
- Frontier OS apps do NOT authenticate directly — the host PWA handles auth and relays signed access controls to apps via the SDK's postMessage bridge.
- Apps use sdk.getUser().getVerifiedAccessControls() to get cryptographically signed user info (ECDSA secp256k1).
- The ft0sh and torbo2 apps both demonstrate OAuth2 PKCE against api.berlinhouse.com for standalone (non-SDK) auth.

Note: Apps built with the /fos workflow use the SDK's postMessage bridge and do NOT need to implement OAuth directly.`,
      },
    ],
  },
];

/** Build a combined context string from selected source IDs. */
export function buildContextPrompt(selectedIds: Set<string>): string {
  const blocks: string[] = [];
  for (const cat of CONTEXT_CATEGORIES) {
    for (const source of cat.sources) {
      if (selectedIds.has(source.id)) {
        blocks.push(`## ${source.label}\n${source.context}`);
      }
    }
  }
  if (blocks.length === 0) return '';
  return blocks.join('\n\n');
}
