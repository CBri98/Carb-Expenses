# Fase 10.6 — Correzioni visuali e uniformità dei componenti

## Obiettivo

Implementare un ulteriore passaggio correttivo dell'interfaccia dopo la Fase 10.5.

Questa fase non introduce nuove funzionalità di business. Deve correggere difetti
visivi, incoerenze tra pagine e regressioni introdotte durante la rifinitura
precedente.

La Fase 10.6 deve intervenire almeno su:

- card riepilogative della Dashboard;
- grafici e alternative testuali della Dashboard;
- tabella e form delle Spese;
- indicatori delle spese generate da ricorrenze;
- ricerca e filtri di Spese, Spese ricorrenti, Categorie ed Etichette;
- counter card di Spese ricorrenti e Notifiche;
- azione globale della pagina Notifiche;
- valori selezionati nei componenti `ng-select` multipli;
- formato delle date nelle tabelle.

Le indicazioni di questo documento prevalgono sulle regole visive incompatibili
presenti nella Fase 10.5.

Implementare direttamente le modifiche nel repository. Non limitarsi a
descrivere la soluzione.

---

## Operazioni preliminari

Prima di modificare il codice:

1. leggere integralmente `AGENTS.md`;
2. leggere integralmente:
   - `docs/PHASE_10_5_UI_REFINEMENT.md`;
   - `docs/PHASE_10_5_COMPLETION_2026-07-27.md`;
   - questo documento;
3. verificare lo stato reale del repository con:

   ```bash
   git status
   git diff
   ```

4. individuare i componenti condivisi già disponibili;
5. controllare gli stili globali di:
   - card;
   - pannelli filtro;
   - pulsanti;
   - `ng-select`;
   - badge e indicatori colorati;
6. verificare il comportamento in tema chiaro e scuro;
7. non installare nuove dipendenze per modifiche risolvibili con Angular,
   Bootstrap, Chart.js e gli stili già presenti.

---

## Vincoli generali

- Non modificare la semantica finanziaria.
- Non duplicare form, pipe o componenti condivisi.
- Non introdurre chiamate HTTP nei componenti.
- Non usare `any`.
- Non disabilitare TypeScript strict.
- Non sostituire `ng-select` con select native.
- Non affidare lo stato di un controllo soltanto al colore.
- Non rimuovere alternative testuali o supporto da tastiera dai grafici.
- Non rendere distruttive azioni che oggi sono reversibili.
- Non modificare backend o schema Prisma salvo quanto strettamente necessario
  per il nuovo valore predefinito dell'andamento Dashboard.
- Non sovrascrivere una preferenza a 6 mesi scelta esplicitamente da un utente.
- Non ignorare errori di test, lint, typecheck o build.

---

# 1. Card riepilogative della Dashboard

## 1.1 Posizione del badge

L'introduzione del badge nella `StatCardComponent` non deve creare una terza
riga nel normale flusso verticale della card.

Il badge deve:

- essere posizionato nell'angolo superiore destro della card;
- rimanere visivamente associato alla card senza aumentarne l'altezza;
- non spostare titolo, valore, dettaglio o dettaglio secondario;
- mantenere icona, colore e testo;
- troncare il testo con ellissi quando lo spazio è insufficiente;
- mostrare il testo completo tramite `title` o tooltip accessibile;
- non sovrapporsi all'icona principale o al contenuto;
- adattarsi correttamente su mobile.

La card deve usare un contenitore `position: relative` e riservare soltanto lo
spazio orizzontale necessario quando il badge è presente. Non usare margini
verticali o elementi vuoti per compensare il posizionamento.

### Criteri di accettazione

- Le sei card della Dashboard mantengono la stessa altezza a parità di riga.
- La card “Prossima spesa” non allunga le altre card.
- Il badge categoria è in alto a destra.
- Nessun contenuto si sovrappone a 320, 390, 768 e 1440 px.

---

# 2. Dashboard — Andamento giornaliero

La sezione espandibile “Mostra tutti i dati” deve essere riprogettata perché
l'elenco attuale è visivamente poco leggibile.

