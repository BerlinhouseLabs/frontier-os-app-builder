# x402 Agent Market

## What This Is

A marketplace for AI agents and API services built on Frontier OS, powered by the x402 HTTP payment protocol. Frontier OS members can browse, register, and pay for agent services using Frontier Dollars (FND). The x402 protocol enables autonomous, per-request micropayments: an agent charges a price per call, and users pay with FND via the Frontier Wallet.

## Core Value

Discover and pay for AI agent services in one tap — browse the market, pay with FND, get immediate access.

## SDK Modules

| Module | Why Needed | Key APIs |
|--------|-----------|----------|
| Wallet | FND payments for agent service calls (x402 payment flow) | `getBalanceFormatted()`, `transferOverallFrontierDollar()`, `getAddress()` |
| User | Display user identity, gate agent registration to members | `getDetails()`, `getProfile()`, `getVerifiedAccessControls()` |
| Storage | Persist agent listings, user's registered agents, preferences | `get()`, `set()`, `remove()` |
| Chain | Network/contract context | `getCurrentNetwork()`, `getContractAddresses()` |
| ThirdParty | Register agent as a Frontier app, manage webhooks for call notifications | `listDevelopers()`, `createApp()` |

## Target Users

- **Primary users:** Frontier OS members who want to use AI agent services (pay-per-call via FND)
- **Secondary users:** Developers and operators who want to list their x402-enabled agent/API in the marketplace
- **Non-users:** Anonymous visitors (app requires Frontier Wallet), users seeking free services (everything has a price per x402)

## Constraints

- **Runtime**: Runs inside Frontier OS iframe — no direct DOM access to parent, postMessage communication only
- **Theme**: Dark theme mandatory — must match Frontier OS visual language
- **SDK**: All platform features via `@frontiertower/frontier-sdk` — no direct API calls to Frontier services
- **Auth**: Identity provided by Frontier OS — no custom auth flows
- **CORS**: All external API calls must handle CORS (app runs in iframe on different origin)
- **Standalone**: Must detect iframe vs standalone and degrade gracefully
- **x402**: Agent endpoint URLs are stored but actual x402 HTTP calls happen outside the Frontier iframe (linked out) — the app handles the payment side via FND transfers

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use Storage for agent registry | No backend needed; agents are stored per-user and shared via Frontier Storage | Pending |
| Use `transferOverallFrontierDollar` for payments | Prefers iFND (cheaper) then falls back to FND — best UX for members | Pending |
| x402 endpoint invocation linked externally | App handles payment; actual HTTP call with x402 headers done in user's client | Pending |

---
*Last updated: 2026-03-29 after initial creation*
