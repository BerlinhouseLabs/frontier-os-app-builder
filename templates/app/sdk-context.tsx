import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { FrontierSDK } from '@frontiertower/frontier-sdk';

const SdkContext = createContext<FrontierSDK | null>(null);

export const useSdk = (): FrontierSDK => {
  const sdk = useContext(SdkContext);
  if (!sdk) throw new Error('useSdk must be used within SdkProvider');
  return sdk;
};

export const SdkProvider = ({ children }: { children: ReactNode }) => {
  const [sdk, setSdk] = useState<FrontierSDK | null>(null);

  useEffect(() => {
    const instance = new FrontierSDK();
    setSdk(instance);

    return () => {
      instance.destroy();
    };
  }, []);

  if (!sdk) return null;

  return (
    <SdkContext.Provider value={sdk}>
      {children}
    </SdkContext.Provider>
  );
};
