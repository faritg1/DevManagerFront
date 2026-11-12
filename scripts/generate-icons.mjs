// Rasterizes the mark in public/favicon.svg into the PNG app icons. Run: node scripts/generate-icons.mjs
// Uses the Playwright already installed for the e2e suite; see docs/identidad-visual.md.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const BLUE = '#0b6fb8'; // primary-600
const ACCENT = '#1392ec'; // primary

const mark = readFileSync(join(PUBLIC, 'favicon.svg'), 'utf8').match(/<g id="mark"[\s\S]*<\/g>/)?.[0];
if (!mark) throw new Error('public/favicon.svg must contain <g id="mark">');

// scale: share of the canvas the 64-unit mark box takes. radius: corner radius of the tile, in % of the canvas.
const ICONS = [
    { file: 'favicon-32.png', size: 32, scale: 1, stroke: BLUE, dot: ACCENT },
    { file: 'apple-touch-icon.png', size: 180, scale: 0.72, bg: BLUE, stroke: '#fff', dot: '#fff' },
    { file: 'icon-192.png', size: 192, scale: 0.72, bg: BLUE, radius: 22, stroke: '#fff', dot: '#fff' },
    { file: 'icon-512.png', size: 512, scale: 0.72, bg: BLUE, radius: 22, stroke: '#fff', dot: '#fff' },
    // Maskable: full-bleed background; the drawn mark (78% of its box) stays inside the central 80% safe zone.
    { file: 'icon-maskable-512.png', size: 512, scale: 0.6, bg: BLUE, stroke: '#fff', dot: '#fff' },
];

const html = ({ size, scale, bg = 'transparent', radius = 0, stroke, dot }) => `<!doctype html>
<style>
  html, body { margin: 0; background: transparent }
  div { width: ${size}px; height: ${size}px; background: ${bg}; border-radius: ${radius}%; display: grid; place-items: center }
  svg { width: ${size * scale}px; height: ${size * scale}px }
  .a { stroke: ${stroke} } .b { fill: ${dot} }
</style>
<div><svg viewBox="0 0 64 64">${mark}</svg></div>`;

/** Playwright's own browser when it resolves; otherwise the newest headless shell in the local cache. */
async function launch() {
    try {
        return await chromium.launch();
    } catch (error) {
        const cache = join(process.env.LOCALAPPDATA ?? '', 'ms-playwright');
        const build = (dir) => Number(dir.split('-')[1]);
        const newest = existsSync(cache)
            ? readdirSync(cache).filter((d) => d.startsWith('chromium_headless_shell-')).sort((x, y) => build(y) - build(x))[0]
            : undefined;
        const exe = newest && ['chrome-headless-shell-win64', 'chrome-win']
            .map((dir) => join(cache, newest, dir, 'chrome-headless-shell.exe'))
            .find(existsSync);
        if (!exe) throw error;
        return chromium.launch({ executablePath: exe });
    }
}

const browser = await launch();
try {
    const page = await browser.newPage();
    for (const icon of ICONS) {
        await page.setViewportSize({ width: icon.size, height: icon.size });
        await page.setContent(html(icon));
        await page.screenshot({ path: join(PUBLIC, icon.file), omitBackground: true });
        console.log(`${icon.file} ${icon.size}x${icon.size}`);
    }
} finally {
    await browser.close();
}
