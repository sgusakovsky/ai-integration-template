#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const aiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.resolve(aiRoot, "..", "project-ai-workspace-template.zip");
const checksumPath = `${output}.sha256`;
const ignored = new Set([".DS_Store", "node_modules"]);

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", stdio: "pipe" });
  if (result.status !== 0) throw new Error(`${command} failed: ${(result.stderr || result.stdout).trim()}`);
  return result;
}

function include(source) {
  const relative = path.relative(aiRoot, source).replaceAll("\\", "/");
  if (!relative) return true;
  const name = path.basename(source);
  if (ignored.has(name)) return false;
  if (/^(?:\.ai-runtime|runtime|logs|transcripts)(?:\/|$)/.test(relative)) return false;
  if (/^session-summaries\/.*\.json$/.test(relative)) return false;
  if (/\.(?:key|pem|p12)$/.test(name)) return false;
  return relative !== "project/profile.local.json";
}

function files(root) {
  const result = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (!include(absolute)) continue;
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) result.push(path.relative(root, absolute).replaceAll("\\", "/"));
    }
  };
  visit(root);
  return result.sort();
}

function digest(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

for (const command of ["zip", "unzip"]) {
  const probe = spawnSync(command, ["-v"], { encoding: "utf8" });
  if (probe.error) throw new Error(`${command} is required to build and verify the distribution archive.`);
}

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "aiw-package-"));
try {
  const staged = path.join(temporary, "project-ai-workspace-template");
  fs.cpSync(aiRoot, staged, { recursive: true, filter: include });
  const fixedTime = new Date("2000-01-01T00:00:00.000Z");
  for (const relative of files(staged)) fs.utimesSync(path.join(staged, relative), fixedTime, fixedTime);
  fs.rmSync(output, { force: true });
  const archiveEntries = files(staged).map((relative) => path.posix.join("project-ai-workspace-template", relative));
  run("zip", ["-X", "-q", output, ...archiveEntries], temporary);

  const extractedRoot = path.join(temporary, "extracted");
  fs.mkdirSync(extractedRoot);
  run("unzip", ["-q", output, "-d", extractedRoot], temporary);
  const extracted = path.join(extractedRoot, "project-ai-workspace-template");
  const expectedFiles = files(staged);
  const actualFiles = files(extracted);
  if (JSON.stringify(actualFiles) !== JSON.stringify(expectedFiles)) throw new Error("Archive file list does not match the source template.");
  for (const relative of expectedFiles) {
    if (digest(path.join(staged, relative)) !== digest(path.join(extracted, relative))) throw new Error(`Archive content differs: ${relative}`);
  }

  const testFiles = fs.readdirSync(path.join(extracted, "tests")).filter((name) => name.endsWith(".test.mjs")).map((name) => path.join("tests", name));
  run(process.execPath, ["--test", ...testFiles], extracted);
  run(process.execPath, ["bin/aiw.mjs", "self-test"], extracted);
  const profilePath = path.join(extracted, "project", "profile.json");
  const profile = JSON.parse(fs.readFileSync(profilePath, "utf8"));
  profile.project = { id: "configured-package-check", displayName: "Configured Package Check" };
  profile.targetRepository.allowedRemotes = ["git@example.invalid:team/project.git"];
  for (const entry of Object.values(profile.projectCommands)) {
    entry.mode = "manual";
    entry.command = "";
    entry.args = [];
    entry.instructions = "Human-owned configured package verification.";
  }
  fs.writeFileSync(profilePath, `${JSON.stringify(profile, null, 2)}\n`);
  run(process.execPath, ["--test", ...testFiles], extracted);

  const checksum = digest(output);
  fs.writeFileSync(checksumPath, `${checksum}  ${path.basename(output)}\n`);
  process.stdout.write(`Package verified: ${output}\nSHA-256: ${checksum}\n`);
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
