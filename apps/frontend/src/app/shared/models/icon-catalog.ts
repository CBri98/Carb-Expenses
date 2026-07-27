export type IconGroup =
  | 'Generali'
  | 'Casa'
  | 'Alimentazione'
  | 'Trasporti'
  | 'Salute'
  | 'Lavoro'
  | 'Studio'
  | 'Shopping'
  | 'Tecnologia'
  | 'Intrattenimento'
  | 'Sport'
  | 'Viaggi'
  | 'Finanza'
  | 'Animali'
  | 'Servizi'
  | 'Regali'
  | 'Famiglia';

export interface IconCatalogItem {
  key: string;
  label: string;
  group: IconGroup;
}

export const ICON_CATALOG: readonly IconCatalogItem[] = [
  { key: 'bi-tag', label: 'Etichetta', group: 'Generali' },
  { key: 'bi-stars', label: 'Speciale', group: 'Generali' },
  { key: 'bi-bookmark', label: 'Segnalibro', group: 'Generali' },
  { key: 'bi-calendar-check', label: 'Calendario', group: 'Generali' },
  { key: 'bi-arrow-repeat', label: 'Ricorrente', group: 'Generali' },
  { key: 'bi-three-dots', label: 'Altro', group: 'Generali' },

  { key: 'bi-house', label: 'Casa', group: 'Casa' },
  { key: 'bi-house-door', label: 'Abitazione', group: 'Casa' },
  { key: 'bi-building', label: 'Condominio', group: 'Casa' },
  { key: 'bi-lightbulb', label: 'Illuminazione', group: 'Casa' },
  { key: 'bi-lightning', label: 'Energia', group: 'Casa' },
  { key: 'bi-tools', label: 'Manutenzione', group: 'Casa' },
  { key: 'bi-droplet', label: 'Acqua', group: 'Casa' },

  { key: 'bi-basket', label: 'Spesa alimentare', group: 'Alimentazione' },
  { key: 'bi-cart', label: 'Carrello', group: 'Alimentazione' },
  { key: 'bi-cup-hot', label: 'Bar e caffè', group: 'Alimentazione' },
  { key: 'bi-egg-fried', label: 'Ristorante', group: 'Alimentazione' },
  { key: 'bi-cake2', label: 'Dolci', group: 'Alimentazione' },
  { key: 'bi-cup-straw', label: 'Bevande', group: 'Alimentazione' },

  { key: 'bi-car-front', label: 'Auto', group: 'Trasporti' },
  { key: 'bi-bus-front', label: 'Autobus', group: 'Trasporti' },
  { key: 'bi-train-front', label: 'Treno', group: 'Trasporti' },
  { key: 'bi-fuel-pump', label: 'Carburante', group: 'Trasporti' },
  { key: 'bi-bicycle', label: 'Bicicletta', group: 'Trasporti' },
  { key: 'bi-ev-station', label: 'Ricarica elettrica', group: 'Trasporti' },

  { key: 'bi-heart-pulse', label: 'Salute', group: 'Salute' },
  { key: 'bi-capsule', label: 'Farmacia', group: 'Salute' },
  { key: 'bi-hospital', label: 'Ospedale', group: 'Salute' },
  { key: 'bi-bandaid', label: 'Cure', group: 'Salute' },
  { key: 'bi-thermometer-half', label: 'Visita medica', group: 'Salute' },

  { key: 'bi-briefcase', label: 'Lavoro', group: 'Lavoro' },
  { key: 'bi-person-workspace', label: 'Postazione', group: 'Lavoro' },
  { key: 'bi-clipboard-check', label: 'Attività', group: 'Lavoro' },
  { key: 'bi-graph-up-arrow', label: 'Crescita', group: 'Lavoro' },
  { key: 'bi-file-earmark-spreadsheet', label: 'Amministrazione', group: 'Lavoro' },

  { key: 'bi-mortarboard', label: 'Istruzione', group: 'Studio' },
  { key: 'bi-book', label: 'Libri', group: 'Studio' },
  { key: 'bi-journal-text', label: 'Appunti', group: 'Studio' },
  { key: 'bi-pencil', label: 'Cancelleria', group: 'Studio' },
  { key: 'bi-backpack', label: 'Scuola', group: 'Studio' },

  { key: 'bi-bag', label: 'Shopping', group: 'Shopping' },
  { key: 'bi-bag-heart', label: 'Acquisto preferito', group: 'Shopping' },
  { key: 'bi-basket2', label: 'Acquisti', group: 'Shopping' },
  { key: 'bi-cart-check', label: 'Ordine completato', group: 'Shopping' },
  { key: 'bi-shop-window', label: 'Negozio', group: 'Shopping' },

  { key: 'bi-phone', label: 'Telefono', group: 'Tecnologia' },
  { key: 'bi-laptop', label: 'Computer portatile', group: 'Tecnologia' },
  { key: 'bi-pc-display', label: 'Computer', group: 'Tecnologia' },
  { key: 'bi-smartwatch', label: 'Dispositivo', group: 'Tecnologia' },
  { key: 'bi-router', label: 'Internet', group: 'Tecnologia' },
  { key: 'bi-cloud', label: 'Servizio cloud', group: 'Tecnologia' },

  { key: 'bi-controller', label: 'Videogiochi', group: 'Intrattenimento' },
  { key: 'bi-film', label: 'Cinema', group: 'Intrattenimento' },
  { key: 'bi-music-note-beamed', label: 'Musica', group: 'Intrattenimento' },
  { key: 'bi-headphones', label: 'Audio', group: 'Intrattenimento' },
  { key: 'bi-camera', label: 'Fotografia', group: 'Intrattenimento' },
  { key: 'bi-palette', label: 'Arte', group: 'Intrattenimento' },

  { key: 'bi-trophy', label: 'Sport', group: 'Sport' },
  { key: 'bi-person-walking', label: 'Camminata', group: 'Sport' },
  { key: 'bi-person-arms-up', label: 'Allenamento', group: 'Sport' },
  { key: 'bi-stopwatch', label: 'Cronometro', group: 'Sport' },
  { key: 'bi-water', label: 'Nuoto', group: 'Sport' },

  { key: 'bi-airplane', label: 'Volo', group: 'Viaggi' },
  { key: 'bi-luggage', label: 'Bagaglio', group: 'Viaggi' },
  { key: 'bi-map', label: 'Mappa', group: 'Viaggi' },
  { key: 'bi-compass', label: 'Esplorazione', group: 'Viaggi' },
  { key: 'bi-globe-europe-africa', label: 'Estero', group: 'Viaggi' },
  { key: 'bi-passport', label: 'Documenti di viaggio', group: 'Viaggi' },

  { key: 'bi-bank', label: 'Banca', group: 'Finanza' },
  { key: 'bi-piggy-bank', label: 'Risparmio', group: 'Finanza' },
  { key: 'bi-cash-stack', label: 'Contanti', group: 'Finanza' },
  { key: 'bi-credit-card', label: 'Carta', group: 'Finanza' },
  { key: 'bi-wallet2', label: 'Portafoglio', group: 'Finanza' },
  { key: 'bi-receipt', label: 'Ricevuta', group: 'Finanza' },
  { key: 'bi-currency-euro', label: 'Euro', group: 'Finanza' },
  { key: 'bi-calculator', label: 'Contabilità', group: 'Finanza' },

  { key: 'bi-feather', label: 'Animali domestici', group: 'Animali' },
  { key: 'bi-egg', label: 'Alimentazione animali', group: 'Animali' },
  { key: 'bi-flower2', label: 'Benessere animali', group: 'Animali' },
  { key: 'bi-feather2', label: 'Uccelli', group: 'Animali' },
  { key: 'bi-bug', label: 'Piccoli animali', group: 'Animali' },

  { key: 'bi-wrench-adjustable', label: 'Riparazioni', group: 'Servizi' },
  { key: 'bi-shield-check', label: 'Assicurazione', group: 'Servizi' },
  { key: 'bi-key', label: 'Accessi', group: 'Servizi' },
  { key: 'bi-wifi', label: 'Connessione', group: 'Servizi' },
  { key: 'bi-telephone', label: 'Telefonia', group: 'Servizi' },
  { key: 'bi-envelope', label: 'Posta', group: 'Servizi' },

  { key: 'bi-gift', label: 'Regalo', group: 'Regali' },
  { key: 'bi-balloon', label: 'Festa', group: 'Regali' },
  { key: 'bi-flower1', label: 'Fiori', group: 'Regali' },
  { key: 'bi-gem', label: 'Gioiello', group: 'Regali' },
  { key: 'bi-box2-heart', label: 'Pacco regalo', group: 'Regali' },

  { key: 'bi-people', label: 'Famiglia', group: 'Famiglia' },
  { key: 'bi-person-hearts', label: 'Affetti', group: 'Famiglia' },
  { key: 'bi-house-heart', label: 'Casa e famiglia', group: 'Famiglia' },
  { key: 'bi-emoji-smile', label: 'Bambini', group: 'Famiglia' },
  { key: 'bi-heart', label: 'Cuore', group: 'Famiglia' },
] as const;

