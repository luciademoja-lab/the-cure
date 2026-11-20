import { geoGraticule10, geoOrthographic, geoPath, geoStereographic, GeoProjection } from 'd3-geo';
import type { Feature, MultiLineString, MultiPoint } from 'geojson';
import catalog from '../data/constellations.json';

/**
 * Le 88 costellazioni ufficiali. Coordinate reali: ascensione retta (in gradi, -180..180) e declinazione.
 * Figure e coordinate dal progetto d3-celestial di Olaf Frohn (licenza BSD-3, vedi data/LICENSE-d3-celestial.txt).
 */
export interface Constellation {
  id: string;
  name: string;
  it: string;
  stars: [number, number][];
  lines: [number, number][];
  center: [number, number];
}

export const CONSTELLATIONS = catalog as Constellation[];

/** Il premio vale da questa soglia in su. */
export const REWARD_MIN_STARS = 7;

export const displayName = (c: Constellation, locale: string) => (locale === 'it' ? c.it : c.name);

export function constellationLines(c: Constellation): Feature<MultiLineString> {
  return {
    type: 'Feature',
    properties: { id: c.id },
    geometry: { type: 'MultiLineString', coordinates: c.lines.map(([a, b]) => [c.stars[a], c.stars[b]]) },
  };
}

export function constellationStars(c: Constellation, count = c.stars.length): Feature<MultiPoint> {
  return { type: 'Feature', properties: { id: c.id }, geometry: { type: 'MultiPoint', coordinates: c.stars.slice(0, count) } };
}

/**
 * Costellazioni che si possono reclamare adesso: non ancora reclamate da chi guarda e con stelle sufficienti.
 * In ordine alfabetico secondo il nome mostrato.
 */
export function claimable(mine: string[], availableStars: number, locale: string): Constellation[] {
  const owned = new Set(mine);
  return CONSTELLATIONS.filter((c) => !owned.has(c.id) && c.stars.length <= availableStars).sort((a, b) =>
    displayName(a, locale).localeCompare(displayName(b, locale), locale)
  );
}

/** La prossima meta quando non c'è ancora niente da reclamare: la più piccola non ancora reclamata. */
export function nextTarget(mine: string[], locale: string): Constellation | null {
  const owned = new Set(mine);
  const open = CONSTELLATIONS.filter((c) => !owned.has(c.id));
  if (open.length === 0) return null;
  const min = Math.min(...open.map((c) => c.stars.length));
  return open
    .filter((c) => c.stars.length === min)
    .sort((a, b) => displayName(a, locale).localeCompare(displayName(b, locale), locale))[0];
}

/**
 * Il cielo visto dalla Terra: proiezione ortografica rovesciata orizzontalmente,
 * perché guardando in su l'est sta a sinistra.
 */
export function skyProjection(size: number, rotation: [number, number], zoom: number): GeoProjection {
  return geoOrthographic()
    .reflectX(true)
    .rotate([rotation[0], rotation[1], 0])
    .translate([size / 2, size / 2])
    .scale((size / 2) * 0.96 * zoom)
    .clipAngle(90)
    .precision(0.5);
}

/** Rotazione che porta il centro di una costellazione al centro della vista. */
export const rotationTo = (c: Constellation): [number, number] => [-c.center[0], -c.center[1]];

export const graticule = geoGraticule10();

/** Disegno piccolo di una singola costellazione, centrata e adattata al riquadro. */
export function figurePath(c: Constellation, width: number, height: number, pad = 14) {
  const projection = geoStereographic()
    .reflectX(true)
    .rotate([-c.center[0], -c.center[1]])
    .fitExtent(
      [
        [pad, pad],
        [width - pad, height - pad],
      ],
      constellationStars(c)
    );
  return { projection, path: geoPath(projection) };
}
