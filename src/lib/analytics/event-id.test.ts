import { describe, expect, it } from 'vitest';
import { analyticsEventUuid, UUID_NAMESPACE_URL, uuidV5 } from './event-id';

const UUID_NAMESPACE_DNS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

describe('uuidV5', () => {
  it('matches the widely published vector (Python uuid5(NAMESPACE_DNS, "www.example.com"))', () => {
    expect(uuidV5('www.example.com', UUID_NAMESPACE_DNS)).toBe('2ed6657d-e927-568b-95e1-2665a8aea6a2');
  });

  it('matches Python uuid5 in the URL namespace', () => {
    expect(uuidV5('designloop:signed_up:user_1', UUID_NAMESPACE_URL)).toBe('d5f498ab-827a-5903-bbda-44e59f2dabbf');
  });

  it('sets the version (5) and RFC variant bits', () => {
    const id = uuidV5('anything', UUID_NAMESPACE_URL);
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('refuses a namespace that is not a UUID', () => {
    expect(() => uuidV5('x', 'not-a-uuid')).toThrow('namespace must be a UUID');
  });
});

describe('analyticsEventUuid', () => {
  it('is the UUIDv5 of "us_two:<event>:<fact id>", as Python builds it', () => {
    expect(analyticsEventUuid('round_revealed', 'c_1:1')).toBe('4cb06e2c-e29f-5589-9973-40b843543aba');
  });

  it('differs between events about the same fact, and between facts', () => {
    expect(analyticsEventUuid('round_revealed', 'c_1')).not.toBe(analyticsEventUuid('pack_chosen', 'c_1'));
    expect(analyticsEventUuid('pack_chosen', 'c_1')).not.toBe(analyticsEventUuid('pack_chosen', 'c_2'));
  });
});
