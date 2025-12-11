#!/usr/bin/env bun
import s from 'ansi-styles'; // from '@hbstack/node-packages'
import { load } from 'cheerio';
import { spawnSync } from 'child_process';
import { program } from 'commander';
import { Element } from 'domhandler';
import { sort } from 'fast-sort';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { globSync, type GlobOptionsWithFileTypesUnset } from 'glob'; // from '@hbstack/node-packages'
import { minify as minifyHTML } from 'html-minifier-terser';
import { minify as minifyXML } from 'minify-xml';
import { html, type Token } from 'parse5';
import { adapter } from 'parse5-htmlparser2-tree-adapter';
import { join, resolve } from 'path';
import { cwd, exit as exitWithCode } from 'process';

// ####################
// # Class & Function #
// ####################
// Some variables that would be used in multiple times
const dirContent = join(cwd(), 'content');
const dirPublic = join(cwd(), 'public');
const dirResources = join(cwd(), 'resources');
const dirRoot = cwd();

// Generic functions
const header_max_length = 7;
/** Print information log message */
function printInfo(msg: unknown, header = 'INFO'): void {
  console.log(`${s.green.open}${header.padEnd(header_max_length)}${s.green.close}:`, msg);
}
/** Print error log message */
function printError(msg: unknown, header = 'ERROR'): void {
  console.error(`${s.red.open}${header.padEnd(header_max_length)}${s.red.close}:`, msg);
}
/** I'm doing this because TypeScript is dumb :( */
function exit(code?: number | string | null | undefined): never {
  exitWithCode(code);
}

// Natural comparer
const _collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
const natcomp = _collator.compare.bind(_collator);

