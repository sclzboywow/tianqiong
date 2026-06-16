import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import { en } from "payload/i18n/en";
import { zh } from "payload/i18n/zh";
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";
import {
  Npcs,
  Areas,
  MapLocations,
  EventTemplates,
  TaskTemplates,
  LocationActions,
  Items,
  Achievements,
  DailyReportTemplates,
} from "./src/payload/collections/index";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  i18n: {
    fallbackLanguage: "zh",
    supportedLanguages: { zh, en },
  },
  admin: {
    user: "users",
    meta: {
      titleSuffix: "- 天穹综合体",
    },
    importMap: {
      baseDir: path.resolve(dirname, "src"),
    },
  },
  collections: [
    {
      slug: "users",
      auth: true,
      labels: { singular: "用户", plural: "用户" },
      admin: { group: "系统管理" },
      fields: [
        {
          name: "role",
          type: "select",
          label: "角色",
          options: [
            { label: "管理员", value: "admin" },
            { label: "编辑", value: "editor" },
          ],
          defaultValue: "admin",
        },
      ],
    },
    Npcs,
    Areas,
    MapLocations,
    EventTemplates,
    TaskTemplates,
    LocationActions,
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
