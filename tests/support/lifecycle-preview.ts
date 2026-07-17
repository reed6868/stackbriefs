import { spawn } from "node:child_process";
import { join } from "node:path";

import {
  buildLifecycleProject,
  createLifecycleProject,
  removeLifecycleProject,
} from "./lifecycle-project.ts";

const projectRoot = await createLifecycleProject();
await buildLifecycleProject(projectRoot);

const preview = spawn(
  join(projectRoot, "node_modules/.bin/astro"),
  ["preview", "--host", "127.0.0.1", "--port", "4328"],
  { cwd: projectRoot, stdio: "inherit" },
);

async function stop(signal: NodeJS.Signals) {
  preview.kill(signal);
  await removeLifecycleProject(projectRoot);
}

process.on("SIGINT", () => void stop("SIGINT"));
process.on("SIGTERM", () => void stop("SIGTERM"));

const exitCode = await new Promise<number>((resolve) => {
  preview.on("exit", (code) => resolve(code ?? 0));
});
await removeLifecycleProject(projectRoot);
process.exit(exitCode);
