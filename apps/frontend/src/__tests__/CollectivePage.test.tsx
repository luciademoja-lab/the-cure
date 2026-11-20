import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CollectivePage } from '../pages/CollectivePage';
import { I18nProvider } from '../i18n/I18nProvider';
import { fakeSupabase } from '../test/setup';
import { claimable, CONSTELLATIONS, nextTarget, rotationTo, skyProjection } from '../lib/sky';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const baseSky = { claims: { Ori: 3, Lyr: 1 }, mine: ['Lyr'], availableStars: 0, invited: 2, usedStars: 0, people: 42, myCode: 'abc12345' };

const renderSky = () =>
  render(
    <I18nProvider>
      <CollectivePage />
    </I18nProvider>
  );

describe('il cielo: dati e regole', () => {
  it('ha le 88 costellazioni ufficiali, con figure valide', () => {
    expect(CONSTELLATIONS).toHaveLength(88);
    for (const c of CONSTELLATIONS) {
      for (const [a, b] of c.lines) {
        expect(c.stars[a]).toBeDefined();
        expect(c.stars[b]).toBeDefined();
      }
    }
    expect(CONSTELLATIONS.filter((c) => c.stars.length >= 7)).toHaveLength(45);
  });

  it('mette la costellazione scelta al centro della vista (coordinate reali)', () => {
    const orion = CONSTELLATIONS.find((c) => c.id === 'Ori')!;
    const p = skyProjection(600, rotationTo(orion), 1)(orion.center)!;
    expect(p[0]).toBeCloseTo(300, 0);
    expect(p[1]).toBeCloseTo(300, 0);
  });

  it('guardando in su l’est sta a sinistra (cielo rovesciato rispetto a una mappa)', () => {
    const proj = skyProjection(600, [0, 0], 1);
    expect(proj([10, 0])![0]).toBeLessThan(300);
  });

  it('propone le costellazioni reclamabili in ordine alfabetico, escluse quelle già prese', () => {
    const list = claimable(['Ant'], 3, 'en');
    expect(list.every((c) => c.stars.length <= 3)).toBe(true);
    expect(list.map((c) => c.id)).not.toContain('Ant');
    const names = list.map((c) => c.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'en')));
    expect(claimable([], 1, 'en')).toEqual([]);
    expect(nextTarget([], 'en')!.stars.length).toBe(2);
  });
});

describe('CollectivePage', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fakeSupabase.signInAs();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('disegna tutto il cielo e mostra il link di invito', async () => {
    fetchMock.mockResolvedValueOnce(json(baseSky));
    const { container } = renderSky();
    expect(await screen.findByText('42 points of light')).toBeInTheDocument();
    expect(container.querySelectorAll('.sky-constellation')).toHaveLength(88);
    expect(container.querySelectorAll('.sky-constellation.mine')).toHaveLength(1);
    expect(container.querySelectorAll('.sky-constellation.claimed')).toHaveLength(1);
    expect(screen.getByLabelText('Your invitation link')).toHaveValue(`${window.location.origin}/register?ref=abc12345`);
  });

  it('con abbastanza stelle mostra la prima costellazione in ordine alfabetico e il pulsante per reclamarla', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(json({ ...baseSky, availableStars: 8 }));
    renderSky();
    const first = claimable(['Lyr'], 8, 'en')[0];
    expect(await screen.findByRole('heading', { name: first.name })).toBeInTheDocument();

    fetchMock.mockResolvedValueOnce(json({ constellation: first.id, stars: first.stars.length, rewarded: first.stars.length >= 7 }, 201));
    fetchMock.mockResolvedValueOnce(json({ ...baseSky, mine: ['Lyr', first.id], availableStars: 8 - first.stars.length }));
    fetchMock.mockResolvedValue(json({}));
    await user.click(screen.getByRole('button', { name: 'Claim this constellation' }));
    const claimCall = fetchMock.mock.calls.find(([url]) => url === '/api/sky/claim');
    expect(JSON.parse(claimCall![1].body)).toEqual({ constellation: first.id });
    expect(await screen.findByText(new RegExp(`${first.name} is yours`))).toBeInTheDocument();
  });

  it('senza stelle sufficienti mostra la prossima meta, senza pulsante', async () => {
    fetchMock.mockResolvedValueOnce(json({ ...baseSky, availableStars: 1 }));
    renderSky();
    expect(await screen.findByText(/more stars to complete/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Claim this constellation' })).toBeNull();
  });
});
