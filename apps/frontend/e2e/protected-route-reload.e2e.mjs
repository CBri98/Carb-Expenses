import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const frontendUrl = process.env['E2E_FRONTEND_URL'] ?? 'http://localhost:4200';
const apiUrl = process.env['E2E_API_URL'] ?? 'http://localhost:3000/api/v1';
const email = process.env['E2E_EMAIL'] ?? 'demo@expense.local';
const password = process.env['E2E_PASSWORD'] ?? 'DemoExpense2026!';
const requestedPath = '/calendar?view=week&date=2026-07-18&status=PLANNED';

async function run() {
const chrome = findChrome();
const profile = mkdtempSync(join(tmpdir(), 'carbexpenses-e2e-reload-'));
const processHandle = spawn(chrome, [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--remote-debugging-port=0',
  `--user-data-dir=${profile}`,
  '--window-size=1280,900',
  `${frontendUrl}/auth/login`,
], { stdio: 'ignore' });

let socket;
let testError;

try {
  await ensureService(`${apiUrl}/health`);
  await ensureService(frontendUrl);
  const port = await devtoolsPort(profile);
  const page = await browserPage(port);
  socket = new CdpClient(page.webSocketDebuggerUrl);
  await socket.ready();
  await socket.command('Runtime.enable');
  await socket.command('Page.enable');
  await socket.command('Network.enable');
  await socket.command('Page.navigate', { url: `${frontendUrl}/auth/login` });
  await waitFor(
    socket,
    `location.origin === ${JSON.stringify(frontendUrl)} && document.readyState !== 'loading'`,
    'pagina login',
  );

  const loginStatus = await socket.evaluate(`fetch(${JSON.stringify(`${apiUrl}/auth/login`)}, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ${JSON.stringify(email)}, password: ${JSON.stringify(password)} })
  }).then(response => response.status)`);
  assert(loginStatus === 200, `Login E2E fallito con stato ${loginStatus}`);

  // Simula un profilo creato prima dell'estensione del path del refresh cookie.
  // Entrambi i cookie omonimi vengono inviati a /auth/refresh: il backend deve
  // ignorare quello legacy e rimuoverlo durante la rotazione del token.
  const legacyCookie = await socket.command('Network.setCookie', {
    name: 'refresh_token',
    value: 'legacy.invalid.refresh-token',
    url: apiUrl,
    path: '/api/v1/auth',
    httpOnly: true,
    sameSite: 'Lax',
  });
  assert(legacyCookie.success !== false, 'Impossibile predisporre il cookie legacy E2E');

  await socket.evaluate(`location.href = ${JSON.stringify(`${frontendUrl}${requestedPath}`)}`);
  await waitFor(
    socket,
    "location.pathname === '/calendar' && Boolean(document.querySelector('app-calendar-page'))",
    'route protetta iniziale',
  );

  const navigations = [];
  socket.on('Page.frameNavigated', (params) => {
    if (!params.frame.parentId) navigations.push(params.frame.url);
  });
  await socket.command('Page.reload', { ignoreCache: false });
  await waitFor(
    socket,
    "document.readyState === 'complete' && location.pathname === '/calendar' && Boolean(document.querySelector('app-calendar-page'))",
    'route protetta dopo reload',
  );

  const result = await socket.evaluate(`({
    pathname: location.pathname,
    search: location.search,
    loginVisible: Boolean(document.querySelector('app-login')),
    calendarVisible: Boolean(document.querySelector('app-calendar-page'))
  })`);
  assert(result.pathname === '/calendar', `Route finale inattesa: ${result.pathname}`);
  assert(result.search === requestedPath.slice(requestedPath.indexOf('?')), `Query string persa: ${result.search}`);
  assert(result.calendarVisible === true, 'La pagina Calendario non è visibile dopo il reload');
  assert(result.loginVisible === false, 'La pagina Login è visibile dopo il reload');
  assert(
    navigations.every((url) => !new URL(url).pathname.startsWith('/auth/login')),
    `Redirect intermedio al login: ${navigations.join(', ')}`,
  );

  await socket.command('Page.navigate', { url: `${frontendUrl}/settings/categories` });
  await waitFor(socket, "location.pathname === '/settings/categories' && Boolean(document.querySelector('app-categories'))", 'pagina categorie');
  const activeEntries = await socket.evaluate(`Array.from(document.querySelectorAll('.sidebar__nav a.active')).map(item => item.textContent.trim()).filter(Boolean)`);
  assert(JSON.stringify(activeEntries) === JSON.stringify(['Categorie']), `Voci sidebar attive inattese: ${activeEntries.join(', ')}`);
  const navigationHierarchy = await socket.evaluate(`(() => {
    const sections = Array.from(document.querySelectorAll('.sidebar__section')).map((section) => {
      const items = [];
      let sibling = section.nextElementSibling;
      while (sibling && !sibling.classList.contains('sidebar__section')) {
        if (sibling.matches('a')) items.push(sibling.querySelector('span')?.textContent.trim() || '');
        sibling = sibling.nextElementSibling;
      }
      return { label: section.textContent.trim(), items };
    });
    const breadcrumbItems = Array.from(document.querySelectorAll('app-breadcrumb .breadcrumb-item')).map((item) => item.textContent.trim());
    const breadcrumbLink = document.querySelector('app-breadcrumb a')?.getAttribute('href') || '';
    return { sections, breadcrumbItems, breadcrumbLink };
  })()`);
  const managementSection = navigationHierarchy.sections.find((section) => section.label === 'Gestione');
  const personalSection = navigationHierarchy.sections.find((section) => section.label === 'Area personale');
  assert(JSON.stringify(managementSection?.items) === JSON.stringify(['Spese', 'Spese ricorrenti', 'Promemoria', 'Categorie', 'Etichette']), `Sezione Gestione inattesa: ${JSON.stringify(managementSection)}`);
  assert(navigationHierarchy.sections.at(-1)?.label === 'Area personale', 'Area personale non Ã¨ l ultima sezione della sidebar');
  assert(JSON.stringify(personalSection?.items) === JSON.stringify(['Notifiche', 'Impostazioni']), `Sezione Area personale inattesa: ${JSON.stringify(personalSection)}`);
  assert(JSON.stringify(navigationHierarchy.breadcrumbItems) === JSON.stringify(['Gestione', 'Categorie']), `Breadcrumb Categorie inatteso: ${navigationHierarchy.breadcrumbItems.join(' > ')}`);
  assert(navigationHierarchy.breadcrumbLink === '/expenses', `Link Gestione inatteso: ${navigationHierarchy.breadcrumbLink}`);
  await socket.evaluate(`document.querySelector('app-breadcrumb a').click()`);
  await waitFor(socket, "location.pathname === '/expenses' && Boolean(document.querySelector('app-expenses-page'))", 'link breadcrumb Gestione');
  await socket.command('Page.navigate', { url: `${frontendUrl}/settings/categories` });
  await waitFor(socket, "location.pathname === '/settings/categories' && Boolean(document.querySelector('app-categories'))", 'ritorno categorie');

  const visualTokens = await socket.evaluate(`(() => {
    const root = document.documentElement;
    const active = document.querySelector('.sidebar__nav a.active');
    const sidebar = document.querySelector('.sidebar');
    const topbar = document.querySelector('.topbar');
    const bodyTransition = getComputedStyle(document.body).transitionDuration;
    const sidebarTransition = getComputedStyle(sidebar).transitionDuration;
    const transitionFreeze = document.createElement('style');
    transitionFreeze.textContent = '*,*::before,*::after{transition:none!important}';
    document.head.append(transitionFreeze);
    const probe = document.createElement('span');
    probe.style.background = 'var(--surface-soft)';
    const linkProbe = document.createElement('a');
    linkProbe.style.color = 'rgb(var(--bs-link-color-rgb))';
    document.body.append(probe, linkProbe);
    const snapshot = () => ({
      active: getComputedStyle(active).backgroundColor,
      sidebar: getComputedStyle(sidebar).backgroundColor,
      topbar: getComputedStyle(topbar).backgroundColor,
      surfaceSoft: getComputedStyle(probe).backgroundColor,
      link: getComputedStyle(linkProbe).color,
    });
    const originalTheme = root.dataset.theme;
    const originalAccent = root.dataset.accent;
    root.dataset.theme = 'light';
    root.dataset.accent = 'mint';
    const mintLight = snapshot();
    const lightSurface = getComputedStyle(root).getPropertyValue('--surface').trim();
    root.dataset.accent = 'rose';
    const roseLight = snapshot();
    root.dataset.theme = 'dark';
    root.dataset.accent = 'mint';
    const mintDark = snapshot();
    const darkSurface = getComputedStyle(root).getPropertyValue('--surface').trim();
    root.dataset.accent = 'rose';
    const roseDark = snapshot();
    root.dataset.theme = originalTheme || 'light';
    root.dataset.accent = originalAccent || 'indigo';
    const navMargin = Number.parseFloat(getComputedStyle(document.querySelector('.sidebar__nav a')).marginTop);
    const expectedNavMargin = Number.parseFloat(getComputedStyle(root).fontSize) * .25;
    transitionFreeze.remove();
    probe.remove();
    linkProbe.remove();
    return { mintLight, roseLight, mintDark, roseDark, lightSurface, darkSurface, navMargin, expectedNavMargin, bodyTransition, sidebarTransition };
  })()`);
  for (const mode of ['Light', 'Dark']) {
    const mint = visualTokens[`mint${mode}`];
    const rose = visualTokens[`rose${mode}`];
    assert(mint.active !== rose.active, `Il nav item attivo non reagisce al cambio accent color in tema ${mode}`);
    assert(mint.sidebar !== rose.sidebar, `--sidebar-bg non reagisce al cambio accent color in tema ${mode}`);
    assert(mint.topbar !== rose.topbar, `--topbar-translucent non reagisce al cambio accent color in tema ${mode}`);
    assert(mint.surfaceSoft !== rose.surfaceSoft, `--surface-soft non reagisce al cambio accent color in tema ${mode}`);
    assert(mint.link !== rose.link, `--bs-link-color-rgb non reagisce al cambio accent color in tema ${mode}`);
  }
  assert(visualTokens.lightSurface !== visualTokens.darkSurface, 'Le superfici light e dark risultano identiche');
  assert(Math.abs(visualTokens.navMargin - visualTokens.expectedNavMargin) < .1, `Margine sidebar inatteso: ${visualTokens.navMargin}px`);
  assert(!visualTokens.bodyTransition.startsWith('0s') && !visualTokens.sidebarTransition.split(',').every(value => value.trim() === '0s'), 'Transizione cambio tema assente');

  const widths = [320, 390, 768, 1440];
  const responsive = [];
  for (const width of widths) {
    await socket.command('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    await delay(300);
    responsive.push(await socket.evaluate(`({ requestedWidth: ${width}, width: innerWidth, scrollWidth: document.documentElement.scrollWidth, overflow: document.documentElement.scrollWidth > innerWidth + 1 })`));
  }
  assert(responsive.every((entry) => entry.width === entry.requestedWidth), `Viewport responsive non applicato esattamente: ${JSON.stringify(responsive)}`);
  assert(responsive.every((entry) => !entry.overflow), `Overflow orizzontale rilevato: ${JSON.stringify(responsive)}`);
  await socket.command('Emulation.clearDeviceMetricsOverride');

  const categoryCardsInteractive = await socket.evaluate(`document.querySelectorAll('app-counter-card [role="button"]').length >= 4`);
  assert(categoryCardsInteractive, 'Le counter card Categorie non sono interattive');
  await socket.evaluate(`(() => { const input = document.querySelector('#category-search'); input.value = 'Casa'; input.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  await waitFor(socket, "new URLSearchParams(location.search).get('search') === 'Casa'", 'query parameter ricerca categorie');
  const disabledReorderHint = await socket.evaluate(`document.querySelector('.drag-handle')?.getAttribute('title') || ''`);
  assert(disabledReorderHint.includes('Rimuovi ricerca'), 'Tooltip riordino disabilitato non disponibile');

  await socket.command('Page.navigate', { url: `${frontendUrl}/dashboard?month=7&year=2026` });
  await waitFor(socket, "location.pathname === '/dashboard' && document.querySelectorAll('.stat-card').length >= 6 && document.querySelectorAll('.chart-insights').length >= 2", 'dashboard rifinita');
  const dashboardRefinement = await socket.evaluate(`(() => {
    const cards = Array.from(document.querySelectorAll('.stat-card'));
    const nextExpenseCard = cards.find(card => card.querySelector('.stat-card__title')?.textContent.trim() === 'Prossima spesa');
    const due = document.querySelector('app-upcoming-expenses .due');
    const colorProbe = document.createElement('span');
    colorProbe.style.color = 'var(--primary-strong)';
    document.body.append(colorProbe);
    const badge = document.querySelector('.stat-card__badge');
    const badgeCard = badge?.closest('.stat-card');
    const disclosure = document.querySelector('.chart-data-disclosure');
    if (disclosure) disclosure.open = true;
    const result = {
      eyebrow: document.querySelector('app-dashboard .section-eyebrow')?.textContent.trim() || '',
      categoryAlternatives: document.querySelectorAll('.category-summary__link').length,
      categoryVisibilityButtons: document.querySelectorAll('.category-visibility').length,
      dailyInsights: document.querySelectorAll('.chart-insights:first-of-type > div').length,
      hasNumericUserDate: /\\b\\d{2}\\/\\d{2}\\/\\d{4}\\b/.test(document.querySelector('app-dashboard')?.textContent || ''),
      badgeAbsolute: badge ? getComputedStyle(badge).position === 'absolute' : false,
      badgeInsideCard: Boolean(badgeCard && badge.getBoundingClientRect().top >= badgeCard.getBoundingClientRect().top),
      nextExpenseBodyGrows: getComputedStyle(nextExpenseCard?.querySelector('.stat-card__body')).flexGrow === '1',
      strongCardDetails: document.querySelectorAll('.stat-card__detail strong').length,
      strongHistoryPeak: document.querySelectorAll('#history-title + p strong').length,
      upcomingDueUsesAccent: due ? getComputedStyle(due).color === getComputedStyle(colorProbe).color : true,
      rowHeights: cards.map(card => Math.round(card.getBoundingClientRect().height)),
      disclosureRows: disclosure?.querySelectorAll('tbody tr').length || 0,
      disclosureColumns: Array.from(disclosure?.querySelectorAll('th') || []).map(item => item.textContent.trim()),
      trendMonths: document.querySelector('.dashboard-trend-months .ng-value-label')?.textContent.trim() || ''
    };
    colorProbe.remove();
    return result;
  })()`);
  assert(dashboardRefinement.eyebrow === 'Panoramica', `Sovratitolo Dashboard inatteso: ${dashboardRefinement.eyebrow}`);
  assert(dashboardRefinement.categoryAlternatives > 0, 'Legenda categorie Dashboard non interattiva');
  assert(dashboardRefinement.categoryVisibilityButtons === dashboardRefinement.categoryAlternatives, 'Pulsanti visibilità categorie mancanti');
  assert(dashboardRefinement.dailyInsights >= 3, 'Insight sintetici Dashboard mancanti');
  assert(!dashboardRefinement.hasNumericUserDate, 'Dashboard mostra ancora date DD/MM/YYYY');
  assert(dashboardRefinement.badgeAbsolute && dashboardRefinement.badgeInsideCard, 'Badge StatCard non posizionato in alto nella card');
  assert(dashboardRefinement.nextExpenseBodyGrows, 'Il body della card Prossima spesa non usa lo spazio orizzontale disponibile');
  assert(dashboardRefinement.strongCardDetails >= 5, 'Valori informativi delle StatCard non evidenziati in grassetto');
  assert(dashboardRefinement.strongHistoryPeak === 2, 'Massimo storico Dashboard non evidenziato semanticamente');
  assert(dashboardRefinement.upcomingDueUsesAccent, 'La scadenza nelle Prossime spese usa ancora un colore non coerente con l accent');
  assert(new Set(dashboardRefinement.rowHeights.slice(3)).size === 1, `Badge StatCard altera l’allineamento della riga: ${dashboardRefinement.rowHeights.join(', ')}`);
  assert(dashboardRefinement.disclosureRows > 0 && dashboardRefinement.disclosureColumns.join('|') === 'Data|Totale|Spese', 'Dati giornalieri espansi non strutturati');
  assert(dashboardRefinement.trendMonths.includes('12 mesi'), `Default storico inatteso: ${dashboardRefinement.trendMonths}`);
  await socket.evaluate(`document.querySelector('.category-visibility')?.click()`);
  await waitFor(socket, "document.querySelector('.category-visibility')?.getAttribute('aria-pressed') === 'false' && document.querySelector('.category-visibility')?.closest('li')?.classList.contains('category-summary__item--hidden')", 'categoria nascosta dal grafico');
  const categoryToggle = true;
  await socket.evaluate(`document.querySelector('.category-visibility')?.click()`);
  await waitFor(socket, "document.querySelector('.category-visibility')?.getAttribute('aria-pressed') === 'true'", 'categoria ripristinata nel grafico');

  await socket.command('Page.navigate', { url: `${frontendUrl}/expenses/new` });
  await waitFor(socket, "location.pathname === '/expenses/new' && Boolean(document.querySelector('app-expense-form'))", 'form spesa rifinito');
  const expenseFormSections = await socket.evaluate(`Array.from(document.querySelectorAll('app-expense-form .form-section__title')).map(item => item.textContent.trim())`);
  assert(expenseFormSections.includes('Dati principali'), `Sezione Dati principali assente: ${expenseFormSections.join(', ')}`);
  assert(expenseFormSections.includes('Classificazione'), `Sezione Classificazione assente: ${expenseFormSections.join(', ')}`);
  assert(expenseFormSections.includes('Dettagli'), `Sezione Dettagli assente: ${expenseFormSections.join(', ')}`);
  const expenseFormCards = await socket.evaluate(`({ count: document.querySelectorAll('app-expense-form .form-section').length, nestedInOuterCard: Boolean(document.querySelector('app-expense-form .form-section')?.parentElement?.closest('.card')) })`);
  assert(expenseFormCards.count >= 3 && !expenseFormCards.nestedInOuterCard, 'Form Spesa non presentato come card separate');

  await socket.command('Page.navigate', { url: `${frontendUrl}/expenses` });
  await waitFor(socket, "location.pathname === '/expenses' && Boolean(document.querySelector('#expense-search')) && Boolean(document.querySelector('app-expense-table'))", 'lista spese 10.6');
  const expensesRefinement = await socket.evaluate(`({
    eyebrow: document.querySelector('app-expenses-page app-page-header p')?.textContent.trim() || '',
    searchInCard: Boolean(document.querySelector('#expense-search')?.closest('.card')),
    fullMonthInTable: /(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)/i.test(document.querySelector('app-expense-table tbody')?.textContent || ''),
    recurringIndicatorsAreBadges: document.querySelectorAll('app-recurrence-expense-indicator .badge').length,
    recurringTextIndicators: document.querySelectorAll('app-recurrence-expense-indicator .recurrence-expense-link').length
  })`);
  assert(expensesRefinement.eyebrow === 'Gestione', `Sovratitolo Spese inatteso: ${expensesRefinement.eyebrow}`);
  assert(expensesRefinement.searchInCard, 'Ricerca Spese fuori dalla card');
  assert(expensesRefinement.fullMonthInTable, 'Le date della tabella Spese non mostrano il mese completo');
  assert(expensesRefinement.recurringIndicatorsAreBadges === 0, 'Indicatore Spesa ricorrente ancora in formato badge');
  await socket.evaluate(`if (!document.querySelector('#expense-filter-category')) document.querySelector('app-expense-filters .filters__toggle')?.click()`);
  await waitFor(socket, "Boolean(document.querySelector('#expense-filter-category'))", 'filtri spese aperti');
  await socket.evaluate(`document.querySelector('#expense-filter-category')?.closest('.ng-select-container')?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))`);
  await waitFor(socket, "Boolean(document.querySelector('.ng-dropdown-panel .ng-option:not(.ng-option-disabled)'))", 'opzioni categorie spese');
  await socket.evaluate(`document.querySelector('.ng-dropdown-panel .ng-option:not(.ng-option-disabled)')?.click()`);
  await waitFor(socket, "Boolean(document.querySelector('app-expense-filters app-multiselect-value'))", 'chip multiselect categoria');
  const multiselectChip = await socket.evaluate(`(() => { const chip = document.querySelector('app-expense-filters app-multiselect-value'); const button = chip?.querySelector('button'); const style = chip ? getComputedStyle(chip.querySelector('.multi-value__label')) : null; return { removeButton: Boolean(button), removeLabel: button?.getAttribute('aria-label') || '', paddingLeft: style?.paddingLeft || '0px', colorVariable: chip?.querySelector('.multi-value')?.getAttribute('style') || '' }; })()`);
  assert(multiselectChip.removeButton && multiselectChip.removeLabel.startsWith('Rimuovi '), 'Crocetta individuale multiselect assente');
  assert(parseFloat(multiselectChip.paddingLeft) > 0 && multiselectChip.colorVariable.includes('--multi-value-color'), 'Padding o colore chip multiselect non applicato');

  await socket.command('Page.navigate', { url: `${frontendUrl}/reports/monthly?month=7&year=2026` });
  await waitFor(socket, "location.pathname === '/reports/monthly' && Boolean(document.querySelector('#monthly-search')) && Boolean(document.querySelector('app-monthly-report-page app-filter-panel'))", 'report mensile rifinito');
  const monthlyReportRefinement = await socket.evaluate(`({
    eyebrow: document.querySelector('app-monthly-report-page .section-eyebrow')?.textContent.trim() || '',
    nativeSelects: document.querySelectorAll('app-monthly-report-page select').length,
    filterPanels: document.querySelectorAll('app-monthly-report-page app-filter-panel').length,
    accessibleChartLinks: document.querySelectorAll('app-monthly-report-page .report-data-link, app-monthly-report-page .category-list__button').length
  })`);
  assert(monthlyReportRefinement.eyebrow === 'Analisi', `Sovratitolo Report inatteso: ${monthlyReportRefinement.eyebrow}`);
  assert(monthlyReportRefinement.nativeSelects === 0, 'Il Report mensile contiene ancora select native');
  assert(monthlyReportRefinement.filterPanels > 0, 'FilterPanel Report mensile assente');
  assert(monthlyReportRefinement.accessibleChartLinks > 0, 'Alternative interattive ai grafici del Report mensile assenti');

  await socket.command('Page.navigate', { url: `${frontendUrl}/reports/compare?monthA=6&yearA=2026&monthB=7&yearB=2026` });
  await waitFor(socket, "location.pathname === '/reports/compare' && document.querySelectorAll('app-dashboard-chart').length >= 3 && Boolean(document.querySelector('app-filter-panel'))", 'confronto mensile rifinito');

  await socket.command('Page.navigate', { url: `${frontendUrl}/recurrences` });
  await waitFor(socket, "location.pathname === '/recurrences' && Boolean(document.querySelector('app-recurrences-page')) && Boolean(document.querySelector('#recurrence-search'))", 'lista ricorrenze');
  await waitFor(socket, "Array.from(document.querySelectorAll('a')).some(item => /^\\/recurrences\\/[0-9a-f-]+$/i.test(item.getAttribute('href') || ''))", 'prima ricorrenza');
  await socket.evaluate(`if (!document.querySelector('app-recurrences-page .filters__panel')) document.querySelector('app-recurrences-page .filters__toggle')?.click()`);
  await waitFor(socket, "Boolean(document.querySelector('app-recurrences-page .filters__panel'))", 'filtri ricorrenze aperti');
  const recurrenceRefinement = await socket.evaluate(`({ eyebrow: document.querySelector('app-recurrences-page app-page-header p')?.textContent.trim() || '', counterIcons: document.querySelectorAll('app-recurrences-page app-counter-card .counter-card__icon').length, nestedFilterCards: document.querySelectorAll('app-recurrences-page .filters__panel .card').length, resetSemantic: Array.from(document.querySelectorAll('app-recurrences-page button')).some(item => item.textContent.trim() === 'Reimposta'), tableHover: document.querySelector('app-recurrences-page table')?.classList.contains('table-hover') || false, rowTransition: getComputedStyle(document.querySelector('app-recurrences-page tbody tr')).transitionDuration })`);
  assert(recurrenceRefinement.eyebrow === 'Gestione', `Sovratitolo Ricorrenze inatteso: ${recurrenceRefinement.eyebrow}`);
  assert(recurrenceRefinement.counterIcons === 4, 'Icone counter card Ricorrenze mancanti');
  assert(recurrenceRefinement.nestedFilterCards === 0, 'Card annidata nei filtri Ricorrenze');
  assert(recurrenceRefinement.resetSemantic, 'Semantica Reimposta assente nei filtri Ricorrenze');
  assert(recurrenceRefinement.tableHover && !recurrenceRefinement.rowTransition.split(',').every(value => value.trim() === '0s'), 'Hover tabella Ricorrenze non allineato alla tabella Spese');
  const detailPath = await socket.evaluate(`Array.from(document.querySelectorAll('a')).map(item => item.getAttribute('href') || '').find(path => /^\\/recurrences\\/[0-9a-f-]+$/i.test(path)) || ''`);
  assert(/^\/recurrences\/[0-9a-f-]+$/i.test(detailPath), `Link dettaglio ricorrenza non trovato: ${detailPath}`);
  const recurrenceSearch = await socket.evaluate(`document.querySelector('tbody tr strong')?.textContent.trim() || ''`);
  assert(Boolean(recurrenceSearch), 'Nome ricorrenza non trovato per la ricerca E2E');
  await socket.evaluate(`(() => { const input = document.querySelector('#recurrence-search'); input.value = ${JSON.stringify(recurrenceSearch)}; input.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  await waitFor(socket, `new URLSearchParams(location.search).get('search') === ${JSON.stringify(recurrenceSearch)}`, 'ricerca ricorrenze con debounce');

  await socket.command('Page.navigate', { url: `${frontendUrl}/recurrences/new` });
  await waitFor(socket, "location.pathname === '/recurrences/new' && Boolean(document.querySelector('app-recurrence-form'))", 'form nuova ricorrenza');
  const hasDescriptionField = await socket.evaluate(`Boolean(document.querySelector('#recurrence-description'))`);
  assert(!hasDescriptionField, 'Il campo descrizione duplicato è ancora presente nel form Ricorrenza');

  await socket.command('Page.navigate', { url: `${frontendUrl}${detailPath}` });
  await waitFor(socket, "Boolean(document.querySelector('app-recurrence-detail')) && document.querySelectorAll('[role=tab]').length === 3", 'dettaglio ricorrenza con tab');
  await socket.evaluate(`document.querySelector('#recurrence-tab-occurrences').click()`);
  await waitFor(socket, "Boolean(document.querySelector('#recurrence-panel-occurrences'))", 'tab occorrenze ricorrenza');

  await socket.command('Page.navigate', { url: `${frontendUrl}/reminders?status=UPCOMING&pageSize=5` });
  await waitFor(socket, "location.pathname === '/reminders' && Boolean(document.querySelector('app-reminders-page')) && document.querySelectorAll('app-reminders-page app-counter-card').length === 6", 'gestione promemoria');
  await socket.evaluate(`if (!document.querySelector('#reminder-status-filter')) document.querySelector('app-reminders-page .filters__toggle')?.click()`);
  await waitFor(socket, "Boolean(document.querySelector('#reminder-status-filter'))", 'filtri promemoria aperti');
  const remindersRefinement = await socket.evaluate(`({
    eyebrow: document.querySelector('app-reminders-page app-page-header p')?.textContent.trim() || '',
    breadcrumbItems: Array.from(document.querySelectorAll('app-reminders-page app-breadcrumb .breadcrumb-item')).map(item => item.textContent.trim()),
    activeSidebar: Array.from(document.querySelectorAll('.sidebar__nav a.active')).map(item => item.textContent.trim()).filter(Boolean),
    counterRows: new Set(Array.from(document.querySelectorAll('app-reminders-page app-counter-card')).map(card => Math.round(card.getBoundingClientRect().top))).size,
    queryStatus: new URLSearchParams(location.search).get('status'),
    queryPageSize: new URLSearchParams(location.search).get('pageSize'),
    filters: ['#reminder-status-filter', '#reminder-type-filter', '#reminder-source-filter', '#reminder-expense-status-filter', '#reminder-category-filter', '#reminder-recurrence-filter', '#scheduled-from', '#scheduled-to', '#expense-date-from', '#expense-date-to'].every(selector => Boolean(document.querySelector(selector))),
    nestedFilterCards: document.querySelectorAll('app-reminders-page .filters__panel .card').length,
    desktopRows: document.querySelectorAll('app-reminders-page tbody tr').length,
    mobileCards: document.querySelectorAll('app-reminders-page .reminder-card').length,
    styledTable: Boolean(document.querySelector('app-reminders-page table.reminders-table')),
    styledHeaders: getComputedStyle(document.querySelector('app-reminders-page table.reminders-table thead th')).backgroundColor !== 'rgba(0, 0, 0, 0)',
    rowTransitionProperty: getComputedStyle(document.querySelector('app-reminders-page .reminder-row')).transitionProperty,
    typeBadges: document.querySelectorAll('app-reminders-page table app-reminder-type-badge').length,
    categoryBadges: document.querySelectorAll('app-reminders-page table app-category-badge').length
  })`);
  assert(remindersRefinement.eyebrow === 'Gestione', `Sovratitolo Promemoria inatteso: ${remindersRefinement.eyebrow}`);
  assert(JSON.stringify(remindersRefinement.breadcrumbItems) === JSON.stringify(['Gestione', 'Promemoria']), `Breadcrumb Promemoria inatteso: ${remindersRefinement.breadcrumbItems.join(' > ')}`);
  assert(JSON.stringify(remindersRefinement.activeSidebar) === JSON.stringify(['Promemoria']), `Voce Promemoria non univocamente attiva: ${remindersRefinement.activeSidebar.join(', ')}`);
  assert(remindersRefinement.queryStatus === 'UPCOMING' && remindersRefinement.queryPageSize === '5', 'Query Promemoria non persistita');
  assert(remindersRefinement.filters && remindersRefinement.nestedFilterCards === 0, 'Filtri Promemoria incompleti o con card annidate');
  assert(remindersRefinement.desktopRows > 0 && remindersRefinement.mobileCards > 0, 'Vista desktop/mobile Promemoria senza dati seed');
  assert(remindersRefinement.counterRows === 2, `Le counter card Promemoria non occupano due righe: ${remindersRefinement.counterRows}`);
  assert(remindersRefinement.styledTable && remindersRefinement.styledHeaders, 'Stile gestionale della tabella Promemoria assente');
  assert(remindersRefinement.rowTransitionProperty.includes('background-color') && remindersRefinement.rowTransitionProperty.includes('box-shadow'), 'Hover delle righe Promemoria assente');
  assert(remindersRefinement.typeBadges > 0 && remindersRefinement.categoryBadges > 0, 'Badge delle colonne Promemoria mancanti');
  await socket.command('Page.reload', { ignoreCache: false });
  await waitFor(socket, "document.readyState === 'complete' && location.pathname === '/reminders' && new URLSearchParams(location.search).get('status') === 'UPCOMING' && Boolean(document.querySelector('app-reminders-page'))", 'reload promemoria con query');

  await socket.command('Page.navigate', { url: `${frontendUrl}/notifications` });
  await waitFor(socket, "location.pathname === '/notifications' && Boolean(document.querySelector('app-notifications-page'))", 'notifiche 10.6');
  const notificationRefinement = await socket.evaluate(`({
    eyebrow: document.querySelector('app-notifications-page app-page-header p')?.textContent.trim() || '',
    counterIcons: document.querySelectorAll('app-notifications-page app-counter-card .counter-card__icon').length,
    themedReadAll: Boolean(Array.from(document.querySelectorAll('app-notifications-page button')).find(item => item.textContent.includes('Segna tutte come lette'))?.classList.contains('btn-primary')),
    breadcrumbItems: Array.from(document.querySelectorAll('app-breadcrumb .breadcrumb-item')).map(item => item.textContent.trim()),
    personalHref: document.querySelector('app-breadcrumb a')?.getAttribute('href') || ''
  })`);
  assert(notificationRefinement.eyebrow === 'Area personale', `Sovratitolo Notifiche inatteso: ${notificationRefinement.eyebrow}`);
  assert(notificationRefinement.counterIcons === 2, 'Icone counter card Notifiche mancanti');
  assert(notificationRefinement.themedReadAll, 'Pulsante Segna tutte come lette non tematizzato');
  assert(JSON.stringify(notificationRefinement.breadcrumbItems) === JSON.stringify(['Area personale', 'Notifiche']), `Breadcrumb Notifiche inatteso: ${notificationRefinement.breadcrumbItems.join(' > ')}`);
  assert(notificationRefinement.personalHref === '/notifications', `Link Area personale inatteso: ${notificationRefinement.personalHref}`);
  await socket.command('Page.navigate', { url: `${frontendUrl}/settings/account` });
  await waitFor(socket, "location.pathname === '/settings/account' && Boolean(document.querySelector('app-settings-page'))", 'impostazioni area personale');
  const settingsBreadcrumb = await socket.evaluate(`({ eyebrow: document.querySelector('app-settings-page .eyebrow')?.textContent.trim() || '', items: Array.from(document.querySelectorAll('app-breadcrumb .breadcrumb-item')).map(item => item.textContent.trim()), href: document.querySelector('app-breadcrumb a')?.getAttribute('href') || '' })`);
  assert(settingsBreadcrumb.eyebrow === 'Area personale', `Sovratitolo Impostazioni inatteso: ${settingsBreadcrumb.eyebrow}`);
  assert(JSON.stringify(settingsBreadcrumb.items) === JSON.stringify(['Area personale', 'Impostazioni']), `Breadcrumb Impostazioni inatteso: ${settingsBreadcrumb.items.join(' > ')}`);
  await socket.evaluate(`document.querySelector('app-breadcrumb a').click()`);
  await waitFor(socket, "location.pathname === '/notifications' && Boolean(document.querySelector('app-notifications-page'))", 'link breadcrumb Area personale');

  await socket.evaluate(`fetch(${JSON.stringify(`${apiUrl}/auth/logout`)}, {
    method: 'POST', credentials: 'include'
  }).then(response => response.status)`);
  console.log(JSON.stringify({
    passed: true,
    requestedPath,
    finalPath: `${result.pathname}${result.search}`,
    navigationCount: navigations.length,
    loginRedirectObserved: false,
    legacyCookieCollisionCovered: true,
    sidebarSingleActiveEntry: activeEntries,
    navigationHierarchy,
    accentColorsReact: true,
    lightDarkSurfacesDiffer: true,
    responsiveWidths: responsive,
    categoryFiltersPersistInUrl: true,
    dashboardRefinement,
    expenseFormSections,
    expenseFormCards,
    expensesRefinement,
    multiselectChip,
    monthlyReportRefinement,
    comparisonChartsInteractive: true,
    recurrenceRefinement,
    notificationRefinement,
    settingsBreadcrumb,
    recurrenceFlowCovered: true,
  }, null, 2));
} catch (error) {
  testError = error;
} finally {
  if (socket) {
    try { await socket.command('Browser.close'); } catch {}
    socket.close();
  }
  await waitForExit(processHandle);
  await delay(1_000);
  try {
    rmSync(profile, { recursive: true, force: true, maxRetries: 20, retryDelay: 200 });
  } catch (cleanupError) {
    if (!testError) testError = cleanupError;
    else console.error(`Pulizia profilo E2E fallita: ${cleanupError.message}`);
  }
}

if (testError) throw testError;
}

function findChrome() {
  const candidates = [
    process.env['CHROME_PATH'],
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean);
  const executable = candidates.find((candidate) => existsSync(candidate));
  if (!executable) throw new Error('Chrome/Chromium non trovato; impostare CHROME_PATH');
  return executable;
}

async function ensureService(url) {
  const response = await fetch(url);
  assert(response.ok, `Servizio E2E non disponibile: ${url} (${response.status})`);
}

async function devtoolsPort(directory) {
  const file = join(directory, 'DevToolsActivePort');
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (existsSync(file)) return Number(readFileSync(file, 'utf8').split(/\r?\n/, 1)[0]);
    await delay(100);
  }
  throw new Error('Chrome DevTools non disponibile');
}

async function browserPage(port) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const pages = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
      const page = pages.find((candidate) => candidate.type === 'page');
      if (page) return page;
    } catch {}
    await delay(100);
  }
  throw new Error('Nessuna pagina Chrome disponibile');
}