## 2.1 Intestazione del disclosure

Il controllo di apertura deve:

- avere un'area cliccabile chiaramente riconoscibile;
- usare una superficie coerente con la card;
- mostrare un'icona che cambia tra stato chiuso e aperto;
- mantenere `summary` o un equivalente semanticamente accessibile;
- avere focus visibile;
- non sembrare un semplice testo sottolineato.

## 2.2 Contenuto espanso

I dati devono essere presentati come elenco strutturato o tabella compatta con
colonne chiaramente distinguibili:

- Data;
- Totale;
- Numero di spese.

Requisiti:

- usare il nome completo del mese;
- allineare a destra importi e quantità;
- separare visivamente le righe;
- mantenere ogni riga navigabile verso le Spese filtrate per quel giorno;
- usare un'altezza massima con scroll interno soltanto quando l'elenco è lungo;
- evitare una lista di frasi concatenate;
- su mobile trasformare le righe in un layout leggibile senza overflow
  orizzontale;
- mantenere stato hover e focus;
- usare plurale e singolare corretti per “spesa/spese”.

Esempio visivo dei contenuti:

```text
14 luglio 2026                   82,40 €        3 spese
15 luglio 2026                   19,90 €        1 spesa
```

La stessa presentazione condivisa deve essere riutilizzabile per “Mostra tutti
i dati” della card “Andamento degli ultimi mesi”, evitando due implementazioni
visivamente diverse.

---

# 3. Dashboard — Spese per categoria

## 3.1 Totale nel sottotitolo

Il totale presente nel sottotitolo della card deve essere evidenziato in
grassetto.

Il valore monetario deve essere separabile dal resto della frase, senza
costruire HTML tramite stringhe e senza perdere il formato euro italiano.

Esempio:

```text
Totale del periodo: 1.250,50 €
                    ^^^^^^^^^^^ grassetto
```

## 3.2 Legenda Chart.js

La legenda generata sotto il grafico da Chart.js deve essere nascosta soltanto
per il grafico “Spese per categoria”.

Non rimuovere globalmente la legenda dagli altri grafici. Se necessario,
aggiungere al componente grafico un input esplicito come `showLegend`.

## 3.3 Visibilità delle categorie dalla lista

La lista personalizzata sotto il grafico diventa il controllo autorevole per
mostrare o nascondere le singole categorie dal doughnut.

Ogni riga deve contenere:

- indicatore del colore;
- nome;
- totale;
- percentuale;
- un piccolo pulsante icona per mostrare o nascondere la categoria.

Il pulsante deve:

- usare `bi-eye` quando la categoria è visibile;
- usare `bi-eye-slash` quando la categoria è nascosta;
- avere `aria-label` descrittiva;
- esporre lo stato con `aria-pressed`;
- avere tooltip o `title`;
- non aprire la pagina Spese quando viene premuto;
- essere utilizzabile da tastiera;
- avere un target cliccabile di almeno 32 × 32 px.

La parte informativa della riga deve continuare a permettere l'apertura delle
Spese filtrate per categoria.

Quando una categoria viene nascosta:

- il segmento scompare dal grafico senza modificare i dati ricevuti dal backend;
- totale e percentuale originali restano leggibili nella lista;
- la riga assume anche uno stato non cromatico, per esempio icona e testo
  “Nascosta” accessibile;
- il pulsante consente sempre di ripristinarla.

Se tutte le categorie vengono nascoste, mostrare nel riquadro del grafico un
messaggio neutro e un comando “Mostra tutte”. Ripristinare la visibilità
iniziale quando cambia il periodo principale della Dashboard.

---

# 4. Dashboard — Andamento degli ultimi mesi

Il periodo predefinito deve essere 12 mesi, non 6.

Aggiornare in modo coerente:

- fallback frontend dello store delle impostazioni;
- valore iniziale del form Impostazioni;
- default backend delle preferenze;
- default Prisma, creando una migrazione se lo schema cambia;
- seed development;
- reset delle preferenze;
- test e documentazione Swagger eventualmente interessata.

