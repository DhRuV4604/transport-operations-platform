import { TEST_DATABASE_URL } from "./db-path";

process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.AUTH_SECRET = process.env.AUTH_SECRET ?? "test-secret";
