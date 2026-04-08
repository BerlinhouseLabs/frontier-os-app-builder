# Wallet Module

**Trigger keywords:** payment, pay, charge, pos, checkout, purchase, buy, sell, transfer, send money, balance, funds, money, wallet, fnd, swap, exchange, convert, token, deposit, on-ramp, fund, withdraw, off-ramp, bank, fiat, subscription, billing, price, cost, fee, tip, donate, donation

Access via `sdk.getWallet()`. All methods use the current chain from the chain manager. Write operations require biometric authentication.

---

## Methods

```typescript
getBalance(): Promise<WalletBalance>
```
Returns raw balance breakdown (bigint values). Permission: `wallet:getBalance`

```typescript
getBalanceFormatted(): Promise<WalletBalanceFormatted>
```
Returns display-formatted balance strings (e.g. `'$10.50'`). Permission: `wallet:getBalanceFormatted`

```typescript
getAddress(): Promise<string>
```
Returns the smart account contract address for the current chain. Permission: `wallet:getAddress`

```typescript
getSmartAccount(): Promise<SmartAccount>
```
Returns detailed smart account info including deployment status. Permission: `wallet:getSmartAccount`

```typescript
transferERC20(
  tokenAddress: string,
  to: string,
  amount: bigint,
  overrides?: GasOverrides
): Promise<UserOperationReceipt>
```
Transfer ERC20 tokens. Amount in token's smallest unit. Permission: `wallet:transferERC20`

```typescript
approveERC20(
  tokenAddress: string,
  spender: string,
  amount: bigint,
  overrides?: GasOverrides
): Promise<UserOperationReceipt>
```
Approve a spender for ERC20 tokens. Permission: `wallet:approveERC20`

```typescript
transferNative(
  to: string,
  amount: bigint,
  overrides?: GasOverrides
): Promise<UserOperationReceipt>
```
Transfer native currency (ETH). Amount in wei. Permission: `wallet:transferNative`

```typescript
executeCall(
  call: ExecuteCall,
  overrides?: GasOverrides
): Promise<UserOperationReceipt>
```
Execute an arbitrary contract call. Permission: `wallet:executeCall`

```typescript
executeBatchCall(
  calls: ExecuteCall[],
  overrides?: GasOverrides
): Promise<UserOperationReceipt>
```
Execute multiple calls atomically in a single transaction. Permission: `wallet:executeBatchCall`

```typescript
transferFrontierDollar(
  to: string,
  amount: string,
  overrides?: GasOverrides
): Promise<UserOperationReceipt>
```
Transfer FND (Frontier Network Dollar). Amount is human-readable string (e.g. `'10.5'`). Permission: `wallet:transferFrontierDollar`

```typescript
transferInternalFrontierDollar(
  to: string,
  amount: string,
  overrides?: GasOverrides
): Promise<UserOperationReceipt>
```
Transfer iFND (Internal Frontier Network Dollar). Amount is human-readable string. Permission: `wallet:transferInternalFrontierDollar`

```typescript
transferOverallFrontierDollar(
  to: string,
  amount: string,
  overrides?: GasOverrides
): Promise<UserOperationReceipt>
```
Transfer using iFND first, falling back to FND for the remainder. Permission: `wallet:transferOverallFrontierDollar`

```typescript
getSupportedTokens(): Promise<string[]>
```
Returns token symbols supported for swaps on the current chain (e.g. `['FND', 'USDC', 'WETH']`). Permission: `wallet:getSupportedTokens`

```typescript
swap(
  sourceToken: string,
  targetToken: string,
  sourceNetwork: string,
  targetNetwork: string,
  amount: string
): Promise<SwapResult>
```
Execute a token swap (same-chain or cross-chain). Amount is human-readable. Permission: `wallet:swap`

```typescript
quoteSwap(
  sourceToken: string,
  targetToken: string,
  sourceNetwork: string,
  targetNetwork: string,
  amount: string
): Promise<SwapQuote>
```
Get a swap quote without executing. Permission: `wallet:quoteSwap`

```typescript
getUsdDepositInstructions(): Promise<OnRampResponse<UsdDepositInstructions>>
```
Get US bank details for fiat-to-crypto on-ramp. Requires approved KYC. Permission: `wallet:getUsdDepositInstructions`

```typescript
getEurDepositInstructions(): Promise<OnRampResponse<EurDepositInstructions>>
```
Get SEPA bank details for EUR fiat-to-crypto on-ramp. Requires approved KYC. Permission: `wallet:getEurDepositInstructions`

```typescript
getLinkedBanks(): Promise<LinkedBanksResponse>
```
Get all linked bank accounts for off-ramp withdrawals. Requires approved KYC. Permission: `wallet:getLinkedBanks`

```typescript
linkUsBankAccount(
  accountOwnerName: string,
  bankName: string,
  routingNumber: string,
  accountNumber: string,
  checkingOrSavings: 'checking' | 'savings',
  address: BillingAddress
): Promise<LinkBankResponse>
```
Link a US bank account for USD withdrawals via ACH. Requires approved KYC. Permission: `wallet:linkUsBankAccount`

