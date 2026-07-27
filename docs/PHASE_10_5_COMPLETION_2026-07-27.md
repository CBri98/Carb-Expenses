# Chiusura Fase 10.5 — 27 luglio 2026

La Fase 10.5 è completata. Questo documento chiude l’handoff del 18 luglio 2026; la specifica autorevole resta `PHASE_10_5_UI_REFINEMENT.md`.

## Audit correttivo del 27 luglio

Una seconda verifica puntuale rispetto alla specifica completa ha evidenziato che la prima chiusura copriva l'handoff residuo, ma non tutte le rifiniture richieste. Prima della chiusura definitiva sono quindi stati completati anche:

- formato date utente italiano leggibile (`14 lug 2026` e `14 luglio 2026`) al posto del formato numerico;
- form Spesa riorganizzato nelle sezioni Dati principali, Classificazione e Dettagli, con gerarchia e azioni uniformi;
- KPI Dashboard con dettaglio separato, badge categoria, importo e data della prossima spesa non concatenati;
- insight sintetici e alternative testuali interattive per i grafici Dashboard e Report;
- ricerca separata, pannello filtri condiviso, `ng-select`, ordinamento a tre stati e filtri persistenti nei query parameter nei report e nei cataloghi;
- grafici del confronto mesi navigabili anche tramite tastiera e tabelle alternative collegate alle Spese filtrate;
- contatori Categorie utilizzabili come filtri, stato di salvataggio del riordino e motivazione accessibile quando il trascinamento è disabilitato;
- controlli Impostazioni uniformati a `ng-select` e azioni principali corredate da icone coerenti;
- copertura E2E specifica per questi requisiti, oltre alla precedente verifica di reload, tema e responsive.

La chiusura riportata nel resto del documento si riferisce a questo stato corretto e verificato, non alla precedente implementazione parziale.

## Tabelle

- `FilterPanelComponent` condiviso per pannelli collassabili, conteggio, riepilogo e reset.
- ricerca separata dai filtri in Spese, Notifiche, Calendario, Ricorrenze, Categorie ed Etichette;
- filtri automatici con debounce e query parameter dove previsti dalle pagine server-side;
- ordinamento a tre stati e icona muted nella tabella Spese e nella tabella Ricorrenze;
- righe Ricorrenze cliccabili con Enter e controlli interni senza propagazione;
- drag and drop CDK, rollback e comandi accessibili sposta su/giù per Categorie ed Etichette.

## Spese

- form diviso in sezioni leggibili e riutilizzato da pagina, modale rapida e calendario;
- etichette filtrate per categoria e rimozione delle selezioni incompatibili;
- filtri multipli, modalità ricorrenze, reset autorevole e paginazione backend;
- riepilogo promemoria in lista senza query per riga;
- dettaglio con azioni nell’header e tab Informazioni/Promemoria.

## Dashboard e report

- KPI, categorie, prossime spese e punti dei grafici navigano alle Spese filtrate;
- selezione mese/anno e descrizioni dinamiche;
- grafici Angular migrati a `ng2-charts`, con riferimenti stabili e alternative testuali;
- prossime spese raggruppate per mese e sezione Scadute;
- report mensile e confronto coerenti con card, formati e interazioni della Dashboard.

## Calendario

- vista annuale custom con tutti i dodici mesi, inclusi quelli vuoti;
- singola richiesta dal 1 gennaio incluso al 1 gennaio successivo escluso;
- apertura mese, creazione spesa e ricerca automatica con debounce;
- rimosso il testo tecnico relativo alla sincronizzazione URL.

## Notifiche

- endpoint e azione idempotente di disarchiviazione `ARCHIVED → READ`;
- dropdown chiuso da click esterno, Escape e navigazione, senza chiusure sui click interni;
- ricerca separata e filtri automatici;
- empty state e spaziatura azioni uniformati.

## Ricorrenze

- ricerca separata, filtri automatici e ordinamento a tre stati;
- tabella desktop e card mobile cliccabili, note con ellissi/title, azione primaria e menu contestuale;
- rimosso il campo Descrizione dal form: il payload e il backend mantengono `description = name` per compatibilità;
- il generatore usa sempre `rule.name` per le nuove spese;
- dettaglio nei tab Informazioni generali, Occorrenze generate e Promemoria;
- test frontend e backend dedicati a form, note, righe, tab e compatibilità del campo legacy.

## Stile globale

- date utente in formato italiano esteso tramite pipe centralizzati;
- 97 Bootstrap Icons valide, uniche, curate e divise in 17 gruppi;
- picker condiviso con ricerca, gruppi, tastiera, selezione multipla, preferenze e icona corrente nascosta;
- `ng-select` uniforme con icone anche nei valori selezionati pertinenti;
- token semantici per accent, superfici selezionate e navigazione attiva;
- outline button con superficie, transizioni brevi, route enter, scrollbar neutra e reduced motion;
- light e dark mode verificati nel browser reale.

## Backend

- filtri multipli Spese, sintesi promemoria, summary e reorder per cataloghi;
- ricerca Notifiche e disarchiviazione;
- intervallo annuale Calendario;
- compatibilità Ricorrenze conservata senza migrazione distruttiva: il campo `description` resta nello schema ma viene sincronizzato al nome;
- otto migrazioni applicate; schema Prisma valido e aggiornato;
- Swagger disponibile e aggiornato a `/api/docs`.

## Verifiche eseguite

- `git diff --check`: superato;
- `prisma format`, `prisma validate`, `prisma generate`: superati;
- migrazioni Docker: database aggiornato, 8/8;
- seed development: superato, categorie e dati demo disponibili;
- backend: 24 file, 147 test superati;
- frontend: 44 file, 114 test superati;
- ESLint: superato con zero warning;
- typecheck backend e frontend: superati;
- build backend e frontend: superate;
- Docker Compose: backend, frontend e MariaDB healthy;
- health API, Swagger e frontend: HTTP 200;
- E2E browser reale: reload autenticato senza login intermedio, collisione cookie legacy, singola voce sidebar, accent light/dark, breakpoint 390/768/1440 senza overflow, filtri Categorie persistenti nell'URL, date Dashboard non numeriche, insight e alternative dei grafici, sezioni form Spesa, report mensile senza select native e confronto con tre grafici interattivi.

## Problemi residui

Non risultano errori funzionali bloccanti per la Fase 10.5. La build frontend segnala due warning di budget non bloccanti: bundle iniziale 869,68 kB rispetto al budget 700 kB e SCSS Calendario 8,38 kB rispetto al budget 8 kB. L’ottimizzazione dei budget resta materiale per la Fase 12 e non è stata anticipata.
