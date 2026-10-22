'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS, activeHref } from './nav-items';

/** Left-hand tabs on wide screens. */
export function SideNav() {
  const current = activeHref(usePathname());
  return (
    <nav aria-label="Game" className="hidden md:flex flex-col gap-1 w-[200px] shrink-0">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} className="side-tab" aria-current={current === href ? 'page' : undefined}>
          <Icon className="size-5" aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

/** The same links in one bar at the bottom of a phone, where thumbs are. */
export function TabBar() {
  const current = activeHref(usePathname());
  return (
    <nav
      aria-label="Game"
      className="md:hidden fixed inset-x-0 bottom-0 z-10 bg-surface border-t border-edge pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link href={href} className="tab-bar-item" aria-current={current === href ? 'page' : undefined}>
              <Icon className="size-5" aria-hidden="true" />
              {label === 'This or that' ? 'This/that' : label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
