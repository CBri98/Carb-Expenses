# PHASE_10_5_UI_REFINEMENT.md

## Obiettivo

Implementare la **Fase 10.5 — Rifinitura funzionale e uniformità dell’interfaccia** dell’applicazione descritta in `AGENTS.md`.

Questa fase si colloca tra:

```text
Fase 10 — Impostazioni e personalizzazione
Fase 11 — Gestione centralizzata dei promemoria
Fase 12 — Polish, testing e release
```

L’obiettivo è correggere e uniformare le interfacce già realizzate senza introdurre nuovi macro-moduli.

Al termine della fase l’applicazione deve avere:

* tabelle coerenti;
* ricerca testuale sempre visibile;
* filtri leggibili e automatici;
* ordinamento a tre stati;
* drag and drop per categorie ed etichette;
* form delle spese completamente riorganizzato;
* dettaglio spesa più leggibile;
* dashboard navigabile;
* grafici interattivi;
* report coerenti con la dashboard;
* calendario annuale;
* notifiche e ricorrenze più utilizzabili;
* date visualizzate in formato esteso;
* stili uniformi per `ng-select`, pulsanti, card e scrollbar;
* animazioni leggere e accessibili;
* implementazione Angular dei grafici tramite `ng2-charts`.

Implementare direttamente le modifiche nel repository.

Non limitarsi a descrivere la soluzione.

---

# Operazioni preliminari

Prima di modificare il codice:

1. leggere integralmente `AGENTS.md`;
2. leggere integralmente `docs/PHASE_10_5_UI_REFINEMENT.md`;
3. leggere le parti rilevanti dei documenti delle Fasi 3–10;
4. analizzare lo stato reale del repository;
5. eseguire:

```bash
git status
git diff
```

6. verificare quali funzionalità sono realmente implementate;
7. individuare i componenti condivisi già presenti;
8. individuare gli stili globali già presenti;
9. verificare:

   * Angular;
   * Bootstrap;
   * Bootstrap Icons;
   * `ng-select`;
   * Chart.js;
   * FullCalendar;
   * Angular CDK;
   * eventuale `ng2-charts`;
10. non installare dipendenze senza aver verificato compatibilità e peer dependency;
11. non usare:

```text
--force
--legacy-peer-deps
```

12. non ricominciare da zero;
13. non sostituire componenti funzionanti quando possono essere estesi;
14. non modificare backend, Prisma o API se il cambiamento può essere risolto correttamente nel frontend;
15. implementare le modifiche backend realmente necessarie;
16. mantenere il progetto compilabile dopo ogni gruppo di modifiche.

---

# Ordine obbligatorio di esecuzione

Procedere per gruppi.

## Gruppo A — Infrastruttura UI condivisa

Implementare prima:

* standard tabelle;
* ordinamento a tre stati;
* barra di ricerca;
* pannelli filtri;
* date estese;
* pulsanti;
* `ng-select`;
* card empty state;
* transizioni;
* scrollbar.

## Gruppo B — Spese, categorie ed etichette

Implementare:

* drag and drop;
* counter card;
* form spesa;
* filtri spese;
* tabella spese;
* dettaglio spesa;
* icone categoria ed etichetta.

## Gruppo C — Dashboard e report

Implementare:

* navigazione dalle card;
* interazione con grafici;
* layout riepiloghi;
* prossime spese;
* coerenza con report e confronto mensile;
* migrazione dei componenti grafici a `ng2-charts`.

## Gruppo D — Calendario, notifiche e ricorrenze

Implementare:

* calendario annuale;
* disarchiviazione notifiche;
* filtri coerenti;
* dropdown notifiche;
* tabella ricorrenze;
* form e dettaglio ricorrenza.

## Gruppo E — Verifica completa

Eseguire:

* test;
* lint;
* type checking;
* build;
* verifica responsive;
* verifica light e dark mode;
* verifica dei flussi esistenti.

Non applicare una modifica globale a tutte le pagine senza verificarla almeno su una pagina campione.

---

# Vincoli generali

* Non introdurre nuove macro-funzionalità.
* Non implementare la Fase 11.
* Non implementare la Fase 12.
* Non cambiare stack.
* Non riscrivere l’autenticazione.
* Non modificare la semantica finanziaria.
* Non modificare il comportamento degli scheduler salvo test di regressione.
* Non eliminare dati o campi database in maniera distruttiva.
* Non usare `any`.
* Non disabilitare TypeScript strict.
* Non duplicare componenti condivisi.
* Non effettuare chiamate HTTP direttamente nei componenti.
* Non introdurre NgRx.
* Non affidare informazioni esclusivamente al colore.
* Non ignorare errori di test, lint o build.

---

# Standard globale delle tabelle

Tutte le tabelle applicative devono utilizzare uno standard condiviso.

Pagine interessate almeno:

* spese;
* categorie;
* etichette;
* notifiche;
* promemoria;
* ricorrenze;
* report mensile;
* confronto mensile;
* eventuali liste calendario;
* eventuali tabelle delle impostazioni.

Creare o estendere componenti e direttive condivise, evitando implementazioni duplicate.

Possibili componenti:

```text
DataTableToolbarComponent
DataTableSearchComponent
SortableHeaderComponent
TableEmptyStateComponent
TableRowActionsComponent
TableDensityDirective
```

---

# Barra di ricerca sempre visibile

La ricerca testuale deve essere sempre mostrata sopra la tabella.

Non deve più essere contenuta nel pannello filtri.

Struttura consigliata:

```text
Titolo e counter card

Barra tabella:
[ Ricerca testuale                         ] [ Filtri (3) ] [ Azioni ]

Pannello filtri collassabile

Tabella
```

La barra deve contenere:

* input di ricerca;
* icona ricerca;
* pulsante pulizia quando valorizzata;
* eventuale conteggio risultati;
* pulsante apertura filtri;
* eventuali azioni principali.

La ricerca deve:

* aggiornarsi con debounce;
* essere sincronizzata con i query parameter;
* riportare la pagina a `1`;
* non richiedere il pulsante “Applica”;
* non generare richieste duplicate.

Debounce indicativo:

```text
250–400 ms
```

Non spostare nella barra filtri strutturati come:

* categoria;
* stato;
* data;
* metodo di pagamento.

---

# Pannelli filtri uniformi

Tutte le pagine devono usare un pannello filtri coerente con quello della pagina Spese.

Pagine interessate:

* spese;
* categorie;
* etichette;
* notifiche;
* promemoria;
* ricorrenze;
* report;
* altre pagine con filtri.

Il pannello deve:

* essere collassabile;
* applicare automaticamente i filtri;
* non mostrare il pulsante “Applica filtri”;
* mostrare il numero dei filtri attivi;
* mostrare un breve riepilogo quando chiuso;
* offrire “Azzera filtri”;
* mantenere i query parameter;
* essere responsive;
* usare gruppi visivi leggibili.

Non inserire tutti i campi in un’unica griglia senza separazione.

Usare sezioni interne come:

```text
Periodo
Classificazione
Stato
Importo
Altre opzioni
```

Ogni gruppo deve avere:

* titolo;
* breve descrizione opzionale;
* spaziatura;
* bordo o superficie secondaria;
* layout responsive.

---

# Ordinamento a tre stati

Tutte le colonne ordinabili devono usare questo ciclo:

```text
nessun ordinamento
→ crescente
→ decrescente
→ nessun ordinamento
```

Quindi:

* primo click: crescente;
* secondo click: decrescente;
* terzo click: rimuove l’ordinamento.

Quando viene rimosso l’ordinamento:

* eliminare `sortBy`;
* eliminare `sortDirection`;
* ripristinare l’ordinamento predefinito della pagina;
* aggiornare i query parameter;
* non lasciare parametri vuoti.

---

# Icone delle colonne ordinabili

Una colonna ordinabile non attiva deve mostrare sempre un’icona muted.

Esempio:

```text
Descrizione ⇅
```

Stati:

