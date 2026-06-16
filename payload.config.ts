import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";
import {
  Npcs,
  Areas,
  EventTemplates,
  TaskTemplates,
  Items,
  Achievements,
  DailyReportTemplates,
} from "./src/payload/collections/index";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: "users",
    importMap: {
      baseDir: path.resolve(dirname, "src"),
    },
  },
  collections: [
    {
      slug: "users",
      auth: true,
      fields: [{ name: "role", type: "select", options: ["admin", "editor"], defaultValue: "admin" }],
    },
    Npcs,
    Areas,
    EventTemplates,
    TaskTemplates,
    Items,
    Achievements,
    DailyReportTemplates,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "tianqiong-dev-secret",
  typescript: {
    outputFile: path.resolve(dirname, "src/payload/payload-types.ts"),
  },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URL || "file:./payload.db",
    },
  }),
  sharp,
});
