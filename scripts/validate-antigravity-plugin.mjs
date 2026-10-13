#!/usr/bin/env node
// Checks every Antigravity plugin in the repo (a directory with .antigravity-plugin/plugin.json: the
// repo root and plugins/*/) against the rules in Google's Antigravity Plugin Marketplace Publishing
// Guide, so a PR can't ship a manifest the Marketplace would reject. It is a stand-in for
// `agy plugin validate`, which needs the Antigravity app installed; run that too before a
// Marketplace submission.
//
//   node scripts/validate-antigravity-plugin.mjs        # exits 1 on any error, prints warnings
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const warnings = [];
let root = repoRoot;
let label = ".";
const err = (m) => errors.push(`${label}: ${m}`);
const warn = (m) => warnings.push(`${label}: ${m}`);

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SEMVER = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;
const BUILTIN_VARS = new Set(["PLUGIN_ROOT", "PLUGIN_DATA"]);

function readJson(rel) {
  try {
    return JSON.parse(readFileSync(join(root, rel), "utf8"));
  } catch (e) {
    err(`${rel}: ${e.code === "ENOENT" ? "missing" : `invalid JSON (${e.message})`}`);
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

// ── Discovery: the repo root and plugins/*/ ───────────────────────────────────────────────
const pluginRoots = [repoRoot];
if (existsSync(join(repoRoot, "plugins"))) {
  for (const d of readdirSync(join(repoRoot, "plugins"), { withFileTypes: true })) if (d.isDirectory()) pluginRoots.push(join(repoRoot, "plugins", d.name));
}
const found = pluginRoots.filter((r) => existsSync(join(r, ".antigravity-plugin", "plugin.json")));
if (!found.length) errors.push("no .antigravity-plugin/plugin.json at the repo root or under plugins/*/");

for (const r of found) {
  root = r;
  label = r === repoRoot ? "." : r.slice(repoRoot.length + 1);
  validatePlugin();
}

function validatePlugin() {
  // ── Manifest location ─────────────────────────────────────────────────────────────────────
  const MANIFEST = ".antigravity-plugin/plugin.json";
  const extra = readdirSync(join(root, ".antigravity-plugin")).filter((f) => f !== "plugin.json");
  if (extra.length) err(`.antigravity-plugin/ may hold only plugin.json; found ${extra.join(", ")}`);

  const m = readJson(MANIFEST);
  if (m) {
    // ── Required core + Marketplace fields ──────────────────────────────────────────────────
    if (typeof m.name !== "string" || !KEBAB.test(m.name) || m.name.length > 64) err(`name must be kebab-case, 1–64 chars (got ${JSON.stringify(m.name)})`);
    if (typeof m.description !== "string" || !m.description.trim()) err("description is required");
    else if (m.description.length < 120 || m.description.length > 160) warn(`description is ${m.description.length} chars; 120–160 recommended for Marketplace cards`);
    if (typeof m.displayName !== "string" || !m.displayName.trim()) err("displayName is required for the Marketplace");
    else if (/\b(plugin|mcp)\b/i.test(m.displayName)) warn(`displayName "${m.displayName}" carries a redundant suffix`);
    if (typeof m.version !== "string" || !SEMVER.test(m.version)) err(`version must be semver MAJOR.MINOR.PATCH (got ${JSON.stringify(m.version)})`);
    // The Claude manifest beside it is the version of record; every flavor of a plugin ships together.
    const claude = existsSync(join(root, ".claude-plugin/plugin.json")) ? readJson(".claude-plugin/plugin.json") : null;
    if (claude && m.version !== claude.version) err(`version ${m.version} != .claude-plugin/plugin.json ${claude.version}; bump them together`);
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

    // ── Skills ──────────────────────────────────────────────────────────────────────────────
    const skillPaths = m.skills ?? ["skills"];
    if (!Array.isArray(skillPaths) || !skillPaths.every((p) => typeof p === "string")) err("skills must be a string[] (Antigravity does not take the single-string form)");
    else {
      const skillDirs = [];
      for (const p of skillPaths) {
        const abs = join(root, p);
        if (!existsSync(abs) || !statSync(abs).isDirectory()) { err(`skills entry ${p} is not a directory`); continue; }
        // An entry is either a skill folder itself or a folder of skill folders.
        if (existsSync(join(abs, "SKILL.md"))) skillDirs.push(abs);
        else for (const d of readdirSync(abs, { withFileTypes: true })) if (d.isDirectory() && existsSync(join(abs, d.name, "SKILL.md"))) skillDirs.push(join(abs, d.name));
      }
      if (!skillDirs.length) err("no skills found under the skills paths");
      for (const dir of skillDirs) {
        const rel = dir.slice(root.length + 1);
        const fm = frontmatter(readFileSync(join(dir, "SKILL.md"), "utf8"));
        if (!fm) { err(`${rel}/SKILL.md has no YAML frontmatter`); continue; }
        const folder = dir.split(/[\\/]/).pop();
        if (!fm.name || !KEBAB.test(fm.name) || fm.name.length > 64) err(`${rel}: name must be kebab-case, 1–64 chars (got ${JSON.stringify(fm.name)})`);
        else if (fm.name !== folder) err(`${rel}: name "${fm.name}" must match its folder "${folder}"`);
        const len = (fm.description ?? "").length;
        if (len < 1 || len > 1024) err(`${rel}: description is ${len} chars; must be 1–1024`);
      }
    }

    // ── MCP servers ─────────────────────────────────────────────────────────────────────────
    const mcpRel = m.mcpServers ?? "mcp_config.json";
    if (typeof mcpRel !== "string") err("mcpServers must be a path (string) to the MCP config file");
    else if (existsSync(join(root, mcpRel))) {
      const mcp = readJson(mcpRel);
      const servers = mcp?.mcpServers;
      if (mcp && (typeof servers !== "object" || !servers || !Object.keys(servers).length)) err(`${mcpRel}: needs a non-empty mcpServers object`);
      const declared = new Set((mcp?.variables ?? []).map((v) => v.name));
      for (const [key, s] of Object.entries(servers ?? {})) {
        const id = `${mcpRel} → ${key} (runs as ${m.name}-${key})`;
        if (s.url || s.type) err(`${id}: use "serverUrl" for remote servers; "url"/"type" are the Claude/Cursor shape`);
        if (!s.serverUrl && !s.command) err(`${id}: needs serverUrl (remote) or command (stdio)`);
        if (s.serverUrl && !/^https:\/\//.test(s.serverUrl)) err(`${id}: serverUrl must be https://`);
        for (const [, name] of JSON.stringify(s).matchAll(/\$\{([A-Z0-9_]+)\}/g)) if (!BUILTIN_VARS.has(name) && !declared.has(name)) err(`${id}: \${${name}} is not declared in "variables"`);
        if (/"(\/Users|\/home|[A-Z]:\\\\)/.test(JSON.stringify(s))) err(`${id}: hardcoded absolute path; use \${PLUGIN_ROOT} or \${PLUGIN_DATA}`);
      }
    } else if (m.mcpServers) err(`mcpServers file ${mcpRel} does not exist`);

    if (!existsSync(join(root, "README.md"))) err("README.md (shown on the Marketplace page before install) is missing");
  }

  // The guide requires `name` to match the plugin directory. The repo root can't (the clone is
  // named after the repository), so that one is a question for Google, not an error here.
  if (m && root !== repoRoot && m.name !== root.split(/[\\/]/).pop()) err(`name "${m.name}" must match its directory`);
}

for (const w of warnings) console.log(`warning: ${w}`);
for (const e of errors) console.log(`error: ${e}`);
console.log(errors.length ? `Antigravity plugins: ${errors.length} error(s).` : `Antigravity plugins: OK (${found.map((r) => (r === repoRoot ? "." : r.slice(repoRoot.length + 1))).join(", ")}).`);
process.exit(errors.length ? 1 : 0);