## Ordinabile ma non attiva

* icona `bi-arrow-down-up`;
* colore muted;
* opacità ridotta.

## Ordinamento crescente

* icona `bi-sort-up`;
* colore principale;
* opacità piena.

## Ordinamento decrescente

* icona `bi-sort-down`;
* colore principale;
* opacità piena.

L’utente deve poter distinguere chiaramente:

* colonna ordinabile;
* colonna attualmente ordinata.

Aggiungere:

* `aria-sort`;
* testo accessibile;
* focus visibile;
* attivazione tramite tastiera.

---

# Righe cliccabili

Le tabelle che portano a un dettaglio devono avere:

* hover sulla riga;
* cursor pointer;
* focus da tastiera;
* apertura al click;
* apertura tramite Enter;
* stato hover coerente con light e dark mode.

Il click sui pulsanti azione non deve propagarsi alla riga.

Usare:

```typescript
event.stopPropagation();
```

soltanto nei controlli interni necessari.

Le azioni devono essere uniformi alla tabella Spese.

---

# Date in formato esteso

Non mostrare più date utente nel formato:

```text
DD/MM/YYYY
```

Usare:

```text
27 luglio 2026
```

Nei titoli o dove grammaticalmente opportuno è consentito:

```text
27 Luglio 2026
```

Mantenere una convenzione coerente.

Formati consigliati:

## Data completa

```text
27 luglio 2026
```

## Data e ora

```text
27 luglio 2026, 09:30
```

## Mese e anno

```text
Luglio 2026
```

## Data compatta in spazi ridotti

```text
27 lug 2026
```

Il formato interno e API resta:

```text
YYYY-MM-DD
```

Centralizzare la formattazione in:

```text
DateFormatService
AppDatePipe
```

o utility equivalente.

Non formattare manualmente le date nei singoli componenti.

---

# Drag and drop categorie ed etichette

Le righe delle tabelle Categorie ed Etichette devono poter essere riordinate tramite drag and drop.

Usare preferibilmente:

```text
Angular CDK DragDrop
```

se già disponibile o compatibile.

Non installare una seconda libreria drag and drop.

---

# Condizioni per il riordinamento

Il drag and drop deve essere attivo soltanto quando:

* la tabella è ordinata secondo l’ordine manuale;
* non è attivo un ordinamento differente;
* non è applicata una ricerca che nasconde elementi;
* non sono applicati filtri che rendono ambiguo l’ordine.

Se una di queste condizioni non è rispettata:

* disabilitare il drag and drop;
* mostrare un tooltip:

```text
Rimuovi ricerca, filtri e ordinamenti per modificare l’ordine.
```

Non aggiornare posizioni relative su un sottoinsieme filtrato in maniera ambigua.

---

# Comportamento drag and drop

Quando una riga viene spostata:

1. aggiornare immediatamente la lista;
2. chiamare l’endpoint di reorder esistente;
3. mostrare stato di salvataggio;
4. in caso di successo mantenere l’ordine;
5. in caso di errore ripristinare l’ordine precedente;
6. mostrare un toast.

Aggiungere handle:

```text
bi-grip-vertical
```

Non rendere l’intera riga un handle se confligge con il click per il dettaglio.

---

# Alternativa accessibile al drag and drop

Fornire azioni:

```text
Sposta su
Sposta giù
```

nel menu della riga o tramite pulsanti accessibili.

Il drag and drop non deve essere l’unico modo per modificare l’ordine.

---

# Counter card

Aggiungere counter card alle pagine:

```text
Spese
Categorie
Etichette
```

Coerenti con quelle presenti in:

* Notifiche;
* Spese ricorrenti.

## Counter card spese

Mostrare almeno:

```text
Totale risultati
Completate
Pianificate
Annullate
```

È possibile aggiungere:

```text
Ricorrenti
Con promemoria
```

soltanto se le query aggregate esistono o possono essere implementate efficientemente.

## Counter card categorie

Mostrare almeno:

```text
Totali
Attive
Disattivate
Personalizzate
```

## Counter card etichette

Mostrare almeno:

```text
Totali
Associate a categoria
Senza categoria
Non utilizzate
```

Le card devono:

* provenire da aggregazioni backend quando riguardano tutto il dataset;
* essere cliccabili se applicano un filtro utile;
* aggiornarsi con i filtri globali quando coerente;
* non richiedere il caricamento di tutti i record.

---

# Form spesa — rework completo

Il form attuale deve essere riorganizzato completamente senza modificare la business logic.

Obiettivi:

* leggibilità;
* gerarchia;
* spaziatura;
* campi correlati vicini;
* meno densità;
* comportamento responsive;
* messaggi di validazione chiari.

Riutilizzare:

```text
ExpenseFormComponent
```

Non creare form diversi per:

* nuova spesa;
* modifica;
* inserimento rapido;
* calendario;

salvo wrapper specifici.

---

# Struttura del form spesa

Struttura consigliata:

## Sezione 1 — Dati principali

Campi:

* descrizione;
* importo;
* data;
* ora opzionale;
* stato.

La descrizione deve avere maggiore evidenza.

Importo, data e stato devono essere leggibili immediatamente.

## Sezione 2 — Classificazione

Campi:

* categoria;
* etichette;
* metodo di pagamento.

## Sezione 3 — Dettagli

Campi:

* esercente;
* note.

## Sezione 4 — Pianificazione e promemoria

Mostrare soltanto quando applicabile:

* promemoria;
* indicatori di spesa ricorrente;
* eventuale ricorrenza collegata.

Le sezioni devono usare:

* card interne;
* heading;
* descrizioni brevi;
* spaziatura;
* griglia responsive.

Non usare un’unica colonna di campi senza gerarchia.

---

# Layout form spesa

## Desktop

* descrizione a larghezza completa;
* importo, data e stato nella stessa riga se leggibile;
* categoria e metodo di pagamento affiancati;
* etichette a larghezza completa;
* note a larghezza completa;
* promemoria in sezione autonoma.

## Tablet

* massimo due colonne;
* evitare campi troppo stretti.

## Mobile

* singola colonna;
* azioni sticky opzionali;
* input con area touch adeguata;
* nessuno scroll orizzontale.

---

# Etichette filtrate per categoria

Nel form spesa le etichette disponibili devono dipendere dalla categoria selezionata.

## Categoria selezionata

Mostrare:

* etichette assegnate alla categoria selezionata;
* eventualmente etichette globali senza categoria, soltanto se la business rule corrente le considera utilizzabili globalmente.

La regola preferita per questa fase è:

```text
categoria selezionata
→ etichette della categoria
→ più eventuali etichette senza categoria
```

Se il comportamento desiderato del progetto è più restrittivo, mostrare soltanto quelle della categoria.

Documentare la scelta.

## Categoria non selezionata

Mostrare soltanto:

```text
etichette senza categoria assegnata
```

Non mostrare le etichette appartenenti ad altre categorie.

---

# Cambio categoria con etichette già selezionate

Quando cambia la categoria:

1. determinare le etichette non più compatibili;
2. rimuoverle dalla selezione;
3. informare l’utente con un messaggio non invasivo.

Esempio:

```text
2 etichette sono state rimosse perché non appartengono alla nuova categoria.
```

Non salvare una combinazione categoria/etichette incoerente.

Il backend deve continuare a validare la compatibilità.

---

# Pagina Spese — spese ricorrenti

Aggiungere la possibilità di nascondere le spese generate da ricorrenze.

Usare un filtro coerente con quello delle spese future.

Possibile modello:

```text
Mostra spese ricorrenti
```

oppure una select:

```text
Tutte
Solo manuali
Solo ricorrenti
```

La soluzione consigliata è:

```text
recurrenceMode=ALL
recurrenceMode=EXCLUDE
recurrenceMode=ONLY
```

Etichette:

```text
Tutte le spese
Nascondi ricorrenti
Solo ricorrenti
```

Il filtro deve:

