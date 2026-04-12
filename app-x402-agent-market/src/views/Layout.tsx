import { Outlet } from 'react-router-dom';
import { FrontierServicesProvider } from '../lib/frontier-services';
import { NavBar } from '../components/NavBar';

export const Layout = () => (
  <FrontierServicesProvider>
    <div className="flex flex-col min-h-screen bg-background">
      <NavBar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  </FrontierServicesProvider>
);
