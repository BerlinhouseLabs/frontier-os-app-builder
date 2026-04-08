# SDK Module Inference

Maps business descriptions to Frontier SDK modules, methods, and permissions.

---

## Inference Algorithm

Given a natural-language business description of an app:

1. **Tokenize** -- lowercase the description and split into words. Remove stop words.
2. **Match against keyword patterns** -- for each SDK module, check if any of its trigger keywords appear in the token set.
3. **Always include baseline modules:**
   - **Storage** -- every app needs at least `storage:get` and `storage:set` for user preferences and local state.
   - **Chain** -- every app needs `chain:getCurrentNetwork` and `chain:getContractAddresses` for environment context.
4. **Include User if any user-facing features** -- if the app has any interactive UI (not purely informational), include `user:getDetails` and `user:getProfile`.
5. **Present inferred modules to user for confirmation** -- show the matched modules, the keywords that triggered them, and the permissions that would be requested. Let the user add or remove modules before proceeding.

---

## Module Reference

### Wallet

**Trigger keywords:** payment, pay, checkout, transfer, send, receive, money, balance, wallet, token, swap, deposit, withdraw, bank, fiat, dollar, FND, iFND, ERC20, purchase, buy, sell, fund, currency, on-ramp, off-ramp, tip, donate, subscription (when involving recurring payments)

**Most commonly used methods:**
- `getBalance()` / `getBalanceFormatted()` -- read wallet balance
- `getAddress()` -- get user's wallet address
- `transferFrontierDollar(to, amount)` -- send FND to another address
- `transferInternalFrontierDollar(to, amount)` -- send iFND
- `transferOverallFrontierDollar(to, amount)` -- send FND, preferring iFND first, falling back to FND
- `swap(params)` / `quoteSwap(params)` -- token swap operations
- `getUsdDepositInstructions()` / `getEurDepositInstructions()` -- fiat on-ramp
- `getLinkedBanks()` / `linkUsBankAccount()` / `linkEuroAccount()` -- fiat off-ramp

**Permissions:**

| Permission                              | Description                                   |
| --------------------------------------- | --------------------------------------------- |
| `wallet:getBalance`                     | Access wallet balance                         |
| `wallet:getBalanceFormatted`            | Access formatted wallet balance               |
| `wallet:getAddress`                     | Access wallet address                         |
| `wallet:getSmartAccount`               | Access smart account details                  |
| `wallet:transferERC20`                 | Transfer ERC20 tokens                         |
| `wallet:approveERC20`                  | Approve ERC20 token spending                  |
| `wallet:transferNative`               | Transfer native currency (ETH)                |
| `wallet:transferFrontierDollar`        | Transfer Frontier Dollars                     |
| `wallet:transferInternalFrontierDollar`| Transfer Internal Frontier Dollars            |
| `wallet:transferOverallFrontierDollar` | Transfer FND with iFND preferred              |
| `wallet:executeCall`                   | Execute arbitrary contract calls              |
| `wallet:executeBatchCall`              | Execute multiple contract calls atomically    |
| `wallet:getSupportedTokens`            | Get list of supported tokens for swaps        |
| `wallet:swap`                          | Execute token swaps                           |
| `wallet:quoteSwap`                     | Get quotes for token swaps                    |
| `wallet:getUsdDepositInstructions`     | Get USD bank deposit instructions             |
| `wallet:getEurDepositInstructions`     | Get EUR (SEPA) deposit instructions           |
| `wallet:getLinkedBanks`               | Get linked bank accounts                      |
| `wallet:linkUsBankAccount`            | Link a US bank account                        |
| `wallet:linkEuroAccount`              | Link a EUR/IBAN bank account                  |
| `wallet:deleteLinkedBank`             | Delete a linked bank account                  |
| `wallet:getDeprecatedSmartAccounts`    | Get deprecated smart accounts                 |
| `wallet:transferOverallFrontierDollar` | Transfer FND, preferring iFND first           |

**Example business descriptions:**
- "A tipping app where users can send FND to content creators"
- "A checkout widget for purchasing physical goods with Frontier Dollars"
- "A savings dashboard showing the user's balance and deposit history"

---

### Storage

**Trigger keywords:** save, store, persist, preferences, settings, cache, remember, bookmark, favorite, history, draft, note, data, local

