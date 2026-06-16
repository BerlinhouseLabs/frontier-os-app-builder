# Requirements: Social Swarm — v1

## Platform Requirements

| ID | Requirement | Phase |
|----|-------------|-------|
| PLAT-01 | App renders in Frontier OS iframe with dark theme | Phase 1 |
| PLAT-02 | App detects standalone mode and shows fallback page | Phase 1 |
| PLAT-03 | `useServices()` abstraction used for all SDK access | Phase 1 |
| PLAT-04 | Dev server runs on port 5186 | Phase 1 |
| PLAT-05 | `npm run build` succeeds | Phase 1 |
| PLAT-SDK-01 | SDK wired: real Frontier SDK used in iframe mode | Phase 5 |

## Feature Requirements

| ID | Requirement | Phase |
|----|-------------|-------|
| REQ-01 | Dashboard shows campaign stats, recent campaigns, and swarm status | Phase 2 |
| REQ-02 | User can create a campaign with: title, brief, target audience, platforms, tone | Phase 2 |
| REQ-03 | Running a campaign triggers the swarm: 5 agents execute sequentially with progress UI | Phase 2 |
| REQ-04 | Swarm generates platform-native content pieces for each selected platform | Phase 2 |
| REQ-05 | Each content piece includes: copy, image prompt, hashtags, platform badge | Phase 3 |
| REQ-06 | User can browse all generated content with platform and campaign filters | Phase 3 |
| REQ-07 | User can view content detail with copy-to-clipboard and schedule controls | Phase 3 |
| REQ-08 | User can schedule a content piece for a future date/time | Phase 3 |
| REQ-09 | User can view all swarm agents, their roles, price per run, and status | Phase 4 |
| REQ-10 | Payment flow: user pays FND for each campaign run before swarm executes | Phase 4 |
| REQ-11 | Payment modal shows total cost, agent breakdown, balance, confirm/cancel | Phase 4 |
| REQ-12 | After payment, swarm executes and content is generated | Phase 4 |
| REQ-13 | Payment history is accessible with tx hashes | Phase 4 |

## Out of Scope (v1)

- Actual social media API posting (content is generated; users copy-paste or export)
- Real x402 agent endpoint calls (swarm is simulated in mock layer)
- Content editing (content is generated as-is)
- Multi-user campaigns

## Traceability

| Phase | Requirements |
|-------|-------------|
| Phase 1: Scaffold | PLAT-01 through PLAT-05 |
| Phase 2: Campaign + Swarm Core | REQ-01 through REQ-04 |
| Phase 3: Content Management | REQ-05 through REQ-08 |
| Phase 4: Payments + Agents | REQ-09 through REQ-13 |
| Phase 5: SDK Integration | PLAT-SDK-01 |

---
*Created: 2026-03-29*
