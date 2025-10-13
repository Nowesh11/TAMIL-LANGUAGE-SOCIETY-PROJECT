#!/usr/bin/env node
/**
 * qa-css-check.js
 *
 * Node.js 18+ script to QA and fix common CSS issues:
 * - Detect and fix unbalanced curly braces `{}` (adds missing `}` at EOF)
 * - Detect and fix unclosed comments (`/* ... */`)
 * - Ensure CSS properties end with a semicolon `;` where needed
 * - Handles large CSS files
 * - Prints detailed logs for each fix
 *
 * Usage:
 *   node qa-css-check.js                 # defaults to src/app/site.css
 *   node qa-css-check.js --file src/app/site.css
 *   node qa-css-check.js --all            # scan all .css files under src/
 *
 * Bonus:
 *   - Detects and normalizes literal "\\n" and "\\r" artifacts if present in high volume
 */

const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = process.argv.slice(2);
  const options = { file: 'src/app/site.css', all: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--file' && args[i + 1]) {
      options.file = args[i + 1];
      i++;
    } else if (a.startsWith('--file=')) {
      options.file = a.split('=')[1];
    } else if (a === '--all') {
      options.all = true;
    }
  }
  return options;
}

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error('[ERROR] Unable to read file: ' + filePath);
    throw err;
  }
}

function writeFileSafe(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
  } catch (err) {
    console.error('[ERROR] Unable to write file: ' + filePath);
    throw err;
  }
}

function detectAndNormalizeLiteralNewlines(content, log) {
  // Heuristic: if many literal \n appear, normalize them to real newlines
  const literalNCount = (content.match(/\\n/g) || []).length;
  const literalRCount = (content.match(/\\r/g) || []).length;
  const lineCount = content.split(/\n/).length;
  let changed = false;

  if (literalNCount > 50 || (literalNCount > 0 && lineCount <= 2)) {
    content = content.replace(/\\r/g, '\\n').replace(/\\n/g, '\n');
    log.push('[normalize] Replaced ' + literalRCount + ' literal \\r and ' + literalNCount + ' literal \\n with real newlines');
    changed = true;
  }
  return { content, changed };
}

function fixUnclosedComments(content, log) {
  // Count opens and closes outside of strings
  const opens = (content.match(/\/\*/g) || []).length;
  const closes = (content.match(/\*\//g) || []).length;
  let changed = false;
  if (opens > closes) {
    const missing = opens - closes;
    content = content + '\n' + '*/'.repeat(missing);
    log.push('[comments] Auto-closed ' + missing + " unclosed comment(s) by appending '*/' at EOF");
    changed = true;
  }
  return { content, changed };
}

function addMissingSemicolons(content, log) {
  // Add semicolons for property lines missing ';'
  const lines = content.split(/\r?\n/);
  let changed = false;
  const propRegex = /^\s*([A-Za-z_-][A-Za-z0-9_-]*)\s*:\s*([^;{}]+)(?!.*;).*$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Skip non-declaration contexts
    if (trimmed.startsWith('@')) continue; // @media, @keyframes, etc.
    if (trimmed.endsWith('{') || trimmed.endsWith('}')) continue; // block boundaries
    if (trimmed.includes('{') || trimmed.includes('}')) continue; // avoid complex inline blocks
    // If line looks like a property and lacks semicolon, add it
    const m = line.match(propRegex);
    if (m && !trimmed.endsWith(';')) {
      lines[i] = line + ';';
      log.push("[semicolon] Added ';' at line " + (i + 1) + ": '" + m[1] + ': ' + m[2].trim() + "'");
      changed = true;
    }
  }
  return { content: lines.join('\n'), changed };
}

function fixUnbalancedBraces(content, log) {
  // Track braces, ignoring comment blocks
  let inComment = false;
  let opens = 0;
  let extras = 0;
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    const next = content[i + 1];
    if (!inComment && ch === '/' && next === '*') {
      inComment = true;
      i++;
      continue;
    }
    if (inComment && ch === '*' && next === '/') {
      inComment = false;
      i++;
      continue;
    }
    if (inComment) continue;
    if (ch === '{') {
      opens++;
    } else if (ch === '}') {
      if (opens > 0) {
        opens--;
      } else {
        extras++;
      }
    }
  }

  let changed = false;
  if (opens > 0) {
    content = content + '\n' + '}'.repeat(opens);
    log.push('[braces] Added ' + opens + ' missing closing brace(s) at EOF');
    changed = true;
  }
  if (extras > 0) {
    log.push('[braces] Detected ' + extras + ' extra closing brace(s). Script does not remove them automatically.');
  }
  return { content, changed };
}

function processFile(filePath) {
  console.log('\n[process] ' + filePath);
  let content = readFileSafe(filePath);
  const log = [];
  let totalChanges = 0;

  // Optional normalization for literal \n artifacts
  let result = detectAndNormalizeLiteralNewlines(content, log);
  content = result.content; if (result.changed) totalChanges++;

  // Fix comments first (so braces counting won’t be thrown off)
  result = fixUnclosedComments(content, log);
  content = result.content; if (result.changed) totalChanges++;

  // Add missing semicolons on property lines
  result = addMissingSemicolons(content, log);
  content = result.content; if (result.changed) totalChanges++;

  // Finally, fix unbalanced braces by closing at EOF
  result = fixUnbalancedBraces(content, log);
  content = result.content; if (result.changed) totalChanges++;

  if (totalChanges > 0) {
    writeFileSafe(filePath, content);
    console.log('[save] Wrote fixes to ' + filePath);
  } else {
    console.log(`[ok] No changes needed for ${filePath}`);
  }

  // Print detailed log
  if (log.length) {
    console.log('[log] Details:');
    for (const entry of log) console.log('  - ' + entry);
  }
}

function listCssFilesUnderSrc(rootDir) {
  const srcDir = path.join(rootDir, 'src');
  const results = [];
  const stack = [srcDir];
  while (stack.length) {
    const dir = stack.pop();
    if (!fs.existsSync(dir)) continue;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (e.isFile() && full.endsWith('.css')) results.push(full);
    }
  }
  return results;
}

function main() {
  const options = parseArgs();
  const projectRoot = process.cwd();
  if (options.all) {
    const files = listCssFilesUnderSrc(projectRoot);
    if (!files.length) {
      console.log('[info] No .css files found under src/.');
      return;
    }
    console.log('[info] Scanning ' + files.length + ' CSS file(s) under src/');
    for (const f of files) processFile(f);
  } else {
    const target = path.join(projectRoot, options.file);
    processFile(target);
  }
}

main();