* essere server-side;
* essere sincronizzato con query parameter;
* poter essere azzerato;
* aggiornare counter card e tabella;
* non confondersi con lo stato della ricorrenza.

---

# Pagina Spese — pannello filtri

Il pannello filtri deve essere riorganizzato in sezioni.

Struttura consigliata:

## Periodo

* data da;
* data a;
* mese;
* anno.

## Classificazione

* categorie;
* etichette;
* metodi di pagamento.

## Stato

* stati;
* spese future;
* spese ricorrenti;
* spese con promemoria.

## Importo

* minimo;
* massimo.

## Ordinamento secondario o altre opzioni

Soltanto se realmente necessarie.

Ogni sezione deve avere una superficie distinta.

---

# Select multipli nei filtri Spese

I select strutturati del pannello filtri devono supportare selezione multipla.

Applicare almeno a:

```text
categorie
etichette
stati
metodi di pagamento
```

Non rendere multipli:

* mese;
* anno;
* ordinamento;
* modalità ricorrenze;
* eventuali opzioni booleane.

Query parameter consigliati:

```text
categoryIds=id1,id2
labelIds=id1,id2
statuses=COMPLETED,PLANNED
paymentMethods=CASH,DEBIT_CARD
```

Adattare alle convenzioni già presenti.

Il backend deve:

* validare gli array;
* usare whitelist enum;
* applicare semantica coerente;
* evitare query non indicizzate inutilmente.

Per categorie, stati e metodi usare semantica:

```text
OR
```

Per etichette mantenere la semantica già definita, preferibilmente:

```text
ANY
```

---

# Filtro mese

Nel select del mese non utilizzare la stessa icona per ogni elemento.

Mostrare invece:

```text
01  Gennaio
02  Febbraio
03  Marzo
...
12  Dicembre
```

Il numero deve essere:

* bold;
* monospace opzionale;
* allineato;
* distinto dal nome.

Non usare un’icona calendario ripetuta per ogni mese.

Nel valore selezionato mostrare:

```text
07 — Luglio
```

o equivalente.

---

# Tabella Spese — indicatore promemoria

Per una spesa `PLANNED` con almeno un promemoria attivo mostrare sotto la descrizione un riepilogo compatto.

Esempio:

```text
Assicurazione auto
⏰ Promemoria: 20 luglio 2026, 09:00
```

Se ci sono più promemoria:

```text
⏰ Prossimo: 20 luglio 2026, 09:00 · altri 2
```

Mostrare:

* prossimo promemoria;
* conteggio aggiuntivo;
* icona;
* stile muted ma leggibile.

Non mostrare tutte le date nella riga.

La lista API deve restituire almeno:

```text
nextReminderAt
activeReminderCount
```

oppure un oggetto sintetico equivalente.

Non eseguire una chiamata HTTP per ogni riga.

Evitare query N+1 nel backend.

---

# Dettaglio spesa — rework

Riorganizzare la pagina dettaglio.

## Header

Mantenere nell’header:

* data;
* titolo;
* importo;
* azioni principali.

Spostare le azioni in alto.

Azioni possibili:

* modifica;
* duplica;
* cambia stato;
* elimina;
* torna alle spese.

Usare icone coerenti.

---

# Stato e categoria nel dettaglio spesa

Scambiare la posizione attuale di stato e categoria.

Mostrare entrambi come badge principali.

La categoria non deve essere preceduta da un’etichetta testuale come:

```text
Categoria:
```

Deve essere mostrata nello stesso stile visivo dello stato, con:

* colore;
* icona;
* nome.

Esempio:

```text
[Pianificata] [🚗 Auto]
```

Le etichette restano contenuto secondario.

---

# Nav tab dettaglio spesa

Sotto l’header creare tab:

```text
Informazioni generali
Promemoria
```

## Informazioni generali

Mostrare:

* esercente;
* metodo di pagamento;
* etichette;
* note;
* data creazione;
* ultima modifica;
* eventuale origine ricorrente.

## Promemoria

Mostrare:

* lista promemoria;
* stato;
* data;
* tipo;
* azioni;
* notifiche generate, se disponibili.

Usare gli stessi componenti della gestione promemoria già presenti.

Non duplicare form o liste.

I tab devono:

* essere accessibili;
* mantenere stato via query parameter opzionale;
* funzionare da tastiera;
* essere responsive.

---

# Dashboard — filtri mese e anno

Stilizzare il select mese tramite `ng-select`.

Il filtro anno deve essere un:

```text
input type="number"
```

con:

* valore minimo e massimo;
* pulsanti browser o controlli coerenti;
* validazione;
* nessuna possibilità di testo arbitrario;
* debounce o aggiornamento al blur/Enter;
* sincronizzazione con URL.

Non utilizzare `ng-select` per l’anno.

---

# Dashboard — Categoria principale

Aggiungere un link o pulsante icona che porti alla pagina Spese filtrata per:

* mese selezionato;
* anno selezionato;
* categoria principale.

Esempio:

```text
/expenses?month=7&year=2026&categoryIds=uuid
```

Usare un’icona come:

```text
bi-arrow-up-right
```

con `aria-label`.

La descrizione non deve essere:

```text
338,90 € · 41,18%
```

Mostrare invece una struttura più leggibile:

```text
338,90 €
41,18% del totale mensile
```

oppure due righe distinte.

---

# Dashboard — Spese future

Aggiungere un link alla pagina Spese filtrata per:

* stato `PLANNED`;
* periodo pertinente.

Chiarire la semantica:

* se la card mostra tutte le spese future, non applicare un mese che ne escluderebbe alcune;
* se la card mostra soltanto il mese selezionato, applicare mese e anno.

La navigazione deve essere coerente con la query usata dalla card.

---

# Dashboard — Prossima spesa

Aggiungere un link o pulsante icona che porti direttamente:

```text
/expenses/:id
```

Non mostrare:

```text
15,00 € · 2026-07-25
```

Mostrare:

```text
15,00 €
25 luglio 2026
```

su righe distinte.

Mostrare anche la categoria tramite badge quando lo spazio lo consente.

---

# Dashboard — Andamento giornaliero

La descrizione deve essere dinamica.

Sostituire:

```text
Spese completate giorno per giorno nel periodo.
```

con:

```text
Spese completate giorno per giorno a luglio 2026.
```

Il mese deve provenire dal periodo selezionato.

Non hardcodare “Luglio”.

---

# Riepilogo testuale del grafico giornaliero

Rimuovere l’attuale blocco se appare come una tabella poco leggibile.

Sostituirlo con una soluzione più compatta.

Possibili opzioni:

## Insight sintetici

```text
Giorno con più spese
18 luglio — 124,50 €

Media giornaliera
32,40 €

Giorni senza spese
8
```

## Lista dei picchi principali

Mostrare soltanto i 3 giorni principali.

Non ripetere ogni punto del grafico in una lunga lista sotto il canvas.

Mantenere comunque un’alternativa accessibile tramite:

* tabella espandibile;
* pulsante “Mostra dati”;
* dialog;
* accordion.

---

# Click sul grafico giornaliero

Cliccando un punto o una barra:

* recuperare la data associata;
* navigare alla pagina Spese;
* applicare filtro esatto per quella data.

Esempio:

```text
/expenses?dateFrom=2026-07-18&dateTo=2026-07-18
```

Aggiungere:

* cursor pointer sui punti;
* hover coerente;
* navigazione da una legenda o tabella alternativa per accessibilità.

Il grafico non deve essere l’unico modo di aprire il filtro.

---

# Dashboard — Spese per categoria

Cliccando una fetta del grafico:

* recuperare categoria;
* recuperare mese e anno;
* navigare alla pagina Spese filtrata.

Esempio:

```text
/expenses?month=7&year=2026&categoryIds=uuid
```

La legenda deve essere anch’essa cliccabile o avere un’azione alternativa.

Non affidare la navigazione soltanto al canvas.

---

# Dashboard — Andamento ultimi mesi

Cliccando una barra o un punto:

