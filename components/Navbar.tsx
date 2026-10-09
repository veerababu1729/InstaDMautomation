'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const path = usePathname();
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-brand">
          <div className="navbar-logo">📱</div>
          <span className="navbar-title">InstaDM Auto</span>
        </Link>
        <div className="navbar-nav">
          <Link href="/" className={`nav-link ${path === '/' ? 'active' : ''}`}>
            🏠 Dashboard
          </Link>
          <Link href="/onboard" className={`nav-link ${path === '/onboard' ? 'active' : ''}`}>
            ➕ Add Page
          </Link>
          <Link href="/docs" className={`nav-link ${path === '/docs' ? 'active' : ''}`}>
            📖 Setup Guide
          </Link>
        </div>
      </div>
    </nav>
  );
}
