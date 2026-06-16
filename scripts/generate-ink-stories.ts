import fs from "fs";
import path from "path";
import { TASK_TEMPLATES } from "../src/data/taskTemplates";

const STORY_CONTENT: Record<string, { intro: string; choices: { text: string; id: string; result: string }[] }> = {
  fire_corridor_blocked: {
    intro: "你在 L1 商业街巡场时，发现某商户把装修材料堆满了消防通道。\n\n商户负责人说：\n\"就放半天，晚上肯定搬。\"\n\n但你知道，明天上午消防专项检查组可能提前到场。",
    choices: [
      { text: "立即要求清走，并拍照留存", id: "strict_clear", result: "你要求商户立即清走材料，并拍照留存。商户脸色不好看，但消防通道恢复了畅通。" },
      { text: "允许临时堆放，但签确认单", id: "conditional_allow", result: "你要求商户签署确认单，并限定晚上前清理。事情暂时压住了，但风险还在。" },
      { text: "先不处理，避免影响商户关系", id: "ignore", result: "你决定先不处理。现场暂时很和气，但你心里有点不踏实。" },
    ],
  },
  fire_pump_sign_missing: {
    intro: "消防泵房门口缺少标识牌，巡检人员差点走错房间。",
    choices: [
      { text: "立即补齐标识", id: "immediate_fix", result: "你协调供应商当天补齐了标识牌。" },
      { text: "列入整改计划", id: "schedule_fix", result: "你先把问题记入整改台账，计划本周完成。" },
      { text: "暂时忽略", id: "ignore_sign", result: "你觉得影响不大，决定先推进其他事项。" },
    ],
  },
  sprinkler_blocked: {
    intro: "商业中庭吊顶施工后，部分喷淋头被遮挡，影响消防验收。",
    choices: [
      { text: "返工调整吊顶", id: "rework_ceiling", result: "你要求班组返工，喷淋点位重新露出。" },
      { text: "局部微调", id: "partial_adjust", result: "你协调做了局部调整，主要点位已恢复。" },
      { text: "先拖一拖", id: "delay_fix", result: "你决定先不影响当前施工节奏，后面再说。" },
    ],
  },
  merchant_early_entry: {
    intro: "有商户提出想提前进场装修，现场尚未完全具备安全条件。",
    choices: [
      { text: "放行进场", id: "allow_entry", result: "你同意商户提前进场，现场更热闹了。" },
      { text: "有条件放行", id: "conditional_entry", result: "你要求商户签署安全承诺书后进场。" },
      { text: "拒绝进场", id: "reject_entry", result: "你拒绝了提前进场，商户有些不满。" },
    ],
  },
  finish_protection_damaged: {
    intro: "中庭已完成区域的成品保护被后续工序破坏。",
    choices: [
      { text: "全面返工", id: "full_rework", result: "你要求班组全面返工，确保交付品质。" },
      { text: "局部修补", id: "patch_local", result: "你安排局部修补，控制成本和时间。" },
      { text: "仅做记录", id: "record_only", result: "你先拍照记录，暂未安排修复。" },
    ],
  },
  property_key_handover: {
    intro: "物业公司希望提前领取部分区域钥匙，便于熟悉现场。",
    choices: [
      { text: "部分移交", id: "partial_handover", result: "你协调先移交部分非关键区域钥匙。" },
      { text: "等竣工后移交", id: "wait_completion", result: "你坚持按合同节点移交。" },
      { text: "签署备忘录", id: "sign_memo", result: "你起草备忘录，明确双方责任后办理。" },
    ],
  },
  drawing_mismatch: {
    intro: "现场实际做法与竣工图纸不一致，资料员向你求助。",
    choices: [
      { text: "立即更新图纸", id: "update_drawings", result: "你推动设计院尽快出具变更图纸。" },
      { text: "现场核对后决定", id: "site_verify", result: "你组织现场核对，再确定处理方案。" },
      { text: "先不管差异", id: "ignore_diff", result: "你觉得差异不大，暂未处理。" },
    ],
  },
  hidden_acceptance_missing: {
    intro: "隐蔽验收资料缺少监理签字，影响后续归档。",
    choices: [
      { text: "追签", id: "chase_signature", result: "你当天追到监理补签。" },
      { text: "先做临时记录", id: "temporary_record", result: "你先做临时记录，待后续补齐。" },
      { text: "暂时跳过", id: "skip_for_now", result: "你决定先推进其他资料。" },
    ],
  },
  material_retest_failed: {
    intro: "一批进场材料复检不合格，班组等待处理意见。",
    choices: [
      { text: "退场更换", id: "replace_batch", result: "你要求不合格材料退场并更换。" },
      { text: "协商使用", id: "negotiate_use", result: "你与供应商协商后同意降级使用。" },
      { text: "停工待检", id: "stop_work", result: "你要求相关部位停工，等待复检。" },
    ],
  },
  atrium_upgrade_request: {
    intro: "甲方代表临时提出中庭效果还要再提升一档。",
    choices: [
      { text: "接受提升", id: "accept_upgrade", result: "你组织方案调整，满足甲方新要求。" },
      { text: "提出替代方案", id: "propose_alternative", result: "你提出性价比更高的替代方案。" },
      { text: "拒绝变更", id: "reject_change", result: "你说明工期和成本压力，建议维持原方案。" },
    ],
  },
  supervisor_reject_close: {
    intro: "监理拒绝签署整改闭合单，认为现场仍有隐患。",
    choices: [
      { text: "重新整改", id: "re_rectify", result: "你组织班组按意见重新整改。" },
      { text: "沟通协商", id: "negotiate_sign", result: "你与监理沟通，争取部分闭合。" },
      { text: "上报协调", id: "escalate", result: "你向甲方汇报，请求协调。" },
    ],
  },
  equipment_debug_unready: {
    intro: "机电调试发现现场条件不具备，调试队站在一旁等待。",
    choices: [
      { text: "清理条件", id: "clear_conditions", result: "你协调现场清理出调试条件。" },
      { text: "强行调试", id: "force_debug", result: "你要求先调试，问题后面再补。" },
      { text: "推迟调试", id: "postpone", result: "你决定推迟调试计划。" },
    ],
  },
  mep_collision: {
    intro: "B1走廊发现风管与桥架碰撞，影响后续安装。",
    choices: [
      { text: "重新排布", id: "redesign_route", result: "你要求设计院调整管线路由。" },
      { text: "现场调整", id: "on_site_adjust", result: "你协调现场微调，避开碰撞点。" },
      { text: "暂时忽略", id: "ignore_collision", result: "你觉得影响不大，先继续施工。" },
    ],
  },
  design_reply_delayed: {
    intro: "设计院对变更单回复滞后，现场班组无图施工。",
    choices: [
      { text: "紧急催图", id: "urgent_push", result: "你当天追到设计院回复。" },
      { text: "临时方案", id: "temporary_solution", result: "你组织现场临时方案，先保证推进。" },
      { text: "等待回复", id: "wait_reply", result: "你选择等待正式回复。" },
    ],
  },
  supplier_delay: {
    intro: "关键设备供应商通知到货将延迟三天。",
    choices: [
      { text: "更换供应商", id: "switch_supplier", result: "你紧急联系备用供应商。" },
      { text: "加急催货", id: "expedite_delivery", result: "你要求供应商加急发货。" },
      { text: "调整计划", id: "adjust_schedule", result: "你调整后续施工计划。" },
    ],
  },
  merchant_power_request: {
    intro: "商户希望提前通电进行设备调试。",
    choices: [
      { text: "有条件通电", id: "conditional_power", result: "你在安全措施到位后安排通电。" },
      { text: "拒绝通电", id: "refuse_power", result: "你认为条件不成熟，拒绝通电。" },
      { text: "全面通电", id: "full_power", result: "你安排全面通电，商户很满意。" },
    ],
  },
  night_construction_complaint: {
    intro: "周边居民投诉夜间施工噪声，电话打到了项目部。",
    choices: [
      { text: "停止夜间施工", id: "stop_night_work", result: "你要求班组停止夜间作业。" },
      { text: "降噪施工", id: "reduce_noise", result: "你要求调整工序，降低噪声。" },
      { text: "继续施工", id: "continue_work", result: "你判断工期要紧，继续施工。" },
    ],
  },
  quality_station_report: {
    intro: "质监站要求补充检测报告，否则影响验收。",
    choices: [
      { text: "紧急送检", id: "urgent_test", result: "你当天安排送检。" },
      { text: "提交现有报告", id: "submit_existing", result: "你先提交现有报告说明情况。" },
      { text: "延迟提交", id: "delay_submit", result: "你希望再等等。" },
    ],
  },
  property_maintenance_access: {
    intro: "物业提出设备房检修通道宽度不足，影响后续运维。",
    choices: [
      { text: "加宽通道", id: "widen_access", result: "你安排改造检修通道。" },
      { text: "临时方案", id: "temporary_plan", result: "你先出临时检修方案。" },
      { text: "拒绝改造", id: "reject_change", result: "你认为现状可接受，拒绝改造。" },
    ],
  },
  opening_joint_inspection: {
    intro: "开业前联合检查预警传来，多个部门将同时到场检查。",
    choices: [
      { text: "全面准备", id: "full_prepare", result: "你组织全面排查，补齐短板。" },
      { text: "最低限度准备", id: "minimum_prepare", result: "你先保证关键项过关。" },
      { text: "赌一把开业", id: "gamble_opening", result: "你决定冒险推进，希望检查顺利。" },
    ],
  },
};

const outDir = path.join(process.cwd(), "src/ink/stories");
fs.mkdirSync(outDir, { recursive: true });

for (const template of TASK_TEMPLATES) {
  const story = STORY_CONTENT[template.inkFile];
  if (!story) continue;

  const ink = [
    "-> start",
    "",
    "=== start ===",
    story.intro,
    "",
    ...story.choices.map((c) => `* [${c.text}]\n  -> ${c.id}`),
    "",
    ...story.choices.flatMap((c) => [`=== ${c.id} ===`, c.result, "-> END", ""]),
  ].join("\n");

  fs.writeFileSync(path.join(outDir, `${template.inkFile}.ink`), ink, "utf-8");
}

console.log(`Generated ${TASK_TEMPLATES.length} ink files`);
