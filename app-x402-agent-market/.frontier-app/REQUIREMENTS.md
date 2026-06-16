# Requirements: x402 Agent Market — v1

## Platform Requirements (always present)

| ID | Requirement | Phase |
|----|-------------|-------|
| PLAT-01 | App renders in Frontier OS iframe with dark theme | Phase 1 |
| PLAT-02 | App detects standalone mode and shows fallback page | Phase 1 |
| PLAT-03 | `useServices()` abstraction used for all SDK access | Phase 1 |
| PLAT-04 | Dev server runs on port 5185 | Phase 1 |
| PLAT-05 | `npm run build` succeeds | Phase 1 |
| PLAT-SDK-01 | SDK wired: real Frontier SDK used in iframe mode | Phase 5 |

## Feature Requirements

| ID | Requirement | Phase |
|----|-------------|-------|
| REQ-01 | User can browse all listed agent services in the marketplace | Phase 2 |
| REQ-02 | User can search agents by name, description, or category | Phase 2 |
| REQ-03 | User can filter agents by category (AI assistant, code, data, etc.) | Phase 2 |
| REQ-04 | Each agent card shows name, description, category, price per call, rating | Phase 2 |
| REQ-05 | User can view agent detail page with full info and payment CTA | Phase 2 |
| REQ-06 | User can register a new x402 agent with: name, description, endpoint URL, price, category | Phase 3 |
| REQ-07 | Registered agent is stored and visible in the marketplace | Phase 3 |
| REQ-08 | User can view and manage their own registered agents | Phase 3 |
| REQ-09 | User can deactivate or delete their agent listing | Phase 3 |
| REQ-10 | User can pay for an agent call with FND via the x402 payment flow | Phase 4 |
| REQ-11 | Payment modal shows price, agent name, balance, and confirm/cancel | Phase 4 |
| REQ-12 | After payment, user sees transaction confirmation with hash | Phase 4 |
| REQ-13 | User cannot pay if their FND balance is insufficient | Phase 4 |
| REQ-14 | Payment history is stored and accessible per agent | Phase 4 |

## Out of Scope (v1)

- Actual x402 HTTP request execution (the app pays; user makes the HTTP call externally)
- Agent rating/review system (can be added in v2)
- Multi-token payments (FND only for v1)
- Real-time agent availability/uptime monitoring

## Traceability

| Phase | Requirements |
|-------|-------------|
| Phase 1: Scaffold | PLAT-01 through PLAT-05 |
| Phase 2: Agent Marketplace | REQ-01 through REQ-05 |
| Phase 3: Agent Registration | REQ-06 through REQ-09 |
| Phase 4: x402 Payments | REQ-10 through REQ-14 |
| Phase 5: SDK Integration | PLAT-SDK-01 |

---
*Created: 2026-03-29*
