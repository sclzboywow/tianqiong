/**
 * 本地开发：检查 Payload CMS 中 location-actions 文档是否可按 ID 读取。
 *
 * 用法：npx tsx scripts/dev/inspect-location-action-payload.ts [id]
 * 环境：需配置 Payload 所需环境变量（与项目本地开发一致）。
 */
import { getPayload } from "payload";
import config from "@payload-config";

async function main() {
  const id = Number(process.argv[2] || 11);
  const payload = await getPayload({ config });

  try {
    const doc = await payload.findByID({
      collection: "location-actions",
      id,
    });
    console.log("findByID ok:", doc.slug, doc.label);
  } catch (error) {
    console.error("findByID failed:", error);
  }

  try {
    const result = await payload.find({
      collection: "location-actions",
      where: { id: { equals: id } },
      limit: 1,
    });
    console.log("find ok:", result.docs[0]?.slug);
  } catch (error) {
    console.error("find failed:", error);
  }
}

main().catch(console.error);
