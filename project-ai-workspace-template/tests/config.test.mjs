import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  unresolvedCommands,
  validateForbiddenArtifacts,
  validatePermissions,
  validateProfile,
  validateSkillPolicy
} from "../lib/config.mjs";
import {
  forbiddenArtifactsFixture,
  permissionsFixture,
  profileFixture,
  skillPolicyFixture
} from "./fixtures/configuration.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, "project", name), "utf8"));
const clone = (value) => structuredClone(value);

test("active project configuration matches every strict schema", () => {
  assert.deepEqual(validateProfile(read("profile.json")), []);
  assert.deepEqual(validatePermissions(read("permissions.json")), []);
  assert.deepEqual(validateForbiddenArtifacts(read("forbidden-artifacts.json")), []);
  assert.deepEqual(validateSkillPolicy(read("skill-improvement-policy.json")), []);
});

test("unknown keys are rejected instead of silently ignored", () => {
  const profile = profileFixture();
  profile.ai.unusedSetting = true;
  assert.ok(validateProfile(profile).some((message) => message.includes("unusedSetting is not supported")));
});

test("agent commands require an executable and use structured argv", () => {
  const profile = profileFixture();
  profile.projectCommands.lint.mode = "agent";
  assert.ok(validateProfile(profile).some((message) => message.includes("lint.command is required")));
  profile.projectCommands.lint.command = "npm";
  profile.projectCommands.lint.args = ["run", "lint"];
  assert.equal(validateProfile(profile).length, 0);
});

test("manual commands may document argv while forbidden commands may not", () => {
  const profile = profileFixture();
  profile.projectCommands.build.mode = "manual";
  profile.projectCommands.build.command = "make";
  profile.projectCommands.build.args = ["release"];
  assert.equal(validateProfile(profile).length, 0);
  profile.projectCommands.build.mode = "forbidden";
  assert.ok(validateProfile(profile).some((message) => message.includes("build.args must be empty")));
});

test("unresolved command detection follows mode, not magic strings", () => {
  const profile = profileFixture();
  assert.deepEqual(unresolvedCommands(profile), ["install", "format", "lint", "typecheck", "testTargeted", "testFull", "build"]);
  profile.projectCommands.build.mode = "manual";
  assert.equal(unresolvedCommands(profile).includes("build"), false);
});

test("unsupported permission expansion fails closed", () => {
  const permissions = clone(permissionsFixture());
  permissions.native.networkForGeneratedCommands = true;
  assert.ok(validatePermissions(permissions).some((message) => message.includes("supports only false")));
});

test("skill learning requirements cannot be silently disabled", () => {
  const policy = clone(skillPolicyFixture());
  policy.requireBehavioralEval = false;
  assert.ok(validateSkillPolicy(policy).some((message) => message.includes("must remain true")));
});

test("configuration reference covers every JSON object key", () => {
  const documentation = fs.readFileSync(path.join(root, "project", "README.md"), "utf8");
  const fixtures = {
    "profile.json": profileFixture(),
    "permissions.json": permissionsFixture(),
    "forbidden-artifacts.json": forbiddenArtifactsFixture(),
    "skill-improvement-policy.json": skillPolicyFixture()
  };
  for (const [file, configuration] of Object.entries(fixtures)) {
    const visit = (value, prefix = "") => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return;
      for (const [key, child] of Object.entries(value)) {
        const current = prefix ? `${prefix}.${key}` : key;
        if (/^projectCommands\.[^.]+\.(mode|command|args|instructions|evidenceRequired)$/.test(current)) {
          assert.ok(documentation.includes(`\`${current.split(".")[2]}\``), `Missing shared command-field documentation for ${current}`);
        } else {
          assert.ok(documentation.includes(`\`${current}\``), `Missing documentation for ${file}:${current}`);
        }
        visit(child, current);
      }
    };
    visit(configuration);
  }
});
