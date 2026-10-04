/**
 * FB-SMOKE-TB – flowblocks-ui-toolbar (dist) w Chromium: szuflady i sekcje, elementy z test id, ikony, przeciąganie,
 * tryb tylko do odczytu. Uruchomienie: npm run test:browser.
 */
const path = require('path');
const {expect} = require('chai');
const {start, center} = require('./support');

const ROOT = path.join(__dirname, '..', '..');
const ICONS = 'https://cdn.jsdelivr.net/npm/flowblocks-icons@1.0.8/i/';

const TYPES = [
    {name: 'Start', template: 'Start', icon: 'agave', style: 'cream', category: 'core', configurables: []},
    {name: 'Rule', template: 'PassThrough', icon: 'anchor', style: 'cream', category: 'core', section: 'logic', configurables: []},
    {name: 'Decision', template: 'Split', icon: 'airport', style: 'americana', category: 'core', section: 'logic', configurables: []},
    {name: 'Krd', template: 'PassThrough', icon: '/test/browser/icon.svg', style: 'cream', category: 'integrations', section: 'bureau:krd', configurables: []},
    {name: 'End', template: 'End', icon: 'agave', style: 'cream', category: 'core', configurables: []}
];
const SECTIONS = [
    {id: 'bureau:krd', label: 'KRD', order: 3},
    {id: 'logic', label: 'Logic', order: 1},
    {id: 'core', label: 'Core', order: 2}
];

describe('FB-SMOKE-TB flowblocks-ui-toolbar w przeglądarce (dist)', function () {
    this.timeout(60000);
    let env, page;

    before(async () => {
        const cdn = {};
        for (const i of ['agave', 'anchor', 'airport']) cdn[`${ICONS}${i}.svg`] = `node_modules/smoke-flowblocks-icons/i/${i}.svg`;
        env = await start(ROOT, {cdn});
    });
    after(async () => { if (env) await env.close(); });
    beforeEach(async () => {
        page = await env.newPage();
        await page.goto(`${env.url}/test/browser/toolbar.html`);
        await page.waitForFunction(() => window.smokeReady === true);
    });
    afterEach(async () => {
        await page.context().close();
        expect(env.takeProblems(), 'błędy strony / żądań').deep.eq([]);
    });

    async function reset(types, sections) {
        await page.evaluate(([t, s]) => window.bus.notify('toolbar:reset', t, s), [types, sections]);
        await page.waitForFunction((n) => document.querySelectorAll('[data-testid="smoke.toolbar.item"]').length === n, types.length);
    }

    it('FB-SMOKE-TB1 sekcje: szuflady w kolejności order, elementy w swoich sekcjach, test id i typ bloku', async () => {
        await reset(TYPES, SECTIONS);
        const drawers = await page.$$eval('.drawer', els => els.map(e => [e.dataset.category, e.dataset.label]));
        expect(drawers).deep.eq([['logic', 'Logic'], ['core', 'Core'], ['bureau:krd', 'KRD']]);
        const items = await page.$$eval('[data-testid="smoke.toolbar.item"]', els => els.map(e => [e.getAttribute('data-section'), e.getAttribute('data-block-type')]));
        expect(items).deep.eq([['logic', 'Rule'], ['logic', 'Decision'], ['core', 'Start'], ['core', 'End'], ['bureau:krd', 'Krd']]);
        // rzeczywisty układ: elementy mają wymiary i nie nachodzą na siebie w szufladzie
        const boxes = await page.$$eval('#drawer-1 [data-testid="smoke.toolbar.item"]', els => els.map(e => e.getBoundingClientRect()).map(r => ({y: r.y, h: r.height, w: r.width})));
        expect(boxes.every(b => b.w > 20 && b.h > 20)).true;
        expect(boxes[1].y).gte(boxes[0].y + boxes[0].h - 1);
    });

    it('FB-SMOKE-TB2 bez sekcji (dotychczasowe zachowanie): grupowanie po kategorii w kolejności wystąpienia', async () => {
        await reset(TYPES.map(t => ({...t, section: undefined})));
        const drawers = await page.$$eval('.drawer', els => els.map(e => e.dataset.category));
        expect(drawers).deep.eq(['core', 'integrations']);
    });

    it('FB-SMOKE-TB3 ikony: krótka nazwa → flowblocks-icons@1.0.8, ścieżka – bez zmian; obrazy wczytane', async () => {
        await reset(TYPES, SECTIONS);
        const hrefs = await page.$$eval('[data-testid="smoke.toolbar.item"] image', els => els.map(e => e.getAttribute('xlink:href') || e.getAttribute('href')));
        expect(hrefs).include(`${ICONS}anchor.svg`);
        expect(hrefs).include('/test/browser/icon.svg');
    });

    it('FB-SMOKE-TB4 wciśnięcie elementu emituje toolbar-item:drag z typem; read only – brak zdarzenia i klasa fb-readonly', async () => {
        await reset(TYPES, SECTIONS);
        const item = page.locator('[data-testid="smoke.toolbar.item"][data-block-type="Decision"]');
        const c = await center(item);
        await page.mouse.move(c.x, c.y);
        await page.mouse.down();
        await page.mouse.up();
        let drags = await page.evaluate(() => window.bus.events.filter(e => e.name === 'toolbar-item:drag').map(e => e.args[0]));
        expect(drags).deep.eq(['Decision']);

        await page.evaluate(() => window.bus.setReadOnly(true));
        expect(await page.$$eval('.drawer', els => els.every(e => e.classList.contains('fb-readonly')))).true;
        await page.mouse.move(c.x, c.y);
        await page.mouse.down();
        await page.mouse.up();
        drags = await page.evaluate(() => window.bus.events.filter(e => e.name === 'toolbar-item:drag').length);
        expect(drags).eq(1);
        await page.evaluate(() => window.bus.setReadOnly(false));
        expect(await page.$$eval('.drawer', els => els.some(e => e.classList.contains('fb-readonly')))).false;
    });

    it('FB-SMOKE-TB5 ponowny reset zastępuje zawartość (bez duplikatów elementów)', async () => {
        await reset(TYPES, SECTIONS);
        await reset(TYPES.slice(0, 2), SECTIONS);
        expect(await page.$$eval('[data-testid="smoke.toolbar.item"]', els => els.map(e => e.getAttribute('data-block-type')).sort())).deep.eq(['Rule', 'Start']);
    });
});
