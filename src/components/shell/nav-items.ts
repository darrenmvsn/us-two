import { ArrowLeftRight, History, Layers, MessageCircleHeart, Settings, type LucideIcon } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/us', label: 'Today', icon: MessageCircleHeart },
  { href: '/us/this-or-that', label: 'This or that', icon: ArrowLeftRight },
  { href: '/us/past', label: 'Past', icon: History },
  { href: '/us/packs', label: 'Packs', icon: Layers },
  { href: '/us/settings', label: 'Settings', icon: Settings },
];

/** The tab a path belongs to: exact for Today, by prefix for the rest. */
export function activeHref(pathname: string): string | null {
  if (pathname === '/us') return '/us';
  return NAV_ITEMS.find((item) => item.href !== '/us' && pathname.startsWith(item.href))?.href ?? null;
}
