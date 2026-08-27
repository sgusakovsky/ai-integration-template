import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { writeFixtureConfiguration } from "./fixtures/configuration.mjs";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(globalCli, args, cwd, home) {
  return spawnSync(process.execPath, [globalCli, ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, HOME: home }
  });
}

function fixture(t) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "aiw-global-"));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const aiRoot = path.join(base, "ai");
  const projectRoot = path.join(base, "project");
  const home = path.join(base, "home");
  fs.cpSync(sourceRoot, aiRoot, { recursive: true });
  writeFixtureConfiguration(aiRoot);
  fs.mkdirSync(projectRoot);
  fs.mkdirSync(home);
  return { base, aiRoot, projectRoot, home, globalCli: path.join(aiRoot, "bin", "aiw-global.mjs") };
}

test("global registration is explicit, reversible, and rejects silent replacement", (t) => {
  const { base, aiRoot, home, globalCli } = fixture(t);
  const registered = run(globalCli, ["register", aiRoot], base, home);
  assert.equal(registered.status, 0, registered.stderr);

  const duplicate = run(globalCli, ["register", aiRoot], base, home);
  assert.equal(duplicate.status, 1);
  assert.match(duplicate.stderr, /already registered/);
  assert.equal(run(globalCli, ["register", aiRoot, "--force"], base, home).status, 0);

  const implicit = run(globalCli, ["verify"], base, home);
  assert.equal(implicit.status, 1);
  assert.match(implicit.stderr, /outside every registered project/);

  const installed = run(globalCli, ["desktop-install", "codex", "--project", "fixture"], base, home);
  assert.equal(installed.status, 0, installed.stderr);
  const skill = path.join(home, ".agents", "skills", "aiw-fixture", "SKILL.md");
  assert.ok(fs.existsSync(skill));
  assert.match(fs.readFileSync(skill, "utf8"), /aiw verify --project fixture --task <TASK>/);
  assert.equal(run(globalCli, ["desktop-uninstall", "codex", "--project", "fixture"], base, home).status, 0);
  assert.equal(fs.existsSync(skill), false);

  const claude = run(globalCli, ["desktop-config", "claude", "--project", "fixture"], base, home);
  assert.equal(claude.status, 0, claude.stderr);
  assert.equal(JSON.parse(claude.stdout).mcpServers["aiw-fixture"].command, "node");

  const contextDir = path.join(base, "project-ai-context", "FIX-GLOBAL");
  fs.mkdirSync(contextDir, { recursive: true });
  fs.writeFileSync(path.join(contextDir, "brief.md"), "Temporary context.\n");
  const cleaned = run(globalCli, ["context-clean", "FIX-GLOBAL", "--approved", "--project", "fixture"], base, home);
  assert.equal(cleaned.status, 0, cleaned.stderr);
  assert.equal(fs.existsSync(contextDir), false);

  assert.equal(run(globalCli, ["unregister", "fixture"], base, home).status, 0);
  const registry = JSON.parse(fs.readFileSync(path.join(home, ".aiw", "projects.json"), "utf8"));
  assert.deepEqual(registry.projects, {});
  assert.equal(registry.defaultProject, null);
});

test("global CLI reports stale registered paths", (t) => {
  const { base, aiRoot, home, globalCli } = fixture(t);
  assert.equal(run(globalCli, ["register", aiRoot], base, home).status, 0);
  fs.renameSync(aiRoot, `${aiRoot}-moved`);
  const result = run(`${aiRoot}-moved/bin/aiw-global.mjs`, ["verify", "--project", "fixture"], base, home);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /stale or missing paths/);
});

test("global CLI delegates agent-assisted feedback with task context", (t) => {
  const { base, aiRoot, home, globalCli } = fixture(t);
  assert.equal(run(globalCli, ["register", aiRoot], base, home).status, 0);
  const captured = path.join(base, "delegated.json");
  fs.writeFileSync(path.join(aiRoot, "bin", "aiw.mjs"), `import fs from "node:fs";\nfs.writeFileSync(process.env.AIW_DELEGATED_ARGS, JSON.stringify(process.argv.slice(2)));\n`);
  const result = spawnSync(process.execPath, [globalCli, "feedback", "AIW-201", "--task", "FIX-201", "--tool", "claude", "--project", "fixture"], {
    cwd: base,
    encoding: "utf8",
    env: { ...process.env, HOME: home, AIW_DELEGATED_ARGS: captured }
  });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(fs.readFileSync(captured, "utf8")), ["feedback", "--case", "AIW-201", "--task", "FIX-201", "--tool", "claude"]);
});