Una scelta a 6 mesi salvata esplicitamente dall'utente deve continuare a essere
rispettata. Il nuovo default a 12 mesi si applica a:

- nuovi utenti;
- preferenze non ancora presenti;
- ripristino delle preferenze;
- utente e dati generati dal seed development.

L'endpoint Dashboard deve continuare ad accettare entrambi i valori.

---

# 5. Nome completo del mese nelle tabelle

Tutte le date utente mostrate in tabelle o elenchi tabellari devono usare il
nome completo del mese.

Formato richiesto:

```text
14 luglio 2026
```

Non usare nelle tabelle:

```text
14/07/2026
14 lug 2026
```

Applicare la regola almeno a:

- tabella Spese;
- tabella “Ultimi inserimenti” della Dashboard;
- tabella del report mensile;
- tabelle del confronto tra mesi;
- tabelle Categorie ed Etichette quando mostrano date;
- tabella Spese ricorrenti;
- tabella Notifiche;
- altri componenti condivisi che rappresentano dati in forma tabellare.

I timestamp tecnici possono mantenere anche l'orario, ma il mese deve essere
completo. Centralizzare la formattazione in pipe o utility esistenti; non
duplicare `Intl.DateTimeFormat` nei componenti.

Questa regola sostituisce il formato compatto indicato dalla Fase 10.5 per il
solo contesto tabellare.

---

# 6. Form Nuova spesa dalla pagina Spese

Il form raggiunto dalla pagina Spese tramite `/expenses/new` deve usare lo
stesso linguaggio visuale del form “Nuova spesa ricorrente”.

## 6.1 Sezioni come card separate

Suddividere il form in card distinte almeno per:

1. Dati principali;
2. Classificazione;
3. Dettagli;
4. Promemoria e pianificazione, quando presenti.

Ogni sezione deve avere:

- superficie propria;
- bordo e raggio coerenti con `.form-section` delle ricorrenze;
- titolo con icona;
- spaziatura interna uniforme;
- distanza chiara dalla sezione successiva;
- errori visualizzati vicino al campo interessato.

Non racchiudere le card delle sezioni dentro un'altra card visivamente
equivalente.

## 6.2 Riutilizzo del form

Non duplicare logica, validazioni o chiamate.

Se lo stesso `ExpenseFormComponent` viene usato anche nella modale rapida,
prevedere una modalità di presentazione esplicita:

```text
page
compact
```

- `page`: sezioni mostrate come card separate;
- `compact`: disposizione adatta alla modale, senza card annidate pesanti.

La modifica deve valere anche per la pagina di modifica della spesa, mantenendo
coerenza con la creazione.

---

# 7. Indicatore “Spesa ricorrente”

Non usare più un badge pieno o pill per indicare che una spesa è stata generata
da una ricorrenza.

Sostituire `RecurrenceExpenseIndicatorComponent` con un indicatore testuale che
mantenga:

- icona della ricorrenza;
- testo “Spesa ricorrente” o nome della regola, secondo il contesto attuale;
- colore semantico già usato dall'indicatore;
- link alla ricorrenza quando oggi presente;
- focus visibile e nome accessibile.

L'indicatore deve essere:

- senza sfondo pieno;
- senza bordo da badge;
- senza forma pill;
- compatto e allineabile dentro una cella;
- distinguibile anche senza affidarsi soltanto al colore grazie all'icona e al
  testo.

Applicare il cambiamento ovunque l'indicatore compare, almeno:

- tabella Spese;
- card Spesa mobile;
- “Ultimi inserimenti” della Dashboard;
- “Prossime spese” della Dashboard;
- dettaglio Spesa;
- eventuali elenchi del Calendario e dei Report.

Non modificare i badge di stato della regola ricorrente, come Attiva, In pausa,
Completata o Annullata: la richiesta riguarda l'indicatore associato a una
singola spesa generata.

---

# 8. Pagina Spese — Ricerca

La sezione “Cerca nelle spese” deve essere contenuta in una card, come nelle
altre pagine gestionali.

