# Fase 10.9 — Transizioni tema, gerarchia pagine e tabelle

> Implementata e verificata il 28 luglio 2026. Il resoconto finale è in
> `PHASE_10_9_COMPLETION_2026-07-28.md`.

## Obiettivo

Completare l’ultima rifinitura visuale precedente alle fasi finali, eliminando
i cambi tema bruschi e rendendo coerenti gerarchia, hover e colori tra tutte le
sezioni dell’applicazione.

## Token e cambio tema

- collegare `--bs-link-color-rgb` al colore accent attivo tramite
  `--primary-rgb`;
- applicare transizioni brevi e uniformi a colore, background, bordo e ombra
  delle superfici principali;
- includere body, card, tabelle, form, modali, dropdown, sidebar e topbar;
- mantenere transizioni specifiche per gli hover senza animare proprietà di
  layout costose;
- rispettare `prefers-reduced-motion`.

## Gerarchia dei sovratitoli

Il sovratitolo sopra ogni titolo pagina deve corrispondere esattamente alla
sezione che contiene la pagina nella sidebar:

- Dashboard: `Panoramica`;
- Spese, Spese ricorrenti, Categorie, Etichette e relativi form/dettagli:
  `Gestione`;
- Calendario, Report mensile e Confronto mensile: `Analisi`;
- Notifiche e Impostazioni: `Area personale`.

`PageHeaderComponent` non deve più introdurre implicitamente la dicitura
“Impostazioni”: il valore deve essere dichiarato dalla pagina.

## Sidebar e hover

- portare il margine verticale delle voci sidebar a `0.25rem`;
- aggiungere transizioni a hover, stato attivo, icone e controllo di collasso;
- preservare focus visibile e target cliccabile.

## Dashboard — Prossime spese

Sostituire il giallo del testo di scadenza/data con il colore accent primario,
più coerente con la card e leggibile in light/dark mode.

## Spese ricorrenti

- applicare alla tabella desktop lo stesso comportamento hover della tabella
  Spese;
- animare il passaggio di background e bordo sulle righe;
- applicare un hover equivalente alle card mobile;
- mantenere accessibilità da tastiera e focus visibile.

## Verifiche

- test unitari per il contratto obbligatorio del sovratitolo;
- test browser per token link RGB, transizioni tema, margine sidebar,
  sovratitoli e hover Ricorrenze;
- lint, typecheck, suite frontend/backend, build e Docker Compose;
- assenza di overflow a 320, 390, 768 e 1440 px.
