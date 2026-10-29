import { describe, expect, it } from 'vitest';
import { base64UrlToBytes, isAppleMobile, nudgeSupport, type BrowserFacts } from './nudges';

const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36';
const MAC_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';

const chromeOnAndroid: BrowserFacts = {
  hasServiceWorker: true,
  hasPushManager: true,
  permission: 'default',
  userAgent: ANDROID_UA,
  platform: 'Linux armv8l',
  maxTouchPoints: 5,
  standalone: false,
};

const safariOnIphone: BrowserFacts = {
  hasServiceWorker: true,
  hasPushManager: false,
  permission: null,
  userAgent: IPHONE_UA,
  platform: 'iPhone',
  maxTouchPoints: 5,
  standalone: false,
};

describe('nudgeSupport', () => {
  it('is ready where the browser can push and has not been refused', () => {
    expect(nudgeSupport(chromeOnAndroid)).toBe('ready');
    expect(nudgeSupport({ ...chromeOnAndroid, permission: 'granted' })).toBe('ready');
  });

  it('is blocked once notifications were refused for the site', () => {
    expect(nudgeSupport({ ...chromeOnAndroid, permission: 'denied' })).toBe('blocked');
  });

  it('asks an iPhone in Safari to add the app to the home screen first', () => {
    expect(nudgeSupport(safariOnIphone)).toBe('needs_home_screen');
  });

  it('treats an iPad that asks for desktop pages as an iPad', () => {
    expect(nudgeSupport({ ...safariOnIphone, userAgent: MAC_UA, platform: 'MacIntel' })).toBe('needs_home_screen');
  });

  it('is ready on an iPhone running from the home screen', () => {
    expect(nudgeSupport({ ...safariOnIphone, hasPushManager: true, permission: 'default', standalone: true })).toBe('ready');
  });

  it('is unsupported on a home-screen iPhone too old for push, and on other browsers without it', () => {
    expect(nudgeSupport({ ...safariOnIphone, standalone: true })).toBe('unsupported');
    expect(nudgeSupport({ ...chromeOnAndroid, hasServiceWorker: false })).toBe('unsupported');
  });
});

describe('isAppleMobile', () => {
  it('does not mistake a Mac without a touch screen for an iPad', () => {
    expect(isAppleMobile({ userAgent: MAC_UA, platform: 'MacIntel', maxTouchPoints: 0 })).toBe(false);
  });
});

describe('base64UrlToBytes', () => {
  it('decodes base64url without padding', () => {
    expect(Array.from(base64UrlToBytes('-_8'))).toEqual([0xfb, 0xff]);
    expect(Array.from(base64UrlToBytes('AQID'))).toEqual([1, 2, 3]);
  });

  it('turns a VAPID public key into the 65 bytes of an uncompressed P-256 point', () => {
    const key = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
    const bytes = base64UrlToBytes(key);
    expect(bytes).toHaveLength(65);
    expect(bytes[0]).toBe(0x04);
  });
});