La card deve:

- usare superficie, bordo, ombra e spaziatura condivisi con le ricerche di
  Categorie, Etichette, Notifiche e Spese ricorrenti;
- avere larghezza coerente con il contenuto;
- mantenere label, icona ricerca e pulsante di cancellazione;
- non modificare debounce, query parameter o comportamento del filtro;
- essere separata dal pannello “Filtri e ordinamento”.

Evitare di aggiungere una card esterna attorno all'intero
`ExpenseFiltersComponent`: la card deve riguardare soltanto la ricerca.

---

# 9. Pannelli filtro senza card annidate

Nelle sezioni espanse dei filtri delle pagine:

- Spese ricorrenti;
- Categorie;
- Etichette;

rimuovere l'effetto visivo “card dentro la card”.

## 9.1 Struttura

Usare lo stesso standard della pagina Spese:

- il `FilterPanelComponent` resta l'unico contenitore principale;
- il contenuto espanso usa una griglia semplice;
- i gruppi sono separati da titoli compatti e divisori;
- nessun `filter-group` interno deve avere contemporaneamente sfondo, bordo,
  ombra e raggio da card;
- la superficie del pannello deve rimanere continua.

Riutilizzare o estrarre lo stile `.filter-section-title` della pagina Spese
invece di copiarlo in tre stylesheet diversi.

## 9.2 Semantica dei pulsanti

Uniformare testi, icone, colori e stati ai filtri Spese:

- azione di reset: `Reimposta`;
- icona: `bi-arrow-counterclockwise`;
- classe semantica: `btn-outline-secondary`;
- pulsante disabilitato quando non esistono filtri reimpostabili;
- cancellazione della ricerca: pulsante icona con `bi-x-lg` e label accessibile;
- apertura/chiusura del pannello demandata al pulsante condiviso del
  `FilterPanelComponent`;
- nessun pulsante “Applica”, perché i filtri restano automatici.

Ricerca testuale e filtri strutturati devono mantenere query parameter,
debounce e reset autorevole già implementati.

---

# 10. Counter card di Spese ricorrenti e Notifiche

Le counter card di queste pagine devono mostrare un'icona coerente con il dato.

## 10.1 Spese ricorrenti

Usare il componente condiviso `CounterCardComponent`, senza mantenere markup
Bootstrap duplicato.

Icone suggerite:

- Attive: `bi-play-circle`;
- In pausa: `bi-pause-circle`;
- Occorrenze entro 30 giorni: `bi-calendar2-week`;
- Totale pianificato: `bi-cash-stack`.

## 10.2 Notifiche

Usare lo stesso componente condiviso.

Icone suggerite:

- Risultati: `bi-bell`;
- Non lette: `bi-envelope-exclamation`.

Le icone devono avere:

- contenitore e dimensioni uguali alle counter card di Spese e Categorie;
- contrasto corretto in light e dark mode;
- `aria-hidden="true"` quando il testo adiacente comunica già il significato.

Non rendere automaticamente interattive le card se non esiste un filtro
equivalente. Se una card viene resa interattiva, deve applicare davvero il
filtro corrispondente e supportare tastiera e focus.

---

# 11. Pagina Notifiche — “Segna tutte come lette”

Correggere il pulsante “Segna tutte come lette”, che non deve usare i colori
Bootstrap predefiniti non tematizzati.

Il pulsante deve:

- usare la semantica dell'azione primaria o secondaria definita dal design
  system applicativo;
- usare esclusivamente token colore del tema;
- mantenere l'icona `bi-check2-all`;
- avere stati default, hover, active, focus e disabled leggibili;
- funzionare correttamente con qualsiasi colore accent scelto dall'utente;
- essere verificato in light e dark mode;
- mantenere l'attuale disabilitazione quando non ci sono notifiche non lette o
  è in corso un'operazione.

Non introdurre un colore locale hard-coded nel componente.

---

# 12. Valori selezionati negli `ng-select` multipli

