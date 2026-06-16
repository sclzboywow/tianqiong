import { createClient } from "@libsql/client";

async function main() {
  const client = createClient({ url: "file:payload.db" });
  const tables = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
  );
  console.log("Tables:", tables.rows.map((r) => r.name).join(", "));

  for (const table of ["npcs", "areas", "task_templates", "items", "achievements"]) {
    try {
      const result = await client.execute(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`${table}:`, result.rows[0]?.count);
    } catch {
      console.log(`${table}: (not found)`);
    }
  }
}

main().catch(console.error);
