import { chromium } from 'playwright';
import { execFileSync, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { renderReelHtml } from './render_html.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'reels-data.json'), 'utf8'));

const GAP = 0.28; // seconds of silence between beats, gives the voice room to breathe
const FILTER_ONLY = process.argv.includes('--only')
  ? process.argv[process.argv.indexOf('--only') + 1]
  : null;

function sh(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

function ffprobeDuration(file) {
  const out = execFileSync('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1', file
  ]).toString().trim();
  return parseFloat(out);
}

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

async function genAudioForReel(reel) {
  const audioDir = path.join(ROOT, 'assets', 'audio', reel.id);
  ensureDir(audioDir);
  const gapFile = path.join(ROOT, 'assets', 'audio', 'silence.mp3');
  if (!fs.existsSync(gapFile)) {
    sh(`ffmpeg -y -f lavfi -i anullsrc=r=24000:cl=mono -t ${GAP} -q:a 9 "${gapFile}"`);
  }

  const concatList = [];
  for (let i = 0; i < reel.beats.length; i++) {
    const beat = reel.beats[i];
    const beatFile = path.join(audioDir, `beat-${i}.mp3`);
    execFileSync('python3', [path.join(__dirname, 'gen_tts.py'), beat.narration, beatFile, 'es', 'us']);
    const dur = ffprobeDuration(beatFile);
    beat.dur = Math.round((dur + GAP) * 100) / 100;
    concatList.push(beatFile, gapFile);
  }

  const listFile = path.join(audioDir, 'concat.txt');
  fs.writeFileSync(listFile, concatList.map(f => `file '${path.resolve(f)}'`).join('\n'));
  const fullAudio = path.join(ROOT, 'assets', 'audio', `${reel.id}.mp3`);
  sh(`ffmpeg -y -f concat -safe 0 -i "${listFile}" -ar 24000 -ac 1 -c:a libmp3lame -q:a 3 "${fullAudio}"`);
  return fullAudio;
}

async function captureVideo(reel) {
  const sceneHtmlPath = path.join(ROOT, 'scenes', `${reel.id}.html`);
  fs.writeFileSync(sceneHtmlPath, renderReelHtml(reel, DATA.brand));

  const videoDir = path.join(ROOT, 'assets', 'video', reel.id + '-raw');
  ensureDir(videoDir);
  for (const f of fs.readdirSync(videoDir)) fs.unlinkSync(path.join(videoDir, f));

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1920 },
    recordVideo: { dir: videoDir, size: { width: 1080, height: 1920 } }
  });
  const page = await context.newPage();
  await page.goto('file://' + sceneHtmlPath);
  await page.waitForFunction(() => document.getElementById('render-done').textContent === 'done', undefined, { timeout: 120000, polling: 100 });
  await page.waitForTimeout(200);
  await page.close();
  await context.close();
  await browser.close();

  const files = fs.readdirSync(videoDir).filter(f => f.endsWith('.webm'));
  return path.join(videoDir, files[0]);
}

function mux(webmPath, audioPath, outPath) {
  sh(`ffmpeg -y -i "${webmPath}" -i "${audioPath}" -c:v libx264 -preset medium -crf 22 -pix_fmt yuv420p -vf "scale=1080:1920,fps=30" -c:a aac -b:a 160k -shortest -movflags +faststart "${outPath}"`);
}

async function run() {
  const outDir = path.join(ROOT, 'output');
  ensureDir(outDir);
  for (const reel of DATA.reels) {
    if (FILTER_ONLY && reel.id !== FILTER_ONLY) continue;
    console.log(`\n=== ${reel.id}: ${reel.title} ===`);
    console.log('-- generating narration --');
    const audioPath = await genAudioForReel(reel);
    console.log('-- capturing motion graphics --');
    const webmPath = await captureVideo(reel);
    console.log('-- muxing final mp4 --');
    const outPath = path.join(outDir, `${reel.id}.mp4`);
    mux(webmPath, audioPath, outPath);
    console.log(`done -> ${outPath}`);
  }
}

run().catch(e => { console.error(e); process.exit(1); });
