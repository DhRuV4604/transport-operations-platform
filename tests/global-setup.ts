import { existsSync, unlinkSync } from "node:fs";
import { execSync } from "node:child_process";
import { TEST_DB_PATH, TEST_DATABASE_URL } from "./db-path";

function removeIfExists(filePath: string) {
  if (existsSync(filePath)) unlinkSync(filePath);
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