* recuperare mese e anno;
* navigare a Spese filtrate per quel mese.

Esempio:

```text
/expenses?month=4&year=2026
```

---

# Riepilogo andamento ultimi mesi

Rimuovere o rivedere la tabella riepilogativa attuale se poco leggibile.

Sostituire con:

* variazione complessiva;
* mese più costoso;
* mese meno costoso;
* media mensile;
* pulsante “Mostra tutti i dati”.

La tabella completa può essere:

* collassabile;
* in modale;
* in accordion;
* disponibile per accessibilità.

Non mostrare una seconda tabella densa sempre aperta sotto il grafico.

---

# Dashboard — Ultimi inserimenti

La descrizione della spesa non deve avere stile anchor.

Mostrare:

* testo bold;
* hover sulla riga o card;
* apertura al click dell’intero elemento;
* focus da tastiera.

Il testo non deve essere blu e sottolineato come un link tradizionale.

L’accessibilità deve comunque indicare che l’elemento è interattivo.

---

# Dashboard — Prossime spese

Riorganizzare completamente la sezione.

## Raggruppamento

Raggruppare per mese:

```text
Luglio 2026
Agosto 2026
Settembre 2026
```

Mostrare anche un gruppo:

```text
Scadute
```

quando applicabile.

## Item

Ogni item deve mostrare:

* descrizione bold;
* importo;
* data una sola volta;
* categoria come badge standard;
* eventuale ora;
* stato o scadenza;
* azione apertura.

Non usare sfondo blu pieno.

Usare:

* superficie neutra;
* bordo leggero;
* accent della categoria;
* padding adeguato.

Non mostrare la data due volte.

La descrizione non deve essere un anchor tradizionale.

L’intero item può essere cliccabile.

---

# Dashboard, report mensile e confronto mensile

Le lavorazioni applicate alle card e ai grafici della dashboard devono essere replicate, quando pertinenti, in:

```text
Report mensile
Confronto mensile
```

Uniformare:

* header delle card;
* link di approfondimento;
* layout importo/percentuale;
* formattazione date;
* descrizioni dinamiche;
* grafici cliccabili;
* riepiloghi sintetici;
* alternative accessibili;
* spacing;
* badge;
* hover;
* tooltip.

Non creare tre stili differenti per la stessa metrica.

Creare componenti riutilizzabili.

---

# Migrazione a ng2-charts

Migrare i componenti Angular dei grafici da gestione diretta delle istanze Chart.js a:

```text
ng2-charts
```

Nota architetturale:

```text
ng2-charts è un wrapper Angular di Chart.js.
```

Quindi Chart.js resta la libreria grafica sottostante.

L’obiettivo è migrare:

* integrazione Angular;
* binding dei dataset;
* lifecycle;
* eventi click;
* aggiornamenti;
* distruzione delle istanze.

Prima dell’installazione:

1. verificare la versione Angular;
2. verificare la versione Chart.js;
3. verificare la versione compatibile di `ng2-charts`;
4. non usare peer dependency forzate.

---

# Componenti grafici da migrare

Almeno:

```text
DailyExpenseTrendChartComponent
CategoryDistributionChartComponent
MonthlyExpenseTrendChartComponent
MonthlyTotalsComparisonChartComponent
CategoryComparisonChartComponent
DailyComparisonChartComponent
```

Riutilizzare:

```text
BaseChartDirective
```

e tipizzazioni Chart.js.

Non usare `any` per:

* chart type;
* dataset;
* tooltip;
* click event;
* options.

---

# Eventi click ng2-charts

Centralizzare il mapping:

```text
elemento grafico
→ entità applicativa
→ query parameter
→ navigazione
```

Non usare l’etichetta visualizzata come unico identificatore.

Ogni dataset deve mantenere riferimenti stabili:

* data ISO;
* categoryId;
* month;
* year.

---

# Calendario — vista annuale

Aggiungere una vista:

```text
YEAR
```

Etichetta:

```text
Anno
```

Route esempio:

```text
/calendar?view=year&date=2026-07-18
```

La vista annuale deve mostrare tutti i dodici mesi.

Non è necessario introdurre un nuovo plugin FullCalendar se una vista custom Angular è più leggibile.

---

# Layout calendario annuale

Raggruppare le spese per mese.

Mostrare sempre:

```text
Gennaio
Febbraio
Marzo
Aprile
Maggio
Giugno
Luglio
Agosto
Settembre
Ottobre
Novembre
Dicembre
```

Anche i mesi senza spese devono essere visibili.

## Mese con spese

Mostrare:

* nome mese;
* conteggio;
* totale pianificato;
* totale completato opzionale;
* lista compatta o prime spese;
* azione “Vedi mese”.

## Mese vuoto

Mostrare una card opportunamente stilizzata:

```text
Nessuna spesa
```

con superficie attenuata ma non disabilitata.

Azione possibile:

```text
Aggiungi spesa
```

precompilando una data del mese o aprendo il mese.

---

# Dati vista annuale

Caricare un intervallo massimo di un anno:

```text
1 gennaio incluso
1 gennaio dell’anno successivo escluso
```

L’endpoint calendario già esistente può essere riutilizzato se supporta 366 giorni.

Evitare dodici chiamate separate se una singola query annuale è efficiente.

Non caricare dati di più anni.

---

# Notifiche — empty state

Correggere il margine tra pulsanti come:

```text
Azzera filtri
Vai al calendario
```

Verificare globalmente tutti gli empty state con più azioni.

Creare una regola condivisa:

```text
gap
flex-wrap
allineamento responsive
```

Non correggere soltanto una singola pagina.

---

# Notifiche — disarchiviazione

Aggiungere la possibilità di disarchiviare una notifica.

Endpoint consigliato:

```http
PATCH /api/v1/notifications/:id/unarchive
```

Comportamento:

* rimuovere stato `ARCHIVED`;
* azzerare `archivedAt`;
* impostare lo stato precedente se memorizzato;
* oppure impostare `READ`.

Soluzione consigliata:

```text
ARCHIVED → READ
```

salvo modello differente già presente.

Non riportare automaticamente la notifica a `UNREAD`.

L’operazione deve:

* verificare ownership;
* essere idempotente;
* aggiornare lista e counter;
* mostrare toast.

---

# Notifiche — dropdown

Il dropdown delle notifiche deve chiudersi quando:

* l’utente clicca fuori;
* preme Escape;
* naviga a un’altra pagina;
* apre un altro overlay incompatibile.

Non deve chiudersi quando:

* l’utente clicca dentro per leggere;
* usa scroll interno;
* usa pulsanti interni.

Usare:

* Angular CDK Overlay;
* oppure una direttiva click outside condivisa;
* oppure l’infrastruttura già presente.

Rimuovere correttamente i listener.

---

# Filtri Notifiche e Ricorrenze

Rimuovere il pulsante:

```text
Applica filtri
```

dove presente.

I filtri devono applicarsi automaticamente come nella pagina Spese.

Uniformare anche:

```text
Notifiche
Spese ricorrenti
Categorie
Etichette
```

Per ogni pagina verificare:

* ricerca separata;
* pannello collassabile;
* conteggio filtri;
* reset;
* query parameter;
* debounce;
* nessuna richiesta duplicata;
* layout sezionato.

---

# Spese ricorrenti — tabella

Riorganizzare la tabella seguendo lo standard della tabella Spese.

La riga deve:

* avere hover;
* essere cliccabile;
* aprire il dettaglio;
* avere focus da tastiera.

Le azioni non devono essere una lunga sequenza di pulsanti sempre visibili.

Usare:

* azione primaria contestuale;
* menu dropdown;
* icone uniformi;
* tooltip;
* `stopPropagation`.

Esempio azioni:

```text
Apri
Modifica
Pausa
Riprendi
Termina
Elimina
```

Mostrare soltanto quelle consentite dallo stato.

---

# Spese ricorrenti — form

Rimuovere dal form il campo:

```text
Descrizione delle spese
```

Usare il nome della ricorrenza come descrizione delle spese generate.

Esempio:

```text
Nome ricorrenza: Affitto appartamento
Descrizione spesa generata: Affitto appartamento
```

Non mostrare un campo duplicato.

---

# Compatibilità del campo description

Se il database possiede già:

```text
description
```

non eseguire una migrazione distruttiva in questa fase.

Comportamento consigliato:

* rimuovere il campo dal form;
* valorizzarlo con `name` in creazione e modifica;
* usare `name` nella generazione delle nuove spese;
* mantenere compatibilità con record esistenti;
* valutare la rimozione fisica soltanto in una migrazione futura controllata.

Non perdere dati esistenti.

---

# Tabella ricorrenze — note

Nella tabella, dove prima veniva mostrata la descrizione, mostrare:

```text
note
```

Se le note sono assenti:

* non mostrare “null”;
* usare un placeholder muted;
* oppure omettere la seconda riga.

Troncare note lunghe con:

* ellipsis;
* tooltip;
* testo completo nel dettaglio.

---

# Dettaglio ricorrenza

Riorganizzare tramite nav tab come il dettaglio spesa.

Tab consigliati:

```text
Informazioni generali
Occorrenze generate
Promemoria
```

## Informazioni generali

Mostrare:

* nome;
* importo;
* categoria;
* etichette;
* metodo di pagamento;
* frequenza;
* intervallo;
* data iniziale;
* data finale;
* stato;
* note;
* prossima occorrenza;
* ultima generazione.

## Occorrenze generate

Mostrare:

* tabella o lista;
* filtri;
* collegamento alle spese;
* stato.

## Promemoria

Mostrare:

* template della ricorrenza;
* spiegazione che verranno copiati sulle nuove spese;
* azioni previste dal modulo ricorrenze.

Spostare le azioni principali in alto.

---

# Nuova categoria e nuova etichetta — icone

Ampliare il catalogo delle icone.

Aggiungere icone organizzate per gruppi:

```text
Generali
Casa
Alimentazione
Trasporti
Salute
Lavoro
Studio
Shopping
Tecnologia
Intrattenimento
Sport
Viaggi
Finanza
Animali
Servizi
Regali
Famiglia
```

Usare Bootstrap Icons già disponibili.

Non caricare librerie di icone aggiuntive.

Il catalogo deve contenere un numero sufficiente di opzioni senza diventare ingestibile.

Indicativamente:

```text
60–120 icone curate
```

Non includere automaticamente tutte le Bootstrap Icons.

---

# Picker icone

Il picker deve supportare:

* ricerca;
* gruppi;
* anteprima;
* icona selezionata;
* navigazione da tastiera;
* preferenze dell’utente definite nella Fase 10;
* icona corrente anche se nascosta dalle preferenze.

Non duplicare il picker tra categoria ed etichetta.

---

# Campi colore

Correggere l’allineamento tra:

```text
Colore
Valore esadecimale
```

I due campi devono avere:

* stessa altezza;
* label allineate;
* validation message allineati;
* stessa baseline;
* stessa spaziatura;
* layout mobile corretto.

Se il campo colore nativo ha altezza differente, avvolgerlo in un controllo coerente.

---

# Stile ng-select

Uniformare tutti gli `ng-select`.

Verificare almeno:

* pagina Spese;
* form Spesa;
* Dashboard mese;
* Ricorrenze stato;
* Notifiche;
* Promemoria;
* Categorie;
* Etichette;
* Report;
* Calendario;
* Impostazioni.

Non lasciare select native o `ng-select` non stilizzati senza motivo.

---

# Badge degli elementi selezionati

Nei select multipli aggiungere padding corretto ai badge degli elementi selezionati.

Verificare:

* testo;
* icona;
* pulsante rimozione;
* distanza tra badge;
* altezza;
* wrapping;
* light mode;
* dark mode.

Il badge non deve toccare il bordo del controllo.

---

# Icone nei select

Dove gli item rappresentano enum o entità, mostrare icone quando utili.

Esempi:

## Stato ricorrenza

```text
Attiva
In pausa
Completata
Annullata
```

con icone differenti.

## Stato spesa

```text
Completata
Pianificata
Annullata
```

## Metodo di pagamento

Mostrare le icone già definite.

## Categoria

Mostrare icona e colore.

Non aggiungere un’icona generica identica a tutti gli item.

---

# Pulsanti outline

Gli outline button non devono dipendere esclusivamente dallo sfondo della pagina.

Definire una superficie comune.

Esempio:

```css
.btn-outline-app {
  background-color: var(--surface);
  border-color: var(--border-color);
}
```

Stati da verificare:

* default;
* hover;
* active;
* focus;
* disabled;
* light;
* dark.

Non eliminare il contrasto dell’outline.

---

# Icone nei pulsanti

Aggiungere un’icona ai pulsanti che ne sono privi quando l’azione possiede un simbolo chiaro.

Esempi:

```text
Salva          bi-check-lg
Annulla        bi-x-lg
Modifica       bi-pencil
Elimina        bi-trash
Azzera filtri  bi-arrow-counterclockwise
Riprova        bi-arrow-repeat
Nuova spesa    bi-plus-lg
Esporta        bi-download
Indietro       bi-arrow-left
```

Non aggiungere icone decorative inutili a:

* conferme testuali molto brevi;
* tab;
* label;
* ogni singolo elemento non interattivo.

Mantenere:

* ordine coerente icona/testo;
* gap;
* dimensione;
* `aria-hidden` sulle icone decorative.

---

# Card dei messaggi e empty state

Le card che mostrano messaggi come:

```text
Non hai ancora ricevuto notifiche.
Puoi modificare i filtri oppure consultare le spese pianificate.
```

devono avere:

* superficie;
* bordo;
* ombra leggera;
* padding;
* icona;
* azioni distanziate;
* larghezza controllata;
* light e dark mode.

Usare un componente condiviso:

```text
EmptyStateComponent
```

Non applicare box-shadow direttamente in ogni pagina.

---

# Transizioni globali

Aggiungere transizioni leggere dove migliorano la UX:

* pulsanti;
* card hover;
* righe tabella;
* sidebar;
* accordion;
* dropdown;
* badge;
* focus;
* nav tab;
* item cliccabili.

Durata indicativa:

```text
120–220 ms
```

Proprietà preferite:

```text
opacity
transform
background-color
border-color
box-shadow
```

Evitare transizioni globali con:

```css
transition: all;
```

Non animare:

* larghezze complesse;
* layout pesanti;
* tabelle intere;
* proprietà che causano reflow significativo senza necessità.

---

# Navigazione tra pagine

Aggiungere una transizione semplice:

```text
fade + slide leggero
```

Esempio:

* opacità da `0` a `1`;
* traslazione verticale da `6px` a `0`;
* durata breve.

Non rallentare la navigazione.

Non mantenere entrambe le pagine montate più a lungo del necessario.

Usare Angular animations o CSS coerente con la configurazione reale.

---

# Reduced motion

Rispettare:

```css
@media (prefers-reduced-motion: reduce)
```

Quando attivo:

* disabilitare slide;
* ridurre fade;
* disabilitare animazioni Chart.js;
* ridurre transizioni non essenziali;
* mantenere tutte le funzionalità.

---

# Scrollbar globale

Stilizzare soltanto il thumb della scrollbar.

Non colorare pesantemente:

* track;
* pulsanti;
* sfondo completo.

Comportamento consigliato:

```css
* {
  scrollbar-color: var(--scrollbar-thumb) transparent;
}
```

Per browser WebKit:

```css
*::-webkit-scrollbar-thumb {
  background-color: var(--scrollbar-thumb);
  border-radius: 999px;
}
```

Il track deve restare trasparente.

Verificare:

* light mode;
* dark mode;
* hover del thumb;
* scrollbar interna di dropdown e tabelle.

Non rendere la scrollbar troppo sottile.

---

# Modifiche backend necessarie