async function waitFor(client, expression, label, timeout = 25_000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await client.evaluate(expression)) return;
    await delay(150);
  }
  throw new Error(`Timeout E2E: ${label}`);
}

function waitForExit(child) {
  if (child.exitCode !== null) return Promise.resolve();
  return new Promise((resolve) => {
    child.once('exit', resolve);
    setTimeout(() => {
      child.kill();
      resolve();
    }, 3_000).unref();
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

class CdpClient {
  #socket;
  #sequence = 0;
  #pending = new Map();
  #listeners = new Map();

  constructor(url) {
    this.#socket = new WebSocket(url);
    this.#socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const request = this.#pending.get(message.id);
        if (!request) return;
        this.#pending.delete(message.id);
        if (message.error) request.reject(new Error(message.error.message));
        else request.resolve(message.result);
        return;
      }
      for (const listener of this.#listeners.get(message.method) ?? []) listener(message.params);
    });
  }

  ready() {
    return new Promise((resolve, reject) => {
      this.#socket.addEventListener('open', resolve, { once: true });
      this.#socket.addEventListener('error', reject, { once: true });
    });
  }

  command(method, params = {}) {
    const id = ++this.#sequence;
    this.#socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.#pending.set(id, { resolve, reject }));
  }

  async evaluate(expression) {
    const response = await this.command('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
    return response.result.value;
  }

  on(method, listener) {
    const listeners = this.#listeners.get(method) ?? [];
    listeners.push(listener);
    this.#listeners.set(method, listeners);
  }

  close() {
    this.#socket.close();
  }
}

await run();