**Always included.** Every app needs storage for user preferences at minimum.

**Most commonly used methods:**
- `get(key)` -- read a value
- `set(key, value)` -- write a value
- `remove(key)` -- delete a value

**Permissions:**

| Permission        | Description           |
| ----------------- | --------------------- |
| `storage:get`     | Read from storage     |
| `storage:set`     | Write to storage      |
| `storage:remove`  | Remove from storage   |
| `storage:clear`   | Clear all storage     |

**Example business descriptions:**
- "An app that remembers the user's preferred language and notification settings"
- "A note-taking app that saves drafts locally"

---

### Chain

**Trigger keywords:** network, chain, contract, blockchain, onchain, smart contract, address, deploy, testnet, mainnet

**Always included.** Every app needs chain context for environment detection and contract addresses.

**Most commonly used methods:**
- `getCurrentNetwork()` -- get current network name
- `getContractAddresses()` -- get FND, iFND, PaymentRouter, SubscriptionManager addresses
- `getCurrentChainConfig()` -- full chain configuration

**Permissions:**

| Permission                     | Description                             |
| ------------------------------ | --------------------------------------- |
| `chain:getCurrentNetwork`      | Get current network name                |
| `chain:getAvailableNetworks`   | Get list of available networks          |
| `chain:switchNetwork`          | Switch to a different network           |
| `chain:getCurrentChainConfig`  | Get full chain configuration            |
| `chain:getContractAddresses`   | Get contract addresses                  |

**Example business descriptions:**
- "A dashboard showing contract deployment status across networks"
- "An app that reads on-chain data from the SubscriptionManager"

---

### User

**Trigger keywords:** user, profile, account, member, membership, signup, register, login, identity, referral, invite, KYC, verification, contact, email, subscription status, access control

**Include if any user-facing features.** Most apps need at minimum `user:getDetails`.

**Most commonly used methods:**
- `getDetails()` -- current user details
- `getProfile()` -- user profile information
- `getVerifiedAccessControls()` -- cryptographically verified access controls (always use for gating)
- `createSignupRequest(params)` -- submit membership signup with crypto payment
- `getReferralOverview()` -- referral statistics

**Permissions:**

| Permission                       | Description                                        |
| -------------------------------- | -------------------------------------------------- |
| `user:getDetails`                | Access current user details                        |
| `user:getProfile`                | Access current user profile information             |
| `user:getReferralOverview`       | Access referral statistics                         |
| `user:getReferralDetails`        | Access detailed referral information                |
| `user:addUserContact`            | Add user contact information                        |
| `user:getOrCreateKyc`           | Get or create KYC verification status               |
| `user:createSignupRequest`       | Submit a new membership signup request              |
| `user:getVerifiedAccessControls` | Get cryptographically verified access controls      |

**Important:** Always use `getVerifiedAccessControls()` when making access decisions -- never trust unsigned user data from other SDK methods for gating features, content, or permissions. The method returns a cryptographically signed payload verified against hardcoded per-environment public keys inside the iframe.

**Example business descriptions:**
- "A membership signup form with KYC verification"
- "A referral tracking dashboard showing invite statistics"
- "An app that shows different content based on subscription plan"

---

### Communities

**Trigger keywords:** community, communities, group, team, internship, intern, member management, reassign, transfer member, pass, organization

**Most commonly used methods:**
- `listCommunities()` -- list all visible communities (paginated)
- `getCommunity(id)` -- get a community by ID or slug
- `createInternshipPass(params)` -- create an internship pass
- `listInternshipPasses()` -- list internship passes (paginated)

**Permissions:**

| Permission                            | Description                                  |
| ------------------------------------- | -------------------------------------------- |
| `communities:listCommunities`         | List all visible communities                 |
| `communities:getCommunity`            | Get a community by ID or slug                |
| `communities:createInternshipPass`    | Create an internship pass                    |
| `communities:listInternshipPasses`    | List internship passes                       |
| `communities:getInternshipPass`       | Retrieve an internship pass by ID            |
| `communities:revokeInternshipPass`    | Revoke an internship pass                    |
| `communities:createReassignRequest`   | Create a member reassignment request         |
| `communities:listReassignRequests`    | List pending reassignment requests           |
| `communities:getReassignRequest`      | Retrieve a reassignment request by ID        |
| `communities:acceptReassignRequest`   | Accept a reassignment request                |
| `communities:rejectReassignRequest`   | Reject a reassignment request                |