Implementare soltanto gli endpoint o campi necessari.

Possibili modifiche:

## Lista spese

Supportare:

```text
recurrenceMode
categoryIds
labelIds
statuses
paymentMethods
```

e restituire:

```text
nextReminderAt
activeReminderCount
```

senza query N+1.

## Counter card

Aggiungere o estendere endpoint summary per:

* spese;
* categorie;
* etichette.

## Reorder

Verificare o aggiungere endpoint per:

* categorie;
* etichette.

## Notifiche

Aggiungere:

```http
PATCH /api/v1/notifications/:id/unarchive
```

## Calendario

Verificare intervallo annuale fino a 366 giorni.

Non creare nuovi endpoint se quelli esistenti possono essere estesi in modo pulito.

---

# Query parameter e compatibilità

Non rompere URL salvati o link esistenti.

Quando si passa da filtro singolo a multiplo:

* accettare temporaneamente il vecchio parametro;
* normalizzarlo internamente;
* produrre dal frontend soltanto il nuovo formato.

Esempio:

```text
status=PLANNED
```

può essere interpretato come:

```text
statuses=PLANNED
```

Documentare eventuali compatibilità.

---

# Accessibilità

Verificare almeno:

* righe cliccabili da tastiera;
* drag and drop con alternativa;
* `aria-sort`;
* tab;
* grafici con alternativa;
* click chart con alternativa;
* dropdown notifiche;
* filter accordion;
* ng-select;
* pulsanti icona;
* date leggibili;
* focus;
* dark mode;
* reduced motion.

Non affidare interazioni esclusivamente a:

* hover;
* drag;
* canvas;
* colore;
* icona.

---

# Responsive design

Verificare almeno:

```text
360 px
390 px
768 px
1024 px
1280 px
1440 px
```

Controllare:

* toolbar tabelle;
* ricerca;
* filtri;
* counter card;
* form spesa;
* dettaglio spesa;
* dashboard;
* report;
* calendario annuale;
* notifiche;
* ricorrenze;
* picker icone;
* ng-select;
* tab;
* empty state.

Nessuna pagina deve produrre scroll orizzontale involontario.

---

# Correzioni aggiuntive obbligatorie

Le seguenti correzioni fanno parte integrante della Fase 10.5 e devono essere completate prima della verifica finale.

---

# Navigazione laterale — voci attive errate

## Problema

Nelle pagine:

```text
/settings/categories
/settings/labels
```

risultano evidenziate contemporaneamente:

* la voce specifica `Categorie` o `Etichette`;
* la voce generale `Impostazioni`.

Questo crea un’indicazione ambigua della posizione corrente.

## Comportamento richiesto

Deve risultare attiva una sola destinazione primaria.

Nelle pagine:

```text
/settings/categories
/settings/labels
```

evidenziare esclusivamente:

```text
Categorie
Etichette
```

Non evidenziare contemporaneamente:

```text
Impostazioni
```

La voce Impostazioni deve risultare attiva soltanto nelle route realmente appartenenti alla pagina delle preferenze, per esempio:

```text
/settings/account
/settings/appearance
/settings/experience
/settings/icons
/settings/notifications
```

## Implementazione

Non utilizzare un controllo generico basato soltanto su:

```text
url.startsWith('/settings')
```

se categorie ed etichette condividono lo stesso prefisso.

Utilizzare:

* route esatte;
* configurazione esplicita della sidebar;
* `routerLinkActiveOptions`;
* oppure una funzione centralizzata di matching.

La logica deve supportare:

* route figlie;
* query parameter;
* refresh;
* navigazione avanti e indietro.

Non duplicare la logica di matching in ogni nav item.

---

# Accent color — stato attivo della navigazione

## Problema

Cambiare il colore principale nelle Impostazioni non aggiorna correttamente il colore di sfondo dei nav item selezionati.

Si crea quindi un’incoerenza tra:

* colore principale;
* testo o icona attiva;
* sfondo della voce attiva;
* focus;
* hover.

## Comportamento richiesto

Il preset di accent color deve aggiornare in modo coerente almeno:

```text
--primary
--primary-hover
--primary-soft
--primary-contrast
--focus-ring
--nav-active-bg
--nav-active-color
--nav-active-icon-color
--nav-hover-bg
```

La voce attiva della sidebar e della navigazione interna deve utilizzare i token derivati dal colore principale selezionato.

Non usare colori hardcoded come:

```css
background-color: #eef2ff;
```

nei nav item attivi.

Usare invece token semantici:

```css
.app-nav-item.active {
  background-color: var(--nav-active-bg);
  color: var(--nav-active-color);
}
```

Verificare:

* sidebar;
* menu mobile;
* tab delle Impostazioni;
* nav tab dei dettagli;
* paginazione;
* filtri rapidi;
* light mode;
* dark mode.

---

# Accent color — aggiornamento di surface-soft

## Problema

Il cambio del colore principale non modifica `surface-soft`, lasciando superfici secondarie appartenenti alla palette precedente.

## Comportamento richiesto

Ogni preset di accent color deve definire anche una variante soft coerente.

Esempio indicativo:

```css
[data-accent="indigo"] {
  --accent-primary: #7c83d6;
  --accent-primary-hover: #696fc0;
  --accent-primary-soft: #eef0ff;
  --accent-primary-soft-strong: #e2e5ff;
}

[data-accent="mint"] {
  --accent-primary: #72b5a4;
  --accent-primary-hover: #5e9f8f;
  --accent-primary-soft: #edf8f4;
  --accent-primary-soft-strong: #dff1eb;
}
```

Il token generale:

```text
--surface-soft
```

non deve necessariamente diventare identico all’accent soft in tutta l’applicazione.

Definire preferibilmente token distinti:

```text
--surface-soft
--surface-accent
--surface-accent-strong
```

Usare le superfici accentate per:

* nav item selezionati;
* tab attivi;
* filtri rapidi selezionati;
* card evidenziate;
* badge soft;
* selezioni dell’icon picker;
* controlli selezionati.

Mantenere `--surface-soft` come superficie neutra, se necessario per non colorare tutta l’applicazione.

Se l’implementazione corrente usa direttamente `--surface-soft` per gli elementi accentati, aggiornarla in modo coerente con il preset scelto.

Verificare il contrasto del testo per ogni preset.

---

# Bug critico — refresh causa logout

## Gravità

```text
P0 — Bloccante
```

## Problema

Aggiornando manualmente la pagina tramite refresh, l’applicazione riporta l’utente alla schermata di login anche quando la sessione dovrebbe essere ancora valida.

Questo problema deve essere corretto prima di qualunque rifinitura non bloccante.

## Comportamento richiesto

Quando l’utente aggiorna una route protetta:

1. l’applicazione deve inizializzare lo stato di autenticazione;
2. deve verificare la sessione persistita;
3. deve tentare il refresh token, quando necessario;
4. deve attendere la conclusione dell’inizializzazione prima di eseguire la guard;
5. deve ripristinare l’utente;
6. deve mantenere la route richiesta;
7. deve mostrare il login soltanto quando la sessione è realmente scaduta o non valida.

Esempio:

```text
utente su /dashboard
→ refresh browser
→ bootstrap autenticazione
→ sessione valida
→ resta su /dashboard
```

Non deve verificarsi:

```text
bootstrap non completato
→ auth state temporaneamente falso
→ redirect immediato a /login
```

## Stato autenticazione

Distinguere almeno:

```text
UNKNOWN
AUTHENTICATING
AUTHENTICATED
UNAUTHENTICATED
```

oppure una struttura equivalente.

La guard non deve interpretare lo stato iniziale non ancora risolto come utente non autenticato.

## Verifiche tecniche

Controllare:

* inizializzazione dell’`AuthStore`;
* `APP_INITIALIZER` o meccanismo equivalente;
* auth guard;
* refresh token interceptor;
* persistenza del refresh token;
* cookie `HttpOnly`, se utilizzato;
* configurazione `withCredentials`;
* CORS;
* durata e rotazione token;
* richieste concorrenti di refresh;
* redirect salvato;
* errori del primo caricamento;
* inizializzazione delle impostazioni utente.

