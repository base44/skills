#!/usr/bin/env node
// Checks each Antigravity plugin under antigravity/<name>/ against Google's Antigravity Plugin
// Marketplace Publishing Guide and against the plugin's other flavors, so it ships the same skills
// they do. Run it before a release or a Marketplace submission, alongside `agy plugin validate`.
//
//   node scripts/validate-antigravity-plugin.mjs        # exits 1 on any error, prints warnings
//
// Why antigravity/<name>/ and not the repo root: Antigravity (agy 1.3.4) ignores plugin.json's
// `skills` field and loads every folder under <plugin-root>/skills/. A plugin folder of its own,
// whose skills/ holds a symlink per shipped skill, is how it gets the curated set the other
// manifests list. Installs copy the symlinked skills in as real folders.
//
// Dependency-free on purpose: plain Node, no install step.
import { existsSync, lstatSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const warnings = [];

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SEMVER = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;
const BUILTIN_VARS = new Set(["PLUGIN_ROOT", "PLUGIN_DATA"]);

function readJson(file, err) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    err(`${file.slice(repoRoot.length + 1)}: ${e.code === "ENOENT" ? "missing" : `invalid JSON (${e.message})`}`);
    return null;
  }
}

// Just enough YAML for SKILL.md frontmatter: top-level `key: value` scalars, quoted or plain,
// and `>`/`|` block scalars. Nested keys (allowed-tools, metadata) are skipped.
function frontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const out = {};
  const lines = m[1].split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const kv = lines[i].match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    let [, key, value] = kv;
    if (/^[>|][-+]?$/.test(value)) {
      const block = [];
      while (i + 1 < lines.length && (/^\s+\S/.test(lines[i + 1]) || lines[i + 1] === "")) block.push(lines[++i].trim());
      value = value.startsWith(">") ? block.join(" ").replace(/\s+/g, " ").trim() : block.join("\n").trim();
    } else if (/^".*"$/.test(value)) {
      value = JSON.parse(value);
    } else if (/^'.*'$/.test(value)) {
      value = value.slice(1, -1).replace(/''/g, "'");
    }
    out[key] = value;
  }
  return out;
}

// The plugin's Cursor flavor, the reference for which skills it ships and its version: the
// repo-root .cursor-plugin or plugins/<name>/.cursor-plugin, whichever carries the same name.
function cursorFlavor(name) {
  for (const dir of [repoRoot, join(repoRoot, "plugins", name)]) {
    const file = join(dir, ".cursor-plugin", "plugin.json");
    if (!existsSync(file)) continue;
    const m = JSON.parse(readFileSync(file, "utf8"));
    if (m.name === name) return { file: file.slice(repoRoot.length + 1), manifest: m };
  }
  return null;
}