```typescript
linkEuroAccount(
  accountOwnerName: string,
  accountOwnerType: AccountOwnerType,
  firstName: string,
  lastName: string,
  ibanAccountNumber: string,
  bic?: string
): Promise<LinkBankResponse>
```
Link a EUR/IBAN bank account for SEPA withdrawals. Requires approved KYC. Permission: `wallet:linkEuroAccount`

```typescript
deleteLinkedBank(bankId: string): Promise<void>
```
Delete a linked bank account. Permission: `wallet:deleteLinkedBank`

```typescript
getDeprecatedSmartAccounts(): Promise<DeprecatedSmartAccount[]>
```
Get deprecated smart accounts that still have active gas sponsorship. Permission: `wallet:getDeprecatedSmartAccounts`

---

## Types

```typescript
interface SmartAccount {
  id: number;
  ownerAddress: string;
  contractAddress: string | null;
  network: string;
  status: string;
  deploymentTransactionHash: string;
  createdAt: string;
}

interface WalletBalance {
  total: bigint;
  fnd: bigint;
  internalFnd: bigint;
}

interface WalletBalanceFormatted {
  total: string;    // e.g. '$10.50'
  fnd: string;
  internalFnd: string;
}

interface UserOperationReceipt {
  userOpHash: string;
  transactionHash: string;
  blockNumber: bigint;
  success: boolean;
}

interface GasOverrides {
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  gasLimit?: bigint;
}

interface ExecuteCall {
  target: string;
  value?: bigint;
  data: string;
}

interface SwapParams {
  sourceToken: string;
  targetToken: string;
  sourceNetwork: string;
  targetNetwork: string;
  amount: string;
}

enum SwapResultStatus {
  COMPLETED = 'COMPLETED',
  SUBMITTED = 'SUBMITTED',
}

interface SwapResult {
  sourceChain: object;
  targetChain: object;
  sourceToken: object;
  targetToken: object;
  status: SwapResultStatus;
}

interface SwapQuote {
  sourceChain: object;
  targetChain: object;
  sourceToken: object;
  targetToken: object;
  expectedAmountOut: string;
  minAmountOut: string;
}

interface UsdDepositInstructions {
  currency: 'usd';
  bankName: string;
  bankAddress: string;
  bankRoutingNumber: string;
  bankAccountNumber: string;
  bankBeneficiaryName: string;
  paymentRail: string;
}

interface EurDepositInstructions {
  currency: 'eur';
  iban: string;
  bic: string;
  accountHolderName: string;
}

interface OnRampResponse<T = UsdDepositInstructions | EurDepositInstructions> {
  currency: 'usd' | 'eur';
  depositInstructions: T;
  destinationAddress: string;
  destinationNetwork: string;
}

interface LinkedBank {
  id: string;
  bankName: string;
  last4: string;
  withdrawalAddress: string;
  network: string;
}

interface LinkedBanksResponse {
  banks: LinkedBank[];
}

interface LinkBankResponse {
  externalAccountId: string;
  bankName: string;
  withdrawalAddress: string;
  network: string;
}

interface BillingAddress {
  streetLine1: string;
  streetLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

type AccountOwnerType = 'individual' | 'business';

interface DeprecatedSmartAccount {
  id: number;
  ownerAddress: string;
  contractAddress: string;
  network: string;
  deprecatedAt: string;
  version: number;
}
```

---

## Permissions (22)

| Permission | Description |
|---|---|
| `wallet:getBalance` | Access wallet balance (raw bigint) |
| `wallet:getBalanceFormatted` | Access formatted wallet balance (display strings) |
| `wallet:getAddress` | Access wallet address |
| `wallet:getSmartAccount` | Access smart account details |
| `wallet:transferERC20` | Transfer ERC20 tokens |
| `wallet:approveERC20` | Approve ERC20 token spending |
| `wallet:transferNative` | Transfer native currency (ETH) |
| `wallet:transferFrontierDollar` | Transfer FND (Frontier Network Dollar) |
| `wallet:transferInternalFrontierDollar` | Transfer iFND (Internal Frontier Network Dollar) |
| `wallet:transferOverallFrontierDollar` | Transfer using iFND first, fallback to FND |
| `wallet:executeCall` | Execute arbitrary contract call |
| `wallet:executeBatchCall` | Execute multiple contract calls atomically |
| `wallet:getSupportedTokens` | Get supported token symbols for swaps |
| `wallet:swap` | Execute token swap (same-chain or cross-chain) |
| `wallet:quoteSwap` | Get swap quote without executing |
| `wallet:getUsdDepositInstructions` | Get USD bank deposit instructions (on-ramp) |
| `wallet:getEurDepositInstructions` | Get EUR/SEPA deposit instructions (on-ramp) |
| `wallet:getLinkedBanks` | Get linked bank accounts (off-ramp) |
| `wallet:linkUsBankAccount` | Link US bank account for USD withdrawals |
| `wallet:linkEuroAccount` | Link EUR/IBAN bank account for EUR withdrawals |
| `wallet:deleteLinkedBank` | Delete a linked bank account |
| `wallet:getDeprecatedSmartAccounts` | Get deprecated smart accounts with active gas sponsorship |
