/**
 * Smoke w przeglądarce (Chromium, Playwright) na ZBUDOWANYM pakiecie (dist) – wspólne narzędzia testów test/browser.
 * (Ten sam plik w flowblocks, flowblocks-ui-toolbar i flowblocks-designer.)
 *
 *  - serwer statyczny wyłącznie z katalogów dist/, node_modules/, test/browser/ pakietu (127.0.0.1, losowy port),
 *  - biblioteki zewnętrzne w wersjach, z którymi pakiety działają w ADI (adi-gui/vendor): devDependencies `smoke-*`,
 *  - strażnik: błędy JS strony, console.error, żądania zakończone błędem lub ≥ 400 oraz każde żądanie poza serwerem
 *    testowym (CDN) bez mapowania – test kończy się błędem (bez cichych zaślepek).
 *
 * Przeglądarka: `npx playwright install chromium` (wersja zgodna z devDependency playwright); w CI / kontenerze –
 * PLAYWRIGHT_BROWSERS_PATH.
 */
const fs = require('fs');
const http = require('http');
const path = require('path');

const TYPES = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf'};
const ALLOWED_ROOTS = ['dist', 'node_modules', path.join('test', 'browser')];

/** Serwer statyczny katalogu pakietu (tylko dozwolone katalogi). @returns {Promise<{url, close}>} */
function serve(root) {
    const server = http.createServer((req, res) => {
        const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '');
        const file = path.resolve(root, rel);
        const allowed = ALLOWED_ROOTS.some(r => file.startsWith(path.join(root, r) + path.sep));
        if (!allowed || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end('not found'); return; }
        res.writeHead(200, {'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store'});
        fs.createReadStream(file).pipe(res);
    });
    return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({
        url: `http://127.0.0.1:${server.address().port}`,
        close: () => new Promise(r => server.close(r))
    })));
}

/**
 * Przeglądarka + serwer + strażnik.
 * @param {string} root katalog pakietu
 * @param {{cdn?: Object<string, string>}} [opts] cdn: adres → plik w pakiecie (ścieżka względna). Klucz zakończony `/` –
 *   prefiks (np. drzewo min/vs Monaco), wartość – katalog; klucz zaczynający się od `/` – ścieżka na serwerze testowym
 *   (np. zasoby `./resources/…` designera obok strony testowej, jak w adi-gui obok dist).
 */
async function start(root, opts = {}) {
    const {chromium} = require('playwright');
    const srv = await serve(root);
    const browser = await chromium.launch();
    const problems = [];
    const cdn = opts.cdn || {};
    const keyUrl = (k) => (k.startsWith('/') ? `${srv.url}${k}` : k);
    const exact = new Map(Object.entries(cdn).filter(([k]) => !k.endsWith('/')).map(([k, v]) => [keyUrl(k), v]));
    const prefixes = Object.entries(cdn).filter(([k]) => k.endsWith('/')).map(([k, v]) => [keyUrl(k), v]).sort((a, b) => b[0].length - a[0].length);
    function mapped(u) {
        if (exact.has(u)) return exact.get(u);
        const p = prefixes.find(([k]) => u.startsWith(k));
        if (!p) return undefined;
        const rel = path.join(p[1], decodeURIComponent(u.slice(p[0].length)));
        return rel.startsWith(path.join(p[1], path.sep)) ? rel : undefined; // bez wyjścia poza katalog (../)
    }
    async function newPage() {
        const context = await browser.newContext({viewport: {width: 1400, height: 900}});
        const page = await context.newPage();
        page.on('pageerror', e => problems.push(`pageerror: ${e.message}${e.stack ? `\n${String(e.stack).split('\n').slice(1, 6).join('\n')}` : ''}`));
        page.on('console', m => { if (m.type() === 'error') problems.push(`console.error: ${m.text()}`); });
        page.on('requestfailed', r => problems.push(`requestfailed: ${r.url()} ${r.failure() && r.failure().errorText}`));
        page.on('response', r => { if (r.status() >= 400) problems.push(`HTTP ${r.status()}: ${r.url()}`); });
        await page.route('**/*', (route) => {
            const u = route.request().url().split('#')[0].split('?')[0];
            const target = mapped(u);
            if (target !== undefined) {
                const file = path.join(root, target);
                if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { problems.push(`mapping to missing file: ${u} -> ${target}`); return route.abort(); }
                return route.fulfill({path: file, headers: {'access-control-allow-origin': '*'}});
            }
            if (u.startsWith(srv.url) || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
            problems.push(`external request without mapping: ${u}`);
            return route.abort();
        });
        return page;
    }
    return {
        url: srv.url, newPage, problems,
        /** Strażnik – wywoływany w afterEach: brak problemów od ostatniego sprawdzenia. */
        takeProblems: () => problems.splice(0, problems.length),
        close: async () => { await browser.close(); await srv.close(); }
    };
}

/** Środek elementu (współrzędne strony) – do akcji myszy. */
async function center(locator) {
    const b = await locator.boundingBox();
    if (!b) throw new Error('element is not visible');
    return {x: b.x + b.width / 2, y: b.y + b.height / 2, box: b};
}

/** Przeciągnięcie myszą (kilka kroków – JointJS reaguje na pointermove). */
async function drag(page, from, to) {
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move((from.x + to.x) / 2, (from.y + to.y) / 2, {steps: 5});
    await page.mouse.move(to.x, to.y, {steps: 5});
    await page.mouse.up();
}

module.exports = {serve, start, center, drag};