Non salvare access token sensibili in localStorage soltanto per aggirare il problema.

Non introdurre loop:

```text
401
→ refresh
→ 401
→ refresh infinito
```

## Navigazione originale

Quando l’utente apre direttamente:

```text
/expenses/uuid
/calendar?view=year
/settings/appearance
```

e la sessione è valida, deve restare sulla route richiesta dopo l’inizializzazione.

Se la sessione è scaduta:

1. reindirizzare al login;
2. preservare il return URL;
3. dopo login riuscito, tornare alla route richiesta.

---

# Dashboard — header Andamento degli ultimi mesi

## Problema

L’header della card:

```text
Andamento degli ultimi mesi
```

non presenta più un allineamento corretto tra:

* titolo;
* descrizione;
* controllo 6/12 mesi;
* eventuale azione;
* eventuale icona.

## Comportamento richiesto

Ripristinare una struttura responsive e coerente con le altre chart card.

Struttura consigliata:

```text
[ Titolo e descrizione                         ] [ Controlli ]
```

Desktop:

* titolo e descrizione a sinistra;
* filtro 6/12 mesi e azioni a destra;
* allineamento verticale coerente;
* nessuna sovrapposizione.

Mobile:

* contenuti impilati;
* controllo a larghezza adeguata;
* spacing verticale;
* nessun overflow.

Creare o riutilizzare un header condiviso:

```text
ChartCardHeaderComponent
DashboardCardHeaderComponent
```

Non applicare correzioni CSS isolate soltanto a questa card se il problema deriva da un componente condiviso.

Verificare anche:

* andamento giornaliero;
* distribuzione categorie;
* report mensile;
* confronto mensile.

---

# Calendario — rimozione testo tecnico

## Problema

Nel pannello filtri del Calendario è mostrata la scritta:

```text
Sincronizzati nell’URL
```

Questa è un’informazione tecnica non utile all’utente finale.

## Comportamento richiesto

Rimuovere completamente questa scritta.

Il pannello filtri del Calendario deve essere coerente con quello della pagina Spese.

Deve contenere:

* header filtri;
* numero filtri attivi;
* breve riepilogo;
* reset;
* gruppi di filtri;
* applicazione automatica;
* query parameter gestiti senza messaggi tecnici.

Non mostrare testi relativi a:

* URL;
* query parameter;
* sincronizzazione router;
* implementazione interna.

La persistenza tramite URL deve continuare a funzionare senza essere esposta come dettaglio tecnico.

---

# ng-select multipli — icone negli item selezionati

## Problema

In alcuni `ng-select` multipli gli item mostrano correttamente le icone nel dropdown, ma una volta selezionati mostrano soltanto il testo.

Questo avviene soprattutto per:

* categorie;
* etichette;
* stati;
* metodi di pagamento;
* ricorrenze;
* eventuali filtri notifiche.

## Comportamento richiesto

Quando un elemento ha un’icona significativa, mostrarla anche nel badge dell’elemento selezionato.

Esempi:

## Categoria selezionata

```text
[icona categoria] Auto ×
```

## Etichetta selezionata

```text
[icona etichetta] Lavoro ×
```

## Stato selezionato

```text
[icona stato] Pianificata ×
```

Non mostrare un’icona quando:

* l’entità non ne possiede una;
* l’icona sarebbe identica e inutile per tutti gli elementi;
* ridurrebbe eccessivamente la leggibilità.

## Template condivisi

Creare o riutilizzare template coerenti per:

```text
ng-option-tmp
ng-label-tmp
ng-multi-label-tmp
```

Non duplicare markup in ogni pagina.

È possibile creare componenti condivisi o template wrapper per:

```text
EntitySelectOptionComponent
EntityMultiSelectLabelComponent
```

## Stile

I badge selezionati devono mantenere:

* padding;
* gap tra icona e testo;
* pulsante rimozione;
* wrapping;
* altezza coerente;
* contrasto light/dark;
* accent color;
* focus.

Verificare almeno:

* form spesa;
* filtri spese;
* categorie;
* etichette;
* notifiche;
* promemoria;
* ricorrenze;
* calendario;
* report.

---

# Priorità delle correzioni aggiuntive

Implementare nel seguente ordine:

## P0

```text
Refresh della pagina causa logout.
```

## P1

```text
Navigazione laterale con più voci attive.
Accent color incoerente nei nav item.
Accent color non applicato alle superfici soft.
```

## P2

```text
Header Andamento degli ultimi mesi non allineato.
Pannello filtri Calendario incoerente.
Icone mancanti nei badge ng-select multipli.
```

Non procedere con animazioni o altre rifiniture P3 prima di aver corretto e testato il bug P0.

---

# Test backend aggiuntivi

Aggiungere o aggiornare test per:

## Autenticazione e refresh

* refresh token valido;
* refresh token scaduto;
* refresh token revocato;
* access token scaduto con refresh valido;
* refresh concorrente;
* logout;
* sessione ripristinata;
* return URL;
* nessun loop di refresh.

Se il ripristino sessione è gestito interamente dal frontend e dai cookie, aggiungere comunque test di integrazione sugli endpoint coinvolti.

---

# Test frontend aggiuntivi

## Refresh autenticazione

Verificare almeno:

* refresh su `/dashboard`;
* refresh su `/expenses`;
* refresh su `/expenses/:id`;
* refresh su `/calendar`;
* refresh su `/settings/appearance`;
* sessione valida;
* sessione scaduta;
* stato auth iniziale non risolto;
* loader durante bootstrap;
* return URL dopo login;
* una sola chiamata di refresh concorrente.

Aggiungere preferibilmente un test E2E reale con reload browser.

## Sidebar

Verificare:

* categoria attiva senza Impostazioni;
* etichetta attiva senza Impostazioni;
* account attivo con Impostazioni;
* appearance attiva con Impostazioni;
* query parameter;
* route figlie.

## Accent color

Per ogni preset verificare:

* nav item attivo;
* tab attivo;
* focus ring;
* hover;
* superficie accentata;
* light mode;
* dark mode;
* persistenza dopo refresh.

## Dashboard

Verificare:

* header ultimi mesi desktop;
* header tablet;
* header mobile;
* filtro 6/12 mesi;
* nessuna sovrapposizione.

## Calendario

Verificare:

* assenza testo “Sincronizzati nell’URL”;
* filtri automatici;
* query parameter ancora funzionanti;
* stile coerente con Spese.

## ng-select

Verificare:

* icona nelle option;
* icona nel badge selezionato;
* rimozione;
* più badge;
* wrapping;
* categoria senza icona;
* etichetta senza icona;
* light mode;
* dark mode.

---

# Verifica manuale aggiuntiva

Prima di dichiarare completa la Fase 10.5:

1. effettuare login;
2. aprire `/dashboard`;
3. aggiornare manualmente la pagina;
4. verificare che la sessione resti attiva;
5. aprire direttamente una route protetta in una nuova scheda;
6. verificare il ripristino sessione;
7. simulare una sessione scaduta;
8. verificare redirect e return URL;
9. aprire Categorie;
10. verificare che Impostazioni non sia attiva;
11. aprire Etichette;
12. verificare che Impostazioni non sia attiva;
13. aprire Aspetto;
14. cambiare tutti i colori principali;
15. verificare nav item, tab e superfici;
16. aggiornare la pagina;
17. verificare persistenza del colore;
18. aprire Dashboard;
19. verificare l’header Andamento ultimi mesi;
20. provare desktop, tablet e mobile;
21. aprire Calendario;
22. verificare la rimozione del testo tecnico;
23. confrontare il pannello con quello di Spese;
24. aprire tutti i `ng-select` multipli;
25. selezionare categorie ed etichette;
26. verificare icone nei badge;
27. verificare light mode;
28. verificare dark mode.

