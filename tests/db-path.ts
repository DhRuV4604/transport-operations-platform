import path from "node:path";
import os from "node:os";

export const TEST_DB_PATH = path.join(os.tmpdir(), "transitops-test.db");
export const TEST_DATABASE_URL = `file:${TEST_DB_PATH}`;
