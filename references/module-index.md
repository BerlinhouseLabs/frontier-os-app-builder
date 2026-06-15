# SDK Module Index

Maps app descriptions to Frontier SDK modules. The CLI (`fos-tools.cjs infer-modules`) does keyword matching programmatically — this file documents the algorithm and serves as an index to per-module reference files.

## Inference Algorithm

This mirrors `cmdInferModules` in `fos-tools.cjs` exactly:

1. Lowercase the entire description (`description.toLowerCase()`) — no tokenization or word splitting.
2. For each SDK module, substring-match its trigger keywords against the lowercased description with `String.includes()` (keywords are listed in each module's reference file under `references/sdk/`). Because matching is by substring, multi-word phrases like `send money`, `access control`, and `api key` work, and a keyword can match inside a larger word (e.g. `fund` matches within `refund`).
3. Always include Storage and Chain (the base modules — every app needs these).
4. Include User if User's own keywords match, or if any of Wallet, Events, Communities, Partnerships, or Offices matched. User is NOT added by ThirdParty, Navigation, Storage, or Chain alone.
5. Present the inferred modules for user confirmation.

## Module Quick Reference

| Module | Reference File | Primary Use Case |
|--------|---------------|-----------------|
| Wallet | `references/sdk/wallet.md` | Payments, transfers, FND/iFND, fiat on/off-ramp |
| Storage | `references/sdk/storage.md` | Key-value persistence, preferences |
| Chain | `references/sdk/chain.md` | Network config, contract addresses |
| User | `references/sdk/user.md` | Profiles, access controls, membership |
| Communities | `references/sdk/communities.md` | Groups, internships, member management |
| Partnerships | `references/sdk/partnerships.md` | Sponsors, passes, brand partnerships |
| Events | `references/sdk/events.md` | Calendar, rooms, bookings, RSVPs |
| Offices | `references/sdk/offices.md` | Physical access passes, building entry |
| ThirdParty | `references/sdk/thirdparty.md` | Developer tools, webhooks, API keys |
| Navigation | `references/sdk/navigation.md` | Deep links, cross-app navigation |

## After Inference

Once modules are confirmed, read only the relevant `references/sdk/<module>.md` files for detailed method signatures, types, and permissions. Always include `references/sdk/init.md` and `references/sdk/types.md` as shared context. For any app that reads, displays, transfers, or swaps FND amounts, also read `references/sdk/token-amount.md` — FND amounts are `bigint` base units bridged to/from display strings via `formatAmount()`/`parseAmount()`.
