const COMMAND_NAMES = ["install", "format", "lint", "typecheck", "testTargeted", "testFull", "build"];
const COMMAND_MODES = new Set(["agent", "manual", "forbidden", "unresolved"]);
const DATA_LANES = new Set(["green", "amber", "red"]);
const TEST_DATA_MODES = new Set(["none", "synthetic_only", "approved_nonproduction"]);
const FILESYSTEM_MODES = new Set(["read-only", "workspace-write"]);
const PROJECT_MOUNTS = new Set(["read-only", "read-write"]);

function object(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function exactKeys(value, expected, label, errors) {
  if (!object(value)) {
    errors.push(`${label} must be an object.`);
    return;
  }
  const actual = Object.keys(value);
  for (const key of expected) if (!(key in value)) errors.push(`${label}.${key} is required.`);
  for (const key of actual) if (!expected.includes(key)) errors.push(`${label}.${key} is not supported.`);
}

function string(value, label, errors, { allowEmpty = false } = {}) {
  if (typeof value !== "string" || (!allowEmpty && !value.trim())) errors.push(`${label} must be ${allowEmpty ? "a string" : "a non-empty string"}.`);
}

function boolean(value, label, errors) {
  if (typeof value !== "boolean") errors.push(`${label} must be boolean.`);
}

function integer(value, label, errors, minimum = Number.MIN_SAFE_INTEGER) {
  if (!Number.isInteger(value) || value < minimum) errors.push(`${label} must be an integer >= ${minimum}.`);
}

function stringArray(value, label, errors, { nonEmpty = false, pattern } = {}) {
  if (!Array.isArray(value) || (nonEmpty && value.length === 0)) {
    errors.push(`${label} must be ${nonEmpty ? "a non-empty" : "an"} array of strings.`);
    return;
  }
  value.forEach((item, index) => {
    if (typeof item !== "string" || !item.trim() || (pattern && !pattern.test(item))) errors.push(`${label}[${index}] is invalid.`);
  });
}

function enumValue(value, allowed, label, errors) {
  if (!allowed.has(value)) errors.push(`${label} must be one of: ${[...allowed].join(", ")}.`);
}

export function validateProfile(profile) {
  const errors = [];
  exactKeys(profile, ["schemaVersion", "project", "targetRepository", "dataPolicy", "ai", "projectCommands", "humanGates"], "profile", errors);
  if (!object(profile)) return errors;
  integer(profile.schemaVersion, "profile.schemaVersion", errors, 2);
  if (profile.schemaVersion !== 2) errors.push("profile.schemaVersion must equal 2.");

  exactKeys(profile.project, ["id", "displayName"], "profile.project", errors);
  if (object(profile.project)) {
    string(profile.project.id, "profile.project.id", errors);
    if (typeof profile.project.id === "string" && !/^[A-Za-z0-9._-]+$/.test(profile.project.id)) errors.push("profile.project.id may contain only letters, digits, dot, underscore, or hyphen.");
    string(profile.project.displayName, "profile.project.displayName", errors);
  }

  exactKeys(profile.targetRepository, ["localRelativePath", "runtimeRelativePath", "allowedRemotes", "defaultBranch"], "profile.targetRepository", errors);
  if (object(profile.targetRepository)) {
    string(profile.targetRepository.localRelativePath, "profile.targetRepository.localRelativePath", errors);
    string(profile.targetRepository.runtimeRelativePath, "profile.targetRepository.runtimeRelativePath", errors);
    stringArray(profile.targetRepository.allowedRemotes, "profile.targetRepository.allowedRemotes", errors, { nonEmpty: true });
    if (Array.isArray(profile.targetRepository.allowedRemotes)) profile.targetRepository.allowedRemotes.forEach((remote, index) => {
      if (typeof remote === "string" && !/^(?:https:\/\/[^\s/]+\/.+|git@[^\s:]+:.+|ssh:\/\/git@[^\s/]+\/.+)$/.test(remote)) errors.push(`profile.targetRepository.allowedRemotes[${index}] must be an exact HTTPS or SSH Git URL.`);
    });
    string(profile.targetRepository.defaultBranch, "profile.targetRepository.defaultBranch", errors);
  }

  exactKeys(profile.dataPolicy, ["lane", "allowSourceCode", "allowTestData", "deny"], "profile.dataPolicy", errors);
  if (object(profile.dataPolicy)) {
    enumValue(profile.dataPolicy.lane, DATA_LANES, "profile.dataPolicy.lane", errors);
    boolean(profile.dataPolicy.allowSourceCode, "profile.dataPolicy.allowSourceCode", errors);
    enumValue(profile.dataPolicy.allowTestData, TEST_DATA_MODES, "profile.dataPolicy.allowTestData", errors);
    stringArray(profile.dataPolicy.deny, "profile.dataPolicy.deny", errors, { nonEmpty: true, pattern: /^[a-z][a-z0-9_]*$/ });
  }

  exactKeys(profile.ai, ["defaultTool", "codex", "claude", "mcpAllowlist"], "profile.ai", errors);
  if (object(profile.ai)) {
    enumValue(profile.ai.defaultTool, new Set(["codex", "claude"]), "profile.ai.defaultTool", errors);
    for (const tool of ["codex", "claude"]) {
      exactKeys(profile.ai[tool], ["model"], `profile.ai.${tool}`, errors);
      if (object(profile.ai[tool])) string(profile.ai[tool].model, `profile.ai.${tool}.model`, errors, { allowEmpty: true });
    }
    stringArray(profile.ai.mcpAllowlist, "profile.ai.mcpAllowlist", errors);
    if (Array.isArray(profile.ai.mcpAllowlist) && profile.ai.mcpAllowlist.length) {
      errors.push("profile.ai.mcpAllowlist currently supports only an empty array; configured sessions enforce an empty MCP set.");
    }
  }

  exactKeys(profile.projectCommands, COMMAND_NAMES, "profile.projectCommands", errors);
  if (object(profile.projectCommands)) {
    for (const name of COMMAND_NAMES) {
      const entry = profile.projectCommands[name];
      const label = `profile.projectCommands.${name}`;
      exactKeys(entry, ["mode", "command", "args", "instructions", "evidenceRequired"], label, errors);
      if (!object(entry)) continue;
      enumValue(entry.mode, COMMAND_MODES, `${label}.mode`, errors);
      string(entry.command, `${label}.command`, errors, { allowEmpty: true });
      stringArray(entry.args, `${label}.args`, errors);
      string(entry.instructions, `${label}.instructions`, errors);
      boolean(entry.evidenceRequired, `${label}.evidenceRequired`, errors);
      if (entry.mode === "agent" && (typeof entry.command !== "string" || !entry.command.trim())) errors.push(`${label}.command is required when mode is agent.`);
      if (entry.mode === "manual" && Array.isArray(entry.args) && entry.args.length && (typeof entry.command !== "string" || !entry.command.trim())) errors.push(`${label}.command is required when manual args are provided.`);
      if (["forbidden", "unresolved"].includes(entry.mode) && Array.isArray(entry.args) && entry.args.length) errors.push(`${label}.args must be empty when mode is ${entry.mode}.`);
      if (["forbidden", "unresolved"].includes(entry.mode) && entry.command) errors.push(`${label}.command must be empty when mode is ${entry.mode}.`);
    }
  }
  stringArray(profile.humanGates, "profile.humanGates", errors, { nonEmpty: true, pattern: /^[a-z][a-z0-9_]*$/ });
  return errors;
}

export function validatePermissions(policy) {
  const errors = [];
  exactKeys(policy, ["policyVersion", "native", "docker"], "permissions", errors);
  if (!object(policy)) return errors;
  integer(policy.policyVersion, "permissions.policyVersion", errors, 2);
  if (policy.policyVersion !== 2) errors.push("permissions.policyVersion must equal 2.");
  exactKeys(policy.native, ["filesystemMode", "networkForGeneratedCommands", "approvalMode", "protectedProjectPaths", "requireHumanConfirmation", "deny"], "permissions.native", errors);
  if (object(policy.native)) {
    enumValue(policy.native.filesystemMode, FILESYSTEM_MODES, "permissions.native.filesystemMode", errors);
    boolean(policy.native.networkForGeneratedCommands, "permissions.native.networkForGeneratedCommands", errors);
    if (policy.native.networkForGeneratedCommands !== false) errors.push("permissions.native.networkForGeneratedCommands currently supports only false.");
    enumValue(policy.native.approvalMode, new Set(["on-request"]), "permissions.native.approvalMode", errors);
    stringArray(policy.native.protectedProjectPaths, "permissions.native.protectedProjectPaths", errors, { nonEmpty: true });
    stringArray(policy.native.requireHumanConfirmation, "permissions.native.requireHumanConfirmation", errors, { pattern: /^[a-z][a-z0-9_]*$/ });
    stringArray(policy.native.deny, "permissions.native.deny", errors, { nonEmpty: true, pattern: /^[a-z][a-z0-9_]*$/ });
  }
  exactKeys(policy.docker, ["projectMount"], "permissions.docker", errors);
  if (object(policy.docker)) enumValue(policy.docker.projectMount, PROJECT_MOUNTS, "permissions.docker.projectMount", errors);
  return errors;
}

export function validateForbiddenArtifacts(policy) {
  const errors = [];
  exactKeys(policy, ["schemaVersion", "denyPaths", "denyCommitPatterns", "allowPaths"], "forbiddenArtifacts", errors);
  if (!object(policy)) return errors;
  integer(policy.schemaVersion, "forbiddenArtifacts.schemaVersion", errors, 1);
  if (policy.schemaVersion !== 1) errors.push("forbiddenArtifacts.schemaVersion must equal 1.");
  stringArray(policy.denyPaths, "forbiddenArtifacts.denyPaths", errors, { nonEmpty: true });
  stringArray(policy.denyCommitPatterns, "forbiddenArtifacts.denyCommitPatterns", errors, { nonEmpty: true });
  stringArray(policy.allowPaths, "forbiddenArtifacts.allowPaths", errors);
  if (Array.isArray(policy.denyCommitPatterns)) {
    policy.denyCommitPatterns.forEach((pattern, index) => {
      try { new RegExp(pattern, "i"); } catch { errors.push(`forbiddenArtifacts.denyCommitPatterns[${index}] is not a valid regular expression.`); }
    });
  }
  return errors;
}

export function validateSkillPolicy(policy) {
  const errors = [];
  exactKeys(policy, ["schemaVersion", "mode", "requireSanitizedFailureRecord", "requireBehavioralEval", "requireAdjacentRegression", "minimumProjectArchetypesForUniversalSkillChange", "allowAutonomousSkillMutation", "allowAutonomousMerge", "learningData"], "skillPolicy", errors);
  if (!object(policy)) return errors;
  integer(policy.schemaVersion, "skillPolicy.schemaVersion", errors, 1);
  if (policy.schemaVersion !== 1) errors.push("skillPolicy.schemaVersion must equal 1.");
  if (policy.mode !== "human-reviewed") errors.push("skillPolicy.mode must equal human-reviewed.");
  for (const key of ["requireSanitizedFailureRecord", "requireBehavioralEval", "requireAdjacentRegression"]) {
    boolean(policy[key], `skillPolicy.${key}`, errors);
    if (policy[key] !== true) errors.push(`skillPolicy.${key} must remain true.`);
  }
  integer(policy.minimumProjectArchetypesForUniversalSkillChange, "skillPolicy.minimumProjectArchetypesForUniversalSkillChange", errors, 2);
  for (const key of ["allowAutonomousSkillMutation", "allowAutonomousMerge"]) {
    boolean(policy[key], `skillPolicy.${key}`, errors);
    if (policy[key] !== false) errors.push(`skillPolicy.${key} must remain false.`);
  }
  exactKeys(policy.learningData, ["allow", "deny"], "skillPolicy.learningData", errors);
  if (object(policy.learningData)) {
    stringArray(policy.learningData.allow, "skillPolicy.learningData.allow", errors, { nonEmpty: true, pattern: /^[a-z][a-z0-9_]*$/ });
    stringArray(policy.learningData.deny, "skillPolicy.learningData.deny", errors, { nonEmpty: true, pattern: /^[a-z][a-z0-9_]*$/ });
  }
  return errors;
}

export function unresolvedCommands(profile) {
  return COMMAND_NAMES.filter((name) => profile.projectCommands?.[name]?.mode === "unresolved");
}

export { COMMAND_NAMES };
