# Fase 10.8 — Counter globali, icone e tema coordinato

> Implementata e verificata il 28 luglio 2026. Il resoconto finale è in
> `PHASE_10_8_COMPLETION_2026-07-28.md`.

## Obiettivo

Correggere i riepiloghi delle pagine gestionali, il salvataggio del catalogo
icone e alcune incoerenze visuali emerse dopo la Fase 10.7.

La fase interessa:

- Spese;
- Spese ricorrenti;
- Categorie;
- Etichette;
- Impostazioni > Icone;
- token colore del tema;
- sidebar;
- card riepilogative della Dashboard.

## 1. Counter card globali

Le counter card di Spese, Spese ricorrenti, Categorie ed Etichette devono avere
come valore principale il dato globale dell'utente, indipendente da ricerca,
filtri, ordinamento e pagina corrente.

Quando la lista è filtrata:

- il valore globale deve restare visibile come valore principale;
- deve comparire anche un valore secondario “Risultato filtrato”;
- il valore filtrato deve essere calcolato autorevolmente dal backend, non dalla
  sola pagina caricata nel browser;
- il valore secondario non deve comparire quando non esistono filtri effettivi;
- paginazione e ordinamento non devono essere considerati filtri.

Il componente `CounterCardComponent` deve supportare in modo condiviso:

- etichetta;
- valore globale;
- indicazione esplicita “Totale globale”;
- valore filtrato opzionale;
- interazione accessibile da mouse e tastiera.

## 2. Counter card cliccabili

### Spese

Mantenere le interazioni esistenti:

- Totale risultati: rimuove il filtro stato;
- Completate: filtra `COMPLETED`;
- Pianificate: filtra `PLANNED`;
- Annullate: filtra `CANCELLED`.

### Categorie

Mantenere le interazioni esistenti:

- Totali: rimuove tipo e stato;
- Attive;
- Disattivate;
- Personalizzate.

### Spese ricorrenti

Rendere interattive tutte le card:

- Attive: filtra le regole attive;
- In pausa: filtra le regole in pausa;
- Occorrenze entro 30 giorni: apre le Spese pianificate generate da ricorrenze
  nell'intervallo dei prossimi 30 giorni;
- Totale pianificato: apre lo stesso insieme autorevole di occorrenze.

Il riepilogo Ricorrenze deve accettare i filtri della lista per calcolare il
valore secondario senza caricare tutte le regole nel frontend.

### Etichette

Rendere interattive tutte le card:

- Totali: rimuove il filtro di relazione/utilizzo;
- Associate a categoria;
- Senza categoria;
- Non utilizzate.

Introdurre un filtro autorevole e serializzabile nei query parameter per queste
tre condizioni. La selezione tramite counter card deve essere visibile nel
pannello filtri e reimpostabile con il comando condiviso.

## 3. Salvataggio icone

Il catalogo selezionabile dal frontend e la whitelist del DTO backend devono
essere coerenti.

Requisiti:

- tutte le chiavi presenti in `ICON_CATALOG` devono essere accettate da
  `PATCH /api/v1/settings/icons`;
- il comando “Tutte” deve restare entro il limite massimo del DTO;
- default frontend e backend devono usare soltanto chiavi presenti nel
  catalogo condiviso dal contratto;
- valori arbitrari, classi CSS composte e markup devono continuare a essere
  rifiutati;
- aggiungere un test con icone precedentemente rifiutate, tra cui
  `bi-cart-check`, `bi-trophy`, `bi-feather` e `bi-shield-check`.

## 4. Colore accent coordinato

Il cambio di colore accent deve modificare in modo lieve e coerente anche:

- `--sidebar-bg`;
- `--topbar-translucent`;
- `--surface-soft`.

I colori devono essere derivati da `--primary` tramite `color-mix`, con una
percentuale contenuta. Devono restare distinti da `--surface`, mantenere il
contrasto del testo e funzionare sia in light mode sia in dark mode.

Non introdurre valori hard-coded separati per ogni combinazione tema/accent.

## 5. Sidebar

Inserire un margine verticale minimo e uniforme tra le voci della sidebar.

Il margine non deve:

- alterare la gerarchia delle sezioni;
- ridurre il target cliccabile;
- creare overflow verticale anomalo;
- separare eccessivamente icona, testo e badge Notifiche.

## 6. Card Dashboard

### Prossima spesa

Il body testuale deve sfruttare tutto lo spazio orizzontale disponibile dopo
l'icona. Il testo non deve andare a capo all'interno delle parole quando esiste
ancora spazio utile.

Mantenere il badge categoria in alto a destra senza farlo rientrare nel flusso
verticale.

### Valori numerici

I valori numerici informativi nelle card Dashboard devono avere enfasi
semantica in grassetto, coerente con il totale già evidenziato nella card
“Spese per categoria”.

Applicare l'enfasi almeno a:

- conteggio spese completate;
- variazione percentuale;
- totale e percentuale della categoria principale;
- importo e data della prossima spesa;
- massimo del periodo nello storico;
- valori delle sintesi giornaliere e mensili.

Non costruire HTML tramite stringhe.

## 7. Test e verifiche

Aggiornare o aggiungere test per:

- valore globale sempre visibile;
- valore filtrato presente soltanto con filtri effettivi;
- interazioni delle counter card Ricorrenze ed Etichette;
- query del riepilogo Ricorrenze;
- filtro relazione/utilizzo Etichette;
- accettazione dell'intero catalogo icone e rifiuto dei valori arbitrari;
- variazione dei tre token al cambio accent in light e dark mode;
- margine sidebar;
- body Prossima spesa e valori numerici in grassetto;
- assenza di overflow a 320, 390, 768 e 1440 px.

Eseguire:

```bash
git diff --check
npm run lint
npm run typecheck
npm test --workspace apps/frontend
npm test --workspace apps/backend
npm run build --workspace apps/frontend
npm run build --workspace apps/backend
docker compose up -d --build
npm run test:e2e:reload
```

La fase è completa quando i riepiloghi distinguono chiaramente globale e
filtrato, tutte le counter richieste sono operative, il catalogo icone viene
salvato e il tema resta leggibile in ogni accento supportato.