Correggere globalmente la resa degli elementi selezionati nei componenti
`ng-select` con `[multiple]="true"`.

Pagine interessate almeno:

- form Spesa;
- filtri Spese;
- Calendario;
- report mensile;
- form Spesa ricorrente;
- ogni altro multiselect già presente.

## 12.1 Padding

Ogni elemento selezionato deve avere:

- padding orizzontale visibile e simmetrico sul contenuto;
- spazio sufficiente tra icona, testo e pulsante di rimozione;
- altezza coerente con gli altri badge applicativi;
- distanza uniforme dagli elementi adiacenti;
- testo troncato con ellissi senza comprimere la crocetta.

Il padding non deve dipendere dalla presenza dell'icona.

## 12.2 Colori coerenti

Il valore selezionato dentro l'input deve mantenere la stessa identità cromatica
dell'elemento mostrato nel menu e nelle altre parti dell'app.

In particolare:

- categoria: usare il colore della categoria;
- etichetta: usare il colore dell'etichetta;
- stato: usare il relativo colore semantico;
- elementi senza colore proprio: usare i token neutri o primary del tema.

Sfondo, bordo, testo e icona devono derivare da variabili CSS o da un contrasto
calcolato in modo sicuro. Non usare stringhe di classi arbitrarie generate a
runtime.

Lo stesso elemento non deve apparire, per esempio, rosso nel menu e blu
generico una volta selezionato.

## 12.3 Rimozione singola

Ogni valore selezionato deve mostrare una crocetta per la rimozione individuale.

La crocetta deve:

- essere sempre visibile, salvo quando il controllo è disabilitato o readonly;
- rimuovere soltanto l'elemento associato;
- non aprire o chiudere in modo involontario il menu;
- avere `aria-label`, per esempio “Rimuovi categoria Casa”;
- avere focus e stato hover leggibili;
- mantenere un target cliccabile adeguato;
- non essere sostituita dal solo comando globale di cancellazione.

I template personalizzati `ng-label-tmp` non devono eliminare o nascondere il
controllo `ng-value-icon` fornito dalla libreria. Se il comportamento nativo non
permette nome accessibile e colore corretto, creare un template condiviso per
il valore multiplo senza duplicarlo in ogni pagina.

### Criteri di accettazione

- Ogni chip selezionato ha padding orizzontale.
- Icona e colore restano coerenti tra menu e input.
- Ogni chip ha una crocetta individuale.
- La rimozione aggiorna immediatamente form, filtri e query parameter.
- I chip non escono dal contenitore a 320 e 390 px.
- Il comportamento è corretto in light e dark mode.

---

# Componenti condivisi da privilegiare

Prima di creare nuovi componenti, estendere quelli già presenti:

```text
StatCardComponent
CounterCardComponent
DashboardChartComponent
FilterPanelComponent
ExpenseFormComponent
RecurrenceExpenseIndicatorComponent
ItalianExpenseDatePipe
ItalianExtendedDatePipe
```

Estrarre stili condivisi quando la stessa correzione riguarda almeno due
pagine. Evitare selettori globali troppo generici che possano alterare modali,
dropdown o componenti Bootstrap non correlati.

---

# Ordine di implementazione

## Gruppo A — Componenti condivisi

1. badge della `StatCardComponent`;
2. formato date tabellari;
3. indicatore Spesa ricorrente;
4. counter card;
5. stile e template dei valori multipli `ng-select`;
6. titoli sezione e semantica dei filtri.

## Gruppo B — Dashboard

1. dettaglio “Mostra tutti i dati”;
2. totale categoria in grassetto;
3. legenda doughnut nascosta;
4. visibilità categorie dalla lista;
5. default andamento a 12 mesi.

## Gruppo C — Spese

1. ricerca dentro card;
2. form pagina diviso in card;
3. verifica indicatore ricorrenza in tabella, card e dettaglio.

## Gruppo D — Ricorrenze, cataloghi e notifiche

1. filtri senza card annidate;
2. pulsanti uniformi;
3. counter card con icone;
4. pulsante “Segna tutte come lette” tematizzato.