// Custom HTML Adapter
const attribute_priority = [
  'itemprop',
  'name',
  'property',
  'content',
  'id',
  'class',
  'src',
  'rel',
  'type',
  'href',
  'width',
  'height',
  'alt',
  'crossorigin',
  'async',
];
const SortedAdapter = {
  ...adapter,
  createElement(tagName: string, namespaceURI: html.NS, attrs: Token.Attribute[]): Element {
    attrs.sort((a, b) => {
      const ia = attribute_priority.indexOf(a.name);
      const ib = attribute_priority.indexOf(b.name);
      if (ia !== -1 || ib !== -1) return ia !== -1 && ib !== -1 ? ia - ib : ia === -1 ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
    return adapter.createElement(tagName, namespaceURI, attrs);
  },
  getAttrList(elem: Element): Token.Attribute[] {
    const list = adapter.getAttrList(elem);
    list.sort((a, b) => {
      const ia = attribute_priority.indexOf(a.name);
      const ib = attribute_priority.indexOf(b.name);
      if (ia !== -1 || ib !== -1) return ia !== -1 && ib !== -1 ? ia - ib : ia === -1 ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
    return list;
  },
};

// Kind (for 'new' command)
interface Kind {
  /** Name of the kind. */
  name: string;
  /** Alias of the kind. This must not include 'name' */
  aliases: string[];
  /** Archetype of the kind. */
  archetype: string;
  /** Path where the new post will be saved into */
  path: string;
}

const kinds: Kind[] = [
  { name: 'blue-archive', aliases: ['ba', 'bluearchive'], archetype: 'blue-archive', path: 'b/game/blue-archive' },
  { name: 'chit-chat', aliases: ['cc', 'chat', 'chitchat'], archetype: 'chit-chat', path: 'b/chit-chat' },
  { name: 'default', aliases: [], archetype: 'default', path: 'b' },
  { name: 'game-misc', aliases: ['gm'], archetype: 'game-misc', path: 'b/game/misc' },
  {
    name: 'genshin-archon',
    aliases: ['ga', 'gaq', 'genshin-archon-quest', 'genshin-archon-quests'],
    archetype: 'genshin-impact',
    path: 'b/game/genshin-impact/archon',
  },
  {
    name: 'genshin-event',
    aliases: ['ge', 'genshin-event-quest', 'genshin-event-quests', 'geq'],
    archetype: 'genshin-impact',
    path: 'b/game/genshin-impact/event',
  },
  { name: 'genshin-misc', aliases: [], archetype: 'genshin-impact', path: 'b/game/genshin-impact/misc' },
  {
    name: 'genshin-story',
    aliases: ['genshin-story-quest', 'genshin-story-quests', 'gs', 'gsq'],
    archetype: 'genshin-impact',
    path: 'b/game/genshin-impact/story',
  },
  {
    name: 'genshin-world',
    aliases: ['genshin-world-quest', 'genshin-world-quests', 'gw', 'gwq'],
    archetype: 'genshin-impact',
    path: 'b/game/genshin-impact/world',
  },
  {
    name: 'honkai-star-rail',
    aliases: ['honkai', 'hsr', 'sr'],
    archetype: 'honkai-star-rail',
    path: 'b/game/honkai-star-rail',
  },
  { name: 'minecraft', aliases: ['mc'], archetype: 'minecraft', path: 'b/game/minecraft' },
  { name: 'music', aliases: [], archetype: 'music', path: 'b/chit-chat/music' },
  { name: 'pivox-desktop', aliases: ['pd'], archetype: 'pivox', path: 'd/desktop' },
  { name: 'pivox-development', aliases: ['pdev', 'pivox-dev'], archetype: 'pivox', path: 'd/development' },
  { name: 'pivox-game', aliases: ['pg'], archetype: 'pivox', path: 'd/game' },
  { name: 'pivox-misc', aliases: [], archetype: 'pivox', path: 'd/misc' },
  { name: 'pivox-mobile', aliases: ['pm'], archetype: 'pivox', path: 'd/mobile' },
  { name: 'pivox-server', aliases: ['ps'], archetype: 'pivox', path: 'd/server' },
  { name: 'pivox-web', aliases: ['pw'], archetype: 'pivox', path: 'd/web' },
  {
    name: 'the-division',
    aliases: ['d', 'division', 'td', 'td2'],
    archetype: 'the-division',
    path: 'b/game/the-division',
  },
  { name: 'tower-of-fantasy', aliases: ['tf', 'tof'], archetype: 'tower-of-fantasy', path: 'b/game/tower-of-fantasy' },
  {
    name: 'wuwa-companion',
    aliases: [
      'wc',
      'wcq',
      'wuthering-companion',
      'wuthering-waves-companion',
      'wuthering-waves-companion-quest',
      'wuthering-waves-companion-quests',
      'ww-companion',
      'ww-companion-quest',
      'ww-companion-quests',
      'wwc',
      'wwcq',
    ],
    archetype: 'wuthering-waves',
    path: 'b/game/wuthering-waves/companion',
  },
  {
    name: 'wuwa-event',
    aliases: ['wuthering-event', 'wuthering-waves-event', 'ww-event'],
    archetype: 'wuthering-waves',
    path: 'b/game/wuthering-waves/event',
  },
  {
    name: 'wuwa-exploration',
    aliases: [
      'we',
      'weq',
      'wuthering-exploration',
      'wuthering-waves-exploration',
      'wuthering-waves-exploration-quest',
      'wuthering-waves-exploration-quests',
      'ww-exploration',
      'ww-exploration-quest',
      'ww-exploration-quests',
      'wwe',
      'wweq',
    ],
    archetype: 'wuthering-waves',
    path: 'b/game/wuthering-waves/exploration',
  },
  {
    name: 'wuwa-main',
    aliases: [
      'wm',
      'wmq',
      'wuthering-main',
      'wuthering-waves-main',
      'wuthering-waves-main-quest',
      'wuthering-waves-main-quests',
      'ww-main',
      'ww-main-quest',
      'ww-main-quests',
      'wwm',
      'wwmq',
    ],
    archetype: 'wuthering-waves',
    path: 'b/game/wuthering-waves/main',
  },
  {
    name: 'wuwa-misc',
    aliases: ['wuthering-misc', 'wuthering-waves-misc', 'ww-misc'],
    archetype: 'wuthering-waves',
    path: 'b/game/wuthering-waves/misc',
  },
];

const aliasMap = new Map<string, Kind>();
for (const kind of kinds) {
  aliasMap.set(kind.name, kind);
  for (const alias of kind.aliases) {
    aliasMap.set(alias, kind);
  }
}

function findKind(needle: string): Kind | undefined {
  return aliasMap.get(needle);
}

function showKinds(): string {
  return kinds
    .map((k) => {
      const sorted = [...k.aliases].sort((a, b) => a.localeCompare(b));
      return `${s.cyan.open}${k.name}${s.cyan.close}: ${sorted.join(', ')}`;
    })
    .join('\n');
}

//
function run(command: string, cwd: string): void {
  const result = spawnSync(command, { cwd: cwd, shell: true, stdio: ['ignore', 'inherit', 'inherit'] });
  if (result.error) {
    printError(`Failed to start command: ${result.error.message}`);
  } else if (result.status !== 0) {
    printError(`Command exited with code ${result.status}`);
  } else {
    printInfo('Command exited without any error');
  }
}

// ######################
// # Parse Command-line #
// ######################
/**
 * Prevent calling script without NPM (or Bun)
 * 1. Check package name
 * 2. Check 'package.json' existance
 */
// For whatever reason, this completely blocks script from running
// if (process.env.npm_package_name !== 'tetralog' || !existsSync(join(cwd(), 'package.json'))) {
//   printError('Call this script with NPM or Bun');
//   printError("e.g. 'npm run cli' or 'bun run cli'");
//   exit(1);
// }

program.name('cli').description('Utility for TetraLog');

// clean
program
  .command('clean')
  .description('Remove temporary directories')
  .action(() => {
    // directories
    printInfo(`Removing ${dirPublic}`);
    rmSync(dirPublic, { force: true, maxRetries: 5, recursive: true, retryDelay: 150 });
    printInfo(`Removing ${dirResources}`);
    rmSync(dirResources, { force: true, maxRetries: 5, recursive: true, retryDelay: 150 });
    // files
    const hugo_stats = join(dirRoot, 'hugo_stats.json');
    printInfo(`Removing ${hugo_stats}`);
    rmSync(hugo_stats, { force: true, maxRetries: 5, recursive: false, retryDelay: 150 });
    const hugo_build = join(dirRoot, '.hugo_build.lock');
    printInfo(`Removing ${hugo_build}`);
    rmSync(hugo_build, { force: true, maxRetries: 5, recursive: false, retryDelay: 150 });
  });

// deslash
program
  .command('deslash')
  .description('Remove trailing slash from HTML/XML files')
  .argument('[path]', 'Hugo build output directory', dirPublic)
  .action((path: string) => {
    // 'minifyHTML' requires parent function to be async. De-async it.
    (async () => {
      const _globOption: GlobOptionsWithFileTypesUnset = { absolute: true, cwd: resolve(path), dot: false };
      const _currentYear = new Date().getFullYear().toString();

      const filesHTML = sort(globSync('**/*.{htm,html}', _globOption)).by({ asc: true, comparer: natcomp });
      const filesXML = sort(globSync('**/*.xml', _globOption)).by({ asc: true, comparer: natcomp });

      for (const file of filesHTML) {
        const content = readFileSync(file, 'utf8');
        const $ = load(content, { treeAdapter: SortedAdapter });

        // <a>: Remove trailing slash from href
        $('a[href]').each((_, el) => {
          const $el = $(el);
          const href = $el.attr('href');
          if (href && href !== '/') $el.attr('href', href.replace(/\/+$/, ''));
        });
        // <meta>: Remove trailing slash from URL
        $('meta[property]').each((_, el) => {
          const $el = $(el);
          if ($el.attr('property') == 'og:url') {
            const content = $el.attr('content');
            if (content) $el.attr('content', content.replace(/\/+$/, ''));
          }
        });
        // Write modified content to file
        const minified = await minifyHTML($.html(), {
          // NOTE: Specify non-default values only!
          collapseBooleanAttributes: true,
          collapseInlineTagWhitespace: true,
          collapseWhitespace: true,
          conservativeCollapse: true,
          removeComments: true,
          removeEmptyAttributes: true,
        });
        writeFileSync(file, minified.toString(), 'utf8');
        printInfo(file, 'DESLASH');
      }
      for (const file of filesXML) {
        const content = readFileSync(file, 'utf8');
        const $ = load(content, { xml: { xmlMode: true, decodeEntities: false } });

        // <guid>, <link>, <loc>: Remove trailing slash from URL
        $('guid, link, loc').each((_, el) => {
          const $el = $(el);
          const url = $el.text();
          if (url && url !== '/') $el.text(url.replace(/\/+$/, ''));
        });
        // <description>: Remove new line from content
        $('description').each((_, el) => {
          const $el = $(el);
          const text = $el.text();
          if (text) $el.text(text.replace(/^\s*\n/gm, ''));
        });
        // <copyright>: Replace {year} to current year (because Hugo fails to do so)
        $('copyright').each((_, el) => {
          const $el = $(el);
          const text = $el.text();
          if (text) $el.text(text.replace('{year}', _currentYear));
        });
        // Write modified content to file
        const newContent = minifyXML($.xml());
        writeFileSync(file, newContent.toString(), 'utf8');
        printInfo(file, 'DESLASH');
      }
    })()
      .then(() => {
        printInfo('All files are processed');
      })
      .catch((err: unknown) => {
        printError(err);
      });
  });

// new
program
  .command('new')
  .description('Create new Hugo blog post')
  .requiredOption('-k, --kind <kind>', 'Kind of new article')
  .argument('<title>', 'Title of the new article')
  .action((title: string, { kind }: { kind: string }) => {
    const newKind = findKind(kind);
    const newTitle = title
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();

    // Check title and kind
    if (!newTitle) {
      printError(`Invalid title name: '${newTitle}'`);
    }
    if (!newKind) {
      printError(`Unknown Kind type: ${kind}`);
      printError(`Valid Kind name and their aliases are:\n${showKinds()}`);
    }
    if (!newTitle || !newKind) exit(1);

    const newPath = join(dirContent, newKind.path);

    console.log(`${s.yellow.open}-------- Input Information --------${s.yellow.close}`);
    console.log(`Title: ${newTitle}`);
    console.log(`Kind: ${newKind.name}`);
    console.log(`Content Path: ${newPath}`);
    console.log(`${s.yellow.open}-----------------------------------${s.yellow.close}`);

    if (!existsSync(newPath)) {
      printInfo(`New path will be created: ${newPath}`);
      mkdirSync(newPath, { recursive: true });
    }

    let dirList: string[];
    try {
      dirList = readdirSync(newPath, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name);
    } catch (err) {
      printError(`Failed to read directory: '${newPath}'`);
      exit(1);
    }

    let nextNum = 1;
    while (dirList.some((dir) => dir.startsWith(`${nextNum.toString().padStart(3, '0')}-`))) {
      nextNum++;
    }

    const newIndexName = resolve(join(newPath, `${nextNum.toString().padStart(3, '0')}-${newTitle}`, 'index.md'));

    run(`hugo new content -k ${newKind.archetype} "${newIndexName}"`, dirRoot);
  });

// Parse command line
program.parse();
