import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { isInFrontierApp, createStandaloneHTML } from '@frontiertower/frontier-sdk/ui-utils';
import { SdkProvider, useSdk } from '../lib/sdk-context';
import { FrontierServicesProvider } from '../lib/frontier-services';
import { createSdkServices } from '../lib/sdk-services';

// Bridges the live SDK (from SdkProvider) into the FrontierServices seam that
// feature code consumes via useServices(). Keeps feature code SDK-agnostic: the
// exact same components run against mocks (standalone) and the real SDK (iframe).
const SdkServicesBridge = ({ children }: { children: ReactNode }) => {
  const sdk = useSdk();
  const services = useMemo(() => createSdkServices(sdk), [sdk]);
  return <FrontierServicesProvider services={services}>{children}</FrontierServicesProvider>;
};

export const Layout = () => {
  const [loading, setLoading] = useState(true);
  const [standaloneHtml, setStandaloneHtml] = useState('');

  useEffect(() => {
    if (!isInFrontierApp()) {
      setStandaloneHtml(createStandaloneHTML('{{APP_NAME}}'));
    }
    setLoading(false);
  }, []);

  if (standaloneHtml) {
    return (
      <div
        className="min-h-screen bg-background text-foreground"
        dangerouslySetInnerHTML={{ __html: standaloneHtml }}
      />
    );
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner spinner-lg" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // In-frame: provide both the raw SDK (useSdk) and the SDK-backed services
  // seam (useServices) so every feature component works unchanged from standalone.
  return (
    <SdkProvider>
      <SdkServicesBridge>
        <Outlet />
      </SdkServicesBridge>
    </SdkProvider>
  );
};
