# Chiusura Fase 10.6 — 27 luglio 2026

La Fase 10.6 è completata. La specifica autorevole è `PHASE_10_6_UI_CORRECTIONS.md`.

## Dashboard

- il badge categoria della StatCard “Prossima spesa” è posizionato in alto a destra e non partecipa al flusso verticale;
- le card della stessa riga mantengono altezza uniforme;
- “Mostra tutti i dati” usa un disclosure tematizzato con tabella Data, Totale e Spese, intestazione sticky e scroll interno;
- il totale della categoria principale è evidenziato in grassetto;
- la legenda Chart.js del solo doughnut categorie è nascosta;
- ogni categoria può essere nascosta o ripristinata dal piccolo pulsante nella lista, senza perdere la navigazione alle Spese;
- lo stato nascosto usa icona, testo e `aria-pressed`, non soltanto il colore;
- il periodo storico predefinito è 12 mesi per nuovi utenti, fallback, seed e reset preferenze;
- una preferenza esplicita a 6 mesi resta valida.

## Spese e date

- le date tabellari mostrano il nome completo del mese tramite la pipe condivisa;
- il form Spesa su pagina usa sezioni-card separate, senza card esterna annidata;
- la modale rapida mantiene la presentazione compatta;
- la ricerca “Cerca nelle spese” è contenuta in una card dedicata;
- l'indicatore “Spesa ricorrente” conserva icona, colore e link, ma non usa più badge o pill.

## Filtri, Ricorrenze e Notifiche

- i filtri espansi di Ricorrenze, Categorie ed Etichette non contengono più card interne;
- titoli di sezione e comando “Reimposta” seguono lo standard della pagina Spese;
- le quattro counter card Ricorrenze e le due counter card Notifiche usano il componente condiviso e icone dedicate;
- “Segna tutte come lette” usa il pulsante primary tematizzato, inclusi accent, focus e stato disabled.

## Multiselect

- introdotto `MultiselectValueComponent` condiviso;
- ogni chip ha padding orizzontale, icona e colore dell'entità;
- ogni chip espone una crocetta individuale con nome accessibile “Rimuovi …”;
- la rimozione non propaga il click al dropdown;
- categorie, etichette e stati mantengono la propria identità cromatica dentro l'input;
- applicazione completata su Spese, Calendario, Report mensile e Ricorrenze.

## Backend e database

- default `dashboardTrendMonths` aggiornato da 6 a 12 nelle preferenze backend;
- default dell'endpoint storico aggiornato a 12;
- migrazione `20260727213000_default_dashboard_trend_12` applicata;
- seed development allinea l'utente demo al nuovo default;
- 9/9 migrazioni applicate con successo.

## Verifiche eseguite

- Prisma format, validate e generate: superati;
- backend: 24 file, 147 test superati;
- frontend: 46 file, 118 test superati;
- ESLint: superato con zero warning;
- typecheck backend e frontend: superati;
- build backend e frontend: superate;
- Docker Compose: frontend, backend e MariaDB healthy;
- frontend e backend health: HTTP 200;
- E2E browser reale: superato;
- responsive verificato a 320, 390, 768 e 1440 px senza overflow;
- light mode, dark mode e cambio accent verificati;
- badge StatCard assoluto e card della stessa riga allineate;
- disclosure giornaliero con 8 righe demo e tre colonne leggibili;
- otto categorie controllabili dalla lista;
- default Dashboard rilevato a 12 mesi;
- date Spese con mese completo;
- form Spesa con tre sezioni-card e nessuna card esterna;
- indicatore ricorrenza privo di classi badge;
- chip multiselect con colore, padding e rimozione individuale;
- filtri Ricorrenze aperti senza card annidate e con comando Reimposta;
- counter card e pulsante Notifiche verificati.

## Problemi residui

Non risultano errori funzionali bloccanti per la Fase 10.6. Restano i due warning di budget frontend già noti:

- bundle iniziale 870,33 kB rispetto al budget 700 kB;
- SCSS Calendario 8,38 kB rispetto al budget 8 kB.

La loro ottimizzazione resta nell'ambito della Fase 12.