**Example business descriptions:**
- "An internship management tool for community leaders"
- "A community directory app"
- "A tool to manage member transfers between communities"

---

### Partnerships

**Trigger keywords:** sponsor, sponsorship, partner, partnership, brand, advertiser, promotion, pass, voucher, coupon

**Most commonly used methods:**
- `listSponsors()` -- list sponsors you manage (paginated)
- `createSponsorPass(params)` -- create a sponsor pass
- `listActiveSponsorPasses()` -- list active passes (paginated)

**Permissions:**

| Permission                              | Description                              |
| --------------------------------------- | ---------------------------------------- |
| `partnerships:listSponsors`             | List sponsors you manage                 |
| `partnerships:getSponsor`               | Retrieve a Sponsor by ID                 |
| `partnerships:createSponsorPass`        | Create a SponsorPass                     |
| `partnerships:listActiveSponsorPasses`  | List active SponsorPasses                |
| `partnerships:listAllSponsorPasses`     | List all SponsorPasses                   |
| `partnerships:getSponsorPass`           | Retrieve a SponsorPass by ID             |
| `partnerships:revokeSponsorPass`        | Revoke a SponsorPass by ID               |

**Example business descriptions:**
- "A sponsor management dashboard for partnership managers"
- "A tool for creating and distributing sponsor passes at events"
- "A brand promotion platform within the Frontier network"

---

### Events

**Trigger keywords:** event, events, calendar, meetup, gathering, conference, workshop, hackathon, location, venue, room, booking, schedule, RSVP, host

**Most commonly used methods:**
- `listEvents(filters)` -- list events with optional filters (paginated)
- `createEvent(params)` -- create a new event
- `listLocations()` -- list available locations
- `createRoomBooking(params)` -- create a room booking

**Permissions:**

| Permission                    | Description                              |
| ----------------------------- | ---------------------------------------- |
| `events:listEvents`           | List events with optional filters        |
| `events:createEvent`          | Create a new event                       |
| `events:addEventHost`         | Add a co-host to an event                |
| `events:listLocations`        | List available locations                 |
| `events:listRoomBookings`     | List room bookings                       |
| `events:createRoomBooking`    | Create a room booking                    |

**Example business descriptions:**
- "A room booking app for co-working spaces"
- "An event calendar with RSVP functionality"
- "A venue management tool for event organizers"

---

### Offices

**Trigger keywords:** office, access pass, access control, building, door, entry, coworking, membership contract, check-in, keycard

**Most commonly used methods:**
- `createAccessPass(params)` -- create an access pass for a membership contract
- `listAccessPasses()` -- list access passes (paginated)

**Permissions:**

| Permission                    | Description                                        |
| ----------------------------- | -------------------------------------------------- |
| `offices:createAccessPass`    | Create an access pass for a membership contract     |
| `offices:listAccessPasses`    | List access passes for managed contracts            |
| `offices:getAccessPass`       | Retrieve an access pass by ID                       |
| `offices:revokeAccessPass`    | Revoke an access pass                               |

**Example business descriptions:**
- "A digital access pass manager for co-working spaces"
- "A building entry system for office members"
- "A tool for managing physical access to Frontier offices"

---

### ThirdParty

**Trigger keywords:** developer, API, webhook, app registration, integrate, third-party, 3rd party, platform, marketplace, SDK, developer portal

**Most commonly used methods:**
- `listDevelopers()` -- list developer accounts
- `createApp(params)` -- register a new app
- `createWebhook(params)` -- create a webhook
- `rotateWebhookSigningKey(webhookId)` -- rotate webhook signing key

**Permissions:**