---

# Criteri aggiuntivi di completamento

La Fase 10.5 non è completa finché:

* il refresh non mantiene correttamente la sessione valida;
* le guard non reindirizzano durante lo stato auth iniziale;
* Categorie ed Etichette non attivano anche Impostazioni;
* il cambio accent color aggiorna i nav item selezionati;
* il cambio accent color aggiorna le superfici accentate;
* l’header della card Andamento ultimi mesi è allineato;
* il Calendario non mostra testi tecnici sui query parameter;
* gli `ng-select` multipli mostrano le icone anche negli elementi selezionati quando pertinenti.


# Test backend

Scrivere o aggiornare test almeno per:

## Spese

* filtri multipli;
* esclusione ricorrenti;
* solo ricorrenti;
* reminder summary;
* isolamento utente;
* nessuna query per riga.

## Categorie ed etichette

* reorder;
* ownership;
* ordine stabile;
* rollback applicativo gestibile.

## Counter

* conteggi corretti;
* filtri;
* soft deleted esclusi;
* ownership.

## Notifiche

* unarchive;
* già disarchiviata;
* ownership;
* passaggio a `READ`.

## Calendario

* intervallo annuale;
* anno bisestile;
* mesi vuoti;
* ownership.

## Etichette form

* compatibilità categoria;
* etichette globali;
* rifiuto combinazioni non valide.

---

# Test frontend

Scrivere o aggiornare test almeno per:

## Tabelle

* barra ricerca visibile;
* ricerca rimossa dai filtri;
* ordinamento crescente;
* ordinamento decrescente;
* terzo click senza ordinamento;
* icona muted;
* `aria-sort`;
* click riga;
* click azione senza navigazione.

## Drag and drop

* reorder categorie;
* reorder etichette;
* disabilitato con filtri;
* rollback;
* azioni sposta su/giù.

## Form spesa

* struttura sezioni;
* categoria;
* filtro etichette;
* categoria non selezionata;
* rimozione etichette incompatibili;
* responsive;
* validazioni.

## Spese

* filtro ricorrenti;
* filtri multipli;
* mese con numero bold;
* promemoria nella riga;
* dettaglio tab;
* azioni header.

## Dashboard

* anno number;
* link categoria;
* link future;
* link prossima spesa;
* descrizione dinamica;
* click grafici;
* riepiloghi;
* prossime spese raggruppate.

## Report

* card condivise;
* click grafici;
* layout coerente.

## Calendario

* vista anno;
* 12 mesi;
* mesi vuoti;
* apertura mese;
* aggiunta spesa.

## Notifiche

* spacing empty state;
* unarchive;
* click outside;
* Escape;
* filtri automatici.

## Ricorrenze

* click riga;
* azioni;
* form senza descrizione;
* note in tabella;
* dettaglio tab.

## Stili globali

* ng-select;
* pulsanti;
* empty state;
* reduced motion;
* route animation;
* dark mode.

---

# Verifica manuale

Al termine verificare almeno:

1. aprire la pagina Spese;
2. verificare ricerca sempre visibile;
3. aprire e chiudere filtri;
4. usare filtri multipli;
5. ordinare una colonna tre volte;
6. verificare icone ordinamento;
7. nascondere spese ricorrenti;
8. visualizzare promemoria sotto una spesa pianificata;
9. creare una spesa;
10. cambiare categoria;
11. verificare etichette disponibili;
12. verificare rimozione etichette incompatibili;
13. aprire dettaglio spesa;
14. verificare tab;
15. aprire categorie;
16. riordinare tramite drag and drop;
17. usare sposta su/giù;
18. aprire etichette;
19. riordinare;
20. verificare counter card;
21. aprire dashboard;
22. cambiare mese e anno;
23. usare link categoria principale;
24. usare link spese future;
25. aprire prossima spesa;
26. cliccare grafico giornaliero;
27. cliccare grafico categorie;
28. cliccare andamento mensile;
29. verificare prossime spese raggruppate;
30. aprire report mensile;
31. aprire confronto mensile;
32. verificare coerenza;
33. aprire calendario annuale;
34. verificare tutti i mesi;
35. verificare mesi vuoti;
36. aprire notifiche;
37. archiviare e disarchiviare;
38. aprire dropdown e cliccare fuori;
39. verificare filtri automatici;
40. aprire ricorrenze;
41. verificare riga cliccabile;
42. creare ricorrenza senza campo descrizione;
43. verificare note in tabella;
44. aprire dettaglio ricorrenza;
45. verificare tab;
46. aprire categoria ed etichetta;
47. verificare catalogo icone;
48. verificare campi colore;
49. verificare tutte le date;
50. verificare light mode;
51. verificare dark mode;
52. verificare reduced motion;
53. verificare mobile;
54. verificare tablet;
55. verificare desktop.

---

# Verifica finale obbligatoria

Al termine:

1. eseguire `git diff --check`;
2. eseguire `prisma format`;
3. eseguire `prisma validate`;
4. generare Prisma Client se necessario;
5. applicare eventuali migrazioni;
6. eseguire seed development;
7. eseguire test backend;
8. eseguire test frontend;
9. eseguire lint;
10. eseguire type checking;
11. eseguire build backend;
12. eseguire build frontend;
13. verificare Docker Compose;
14. verificare Swagger;
15. verificare tutte le tabelle;
16. verificare tutti i pannelli filtri;
17. verificare tutti gli `ng-select`;
18. verificare i grafici;
19. verificare light mode;
20. verificare dark mode;
21. verificare responsive;
22. correggere tutti gli errori trovati.

Eseguire i comandi separatamente se l’ambiente presenta problemi con stdout o stderr.

Non dichiarare superate verifiche non realmente eseguite.

---

# Criteri di completamento

La Fase 10.5 è completa soltanto quando:

* la ricerca è sempre separata dai filtri;
* i filtri si applicano automaticamente;
* tutte le tabelle usano ordinamento a tre stati;
* le colonne ordinabili mostrano l’icona muted;
* categorie ed etichette sono riordinabili;
* il form spesa è leggibile;
* le etichette rispettano la categoria;
* le spese ricorrenti possono essere nascoste;
* i promemoria sono visibili nella tabella Spese;
* il dettaglio spesa usa nav tab;
* le card dashboard navigano ai dati;
* i grafici sono interattivi;
* report e dashboard sono coerenti;
* il calendario possiede la vista annuale;
* le notifiche possono essere disarchiviate;
* i filtri Notifiche e Ricorrenze sono automatici;
* la tabella Ricorrenze è coerente con quella Spese;
* il campo descrizione ricorrenza non è più mostrato;
* tutte le date usano formato esteso;
* i grafici Angular usano `ng2-charts`;
* `ng-select` è stilizzato ovunque;
* light e dark mode sono coerenti;
* test e build principali superano.

---

# Output finale richiesto all’agente

Concludere con un riepilogo strutturato contenente:

## Tabelle

* componenti condivisi creati;
* ricerca;
* filtri;
* ordinamento;
* righe cliccabili;
* drag and drop.

## Spese

* form;
* etichette;
* filtri;
* promemoria;
* dettaglio.

## Dashboard e report

* card;
* navigazioni;
* grafici;
* riepiloghi;
* prossime spese.

## Calendario

* vista annuale;
* mesi vuoti;
* caricamento dati.

## Notifiche

* disarchiviazione;
* dropdown;
* filtri.

## Ricorrenze

* tabella;
* form;
* note;
* dettaglio.

## Stile globale

* date;
* ng-select;
* pulsanti;
* card;
* transizioni;
* scrollbar;
* light e dark mode.

## Backend

* endpoint modificati;
* query;
* migrazioni;
* compatibilità.

## Verifiche

* test realmente eseguiti;
* build realmente eseguite;
* Swagger;
* Docker;
* responsive;
* accessibilità;
* problemi residui.

Non limitarsi al riepilogo: implementare prima integralmente le modifiche.
