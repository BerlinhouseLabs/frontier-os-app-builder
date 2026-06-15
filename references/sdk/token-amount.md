# Token Amounts (bigint base units)

Frontier SDK v0.24.0 — imported from `@frontiertower/frontier-sdk` (the package root, **NOT** the `/ui-utils` subpath).

Since v0.23 all FND amounts are **bigint base units**. This module is the canonical `bigint <-> display-string` bridge that every FND-handling app depends on: wallet balances, `transfer*`/`swap` amounts, and the events security-deposit token amounts are all bigint, and these helpers convert to/from the human-readable strings you show in the UI or read from an input field.

## Exports (from the package root — `frontier-sdk/src/index.ts:26`)

```ts
import {
  parseAmount,
  formatAmount,
  FND_DECIMALS,
  InvalidAmountError,
} from '@frontiertower/frontier-sdk';
```

| Export | Signature | Source |
|---|---|---|
| `FND_DECIMALS` | `const FND_DECIMALS: number` (= `6`) | `token-amount.ts:2` |
| `parseAmount` | `parseAmount(value: string, decimals = FND_DECIMALS): bigint` | `token-amount.ts:19` |
| `formatAmount` | `formatAmount(amount: bigint, decimals = FND_DECIMALS): string` | `token-amount.ts:40` |
| `InvalidAmountError` | `class InvalidAmountError extends Error` | `token-amount.ts:5` |

`FND_DECIMALS = 6` is the decimal precision of the Frontier Dollar (FND). Both helpers default to it, so for FND you never pass `decimals` explicitly; pass it only for non-FND tokens (read the on-chain `decimals` from chain config — see Notes).

## `parseAmount(value, decimals = 6) -> bigint`

Parses a plain decimal string into a bigint in base units.

- `'75.5'` -> `75500000n`
- `'100'` -> `100000000n`
- `'0.000001'` -> `1n`

Symbol-free and locale-free by design. It throws `InvalidAmountError` on:

- currency symbols (`'$10'`)
- thousands separators (`'1,000'`)
- comma decimals (`'10,5'`)
- empty / whitespace-only string
- trailing dot (`'10.'`)
- more fractional digits than `decimals` (e.g. `'1.1234567'` for 6-decimal FND)

The validation regex is `/^-?\d+(\.\d+)?$/`, so **a leading minus IS permitted and negatives parse**: `'-5'` -> `-5000000n`. Guard against negative amounts yourself if your flow requires non-negative values. Normalize locale input (`','` -> `'.'`) before calling.

```ts
let amount: bigint;
try {
  amount = parseAmount(userInput);          // throws InvalidAmountError on bad input
} catch (err) {
  if (err instanceof InvalidAmountError) {
    // surface a validation message to the user
  }
  throw err;
}
```

## `formatAmount(amount, decimals = 6) -> string`

Formats a bigint base-unit amount into an exact, symbol-free decimal string.

- `75500000n` -> `'75.5'`
- `100000000n` -> `'100'`
- `1n` -> `'0.000001'`
- `-5000000n` -> `'-5'`

Full precision, trailing zeros trimmed, round-trips with `parseAmount`, negatives preserved. **The SDK never emits `'$'`** — display concerns (the `$` symbol, rounding, grouping separators) belong to the caller. Prepend the currency symbol yourself:

```ts
const display = `$${formatAmount(balance.fnd)}`;  // '$75.5'
```

## Canonical usage (read -> display, input -> write)

```ts
import {
  FrontierSDK,
  formatAmount,
  parseAmount,
} from '@frontiertower/frontier-sdk';

const wallet = sdk.getWallet();

// Read: getBalance() returns WalletBalance { total, fnd, internalFnd } — all bigint.
const balance = await wallet.getBalance();
const fndDisplay = formatAmount(balance.fnd);            // e.g. '75.5' for the UI

// Write: parse the user's input to bigint, then pass it straight to the transfer.
const amount = parseAmount(userInput);                   // throws InvalidAmountError
await wallet.transferFrontierDollar(recipient, amount);
```

The same pattern applies to `transferInternalFrontierDollar`, `transferOverallFrontierDollar`, `swap`, and `quoteSwap` — all take `amount: bigint`. See `references/sdk/wallet.md`.

## Notes

- `getBalanceFormatted()` and the `WalletBalanceFormatted` interface were **REMOVED in v0.23** (along with the `wallet:getBalanceFormatted` permission). There is no SDK method that returns pre-formatted display strings — call `getBalance()` and format each bigint field locally with `formatAmount()`.
- Base units, not display strings, cross the SDK boundary: a balance of `100_000000n` is `'100'` FND, and `1n` is the smallest representable amount (`0.000001` FND).
- For **non-FND tokens** (e.g. the events deposit ERC-20 candidates), do not assume 6 decimals. The on-chain `decimals` come from chain config: `(await sdk.getChain().getCurrentChainConfig()).stableCoins[].decimals`. Pass that value as the `decimals` argument to `parseAmount`/`formatAmount`, or use the `baseUnits` string the SDK already provides (the events `DepositPreflightToken.baseUnits` is wrapped with `BigInt(...)` for `approveERC20`).
