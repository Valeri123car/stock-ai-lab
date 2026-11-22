import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getSession = vi.fn();
vi.mock('../config/supabase', () => ({
  supabase: { auth: { getSession: () => getSession() } },
}));

const { api, ApiError } = await import('./client');

const fetchMock = vi.fn();

function odgovor(status: number, body?: unknown) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  getSession.mockResolvedValue({ data: { session: null } });
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe('api client', () => {
  it('sestavi URL z iskalnim parametrom in vrne JSON', async () => {
    fetchMock.mockResolvedValue(odgovor(200, [{ id: 1, ticker: 'AAPL' }]));

    const res = await api.stocks('app');

    const url = fetchMock.mock.calls[0][0] as URL;
    expect(url.toString()).toBe('http://api.test/api/stocks?q=app');
    expect(res).toEqual([{ id: 1, ticker: 'AAPL' }]);
  });

  it('izpusti prazne parametre', async () => {
    fetchMock.mockResolvedValue(odgovor(200, []));

    await api.prices(7, undefined, '2020-01-01');

    const url = fetchMock.mock.calls[0][0] as URL;
    expect(url.searchParams.has('from')).toBe(false);
    expect(url.searchParams.get('to')).toBe('2020-01-01');
  });

  it('brez seje ne pošlje glave Authorization', async () => {
    fetchMock.mockResolvedValue(odgovor(200, []));

    await api.models();

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.headers).not.toHaveProperty('Authorization');
  });

  it('s sejo pošlje Bearer žeton', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'abc' } } });
    fetchMock.mockResolvedValue(odgovor(200, { email: 'x' }));

    await api.me();

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.headers).toMatchObject({ Authorization: 'Bearer abc' });
  });

  it('pri POST pošlje JSON telo', async () => {
    fetchMock.mockResolvedValue(odgovor(200, {}));

    await api.saveKey('sk-or-123');

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe('PUT');
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' });
    expect(init.body).toBe(JSON.stringify({ kljuc: 'sk-or-123' }));
  });

  it('pri 400 vrže ApiError s sporočilom in napakami po poljih', async () => {
    fetchMock.mockResolvedValue(
      odgovor(400, { message: 'Neveljavni podatki', napake: { kapital: 'Kapital mora biti večji od 0 €' } }),
    );

    const napaka = await api.createExperiment({} as never).catch((e) => e);

    expect(napaka).toBeInstanceOf(ApiError);
    expect(napaka.status).toBe(400);
    expect(napaka.message).toBe('Neveljavni podatki');
    expect(napaka.napake.kapital).toBe('Kapital mora biti večji od 0 €');
  });

  it('pri napaki brez JSON telesa uporabi status', async () => {
    fetchMock.mockResolvedValue(new Response('oops', { status: 500, statusText: 'Server Error' }));

    const napaka = await api.experiments().catch((e) => e);

    expect(napaka).toBeInstanceOf(ApiError);
    expect(napaka.message).toBe('500 Server Error');
    expect(napaka.napake).toEqual({});
  });

  it('pri 204 vrne undefined', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    const res = await api.deleteKey();

    expect(res).toBeUndefined();
  });
});
