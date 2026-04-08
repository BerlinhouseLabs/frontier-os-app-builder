# Chain Module

**Trigger keywords:** network, chain, blockchain, contract, smart contract, on-chain, token address, stablecoin

Access via `sdk.getChain()`. Query and switch blockchain networks.

---

## Methods

```typescript
getCurrentNetwork(): Promise<string>
```
Returns the current network identifier (e.g. `'base'`, `'base-sepolia'`). Permission: `chain:getCurrentNetwork`

```typescript
getAvailableNetworks(): Promise<string[]>
```
Returns all network identifiers the app can switch to. Permission: `chain:getAvailableNetworks`

```typescript
switchNetwork(network: string): Promise<void>
```
Switch active blockchain network. Affects all subsequent wallet operations. Permission: `chain:switchNetwork`

```typescript
getCurrentChainConfig(): Promise<ChainConfig>
```
Returns full chain configuration for the current network. Permission: `chain:getCurrentChainConfig`

```typescript
getContractAddresses(): Promise<{
  fnd: string;
  iFnd: string | null;
  paymentRouter: string;
  subscriptionManager: string;
}>
```
Returns addresses for FND, iFND (may be null), PaymentRouter, and SubscriptionManager contracts on the current chain. Permission: `chain:getContractAddresses`

---

## Types

```typescript
enum Underlying {
  USD = "USD",
}

interface Token {
  name: string;
  symbol: string;
  decimals: number;
  address: string;
}

interface StableCoin extends Token {
  underlying: Underlying;
}

interface ChainConfig {
  id: number;
  name: string;
  network: string;
  bridgeSwapRouterFactoryAddress: string;
  uniswapV3FactoryAddress: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorer: {
    name: string;
    url: string;
  };
  stableCoins: StableCoin[];
  supportedTokens: Token[];
  testnet: boolean;
}
```

---

## Permissions (5)

| Permission | Description |
|---|---|
| `chain:getCurrentNetwork` | Get current network name |
| `chain:getAvailableNetworks` | Get list of available networks |
| `chain:switchNetwork` | Switch to a different network |
| `chain:getCurrentChainConfig` | Get full chain configuration |
| `chain:getContractAddresses` | Get FND, iFND, PaymentRouter, SubscriptionManager addresses |