| Permission                            | Description                              |
| ------------------------------------- | ---------------------------------------- |
| `thirdParty:listDevelopers`           | List developer accounts                  |
| `thirdParty:getDeveloper`             | Get developer details by ID              |
| `thirdParty:updateDeveloper`          | Update developer information             |
| `thirdParty:rotateDeveloperApiKey`    | Rotate developer API key                 |
| `thirdParty:listApps`                | List registered apps                     |
| `thirdParty:createApp`               | Register a new app                       |
| `thirdParty:getApp`                  | Get app details by ID                    |
| `thirdParty:updateApp`               | Update an app                            |
| `thirdParty:deleteApp`               | Request app deactivation                 |
| `thirdParty:listWebhooks`            | List webhooks                            |
| `thirdParty:createWebhook`           | Create a new webhook                     |
| `thirdParty:getWebhook`              | Get webhook details by ID                |
| `thirdParty:updateWebhook`           | Update a webhook                         |
| `thirdParty:deleteWebhook`           | Delete a webhook                         |
| `thirdParty:rotateWebhookSigningKey` | Rotate webhook signing key               |

**Example business descriptions:**
- "A developer portal for managing apps and API keys"
- "A webhook configuration dashboard"
- "A tool for registering and monitoring third-party integrations"

---

### Navigation

**Trigger keywords:** navigate, deep link, deeplink, open app, launch app, redirect, cross-app, inter-app, link to, switch app, app-to-app, close app

**Most commonly used methods:**
- `openApp(appId, options)` -- navigate to another Frontier OS app with optional path and params
- `close()` -- close the current app and return to the previous screen
- `onDeepLink(callback)` -- register a listener for incoming deep link data from another app

**Permissions:**

| Permission              | Description                                  |
| ----------------------- | -------------------------------------------- |
| `navigation:openApp`    | Navigate to another app in Frontier OS       |
| `navigation:close`      | Close the current app                        |

Note: `onDeepLink` does not require a permission — it is a passive listener that receives data when the app was opened via another app's `openApp()` call.

**Example business descriptions:**
- "A restaurant app that links to the POS payment app for checkout"
- "A dashboard that deep links into specific views of other apps"
- "An app launcher that opens other Frontier OS apps"

---

## Inference Examples

### Example 1: "A hotel booking app where users can browse rooms and pay with FND"

| Module      | Matched keywords            | Permissions                                      |
| ----------- | --------------------------- | ------------------------------------------------ |
| Wallet      | pay, FND                    | `wallet:getBalance`, `wallet:transferFrontierDollar` or `wallet:transferOverallFrontierDollar` |
| Storage     | (always)                    | `storage:get`, `storage:set`                     |
| Chain       | (always)                    | `chain:getCurrentNetwork`, `chain:getContractAddresses` |
| User        | users, booking              | `user:getDetails`, `user:getProfile`             |
| Events      | booking, rooms              | `events:listLocations`, `events:createRoomBooking` |

### Example 2: "A community directory showing all communities and their members"

| Module      | Matched keywords            | Permissions                                      |
| ----------- | --------------------------- | ------------------------------------------------ |
| Communities | community, communities, members | `communities:listCommunities`, `communities:getCommunity` |
| Storage     | (always)                    | `storage:get`, `storage:set`                     |
| Chain       | (always)                    | `chain:getCurrentNetwork`, `chain:getContractAddresses` |
| User        | members                     | `user:getDetails`, `user:getProfile`             |

### Example 3: "A subscription management tool for signing up and managing membership plans"

| Module      | Matched keywords            | Permissions                                      |
| ----------- | --------------------------- | ------------------------------------------------ |
| Wallet      | subscription (payments)     | `wallet:getBalance`, `wallet:transferOverallFrontierDollar` |
| User        | signup, membership, managing | `user:getDetails`, `user:getVerifiedAccessControls`, `user:createSignupRequest` |
| Storage     | (always)                    | `storage:get`, `storage:set`                     |
| Chain       | (always)                    | `chain:getCurrentNetwork`, `chain:getContractAddresses` |

### Example 4: "A sponsor pass distribution tool for event organizers"

| Module       | Matched keywords            | Permissions                                      |
| ------------ | --------------------------- | ------------------------------------------------ |
| Partnerships | sponsor, pass               | `partnerships:listSponsors`, `partnerships:createSponsorPass` |
| Events       | event                       | `events:listEvents`                              |
| Storage      | (always)                    | `storage:get`, `storage:set`                     |
| Chain        | (always)                    | `chain:getCurrentNetwork`, `chain:getContractAddresses` |
| User         | organizers                  | `user:getDetails`, `user:getProfile`             |
