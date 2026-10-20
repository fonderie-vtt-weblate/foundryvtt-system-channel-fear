// Génère les fichiers sources FR (mono-langue) pour Weblate à partir de _packs_sources/.
// Le format est celui de Babele (cf. lang/packs/translations/en), sans la section "mapping".
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const SOURCES_DIR = '_packs_sources';
const OUT_DIR = join(SOURCES_DIR, '_compiled');
const REFERENCE_LANG = 'en';

const system = JSON.parse(await readFile('system.json', 'utf8'));
const labels = Object.fromEntries(system.packs.map((pack) => [pack.name, pack.label]));

const getByPath = (object, path) => path.split('.').reduce((value, key) => value?.[key], object);

await mkdir(OUT_DIR, { recursive: true });

for (const pack of (await readdir(SOURCES_DIR)).filter((dir) => '_compiled' !== dir)) {
  const referencePath = join('lang/packs/translations', REFERENCE_LANG, `channel-fear.${pack}.json`);
  const reference = JSON.parse(await readFile(referencePath, 'utf8'));
  const mapping = reference.mapping ?? {};

  const folders = {};
  const entries = {};

  for (const file of (await readdir(join(SOURCES_DIR, pack))).sort()) {
    const document = JSON.parse(await readFile(join(SOURCES_DIR, pack, file), 'utf8'));

    if (document._key?.startsWith('!folders!')) {
      folders[document.name] = document.name;
      continue;
    }

    const entry = { name: document.name };

    for (const [field, path] of Object.entries(mapping)) {
      const value = getByPath(document, path);

      if (typeof value === 'string' && '' !== value) {
        entry[field] = value;
      }
    }

    entries[document.name] = entry;
  }

  const output = { label: labels[pack] ?? pack };

  if (Object.keys(folders).length) {
    output.folders = folders;
  }

  output.entries = entries;

  await writeFile(join(OUT_DIR, `channel-fear.${pack}.json`), `${JSON.stringify(output, null, 2)}\n`);
  console.log(`${pack}: ${Object.keys(entries).length} entrées, ${Object.keys(folders).length} dossiers`);
}
