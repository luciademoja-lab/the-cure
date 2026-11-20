/** Le aree della Forgia sono salvate in italiano (servono per gli incontri): qui solo le etichette inglesi. */
const AREA_EN: Record<string, string> = {
  scrittura: 'writing',
  musica: 'music',
  'arti visive': 'visual arts',
  'cinema e video': 'film and video',
  giochi: 'games',
  'software e app': 'software and apps',
  'intelligenza artificiale': 'artificial intelligence',
  educazione: 'education',
  benessere: 'wellbeing',
  spiritualità: 'spirituality',
  'natura e agricoltura': 'nature and farming',
  animali: 'animals',
  cibo: 'food',
  'moda e artigianato': 'fashion and crafts',
  'impresa sociale': 'social enterprise',
  'comunità ed eventi': 'community and events',
  'ricerca scientifica': 'scientific research',
  salute: 'health',
  viaggi: 'travel',
  'casa e architettura': 'home and architecture',
  'podcast e media': 'podcasts and media',
  finanza: 'finance',
  'sport e movimento': 'sport and movement',
  altro: 'other',
};

export const areaLabel = (locale: string, area: string) => (locale === 'it' ? area : AREA_EN[area] || area);
