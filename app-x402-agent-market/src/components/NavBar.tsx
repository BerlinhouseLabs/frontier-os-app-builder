import { Link, useLocation } from 'react-router-dom';

export const NavBar = () => {
  const { pathname } = useLocation();

  const links = [
    { to: '/', label: 'Home' },
    { to: '/market', label: 'Market' },
    { to: '/my-agents', label: 'My Agents' },
    { to: '/payments', label: 'Payments' },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 no-underline">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-xs font-bold text-white">
            x4
          </div>
          <span className="font-semibold text-foreground text-sm hidden sm:block">
            Agent Market
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {links.map((link) => {
            const active =
              link.to === '/' ? pathname === '/' : pathname.startsWith(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={[
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-colors no-underline',
                  active
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted-background',
                ].join(' ')}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Register CTA */}
        <Link
          to="/register"
          className={[
            'px-3 py-1.5 rounded-md text-xs font-semibold transition-colors no-underline',
            'bg-primary text-white hover:bg-primary/90',
          ].join(' ')}
        >
          + List Agent
        </Link>
      </div>
    </nav>
  );
};
