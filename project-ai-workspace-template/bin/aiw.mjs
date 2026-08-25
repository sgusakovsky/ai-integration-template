#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const scriptFile = fileURLToPath(import.meta.url);
const aiRoot = path.resolve(path.dirname(scriptFile), "..");
const profilePath = path.join(aiRoot, "project", "profile.json");
const forbiddenPath = path.join(aiRoot, "project", "forbidden-artifacts.json");

function fail(message, code = 1) {
  process.stderr.write(`ERROR: ${message}\n`);
  process.exit(code);
}

function info(message) {
  process.stdout.write(`${message}\n`);
}

function loadJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    fail(`Cannot read valid JSON from ${file}: ${error.message}`);
  }
}

function parseArgs(argv) {
  const result = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      result._.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      result[key] = true;
    } else {
      result[key] = next;
      index += 1;
    }
  }
  return result;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    env: options.env || process.env,
    encoding: "utf8",
    stdio: options.inherit ? "inherit" : "pipe",
    shell: false
  });
  if (result.error) {
    if (options.allowFailure) return { status: 127, stdout: "", stderr: result.error.message };
    fail(`Cannot run ${command}: ${result.error.message}`);
  }
  if (result.status !== 0 && !options.allowFailure) {
    const detail = (result.stderr || result.stdout || "").trim();
    fail(`${command} failed with exit code ${result.status}${detail ? `: ${detail}` : ""}`);
  }
  return result;
}

function commandExists(command) {
  const probe = process.platform === "win32" ? "where" : "sh";
  const args = process.platform === "win32" ? [command] : ["-c", `command -v "${command}"`];
  return run(probe, args, { allowFailure: true }).status === 0;
}

