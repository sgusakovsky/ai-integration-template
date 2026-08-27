#!/usr/bin/env node
import process from "node:process";
import { spawnSync } from "node:child_process";

function run(args) {
  const result = spawnSync("docker", args, { encoding: "utf8", stdio: "inherit" });
  if (result.error) {
    process.stderr.write(`ERROR: Docker is required for this smoke test: ${result.error.message}\n`);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status || 1);
}

run(["build", "-t", "project-ai-workspace:local", "-f", "docker/Dockerfile", "."]);
run(["run", "--rm", "--entrypoint", "sh", "project-ai-workspace:local", "-lc", "test \"$(id -u)\" = 10001 && test ! -S /var/run/docker.sock && test ! -e /home/agent/.ssh"]);
process.stdout.write("Docker smoke test: PASS\n");
