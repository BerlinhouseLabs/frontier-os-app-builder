# Roadmap: x402 Agent Market

## Overview

The x402 Agent Market brings the emerging x402 HTTP payment protocol to the Frontier OS ecosystem. Agents and API services can list themselves in the marketplace with a price-per-call in FND. Frontier members browse the market, discover useful AI services, and pay for calls using their Frontier Dollars — all without leaving the Frontier Wallet. The finished product is a fully functional marketplace with agent listing, discovery, and one-tap FND payment powered by the x402 payment flow.

## v1 Phases

- [x] **Phase 1: Scaffold + Standalone Shell** — Project setup, services layer, mock data, dark theme
- [x] **Phase 2: Agent Marketplace** — Browse, search, filter agent listings with category navigation
- [x] **Phase 3: Agent Registration** — List your x402 agent, manage your listings, deactivate/delete
- [x] **Phase 4: x402 Payments** — Pay for agent calls with FND, payment modal, balance check, tx confirmation
- [ ] **Phase 5: SDK Integration** — Wire SDK, create adapter, upgrade Layout for iframe

## Phase Details

### Phase 1: Scaffold + Standalone Shell
**Goal**: Working app shell running standalone in browser with mock data
**Depends on**: Nothing (always first)
**Requirements**: PLAT-01, PLAT-02, PLAT-03, PLAT-04, PLAT-05
**Success Criteria** (what must be TRUE):
  1. App renders standalone in browser with mock data
  2. Dark theme applied — no white backgrounds, no light-mode artifacts
  3. useServices() returns mock wallet balance, user data, agent listings
  4. Dev server runs on port 5185 with HMR working
  5. npm run build succeeds
**Plans**: 1 plan

Plans:
- [x] 01-01: Vite + React scaffold, services layer, mock data, dark theme, dev config

### Phase 2: Agent Marketplace
**Goal**: Full agent marketplace UI — browse, search, filter, and view agent details
**Depends on**: Phase 1
**Requirements**: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05
**Success Criteria** (what must be TRUE):
  1. Home view shows featured agents and category quick-filter
  2. Agent list with search and category filter works
  3. Agent card shows name, category badge, price, description
  4. Agent detail page shows full info with payment CTA
  5. Mock agents are visible and browsable
**Plans**: 2 plans

Plans:
- [x] 02-01: Home view + AgentList with search/filter + AgentCard component
- [x] 02-02: AgentDetail view with full info display

### Phase 3: Agent Registration
**Goal**: Let users list their own x402 agent services and manage them
**Depends on**: Phase 2
**Requirements**: REQ-06, REQ-07, REQ-08, REQ-09
**Success Criteria** (what must be TRUE):
  1. RegisterAgent form accepts all required fields with validation
  2. Registered agent appears in marketplace immediately (via storage)
  3. MyAgents view shows user's own listings
  4. User can deactivate or delete a listing
**Plans**: 2 plans

Plans:
- [x] 03-01: RegisterAgent form + storage write + validation
- [x] 03-02: MyAgents dashboard + deactivate/delete

### Phase 4: x402 Payments
**Goal**: Full x402-style FND payment flow — select, confirm, pay, confirm transaction
**Depends on**: Phase 3
**Requirements**: REQ-10, REQ-11, REQ-12, REQ-13, REQ-14
**Success Criteria** (what must be TRUE):
  1. PaymentModal shows price, agent name, user balance, confirm/cancel
  2. Insufficient balance shows error (payment blocked)
  3. On mock confirmation, shows success with tx hash
  4. Payment history stored per agent via storage
  5. useAgentPayment hook orchestrates the full flow
**Plans**: 2 plans

Plans:
- [x] 04-01: PaymentModal + useAgentPayment hook + balance check
- [x] 04-02: Payment history view + storage persistence

### Phase 5: SDK Integration
**Goal**: Wire real Frontier SDK into the standalone app shell
**Depends on**: All feature phases
**Requirements**: PLAT-SDK-01
**Success Criteria** (what must be TRUE):
  1. sdk-context.tsx exists and exports useSdk + SdkProvider
  2. sdk-services.tsx maps all service methods to real SDK calls
  3. Layout.tsx has isInFrontierApp() detection and SdkProvider wrapping
  4. vercel.json has all 3 CORS origin blocks
  5. App works both standalone (mocks) and in iframe (real SDK)
  6. npm run build succeeds
**Plans**: 1 plan (mechanical)

Plans:
- [ ] 05-01: SDK dependency, adapter, Layout upgrade, CORS

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Scaffold + Standalone Shell | 1/1 | Complete | 2026-03-29 |
| 2. Agent Marketplace | 2/2 | Complete | 2026-03-29 |
| 3. Agent Registration | 2/2 | Complete | 2026-03-29 |
| 4. x402 Payments | 2/2 | Complete | 2026-03-29 |
| 5. SDK Integration | 0/1 | Not started | - |

---
*Roadmap created: 2026-03-29*
*Last updated: 2026-03-29 after phases 1-4 complete*