function normalizeRemote(value) {
  return String(value || "")
    .trim()
    .replace(/^git@([^:]+):/, "https://$1/")
    .replace(/^ssh:\/\/git@([^/]+)\//, "https://$1/")
    .replace(/^http:\/\//, "https://")
    .replace(/\/+$/, "")
    .replace(/\.git$/i, "")
    .toLowerCase();
}

function isInside(child, parent) {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function context() {
  const profile = loadJson(profilePath);
  const clientRoot = path.resolve(aiRoot, profile.targetRepository.localRelativePath);
  const runtimeRoot = path.resolve(aiRoot, profile.targetRepository.runtimeRelativePath || "../.ai-runtime");
  return { profile, clientRoot, runtimeRoot };
}

function validateTarget(requireCommands = false) {
  const ctx = context();
  const errors = [];
  if (!fs.existsSync(ctx.clientRoot)) errors.push(`Project checkout does not exist: ${ctx.clientRoot}`);
  if (isInside(ctx.clientRoot, aiRoot) || isInside(aiRoot, ctx.clientRoot)) {
    errors.push("The project repository and AI workspace must be sibling directories, not nested.");
  }
  if (String(ctx.profile.project.id).startsWith("REPLACE_")) errors.push("Replace project.id in project/profile.json.");
  const allowed = (ctx.profile.targetRepository.allowedRemotes || []).map(normalizeRemote);
  if (!allowed.length || allowed.some((item) => item.includes("replace_"))) {
    errors.push("Replace targetRepository.allowedRemotes with exact project remote URLs.");
  }
  if (fs.existsSync(ctx.clientRoot)) {
    const inside = run("git", ["rev-parse", "--is-inside-work-tree"], { cwd: ctx.clientRoot, allowFailure: true });
    if (inside.status !== 0 || inside.stdout.trim() !== "true") errors.push("Target directory is not a Git worktree.");
    const remote = run("git", ["remote", "get-url", "origin"], { cwd: ctx.clientRoot, allowFailure: true });
    if (remote.status !== 0) {
      errors.push("Project checkout has no origin remote.");
    } else if (!allowed.includes(normalizeRemote(remote.stdout))) {
      errors.push(`Project origin is not allowlisted: ${remote.stdout.trim()}`);
    }
  }
  if (!ctx.profile.dataPolicy?.lane || !["green", "amber", "red"].includes(ctx.profile.dataPolicy.lane)) {
    errors.push("dataPolicy.lane must be green, amber, or red.");
  }
  if (requireCommands) {
    const unresolved = Object.entries(ctx.profile.projectCommands || {})
      .filter(([, value]) => !value || value === "UNRESOLVED")
      .map(([key]) => key);
    if (unresolved.length) errors.push(`Project commands are unresolved: ${unresolved.join(", ")}`);
  }
  return { ...ctx, errors };
}

function globToRegExp(glob) {
  let source = "";
  for (let index = 0; index < glob.length; index += 1) {
    const char = glob[index];
    if (char === "*" && glob[index + 1] === "*") {
      source += ".*";
      index += 1;
    } else if (char === "*") {
      source += "[^/]*";
    } else if (char === "?") {
      source += "[^/]";
    } else {
      source += char.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`^${source}$`, "i");
}

function listChangedFiles(clientRoot, defaultBranch) {
  const files = new Set();
  const commands = [
    ["diff", "--name-only"],
    ["diff", "--cached", "--name-only"],
    ["ls-files", "--others", "--exclude-standard"]
  ];
  const mergeBase = run("git", ["merge-base", "HEAD", defaultBranch], { cwd: clientRoot, allowFailure: true });
  if (mergeBase.status === 0) commands.push(["diff", "--name-only", `${mergeBase.stdout.trim()}...HEAD`]);
  for (const args of commands) {
    const result = run("git", args, { cwd: clientRoot, allowFailure: true });
    if (result.status === 0) {
      for (const file of result.stdout.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)) files.add(file.replaceAll("\\", "/"));
    }
  }
  return [...files].sort();
}

function scan() {
  const { clientRoot, profile, errors } = validateTarget(false);
  if (errors.length) fail(errors.join("\n"));
  const policy = loadJson(forbiddenPath);
  const files = listChangedFiles(clientRoot, profile.targetRepository.defaultBranch);
  const allow = (policy.allowPaths || []).map(globToRegExp);
  const deny = (policy.denyPaths || []).map((pattern) => ({ pattern, regex: globToRegExp(pattern) }));
  const blockedFiles = [];
  for (const file of files) {
    if (allow.some((regex) => regex.test(file))) continue;
    const match = deny.find(({ regex }) => regex.test(file));
    if (match) blockedFiles.push(`${file} (matches ${match.pattern})`);
  }
  const defaultBranch = profile.targetRepository.defaultBranch;
  const messages = run("git", ["log", "--format=%B", `${defaultBranch}..HEAD`], { cwd: clientRoot, allowFailure: true }).stdout || "";
  const diff = run("git", ["diff", "--no-ext-diff", "--unified=0"], { cwd: clientRoot, allowFailure: true }).stdout || "";
  const staged = run("git", ["diff", "--cached", "--no-ext-diff", "--unified=0"], { cwd: clientRoot, allowFailure: true }).stdout || "";
  const addedLines = `${diff}\n${staged}`
    .split(/\r?\n/)
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
    .join("\n");
  const searchable = `${messages}\n${addedLines}`;
  const blockedPatterns = [];
  for (const pattern of policy.denyCommitPatterns || []) {
    let regex;
    try { regex = new RegExp(pattern, "i"); } catch { fail(`Invalid denyCommitPatterns regex: ${pattern}`); }
    if (regex.test(searchable)) blockedPatterns.push(pattern);
  }
  info(`Changed/untracked project files inspected: ${files.length}`);
  if (blockedFiles.length) info(`Forbidden paths:\n- ${blockedFiles.join("\n- ")}`);
  if (blockedPatterns.length) info(`Forbidden text patterns:\n- ${blockedPatterns.join("\n- ")}`);
  if (blockedFiles.length || blockedPatterns.length) fail("Delivery hygiene scan: BLOCK", 2);
  info("Delivery hygiene scan: PASS");
}

function doctor(args) {
  const tool = args.tool || "codex";
  const mode = args.mode || "native";
  const checks = [];
  const nodeMajor = Number(process.versions.node.split(".")[0]);
  checks.push([nodeMajor >= 20, `Node.js >=20 (found ${process.versions.node})`]);
  checks.push([commandExists("git"), "Git available"]);
  if (mode === "native") checks.push([commandExists(tool), `${tool} CLI available`]);
  if (mode === "docker") checks.push([commandExists("docker"), "Docker available"]);
  const requireCommands = Boolean(args["require-commands"]) || new Set(["developer", "qa", "reviewer"]).has(args.role || "");
  const validated = validateTarget(requireCommands);
  for (const error of validated.errors) checks.push([false, error]);
  if (!validated.errors.length) checks.push([true, "Project remote exactly matches allowlist"]);
  checks.push([fs.existsSync(path.join(aiRoot, "agents", `${args.role || "analyst"}.md`)), "Default/requested role exists"]);
  for (const [passed, label] of checks) info(`${passed ? "PASS" : "FAIL"} ${label}`);
  if (checks.some(([passed]) => !passed)) fail("Doctor found blocking configuration problems.", 2);
  scan();
}

function safeToken(value, label) {
  if (!value || !/^[A-Za-z0-9._-]+$/.test(value)) fail(`${label} must contain only letters, digits, dot, underscore, or hyphen.`);
  return value;
}

function buildInstructions(role, workflow, task, sessionDir) {
  const content = composeInstructions(role, workflow, task);
  const output = path.join(sessionDir, "instructions.md");
  fs.writeFileSync(output, content, { mode: 0o600 });
  return output;
}

function skillBundle(skillName) {
  const skillDir = path.join(aiRoot, "skills", skillName);
  const entry = path.join(skillDir, "SKILL.md");
  if (!fs.existsSync(entry)) fail(`Required skill does not exist: ${entry}`);
  const entryText = fs.readFileSync(entry, "utf8");
  const references = [...entryText.matchAll(/\]\((references\/[^)]+\.md)\)/g)].map((match) => match[1]);
  const parts = [entryText];
  for (const relative of [...new Set(references)]) {
    const file = path.resolve(skillDir, relative);
    if (!isInside(file, skillDir) || !fs.existsSync(file)) fail(`Referenced skill file does not exist: ${relative}`);
    parts.push(`# Loaded skill reference: ${relative}\n\n${fs.readFileSync(file, "utf8")}`);
  }
  return parts.join("\n\n---\n\n");
}

function composeInstructions(role, workflow, task) {
  const files = [
    path.join(aiRoot, "docs", "base-instructions.md"),
    path.join(aiRoot, "agents", `${role}.md`),
    path.join(aiRoot, "workflows", `${workflow}.md`)
  ];
  for (const file of files) if (!fs.existsSync(file)) fail(`Required instruction file does not exist: ${file}`);
  const profile = loadJson(profilePath);
  const header = `# Session\n\nTask: ${task}\nRole: ${role}\nWorkflow: ${workflow}\nData lane: ${profile.dataPolicy.lane}\nHuman gates: ${(profile.humanGates || []).join(", ")}\n`;
  const body = [...files.map((file) => fs.readFileSync(file, "utf8")), skillBundle(workflow)].join("\n\n---\n\n");
  return `${header}\n${body}\n`;
}

function composeImprovementInstructions(caseId) {
  const files = [
    path.join(aiRoot, "docs", "improvement-instructions.md"),
    path.join(aiRoot, "workflows", "continuous-improvement.md")
  ];
  for (const file of files) if (!fs.existsSync(file)) fail(`Required improvement file does not exist: ${file}`);
  const header = `# AIW improvement session\n\nRecord: ${caseId}\nAI workspace: ${aiRoot}\nProject repository is out of scope and must not change.\n`;
  const body = [...files.map((file) => fs.readFileSync(file, "utf8")), skillBundle("continuous-improvement")].join("\n\n---\n\n");
  return `${header}\n${body}\n`;
}

function printContext(args) {
  const role = safeToken(args.role || "developer", "role");
  const workflow = safeToken(args.workflow || "feature", "workflow");
  const task = safeToken(args.task || "UNASSIGNED", "task");
  const validated = validateTarget(false);
  if (validated.errors.length) fail(validated.errors.join("\n"));
  process.stdout.write(composeInstructions(role, workflow, task));
}

function createSession(task, tool, role, workflow) {
  const { runtimeRoot } = context();
  fs.mkdirSync(runtimeRoot, { recursive: true, mode: 0o700 });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const sessionDir = path.join(runtimeRoot, `${task}-${stamp}`);
  fs.mkdirSync(sessionDir, { recursive: false, mode: 0o700 });
  const metadata = { task, tool, role, workflow, startedAt: new Date().toISOString(), status: "started" };
  fs.writeFileSync(path.join(sessionDir, "metadata.json"), JSON.stringify(metadata, null, 2), { mode: 0o600 });
  return sessionDir;
}

function nativeToolArgs(tool, ctx, instructionFile, prompt, workRoot = ctx.clientRoot) {
  const model = ctx.profile.ai?.[tool]?.model || "";
  if (tool === "codex") {
    const instructionText = fs.readFileSync(instructionFile, "utf8");
    const args = [
      "-C", workRoot,
      "--sandbox", "workspace-write",
      "--ask-for-approval", "on-request",
      "--strict-config",
      "-c", "sandbox_workspace_write.network_access=false",
      "-c", "shell_environment_policy.ignore_default_excludes=false",
      "-c", "features.apps=false",
      "-c", "features.memories=false",
      "-c", `developer_instructions=${JSON.stringify(instructionText)}`
    ];
    if (model) args.push("--model", model);
    args.push(prompt);
    return args;
  }
  if (tool === "claude") {
    const instructionText = fs.readFileSync(instructionFile, "utf8");
    const args = [
      "--append-system-prompt", instructionText,
      "--settings", path.join(aiRoot, "adapters", "claude", "settings.json"),
      "--setting-sources", "user",
      "--strict-mcp-config",
      "--mcp-config", JSON.stringify({ mcpServers: {} }),
      "--permission-mode", "manual",
      "--no-chrome",
      "--disable-slash-commands"
    ];
    if (model) args.push("--model", model);
    args.push(prompt);
    return args;
  }
  fail(`Unsupported tool: ${tool}`);
}

function dockerToolArgs(tool, ctx, instructionFile, prompt) {
  const image = "project-ai-workspace:local";
  const runtimeSession = path.dirname(instructionFile);
  const mounts = [
    "run", "--rm", "-it",
    "--mount", `type=bind,src=${ctx.clientRoot},dst=/workspace/client`,
    "--mount", `type=bind,src=${aiRoot},dst=/workspace/ai,readonly`,
    "--mount", `type=bind,src=${runtimeSession},dst=/workspace/runtime,readonly`,
    "--workdir", "/workspace/client"
  ];
  const model = ctx.profile.ai?.[tool]?.model || "";
  if (tool === "codex") {
    const instructionText = fs.readFileSync(instructionFile, "utf8");
    mounts.push("--mount", "type=volume,src=aiw-codex-home,dst=/home/agent/.codex", image, "codex",
      "-C", "/workspace/client", "--sandbox", "workspace-write",
      "--ask-for-approval", "on-request", "--strict-config",
      "-c", "sandbox_workspace_write.network_access=false",
      "-c", "shell_environment_policy.ignore_default_excludes=false",
      "-c", "features.apps=false", "-c", "features.memories=false",
      "-c", `developer_instructions=${JSON.stringify(instructionText)}`);
    if (model) mounts.push("--model", model);
    mounts.push(prompt);
    return mounts;
  }
  if (tool === "claude") {
    const instructionText = fs.readFileSync(instructionFile, "utf8");
    mounts.push("--mount", "type=volume,src=aiw-claude-home,dst=/home/agent/.claude", image, "claude",
      "--append-system-prompt", instructionText,
      "--settings", "/workspace/ai/adapters/claude/settings.json",
      "--setting-sources", "user", "--strict-mcp-config", "--mcp-config", JSON.stringify({ mcpServers: {} }),
      "--permission-mode", "manual", "--no-chrome", "--disable-slash-commands");
    if (model) mounts.push("--model", model);
    mounts.push(prompt);
    return mounts;
  }
  fail(`Unsupported tool: ${tool}`);
}

function start(args) {
  const tool = safeToken(args.tool || loadJson(profilePath).ai.defaultTool || "codex", "tool");
  if (!new Set(["codex", "claude"]).has(tool)) fail("--tool must be codex or claude.");
  const role = safeToken(args.role || "developer", "role");
  const workflow = safeToken(args.workflow || "feature", "workflow");
  const task = safeToken(args.task, "task");
  const mode = args.mode || "native";
  if (!new Set(["native", "docker"]).has(mode)) fail("--mode must be native or docker.");
  const ctx = validateTarget(false);
  if (ctx.errors.length) fail(ctx.errors.join("\n"));
  scan();
  if (mode === "native" && !commandExists(tool)) fail(`${tool} CLI is not available.`);
  if (mode === "docker" && !commandExists("docker")) fail("Docker is not available.");
  const sessionDir = createSession(task, tool, role, workflow);
  const instructionFile = buildInstructions(role, workflow, task, sessionDir);
  const prompt = `Work on task ${task} as the ${role} role. Follow the injected workflow. Begin by inspecting the current repository state and state what you will do. Do not commit, push, merge, or deploy.`;
  info(`Session runtime: ${sessionDir}`);
  const command = mode === "docker" ? "docker" : tool;
  const toolArgs = mode === "docker" ? dockerToolArgs(tool, ctx, instructionFile, prompt) : nativeToolArgs(tool, ctx, instructionFile, prompt, ctx.clientRoot);
  const result = run(command, toolArgs, { cwd: ctx.clientRoot, inherit: true, allowFailure: true });
  if (result.status !== 0) fail(`${tool} exited with status ${result.status}. Runtime was preserved at ${sessionDir}.`, result.status || 1);
  scan();
  info("Session ended. Review the project diff, then run verify and finish.");
}

function improve(args) {
  const tool = safeToken(args.tool || loadJson(profilePath).ai.defaultTool || "codex", "tool");
  if (!new Set(["codex", "claude"]).has(tool)) fail("--tool must be codex or claude.");
  const caseId = safeToken(args.case || args.task, "case");
  if (args.mode && args.mode !== "native") fail("AIW improvement currently supports native mode only.");
  const ctx = validateTarget(false);
  if (ctx.errors.length) fail(ctx.errors.join("\n"));
  if (!commandExists(tool)) fail(`${tool} CLI is not available.`);
  scan();
  const clientStatusBefore = run("git", ["status", "--porcelain=v1"], { cwd: ctx.clientRoot }).stdout;
  const clientHeadBefore = run("git", ["rev-parse", "HEAD"], { cwd: ctx.clientRoot }).stdout.trim();
  const sessionDir = createSession(caseId, tool, "aiw-maintainer", "continuous-improvement");
  const instructionFile = path.join(sessionDir, "instructions.md");
  fs.writeFileSync(instructionFile, composeImprovementInstructions(caseId), { mode: 0o600 });
  const prompt = `Improve the private AI workspace for sanitized record ${caseId}. Diagnose the correct layer, add or update a behavioral eval, make the narrowest justified AIW change, and validate it. Do not modify the project repository or perform Git delivery.`;
  info(`Improvement runtime: ${sessionDir}`);
  const result = run(tool, nativeToolArgs(tool, ctx, instructionFile, prompt, aiRoot), { cwd: aiRoot, inherit: true, allowFailure: true });
  if (result.status !== 0) fail(`${tool} exited with status ${result.status}. Runtime was preserved at ${sessionDir}.`, result.status || 1);
  const clientStatusAfter = run("git", ["status", "--porcelain=v1"], { cwd: ctx.clientRoot }).stdout;
  const clientHeadAfter = run("git", ["rev-parse", "HEAD"], { cwd: ctx.clientRoot }).stdout.trim();
  if (clientStatusAfter !== clientStatusBefore || clientHeadAfter !== clientHeadBefore) {
    fail("Project repository changed during AIW improvement. Do not discard user work; inspect and resolve the difference manually.", 2);
  }
  scan();
  validateSkills();
  fs.rmSync(sessionDir, { recursive: true, force: true });
  const aiStatus = run("git", ["status", "--short"], { cwd: aiRoot }).stdout.trim();
  info("AIW improvement session ended; project repository state is unchanged.");
  info(`AI workspace changes:\n${aiStatus || "none"}`);
  info("A human must review eval evidence and the AI-workspace diff before commit or push.");
}

function installHooks() {
  const { clientRoot, errors } = validateTarget(false);
  if (errors.length) fail(errors.join("\n"));
  const gitDirResult = run("git", ["rev-parse", "--git-dir"], { cwd: clientRoot });
  const gitDir = path.resolve(clientRoot, gitDirResult.stdout.trim());
  const hookPath = path.join(gitDir, "hooks", "pre-push");
  fs.mkdirSync(path.dirname(hookPath), { recursive: true });
  if (fs.existsSync(hookPath)) {
    const existing = fs.readFileSync(hookPath, "utf8");
    if (!existing.includes("AIW_MANAGED_HOOK")) fail(`A non-managed pre-push hook already exists: ${hookPath}. Merge it manually; it was not overwritten.`);
  }
  const hookScriptPath = scriptFile.replaceAll("\\", "/");
  const script = `#!/usr/bin/env sh\n# AIW_MANAGED_HOOK\nexec node ${JSON.stringify(hookScriptPath)} verify\n`;
  fs.writeFileSync(hookPath, script, { mode: 0o755 });
  info(`Installed managed pre-push hook: ${hookPath}`);
}

function sessionsForTask(runtimeRoot, task) {
  if (!fs.existsSync(runtimeRoot)) return [];
  return fs.readdirSync(runtimeRoot)
    .filter((name) => name.startsWith(`${task}-`))
    .map((name) => path.join(runtimeRoot, name))
    .filter((item) => fs.statSync(item).isDirectory())
    .sort();
}

function finish(args) {
  const task = safeToken(args.task, "task");
  scan();
  const { runtimeRoot, clientRoot, profile } = context();
  const sessionDirs = sessionsForTask(runtimeRoot, task);
  if (!sessionDirs.length) fail(`No runtime session found for ${task}.`);
  const status = run("git", ["status", "--short"], { cwd: clientRoot }).stdout.trim().split(/\r?\n/).filter(Boolean);
  const summaryDir = path.join(aiRoot, "session-summaries");
  fs.mkdirSync(summaryDir, { recursive: true });
  for (const sessionDir of sessionDirs) {
    const metadataPath = path.join(sessionDir, "metadata.json");
    const metadata = fs.existsSync(metadataPath) ? loadJson(metadataPath) : { task };
    const summary = {
      ...metadata,
      finishedAt: new Date().toISOString(),
      status: "finished",
      projectId: profile.project.id,
      changedPathCount: status.length,
      verification: "delivery-hygiene-pass",
      note: "No project source, prompt, or transcript is stored in this summary."
    };
    const summaryPath = path.join(summaryDir, `${path.basename(sessionDir)}.json`);
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    fs.rmSync(sessionDir, { recursive: true, force: true });
    info(`Sanitized summary created: ${summaryPath}`);
  }
  info(`${sessionDirs.length} runtime session(s) removed. A human must review, stage explicit files, commit, and push.`);
}

function dockerBuild() {
  if (!commandExists("docker")) fail("Docker is not available.");
  run("docker", ["build", "-t", "project-ai-workspace:local", "-f", path.join(aiRoot, "docker", "Dockerfile"), aiRoot], { inherit: true });
}

function dockerLogin(args) {
  const tool = safeToken(args.tool, "tool");
  if (!new Set(["codex", "claude"]).has(tool)) fail("--tool must be codex or claude.");
  if (!commandExists("docker")) fail("Docker is not available.");
  const volume = tool === "codex" ? "aiw-codex-home:/home/agent/.codex" : "aiw-claude-home:/home/agent/.claude";
  const loginArgs = tool === "codex" ? ["login"] : ["auth", "login"];
  run("docker", ["run", "--rm", "--user", "0", "--mount", `type=volume,src=${volume.split(":")[0]},dst=${volume.split(":")[1]}`, "project-ai-workspace:local", "chown", "-R", "10001:10001", volume.split(":")[1]], { inherit: true });
  run("docker", ["run", "--rm", "-it", "--mount", `type=volume,src=${volume.split(":")[0]},dst=${volume.split(":")[1]}`, "project-ai-workspace:local", tool, ...loginArgs], { inherit: true });
}

function selfTest() {
  const cases = [
    [normalizeRemote("git@github.com:Org/Repo.git"), "https://github.com/org/repo"],
    [normalizeRemote("https://gitlab.com/Org/Repo.git/"), "https://gitlab.com/org/repo"],
    [normalizeRemote("ssh://git@bitbucket.org/Org/Repo.git"), "https://bitbucket.org/org/repo"]
  ];
  for (const [actual, expected] of cases) if (actual !== expected) fail(`Remote normalization self-test failed: ${actual} != ${expected}`);
  const globCases = [
    [".claude/**", ".claude/settings.json", true],
    ["*.prompt.md", "task.prompt.md", true],
    ["*.prompt.md", "docs/task.prompt.md", false],
    ["AGENTS.md", "AGENTS.md", true],
    ["**/AGENTS.md", "nested/AGENTS.md", true]
  ];
  for (const [glob, value, expected] of globCases) if (globToRegExp(glob).test(value) !== expected) fail(`Glob self-test failed: ${glob} / ${value}`);
  validateSkills();
  info("Self-test: PASS");
}

function validateSkills() {
  const expected = ["feature", "bug-fix", "testing", "documentation", "continuous-improvement"];
  for (const name of expected) {
    const entry = path.join(aiRoot, "skills", name, "SKILL.md");
    if (!fs.existsSync(entry)) fail(`Missing skill: ${name}`);
    const content = fs.readFileSync(entry, "utf8");
    if (!/^---\n[\s\S]*?\n---\n/.test(content)) fail(`Skill frontmatter is invalid: ${entry}`);
    if (!/^name:\s*[a-z0-9-]+\s*$/m.test(content)) fail(`Skill name is invalid: ${entry}`);
    if (!/^description:\s*\S.+$/m.test(content)) fail(`Skill description is missing: ${entry}`);
    skillBundle(name);
  }
  const policy = loadJson(path.join(aiRoot, "project", "skill-improvement-policy.json"));
  if (policy.mode !== "human-reviewed" || policy.allowAutonomousSkillMutation !== false || policy.allowAutonomousMerge !== false) {
    fail("Skill improvement policy must require human review and disable autonomous mutation/merge.");
  }
  const caseDir = path.join(aiRoot, "evals", "cases");
  const baselineCases = fs.existsSync(caseDir) ? fs.readdirSync(caseDir).filter((name) => name.endsWith(".md")) : [];
  if (baselineCases.length < 5) fail("At least five cross-archetype baseline skill eval cases are required.");
  info("Skill validation: PASS");
}

function usage() {
  info(`Usage:
  aiw doctor [--tool codex|claude] [--mode native|docker] [--role <role>] [--require-commands]
  aiw start --tool codex|claude --role <role> --workflow <workflow> --task <id> [--mode native|docker]
  aiw improve --case AIW-<id> [--tool codex|claude]
  aiw context [--role <role>] [--workflow <workflow>] [--task <id>]
  aiw verify [--task <id>]
  aiw finish --task <id>
  aiw install-hooks
  aiw docker-build
  aiw docker-login --tool codex|claude
  aiw self-test`);
}

const args = parseArgs(process.argv.slice(2));
const command = args._[0];
switch (command) {
  case "doctor": doctor(args); break;
  case "start": start(args); break;
  case "improve": improve(args); break;
  case "context": printContext(args); break;
  case "verify": scan(); break;
  case "finish": finish(args); break;
  case "install-hooks": installHooks(); break;
  case "docker-build": dockerBuild(); break;
  case "docker-login": dockerLogin(args); break;
  case "self-test": selfTest(); break;
  case "help":
  case "--help":
  case undefined: usage(); break;
  default: fail(`Unknown command: ${command}`);
}