export const ICON_KEYS = ICON_CATALOG.map((item) => item.key);
export const ICON_GROUPS = [...new Set(ICON_CATALOG.map((item) => item.group))];
export const DEFAULT_CATEGORY_ICONS = [
  'bi-house', 'bi-house-door', 'bi-building', 'bi-receipt', 'bi-basket',
  'bi-cup-hot', 'bi-bus-front', 'bi-fuel-pump', 'bi-car-front', 'bi-heart-pulse',
  'bi-capsule', 'bi-bag', 'bi-controller', 'bi-airplane', 'bi-arrow-repeat',
  'bi-mortarboard', 'bi-gift', 'bi-bank', 'bi-briefcase', 'bi-cart', 'bi-phone',
  'bi-laptop', 'bi-tools', 'bi-lightning', 'bi-piggy-bank', 'bi-stars',
  'bi-trophy', 'bi-feather', 'bi-shield-check', 'bi-people', 'bi-three-dots',
];
export const DEFAULT_LABEL_ICONS = [
  'bi-tag', 'bi-heart', 'bi-briefcase', 'bi-gift', 'bi-house-door', 'bi-airplane',
  'bi-stars', 'bi-receipt', 'bi-cart-check', 'bi-phone', 'bi-laptop', 'bi-tools',
  'bi-lightning', 'bi-piggy-bank', 'bi-trophy', 'bi-feather', 'bi-people', 'bi-three-dots',
];
