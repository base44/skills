#!/usr/bin/env node
// Validates the compiled `skills/base44-platform-*` tree that Base44 publishes from its builder prompt.
// The compiler at Base44 owns the content; this proves a PR carries
// exactly what it emitted: every generated file bears the header, is listed in the manifest with
// a matching sha256, has valid frontmatter, and links only to files that exist.

import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const skillsDir = path.join(repoRoot, "skills");
const PREFIX = "base44-platform-";
const MANIFEST = path.join(skillsDir, `${PREFIX}manifest.json`);
const HEADER = "<!-- GENERATED FILE. DO NOT EDIT.";
const errors = [];

async function walk(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

function frontmatter(content) {
  const match = content.match(/^---\nname: ([^\n]+)\ndescription: ("[^\n]*")\n---\n/);
  return match ? { name: match[1], description: JSON.parse(match[2]) } : null;
}

async function main() {
  const dirs = (await fs.readdir(skillsDir, { withFileTypes: true }))
    .filter((e) => e.isDirectory() && e.name.startsWith(PREFIX))
    .map((e) => path.join(skillsDir, e.name));
  const files = (await Promise.all(dirs.map(walk))).flat();
  const relative = (f) => path.relative(repoRoot, f).split(path.sep).join("/");

  let manifest;
  try {
    manifest = JSON.parse(await fs.readFile(MANIFEST, "utf8")).files;
  } catch (error) {
    errors.push(`manifest unreadable (${relative(MANIFEST)}): ${error.message}`);
    manifest = {};
  }
  const listed = new Set(Object.keys(manifest));
  const present = new Set(files.map(relative));
  for (const p of listed) if (!present.has(p)) errors.push(`${p}: in the manifest but missing from the tree`);
  for (const p of present) if (!listed.has(p)) errors.push(`${p}: not in the manifest (hand-added file?)`);

  for (const file of files) {
    const rel = relative(file);
    const content = await fs.readFile(file, "utf8");
    const digest = createHash("sha256").update(content).digest("hex");
    if (manifest[rel] && manifest[rel] !== digest) errors.push(`${rel}: content differs from the manifest (hand-edited?)`);
    if (!rel.endsWith(".md")) { errors.push(`${rel}: generated skills contain only markdown`); continue; }
    if (!content.includes(HEADER)) errors.push(`${rel}: missing the generated-file header`);
    if (path.basename(file) === "SKILL.md") {
      const fm = frontmatter(content);
      const dirName = path.basename(path.dirname(file));
      if (!fm) errors.push(`${rel}: missing or malformed frontmatter`);
      else {
        if (fm.name !== dirName) errors.push(`${rel}: frontmatter name "${fm.name}" must equal the directory name "${dirName}"`);
        if (!fm.description.trim() || fm.description.length > 1024) errors.push(`${rel}: description must be 1-1024 characters`);
      }
    }
    for (const match of content.matchAll(/\]\(([^)#\s]+)/g)) {
      const target = match[1];
      if (target.includes("://")) continue;
      const resolved = path.resolve(path.dirname(file), target);
      try { await fs.access(resolved); } catch { errors.push(`${rel}: link target ${target} does not exist`); }
    }
  }

  const pin = (await fs.readFile(path.join(repoRoot, "SOURCE_COMMIT"), "utf8").catch(() => "")).trim();
  if (!/^[0-9a-f]{40}$/.test(pin)) errors.push("SOURCE_COMMIT must hold the 40-hex source commit the tree was compiled from");

  if (errors.length) {
    console.error("Validation failed:");
    for (const e of errors) console.error(`- ${e}`);
    process.exit(1);
  }
  console.log(`Validation passed: ${dirs.length} generated skills, ${files.length} files, pin ${pin.slice(0, 12)}.`);
}

await main();