## Gruppo E — Verifica

1. test unitari;
2. lint;
3. typecheck;
4. build;
5. Docker Compose;
6. E2E browser reale;
7. audit responsive, light mode, dark mode e accent personalizzato.

---

# Test richiesti

## Frontend

Scrivere o aggiornare test almeno per:

- badge StatCard fuori dal normale flusso verticale;
- card Dashboard con altezza coerente;
- disclosure dati giornalieri leggibile e navigabile;
- totale categoria evidenziato;
- legenda Chart.js disattivata soltanto nel doughnut categorie;
- nascondi/mostra categoria senza navigazione involontaria;
- ripristino categorie al cambio periodo;
- default Dashboard di 12 mesi;
- rispetto di una preferenza esplicita a 6 mesi;
- date tabellari con mese completo;
- modalità `page` e `compact` del form Spesa;
- indicatore ricorrenza privo di classi badge;
- ricerca Spese racchiusa nella propria card;
- filtri Ricorrenze, Categorie ed Etichette senza card interna;
- semantica e disabilitazione del pulsante Reimposta;
- counter card Ricorrenze e Notifiche con icone;
- pulsante “Segna tutte come lette” tematizzato;
- padding, colore e rimozione individuale dei valori multiselect.

## Backend

Aggiornare i test soltanto se cambia il default autorevole delle impostazioni:

- nuovo utente con `dashboardTrendMonths = 12`;
- reset preferenze con `dashboardTrendMonths = 12`;
- accettazione dei valori 6 e 12;
- nessuna modifica alle altre preferenze.

## E2E

Verificare nel browser reale almeno:

1. Dashboard con sei card allineate e badge in alto a destra;
2. apertura e lettura di “Mostra tutti i dati”;
3. categoria nascosta e ripristinata dal piccolo pulsante della lista;
4. grafico storico iniziale a 12 mesi per un utente con preferenze predefinite;
5. tabella Spese con nome del mese completo;
6. form Nuova spesa a sezioni-card;
7. indicatore Spesa ricorrente senza pill;
8. ricerca Spese dentro card;
9. filtri espansi senza card annidate;
10. icone nelle counter card;
11. pulsante Notifiche coerente con accent e dark mode;
12. rimozione individuale di categoria, etichetta e stato da un multiselect;
13. assenza di overflow a 320, 390, 768 e 1440 px.

---

# Verifiche finali obbligatorie

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
docker compose ps
```

Verificare inoltre:

- frontend HTTP 200;
- backend health HTTP 200;
- tema chiaro;
- tema scuro;
- almeno un colore accent diverso dal predefinito;
- navigazione completa da tastiera;
- focus visibile;
- nessuna regressione su creazione e modifica Spesa;
- nessuna regressione su filtri, query parameter e paginazione;
- nessuna regressione sulla gestione delle ricorrenze;
- nessun overflow orizzontale ai breakpoint richiesti.

---

# Criteri di completamento

La Fase 10.6 è completa quando:

- il badge della StatCard non altera l'altezza della riga;
- i dati espansi della Dashboard sono leggibili;
- la legenda del doughnut categorie è nascosta;
- le categorie possono essere nascoste e ripristinate dalla lista;
- il grafico storico usa 12 mesi come nuovo default;
- le tabelle mostrano il nome completo del mese;
- il form Spesa su pagina usa card separate come il form Ricorrenza;
- “Spesa ricorrente” è un indicatore testuale con icona, non un badge;
- la ricerca Spese è dentro una card;
- i filtri di Ricorrenze, Categorie ed Etichette non contengono card annidate;
- pulsanti e reset dei filtri seguono la stessa semantica della pagina Spese;
- counter card Ricorrenze e Notifiche mostrano icone;
- “Segna tutte come lette” usa i colori del tema;
- ogni valore selezionato in un multiselect ha padding, colore coerente e
  rimozione individuale;
- test, lint, typecheck, build ed E2E risultano superati;
- la documentazione di completamento viene aggiornata con esito e verifiche.