function validatePlugin(root) {
  const label = root.slice(repoRoot.length + 1);
  const err = (msg) => errors.push(`${label}: ${msg}`);
  const warn = (msg) => warnings.push(`${label}: ${msg}`);

  const m = readJson(join(root, "plugin.json"), err);
  if (!m) return;

  // ── Required core + Marketplace fields ────────────────────────────────────────────────────
  if (typeof m.name !== "string" || !KEBAB.test(m.name) || m.name.length > 64) err(`name must be kebab-case, 1–64 chars (got ${JSON.stringify(m.name)})`);
  else if (m.name !== basename(root)) err(`name "${m.name}" must match its folder "${basename(root)}"`);
  if (typeof m.description !== "string" || !m.description.trim()) err("description is required");
  else if (m.description.length < 120 || m.description.length > 160) warn(`description is ${m.description.length} chars; 120–160 recommended for Marketplace cards`);
  if (typeof m.displayName !== "string" || !m.displayName.trim()) err("displayName is required for the Marketplace");
  else if (/\b(plugin|mcp)\b/i.test(m.displayName)) warn(`displayName "${m.displayName}" carries a redundant suffix`);
  if (typeof m.version !== "string" || !SEMVER.test(m.version)) err(`version must be semver MAJOR.MINOR.PATCH (got ${JSON.stringify(m.version)})`);
  if (!m.author || (typeof m.author === "object" && !m.author.name)) err("author (string or {name, email?, url?}) is required for the Marketplace");

  if (typeof m.logo !== "string" || !m.logo) err("logo is required for the Marketplace");
  else if (!/^https:\/\//.test(m.logo)) {
    if (!existsSync(join(root, m.logo))) err(`logo ${m.logo} does not exist`);
    else if (m.logo.endsWith(".svg")) {
      const svg = readFileSync(join(root, m.logo), "utf8");
      const vb = svg.match(/viewBox="\s*[\d.-]+\s+[\d.-]+\s+([\d.]+)\s+([\d.]+)\s*"/);
      if (!vb || vb[1] !== vb[2]) err(`logo ${m.logo} must be square (1:1)`);
      else if (Number(vb[1]) < 128) warn(`logo viewBox is ${vb[1]}px; >= 128 recommended`);
    }
  }

  if (!Array.isArray(m.suggestedPrompts) || !m.suggestedPrompts.some((p) => typeof p === "string" && p.trim())) err("suggestedPrompts needs at least one non-empty prompt");
  else if (m.suggestedPrompts.length > 3) err(`suggestedPrompts has ${m.suggestedPrompts.length} entries; the Marketplace truncates past 3`);

  if (m.category !== undefined && !(typeof m.category === "string" || (Array.isArray(m.category) && m.category.every((c) => typeof c === "string")))) err("category must be a string or string[]");
  for (const k of m.keywords ?? m.tags ?? []) if (k !== k.toLowerCase()) err(`keyword "${k}" must be lowercase`);
  if (m.homepage && !/^https:\/\//.test(m.homepage)) err("homepage must be an https:// URL");
  if (!existsSync(join(root, "README.md"))) err("README.md (shown on the Marketplace page before install) is missing");

  // ── Skills: skills/ is what Antigravity loads, whatever the manifest says ───────────────────
  if (JSON.stringify(m.skills ?? ["./skills"]) !== JSON.stringify(["./skills"])) err('skills must be ["./skills"]: Antigravity loads every folder under skills/, so a list here would only mislead');
  const skillsDir = join(root, "skills");
  const shipped = existsSync(skillsDir) ? readdirSync(skillsDir).filter((n) => !n.startsWith(".")).sort() : [];
  if (!shipped.length) err("skills/ has no skills");
  for (const name of shipped) {
    const p = join(skillsDir, name);
    if (lstatSync(p).isSymbolicLink() && !existsSync(p)) { err(`skills/${name} is a broken symlink`); continue; }
    if (!statSync(p).isDirectory() || !existsSync(join(p, "SKILL.md"))) { err(`skills/${name} is not a skill folder (no SKILL.md)`); continue; }
    const fm = frontmatter(readFileSync(join(p, "SKILL.md"), "utf8"));
    if (!fm) { err(`skills/${name}/SKILL.md has no YAML frontmatter`); continue; }
    if (fm.name !== name) err(`skills/${name}: frontmatter name "${fm.name}" must match its folder`);
    const len = (fm.description ?? "").length;
    if (len < 1) err(`skills/${name}: description is empty`);
    // The guide caps descriptions at 1024; agy 1.3.4 loads longer ones whole. The skill content is
    // shared with every flavor, so this is reported, not fixed here.
    else if (len > 1024) warn(`skills/${name}: description is ${len} chars; the guide caps it at 1024`);
  }

  const ref = cursorFlavor(m.name);
  if (!ref) warn(`no .cursor-plugin manifest named "${m.name}" to compare the skills and version against`);
  else {
    const expected = (Array.isArray(ref.manifest.skills) ? ref.manifest.skills : []).map((s) => basename(s.replace(/\/+$/, ""))).sort();
    const missing = expected.filter((s) => !shipped.includes(s));
    const extra = shipped.filter((s) => !expected.includes(s));
    if (missing.length) err(`skills/ is missing ${missing.join(", ")}, which ${ref.file} ships`);
    if (extra.length) err(`skills/ has ${extra.join(", ")}, which ${ref.file} does not ship`);
    if (ref.manifest.version !== m.version) err(`version ${m.version} != ${ref.file} ${ref.manifest.version}; bump them together`);
  }

  // ── MCP servers ───────────────────────────────────────────────────────────────────────────
  const mcpRel = m.mcpServers ?? "mcp_config.json";
  if (typeof mcpRel !== "string") err("mcpServers must be a path (string) to the MCP config file");
  else if (existsSync(join(root, mcpRel))) {
    const mcp = readJson(join(root, mcpRel), err);
    const servers = mcp?.mcpServers;
    if (mcp && (typeof servers !== "object" || !servers || !Object.keys(servers).length)) err(`${mcpRel}: needs a non-empty mcpServers object`);
    const declared = new Set((mcp?.variables ?? []).map((v) => v.name));
    for (const [key, s] of Object.entries(servers ?? {})) {
      const id = `${mcpRel} → ${key} (shows in /mcp as ${m.name}_${key})`;
      if (s.url || s.type) err(`${id}: use "serverUrl" for remote servers; "url"/"type" are the Claude/Cursor shape`);
      if (!s.serverUrl && !s.command) err(`${id}: needs serverUrl (remote) or command (stdio)`);
      if (s.serverUrl && !/^https:\/\//.test(s.serverUrl)) err(`${id}: serverUrl must be https://`);
      for (const [, name] of JSON.stringify(s).matchAll(/\$\{([A-Z0-9_]+)\}/g)) if (!BUILTIN_VARS.has(name) && !declared.has(name)) err(`${id}: \${${name}} is not declared in "variables"`);
      if (/"(\/Users|\/home|[A-Z]:\\\\)/.test(JSON.stringify(s))) err(`${id}: hardcoded absolute path; use \${PLUGIN_ROOT} or \${PLUGIN_DATA}`);
    }
  } else if (m.mcpServers) err(`mcpServers file ${mcpRel} does not exist`);
}

const base = join(repoRoot, "antigravity");
const roots = existsSync(base) ? readdirSync(base, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => join(base, d.name)) : [];
if (!roots.length) errors.push("no plugins under antigravity/");
for (const root of roots) validatePlugin(root);

for (const w of warnings) console.log(`warning: ${w}`);
for (const e of errors) console.log(`error: ${e}`);
console.log(errors.length ? `Antigravity plugins: ${errors.length} error(s).` : `Antigravity plugins: OK (${roots.map((r) => r.slice(repoRoot.length + 1)).join(", ")}).`);
process.exit(errors.length ? 1 : 0);
