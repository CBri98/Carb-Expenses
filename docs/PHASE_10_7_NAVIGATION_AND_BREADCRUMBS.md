# Fase 10.7 — Navigazione e breadcrumb coerenti

## Obiettivo

Correggere la gerarchia della navigazione laterale e rendere i breadcrumb
coerenti, accessibili e realmente navigabili.

La fase riguarda esclusivamente la struttura informativa del frontend. Non
modifica route pubbliche, API, dati finanziari o logica di business.

## 1. Navigazione laterale

La sidebar deve mantenere questo ordine:

1. Panoramica;
2. Gestione;
3. Analisi;
4. Area personale.

### Panoramica

- Dashboard.

### Gestione

La sezione deve contenere esclusivamente:

- Spese;
- Spese ricorrenti;
- Categorie;
- Etichette.

Notifiche e Impostazioni non devono comparire in questa sezione.

### Analisi

- Calendario;
- Report mensile;
- Confronto mensile.

Impostazioni non deve comparire in questa sezione.

### Area personale

Deve essere l'ultima sezione della sidebar e contenere:

- Notifiche, mantenendo il contatore delle non lette;
- Impostazioni.

La voce Impostazioni deve risultare attiva soltanto nelle route delle
preferenze personali, senza attivarsi su Categorie o Etichette.

## 2. Breadcrumb delle pagine Gestione

Le pagine principali devono mostrare:

```text
Gestione > Spese
Gestione > Spese ricorrenti
Gestione > Categorie
Gestione > Etichette
```

Il primo elemento “Gestione” deve essere un link funzionante verso la pagina
principale della sezione, `/expenses`.

Le pagine di creazione, modifica e dettaglio devono mantenere tutta la
gerarchia navigabile:

```text
Gestione > Spese > Nuova|Modifica|Dettaglio
Gestione > Spese ricorrenti > Nuova|Modifica|Dettaglio
```

Gli elementi intermedi devono essere link; soltanto l'ultimo elemento deve
avere `aria-current="page"`.

## 3. Breadcrumb dell'Area personale

Le pagine devono mostrare:

```text
Area personale > Notifiche
Area personale > Impostazioni
```

“Area personale” deve essere un link funzionante verso `/notifications`.

## 4. Coerenza globale

Estrarre un componente standalone condiviso per evitare markup breadcrumb
duplicato. Il componente deve:

- ricevere una lista ordinata di elementi;
- supportare un link Angular Router per gli elementi intermedi;
- rendere l'ultimo elemento non cliccabile e con `aria-current="page"`;
- usare la struttura Bootstrap `.breadcrumb` già adottata;
- avere un nome accessibile in italiano;
- preservare query string e comportamento del router quando il link lo
  richiede;
- non generare link vuoti o ancore con `href="#"`;
- essere utilizzato anche da Dashboard, Calendario e pagine Analisi, così da
  mantenere un'unica implementazione.

Per le pagine Analisi usare:

```text
Analisi > Calendario
Analisi > Report mensile
Analisi > Confronto mensile
```

Il link “Analisi” porta a `/calendar`.

Dashboard resta l'unico elemento del proprio breadcrumb.

## 5. Accessibilità e responsive

- I link devono essere raggiungibili da tastiera.
- Il focus deve usare lo stile globale già presente.
- Il breadcrumb deve poter andare a capo senza overflow orizzontale.
- Il testo deve restare leggibile in tema chiaro e scuro.
- La sidebar mobile deve mantenere lo stesso ordine della sidebar desktop.
- Il badge Notifiche non deve alterare il nome accessibile del link.

## 6. Test richiesti

### Unit test

- rendering degli elementi nell'ordine ricevuto;
- link presenti soltanto sugli elementi intermedi configurati;
- ultimo elemento con `aria-current="page"`;
- nessun link fittizio sull'elemento corrente;
- Impostazioni non attiva sulle route Categorie ed Etichette.

### E2E

- la sezione Gestione contiene esattamente le quattro voci richieste;
- Area personale è l'ultima sezione e contiene Notifiche e Impostazioni;
- il breadcrumb Categorie mostra `Gestione > Categorie`;
- il link Gestione porta a `/expenses`;
- il breadcrumb Notifiche mostra `Area personale > Notifiche`;
- il link Area personale porta a `/notifications`;
- nessun overflow ai viewport già coperti dalla Fase 10.6.

## 7. Verifiche finali

Eseguire:

```bash
git diff --check
npm run lint
npm run typecheck
npm test --workspace apps/frontend
npm run build --workspace apps/frontend
npm run test:e2e:reload
```

La fase è completa quando sidebar e breadcrumb riflettono la stessa gerarchia,
i link intermedi sono funzionanti e tutte le verifiche risultano superate.
