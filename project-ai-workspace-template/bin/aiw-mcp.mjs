#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { validateProfile } from "../lib/config.mjs";

const ownRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const aiRoot = path.resolve(process.env.AIW_PROJECT_ROOT || ownRoot);
const launcher = path.join(aiRoot, "bin", "aiw.mjs");

function run(args) {
  const result = spawnSync(process.execPath, [launcher, ...args], { cwd: aiRoot, encoding: "utf8", env: process.env });
  return { ok: result.status === 0, text: `${result.stdout || ""}${result.stderr || ""}`.trim() };
}

function send(payload) { process.stdout.write(`${JSON.stringify(payload)}\n`); }
function result(id, text, isError = false) { send({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text }], isError } }); }

const tools = [
  {
    name: "aiw_context",
    description: "Load the approved external role, workflow, data policy, and delivery rules before working on a project task.",
    inputSchema: {
      type: "object",
      properties: {
        task: { type: "string", description: "Task ID, for example PROJECT-123" },
        role: { type: "string", enum: ["analyst", "architect", "qa", "developer", "reviewer", "technical-writer"] },
        workflow: { type: "string", enum: ["feature", "bug-fix", "testing", "documentation"] }
      },
      required: ["task"]
    }
  },
  {
    name: "aiw_verify",
    description: "Check the project Git diff for forbidden AI artifacts before completion. This does not commit or push.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false }
  },
  {
    name: "aiw_check",
    description: "Run one configured project check. Only mode=agent executes; manual, forbidden, and unresolved remain blocked by policy.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", enum: ["install", "format", "lint", "typecheck", "testTargeted", "testFull", "build"] },
        task: { type: "string", description: "Task ID required when the command requires evidence." },
        target: { type: "string", description: "Selector substituted for {target} in configured arguments." }
      },
      required: ["name"],
      additionalProperties: false
    }
  },
  {
    name: "aiw_project_status",
    description: "Return the configured AI workspace and project repository paths plus a concise Git status.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false }
  }
];

function handle(message) {
  const { id, method, params = {} } = message;
  if (method === "initialize") {
    send({ jsonrpc: "2.0", id, result: { protocolVersion: params.protocolVersion || "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "aiw-project", version: "2.0.0" } } });
  } else if (method === "ping") send({ jsonrpc: "2.0", id, result: {} });
  else if (method === "tools/list") send({ jsonrpc: "2.0", id, result: { tools } });
  else if (method === "tools/call") {
    const input = params.arguments || {};
    if (params.name === "aiw_context") {
      const args = ["context", "--task", String(input.task), "--role", input.role || "developer", "--workflow", input.workflow || "feature"];
      const call = run(args); result(id, call.text, !call.ok);
    } else if (params.name === "aiw_verify") {
      const call = run(["verify"]); result(id, call.text, !call.ok);
    } else if (params.name === "aiw_check") {
      if (input.name === "install") {
        result(id, "Dependency installation is human-owned and cannot be approved through MCP. Run the configured install check in a terminal after explicit approval.", true);
        return;
      }
      const args = ["check", String(input.name)];
      if (input.task) args.push("--task", String(input.task));
      if (input.target) args.push("--target", String(input.target));
      const call = run(args); result(id, call.text, !call.ok);
    } else if (params.name === "aiw_project_status") {
      const profile = JSON.parse(fs.readFileSync(path.join(aiRoot, "project", "profile.json"), "utf8"));
      const errors = validateProfile(profile);
      if (errors.length) { result(id, `Project profile is invalid:\n${errors.join("\n")}`, true); return; }
      const projectRoot = path.resolve(aiRoot, profile.targetRepository.localRelativePath);
      const git = spawnSync("git", ["status", "--short"], { cwd: projectRoot, encoding: "utf8" });
      result(id, `Project: ${profile.project.id}\nProject repository: ${projectRoot}\nAI workspace: ${aiRoot}\nGit status:\n${git.stdout.trim() || "clean"}`, git.status !== 0);
    } else result(id, `Unknown tool: ${params.name}`, true);
  } else if (id !== undefined) send({ jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } });
}

let buffer = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buffer += chunk;
  for (;;) {
    const newline = buffer.indexOf("\n");
    if (newline < 0) break;
    const line = buffer.slice(0, newline).trim(); buffer = buffer.slice(newline + 1);
    if (!line) continue;
    try { handle(JSON.parse(line)); } catch (error) { process.stderr.write(`AIW MCP error: ${error.message}\n`); }
  }
});
