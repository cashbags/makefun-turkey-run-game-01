// GOBBLE RUN — the hand-in program for make.fun turkey-run-game-01.
// Node 22, standard library only. It copies game/ and screenshots/ from
// this repository into the output directory and writes dossier.json there
// with buildDossier from vendor/makefun-game.ts, the kit's own library.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.
// The program is deterministic: the same repository always writes the same
// bytes, so the grader's two runs match byte for byte.

import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The repository root is the directory this file sits in.
const repoRoot = dirname(fileURLToPath(import.meta.url));

// The grader hands us /output; a local run names its own directory.
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's caps, from the competition's gate: the dossier text holds
// at most 160 KiB, screenshots are 4 at most and 256 KiB each, game/ holds
// at most 993 files and directories and 48 MiB, paths at most 1,000 bytes.
const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 48 * 1024 * 1024,
  game_path_max_bytes: 1000,
};

function handIn(): void {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
  const dossier = buildDossier(outDir, caps);
  writeFileSync(join(outDir, 'dossier.json'), dossier);
  const marker = JSON.parse(readFileSync(join(outDir, 'dossier.json'), 'utf8')) as { schema?: unknown };
  if (marker.schema !== 'makefun/dossier/v1') throw new Error('hand-in: dossier schema mismatch');
  console.log(`hand-in: game/ + screenshots/ + dossier.json (${dossier.length} bytes) -> ${outDir}`);
}

handIn();
