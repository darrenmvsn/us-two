import { describe, expect, it } from 'vitest';
import { addressBucket, clientKeyFromHeaders, createFixedWindowLimiter } from './rate-limit';

const from = (ip: string) => new Headers({ 'x-forwarded-for': ip });

describe('createFixedWindowLimiter', () => {
  it('admits up to the limit in a window, then starts again', () => {
    let t = 0;
    const limiter = createFixedWindowLimiter({ limit: 2, windowMs: 1_000, now: () => t });
    expect([limiter.allow('a'), limiter.allow('a'), limiter.allow('a'), limiter.allow('b')]).toEqual([true, true, false, true]);
    t = 1_000;
    expect(limiter.allow('a')).toBe(true);
  });
});

describe('clientKeyFromHeaders', () => {
  it('keeps an IPv4 caller as its address, and every proxy-less caller in one bucket', () => {
    expect(clientKeyFromHeaders(from('203.0.113.7, 10.0.0.1'))).toBe('203.0.113.7');
    expect(clientKeyFromHeaders(new Headers({ 'x-real-ip': '203.0.113.8' }))).toBe('203.0.113.8');
    expect(clientKeyFromHeaders(new Headers())).toBe('local');
  });

  it('keys an IPv6 caller by its /64, so rotating addresses inside it share one bucket', () => {
    const key = clientKeyFromHeaders(from('2001:db8:0:1::1'));
    expect(key).toBe('2001:db8:0:1::/64');
    expect(clientKeyFromHeaders(from('2001:0DB8:0000:0001:abcd:ef01:2345:6789'))).toBe(key);
    expect(clientKeyFromHeaders(from('[2001:db8:0:1:ffff::]'))).toBe(key);
    expect(clientKeyFromHeaders(from('2001:db8:0:2::1'))).not.toBe(key);
  });

  it('spends one allowance across a /64', () => {
    const route = createFixedWindowLimiter({ limit: 2, windowMs: 60_000 });
    const allow = (ip: string) => route.allow(clientKeyFromHeaders(from(ip)));
    expect([allow('2001:db8::1'), allow('2001:db8::2'), allow('2001:db8::3')]).toEqual([true, true, false]);
  });
});

describe('addressBucket', () => {
  it('expands ::, reads an IPv4-mapped address as its IPv4, and keeps what does not parse', () => {
    expect(addressBucket('::')).toBe('0:0:0:0::/64');
    expect(addressBucket('fe80::1%eth0')).toBe('fe80:0:0:0::/64');
    expect(addressBucket('::ffff:198.51.100.4')).toBe('198.51.100.4');
    expect(addressBucket('::ffff:c633:6404')).toBe('198.51.100.4');
    expect(addressBucket('1:2:3:4:5:6:7:8:9')).toBe('1:2:3:4:5:6:7:8:9');
    expect(addressBucket('1::2::3')).toBe('1::2::3');
    expect(addressBucket('not:an:address')).toBe('not:an:address');
  });
});
