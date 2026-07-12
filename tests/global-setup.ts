import { existsSync, unlinkSync } from "node:fs";
import { execSync } from "node:child_process";
import { TEST_DB_PATH, TEST_DATABASE_URL } from "./db-path";

/**
 * Deletes a file if present, tolerating Windows' brief EBUSY window right after a
 * child process (e.g. the MCP server tests spawn one) releases its file handle.
 */
function removeIfExists(filePath: string, attempts = 5) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (!existsSync(filePath)) return;
    try {
      unlinkSync(filePath);
      return;
    } catch (e) {
      const isBusy = e instanceof Error && "code" in e && e.code === "EBUSY";
      if (!isBusy || attempt === attempts) throw e;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
    }
  }
}

export async function setup() {
  removeIfExists(TEST_DB_PATH);
  removeIfExists(`${TEST_DB_PATH}-journal`);

  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: "inherit",
  });
}

export async function teardown() {
  removeIfExists(TEST_DB_PATH);
  removeIfExists(`${TEST_DB_PATH}-journal`);
}
