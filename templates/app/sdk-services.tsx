/**
 * SDK Services Adapter
 *
 * Maps the FrontierServices interface to real SDK module calls.
 * Used when the app runs inside the Frontier OS iframe.
 * Only modules declared in manifest.json are wired; unused modules throw.
 *
 * During SDK Integration the executor should:
 * 1. Wire modules the app actually uses (replace Proxy stubs with real SDK calls)
 * 2. Keep Proxy stubs for unused modules
 */

import type { FrontierSDK } from '@frontiertower/frontier-sdk';
import type {
  FrontierServices,
  WalletService,
  StorageService,
  ChainService,
  UserService,
  PartnershipsService,
  ThirdPartyService,
  CommunitiesService,
  EventsService,
  OfficesService,
  NavigationService,
} from './frontier-services';

function notAvailable(module: string): never {
  throw new Error(`[SDK] ${module} module is not available in this app`);
}

export function createSdkServices(sdk: FrontierSDK): FrontierServices {
  void sdk; // marks `sdk` used while modules are still stubs; remove once you wire one below (e.g. sdk.getWallet())
  // ── Wire modules your app uses ──────────────────────────────
  // Replace the Proxy stubs below with real SDK adapter objects
  // for each module declared in manifest.json.
  //
  // Example (wallet):
  //   const walletAccess = sdk.getWallet();
  //   const wallet: WalletService = {
  //     getBalance: () => walletAccess.getBalance(),
  //     ...
  //   };

  // ── Stub modules not used by this app ───────────────────────
  const wallet = new Proxy({} as WalletService, {
    get: () => () => notAvailable('Wallet'),
  });

  const storage = new Proxy({} as StorageService, {
    get: () => () => notAvailable('Storage'),
  });

  const chain = new Proxy({} as ChainService, {
    get: () => () => notAvailable('Chain'),
  });

  const user = new Proxy({} as UserService, {
    get: () => () => notAvailable('User'),
  });

  const partnerships = new Proxy({} as PartnershipsService, {
    get: () => () => notAvailable('Partnerships'),
  });

  const thirdParty = new Proxy({} as ThirdPartyService, {
    get: () => () => notAvailable('ThirdParty'),
  });

  const communities = new Proxy({} as CommunitiesService, {
    get: () => () => notAvailable('Communities'),
  });

  const events = new Proxy({} as EventsService, {
    get: () => () => notAvailable('Events'),
  });

  const offices = new Proxy({} as OfficesService, {
    get: () => () => notAvailable('Offices'),
  });

  const navigation = new Proxy({} as NavigationService, {
    get: () => () => notAvailable('Navigation'),
  });

  return {
    wallet,
    storage,
    chain,
    user,
    partnerships,
    thirdParty,
    communities,
    events,
    offices,
    navigation,
  };
}
