# SDK Module Index

Maps app descriptions to Frontier SDK modules. The CLI (`fos-tools.cjs infer-modules`) does keyword matching programmatically — this file documents the algorithm and serves as an index to per-module reference files.

## Inference Algorithm

1. Lowercase the description, split into tokens
2. Match against trigger keywords for each SDK module (keywords listed in each module's reference file under references/sdk/)
3. Always include: Storage, Chain (every app needs these)
4. Include User if any interactive UI features
5. Present inferred modules for user confirmation

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
