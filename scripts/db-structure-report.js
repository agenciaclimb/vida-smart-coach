import { Client } from "pg";

const optionalTables = ["subscription_plans", "comments"];

const client = new Client({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: { rejectUnauthorized: false },
});

const formatRows = (result) => result.rows.map((row) => ({ ...row }));

(async () => {
  try {
    await client.connect();
    await client.query("SET ROLE postgres");

    console.log("== public.achievements columns ==");
    const achievements = await client.query(
      `SELECT column_name, data_type, is_nullable, column_default
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'achievements'
       ORDER BY ordinal_position`
    );
    if (achievements.rowCount === 0) {
      console.log("Table not found.");
    } else {
      console.table(formatRows(achievements));
    }

    const uniqueConstraints = await client.query(
      `SELECT conname, pg_get_constraintdef(c.oid) AS definition
       FROM pg_constraint c
       JOIN pg_class t ON t.oid = c.conrelid
       JOIN pg_namespace n ON n.oid = t.relnamespace
       WHERE n.nspname='public' AND t.relname='achievements' AND c.contype='u'
       ORDER BY conname`
    );
    console.log("\n== public.achievements unique constraints ==");
    if (uniqueConstraints.rowCount === 0) {
      console.log("No unique constraints found.");
    } else {
      console.table(formatRows(uniqueConstraints));
    }

    console.log("\n== Tables in public schema matching %achieve% ==");
    const tableList = await client.query(
      `SELECT schemaname, tablename
       FROM pg_tables
       WHERE schemaname = 'public' AND tablename ILIKE '%achieve%'
       ORDER BY tablename`
    );
    if (tableList.rowCount === 0) {
      console.log("No matching tables found.");
    } else {
      console.table(formatRows(tableList));
    }

    console.log("\n== Presence of optional tables ==");
    const existence = await client.query(
      `SELECT table_name,
              EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = t.table_name
              ) AS exists
       FROM UNNEST($1::text[]) AS t(table_name)`,
      [optionalTables]
    );
    console.table(formatRows(existence));

    for (const table of optionalTables) {
      const exists = existence.rows.find((row) => row.table_name === table)?.exists;
      console.log(`\n== public.${table} columns ==`);
      if (!exists) {
        console.log("Table not found.");
        continue;
      }
      const columns = await client.query(
        `SELECT column_name, data_type, is_nullable, column_default
         FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = $1
         ORDER BY ordinal_position`,
        [table]
      );
      console.table(formatRows(columns));
    }
  } catch (error) {
    console.error("Diagnostic query failed:", error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
