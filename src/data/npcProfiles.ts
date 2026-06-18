import type { ProjectStageId } from "@/game/projectStages";
import type { LocationRegionId } from "@/game/locationSandtablePresentationEngine";

export type NpcFaction =
  | "owner"
  | "contractor"
  | "supervisor"
  | "government"
  | "consultant"
  | "supplier"
  | "merchant"
  | "property"
  | "labor"
  | "public"
  | "other";

export type NpcLevel = "S" | "A" | "B" | "C";

export type NpcProfile = {
  id: string;
  excelId: string;
  name: string;
  title: string;
  organization: string;
  faction: NpcFaction;
  level: NpcLevel;
  residentRegion: string;
  sandtableRegionId?: LocationRegionId;
  description: string;
  personality?: string;
  agenda?: string;
  helpsWith?: string[];
  blocksWhen?: string[];
  riskTags?: string[];
  appearStages?: ProjectStageId[];
  payloadCategory: string;
  payloadType: string;
};

/** 旧 MapLocation.relatedNpcNames → profile id */
export const LEGACY_NPC_NAME_ALIASES: Record<string, string> = {
  甲方代表: "owner_project_director",
  监理单位: "chief_supervisor",
  总承包单位: "contractor_project_manager",
  消防专家: "fire_pump_room_engineer",
  设计院: "design_lead",
  供应商: "supplier_representative",
  "商户/运营团队": "merchant_representative",
  物业公司: "property_engineering_manager",
  质监站: "quality_supervision_officer",
  专业分包: "subcontractor_lead",
};

export const NPC_PROFILES: NpcProfile[] = [
  {
    "id": "owner_general_manager",
    "excelId": "NPC001",
    "name": "许承岳",
    "title": "业主总经理",
    "organization": "业主方",
    "faction": "owner",
    "level": "S",
    "residentRegion": "业主",
    "sandtableRegionId": "owner_hub",
    "description": "重大决策/资源申请/阶段汇报",
    "personality": "稳健、重视结果",
    "agenda": "项目可控、风险不上桌",
    "helpsWith": [
      "关键拍板",
      "资源协调"
    ],
    "blocksWhen": [
      "不接受模糊汇报和无依据承诺"
    ],
    "payloadCategory": "owner_regulator",
    "payloadType": "owner"
  },
  {
    "id": "owner_executive_leader",
    "excelId": "NPC002",
    "name": "周岚",
    "title": "分管领导",
    "organization": "业主方",
    "faction": "owner",
    "level": "S",
    "residentRegion": "业主",
    "sandtableRegionId": "owner_hub",
    "description": "节点督办/风险压降/专项协调",
    "personality": "强执行、重节点",
    "agenda": "进度、安全、舆情都不能失控",
    "helpsWith": [
      "跨部门协调",
      "压实责任"
    ],
    "blocksWhen": [
      "对拖延和甩锅非常敏感"
    ],
    "payloadCategory": "owner_regulator",
    "payloadType": "owner"
  },
  {
    "id": "owner_project_director",
    "excelId": "NPC003",
    "name": "林知远",
    "title": "业主项目负责人",
    "organization": "业主方",
    "faction": "owner",
    "level": "S",
    "residentRegion": "业主",
    "sandtableRegionId": "owner_hub",
    "description": "主线任务/综合协调/问题闭环",
    "personality": "务实、推动型",
    "agenda": "把任务拆清、把责任落清",
    "helpsWith": [
      "主线引导",
      "任务派发",
      "协调会议"
    ],
    "blocksWhen": [
      "夹在领导与现场之间承压"
    ],
    "payloadCategory": "owner_regulator",
    "payloadType": "owner"
  },
  {
    "id": "owner_project_coordinator",
    "excelId": "NPC004",
    "name": "赵清",
    "title": "项目管理专员",
    "organization": "业主方",
    "faction": "owner",
    "level": "A",
    "residentRegion": "业主",
    "sandtableRegionId": "owner_hub",
    "description": "计划管理/会议纪要/催办闭环",
    "personality": "细致、催办型",
    "agenda": "周计划、台账、会议纪要准确",
    "helpsWith": [
      "进度跟踪",
      "会议纪要",
      "任务催办"
    ],
    "blocksWhen": [
      "容易发现玩家遗漏事项"
    ],
    "payloadCategory": "owner_regulator",
    "payloadType": "owner"
  },
  {
    "id": "owner_cost_contract_lead",
    "excelId": "NPC005",
    "name": "马衡",
    "title": "成本合约负责人",
    "organization": "业主方",
    "faction": "owner",
    "level": "A",
    "residentRegion": "业主",
    "sandtableRegionId": "owner_hub",
    "description": "合同边界/签证变更/成本预警",
    "personality": "谨慎、原则强",
    "agenda": "合同边界清楚、变更有依据",
    "helpsWith": [
      "成本测算",
      "合同解释",
      "签证审查"
    ],
    "blocksWhen": [
      "对口头承诺和资料缺失卡得很严"
    ],
    "payloadCategory": "owner_regulator",
    "payloadType": "owner"
  },
  {
    "id": "owner_procurement_lead",
    "excelId": "NPC006",
    "name": "苏曼",
    "title": "招采专员",
    "organization": "业主方",
    "faction": "owner",
    "level": "A",
    "residentRegion": "业主",
    "sandtableRegionId": "owner_hub",
    "description": "招采流程/文件审查/开标组织",
    "personality": "流程熟、怕瑕疵",
    "agenda": "招采节点合法合规、不被投诉",
    "helpsWith": [
      "招标文件",
      "流程排期",
      "开评标衔接"
    ],
    "blocksWhen": [
      "材料不齐会延误招标"
    ],
    "payloadCategory": "owner_regulator",
    "payloadType": "owner"
  },
  {
    "id": "owner_finance_reviewer",
    "excelId": "NPC007",
    "name": "唐远",
    "title": "财务资金负责人",
    "organization": "业主方",
    "faction": "owner",
    "level": "A",
    "residentRegion": "业主",
    "sandtableRegionId": "owner_hub",
    "description": "资金计划/付款审核/现金流压力",
    "personality": "保守、重现金流",
    "agenda": "付款有计划、资金不断档",
    "helpsWith": [
      "付款安排",
      "资金计划",
      "票据审核"
    ],
    "blocksWhen": [
      "无合同无验收不付款"
    ],
    "payloadCategory": "owner_regulator",
    "payloadType": "owner"
  },
  {
    "id": "owner_archive_manager",
    "excelId": "NPC008",
    "name": "何静",
    "title": "档案资料管理员",
    "organization": "业主方",
    "faction": "owner",
    "level": "B",
    "residentRegion": "业主",
    "sandtableRegionId": "owner_hub",
    "description": "资料归档/版本校验/验收资料",
    "personality": "严谨、记忆力好",
    "agenda": "资料完整、版本一致、归档可追溯",
    "helpsWith": [
      "资料清单",
      "台账",
      "归档提醒"
    ],
    "blocksWhen": [
      "资料缺签缺章会直接退回"
    ],
    "payloadCategory": "owner_regulator",
    "payloadType": "owner"
  },
  {
    "id": "owner_operation_prep_lead",
    "excelId": "NPC009",
    "name": "陆宁",
    "title": "运营筹备经理",
    "organization": "业主方",
    "faction": "owner",
    "level": "A",
    "residentRegion": "开业筹备",
    "sandtableRegionId": "opening_prep",
    "description": "开业筹备/商户进场/运营移交",
    "personality": "市场化、重体验",
    "agenda": "顺利开业、商户能进场、问题可响应",
    "helpsWith": [
      "运营视角",
      "开业清单",
      "商户协调"
    ],
    "blocksWhen": [
      "会不断提出运营使用需求"
    ],
    "payloadCategory": "owner_regulator",
    "payloadType": "owner"
  },
  {
    "id": "legal_audit_liaison",
    "excelId": "NPC010",
    "name": "方砚",
    "title": "法审与审计联络人",
    "organization": "业主方",
    "faction": "owner",
    "level": "C",
    "residentRegion": "业主",
    "sandtableRegionId": "owner_hub",
    "description": "法审审计/程序风险/证据链",
    "personality": "冷静、挑刺型",
    "agenda": "程序合规、证据链完整",
    "helpsWith": [
      "合规提醒",
      "审计风险识别"
    ],
    "blocksWhen": [
      "对倒签",
      "漏签",
      "超范围敏感"
    ],
    "payloadCategory": "owner_regulator",
    "payloadType": "owner"
  },
  {
    "id": "contractor_project_manager",
    "excelId": "NPC011",
    "name": "陈建峰",
    "title": "总包项目经理",
    "organization": "总包单位",
    "faction": "contractor",
    "level": "S",
    "residentRegion": "现场指挥区",
    "sandtableRegionId": "command_center",
    "description": "生产统筹/资源调配/总包协调",
    "personality": "强势、结果导向",
    "agenda": "资源够、工期稳、别反复变更",
    "helpsWith": [
      "总包资源调度",
      "生产统筹"
    ],
    "blocksWhen": [
      "会为总包利益争取工期和费用"
    ],
    "payloadCategory": "construction",
    "payloadType": "contractor"
  },
  {
    "id": "contractor_production_manager",
    "excelId": "NPC012",
    "name": "罗志强",
    "title": "生产经理",
    "organization": "总包单位",
    "faction": "contractor",
    "level": "A",
    "residentRegion": "现场指挥区",
    "sandtableRegionId": "command_center",
    "description": "施工组织/穿插计划/抢工安排",
    "personality": "急性子、现场派",
    "agenda": "每天有作业面、工序不断档",
    "helpsWith": [
      "日计划",
      "穿插施工",
      "劳动力调配"
    ],
    "blocksWhen": [
      "可能忽视资料和验收前置"
    ],
    "payloadCategory": "construction",
    "payloadType": "contractor"
  },
  {
    "id": "bim_technical_lead",
    "excelId": "NPC013",
    "name": "秦越",
    "title": "技术/BIM负责人",
    "organization": "总包单位",
    "faction": "contractor",
    "level": "A",
    "residentRegion": "现场指挥区",
    "sandtableRegionId": "command_center",
    "description": "图纸会审/BIM协调/技术方案",
    "personality": "理性、技术控",
    "agenda": "图纸问题提前解决、模型少碰撞",
    "helpsWith": [
      "图纸会审",
      "BIM碰撞",
      "技术方案"
    ],
    "blocksWhen": [
      "不认可没有依据的现场做法"
    ],
    "payloadCategory": "construction",
    "payloadType": "contractor"
  },
  {
    "id": "contractor_safety_quality_lead",
    "excelId": "NPC014",
    "name": "谢安",
    "title": "安全总监",
    "organization": "总包单位",
    "faction": "contractor",
    "level": "A",
    "residentRegion": "现场指挥区",
    "sandtableRegionId": "command_center",
    "description": "安全检查/隐患整改/应急演练",
    "personality": "严厉、红线意识强",
    "agenda": "不出事故、不被通报",
    "helpsWith": [
      "隐患排查",
      "安全交底",
      "整改闭合"
    ],
    "blocksWhen": [
      "会停工整改高风险作业"
    ],
    "payloadCategory": "construction",
    "payloadType": "contractor"
  },
  {
    "id": "contractor_technical_lead",
    "excelId": "NPC015",
    "name": "白雨",
    "title": "质量负责人",
    "organization": "总包单位",
    "faction": "contractor",
    "level": "A",
    "residentRegion": "现场指挥区",
    "sandtableRegionId": "command_center",
    "description": "质量验收/样板先行/返工闭合",
    "personality": "标准控、重样板",
    "agenda": "一次成优、减少返工",
    "helpsWith": [
      "质量验收",
      "样板交底",
      "实测实量"
    ],
    "blocksWhen": [
      "对赶工牺牲质量很抵触"
    ],
    "payloadCategory": "construction",
    "payloadType": "contractor"
  },
  {
    "id": "contractor_business_lead",
    "excelId": "NPC016",
    "name": "顾言",
    "title": "商务经理",
    "organization": "总包单位",
    "faction": "contractor",
    "level": "A",
    "residentRegion": "现场指挥区",
    "sandtableRegionId": "command_center",
    "description": "计量签证/商务谈判/索赔争议",
    "personality": "精算、谈判型",
    "agenda": "签证及时、索赔有据",
    "helpsWith": [
      "计量",
      "签证",
      "合同谈判"
    ],
    "blocksWhen": [
      "可能放大费用诉求"
    ],
    "payloadCategory": "construction",
    "payloadType": "contractor"
  },
  {
    "id": "contractor_material_equipment_lead",
    "excelId": "NPC017",
    "name": "孙泽",
    "title": "材料设备主管",
    "organization": "总包单位",
    "faction": "contractor",
    "level": "B",
    "residentRegion": "现场指挥区",
    "sandtableRegionId": "command_center",
    "description": "材料计划/进场验收/设备管理",
    "personality": "务实、怕断供",
    "agenda": "材料按时到、验收合格、堆放有序",
    "helpsWith": [
      "材料计划",
      "进场验收",
      "设备台账"
    ],
    "blocksWhen": [
      "供应商延迟会引发连锁问题"
    ],
    "payloadCategory": "construction",
    "payloadType": "contractor"
  },
  {
    "id": "supervisor_document_engineer",
    "excelId": "NPC018",
    "name": "宋倩",
    "title": "资料主管",
    "organization": "总包单位",
    "faction": "contractor",
    "level": "B",
    "residentRegion": "现场指挥区",
    "sandtableRegionId": "command_center",
    "description": "资料报审/隐蔽验收/资料补正",
    "personality": "细心、流程控",
    "agenda": "资料跟着工程走",
    "helpsWith": [
      "报审资料",
      "隐蔽资料",
      "验收资料"
    ],
    "blocksWhen": [
      "现场做了但资料没跟上会卡验收"
    ],
    "payloadCategory": "construction",
    "payloadType": "contractor"
  },
  {
    "id": "chief_supervisor",
    "excelId": "NPC019",
    "name": "魏诚",
    "title": "总监理工程师",
    "organization": "监理单位",
    "faction": "supervisor",
    "level": "A",
    "residentRegion": "现场指挥区",
    "sandtableRegionId": "command_center",
    "description": "监理签认/旁站验收/整改闭合",
    "personality": "稳重、原则性强",
    "agenda": "质量安全可控、程序合规",
    "helpsWith": [
      "旁站",
      "验收签认",
      "整改督促"
    ],
    "blocksWhen": [
      "对未经报审施工会坚决否决"
    ],
    "payloadCategory": "owner_regulator",
    "payloadType": "supervisor"
  },
  {
    "id": "supervisor_engineer",
    "excelId": "NPC020",
    "name": "叶宁",
    "title": "专业监理工程师",
    "organization": "监理单位",
    "faction": "supervisor",
    "level": "B",
    "residentRegion": "现场指挥区",
    "sandtableRegionId": "command_center",
    "description": "专业巡查/见证取样/工序验收",
    "personality": "较真、看细节",
    "agenda": "专业工序合格、资料可追溯",
    "helpsWith": [
      "专业验收",
      "现场巡查",
      "材料见证"
    ],
    "blocksWhen": [
      "发现问题会要求返工或复检"
    ],
    "payloadCategory": "owner_regulator",
    "payloadType": "supervisor"
  },
  {
    "id": "labor_realname_officer",
    "excelId": "NPC021",
    "name": "胡勇",
    "title": "劳务实名制管理员",
    "organization": "总包单位",
    "faction": "contractor",
    "level": "B",
    "residentRegion": "现场指挥区",
    "sandtableRegionId": "command_center",
    "description": "实名制/考勤/劳务风险",
    "personality": "接地气、消息灵",
    "agenda": "人员稳定、实名制合规",
    "helpsWith": [
      "工人考勤",
      "班组信息",
      "劳务纠纷线索"
    ],
    "blocksWhen": [
      "人员流动会导致计划失真"
    ],
    "payloadCategory": "construction",
    "payloadType": "contractor"
  },
  {
    "id": "team_coordination_lead",
    "excelId": "NPC022",
    "name": "刘铁生",
    "title": "班组长",
    "organization": "班组",
    "faction": "labor",
    "level": "B",
    "residentRegion": "施工现场",
    "sandtableRegionId": "construction_site",
    "description": "班组执行/工序交底/现场反馈",
    "personality": "直爽、重实际",
    "agenda": "作业面清楚、工钱及时、别反复返工",
    "helpsWith": [
      "现场执行",
      "工序反馈",
      "冲突线索"
    ],
    "blocksWhen": [
      "可能抵触频繁变更和额外要求"
    ],
    "payloadCategory": "construction",
    "payloadType": "subcontractor"
  },
  {
    "id": "sample_disclosure_lead",
    "excelId": "NPC023",
    "name": "沈璃",
    "title": "样板与精装工程师",
    "organization": "总包单位",
    "faction": "contractor",
    "level": "A",
    "residentRegion": "现场指挥区",
    "sandtableRegionId": "command_center",
    "description": "样板确认/精装交底/观感质量",
    "personality": "审美强、标准高",
    "agenda": "样板确认后再大面积展开",
    "helpsWith": [
      "样板交底",
      "工艺确认",
      "精装协调"
    ],
    "blocksWhen": [
      "会因样板意见反复影响进度"
    ],
    "payloadCategory": "construction",
    "payloadType": "contractor"
  },
  {
    "id": "government_window_officer",
    "excelId": "NPC024",
    "name": "杜青",
    "title": "综合窗口受理员",
    "organization": "政务服务中心",
    "faction": "government",
    "level": "B",
    "residentRegion": "审批监管区",
    "sandtableRegionId": "approval_regulatory",
    "description": "审批受理/材料清单/退件补正",
    "personality": "耐心、按清单办事",
    "agenda": "资料一次受理、少退件",
    "helpsWith": [
      "受理清单",
      "流程指引",
      "退件原因"
    ],
    "blocksWhen": [
      "资料命名和版本不规范会退回"
    ],
    "payloadCategory": "owner_regulator",
    "payloadType": "regulator"
  },
  {
    "id": "dev_reform_window_officer",
    "excelId": "NPC025",
    "name": "李文博",
    "title": "发改审批经办",
    "organization": "发改窗口",
    "faction": "government",
    "level": "B",
    "residentRegion": "审批监管区",
    "sandtableRegionId": "approval_regulatory",
    "description": "立项备案/投资审批/口径校验",
    "personality": "规范、重依据",
    "agenda": "立项备案逻辑完整",
    "helpsWith": [
      "审批路径",
      "投资信息校验"
    ],
    "blocksWhen": [
      "立项口径不清会卡住后续"
    ],
    "payloadCategory": "owner_regulator",
    "payloadType": "regulator"
  },
  {
    "id": "natural_resources_officer",
    "excelId": "NPC026",
    "name": "高启明",
    "title": "规划审查负责人",
    "organization": "自然资源和规划局",
    "faction": "government",
    "level": "A",
    "residentRegion": "审批监管区",
    "sandtableRegionId": "approval_regulatory",
    "description": "规划审查/指标校核/方案调整",
    "personality": "严谨、空间逻辑强",
    "agenda": "规划指标与红线不能出错",
    "helpsWith": [
      "规划条件",
      "方案审查",
      "规划许可"
    ],
    "blocksWhen": [
      "指标超限",
      "退界冲突会反复修改"
    ],
    "payloadCategory": "owner_regulator",
    "payloadType": "regulator"
  },
  {
    "id": "housing_bureau_officer",
    "excelId": "NPC027",
    "name": "蒋睿",
    "title": "施工许可科长",
    "organization": "住建局",
    "faction": "government",
    "level": "A",
    "residentRegion": "审批监管区",
    "sandtableRegionId": "approval_regulatory",
    "description": "施工许可/监管备案/竣工手续",
    "personality": "流程强、风险敏感",
    "agenda": "施工许可资料完整、监管衔接清楚",
    "helpsWith": [
      "施工许可",
      "质量安全备案",
      "竣工备案"
    ],
    "blocksWhen": [
      "施工条件不满足不放行"
    ],
    "payloadCategory": "owner_regulator",
    "payloadType": "regulator"
  },
  {
    "id": "quality_safety_station_officer",
    "excelId": "NPC028",
    "name": "袁海",
    "title": "质安监督员",
    "organization": "质量安全监督站",
    "faction": "government",
    "level": "A",
    "residentRegion": "审批监管区",
    "sandtableRegionId": "approval_regulatory",
    "description": "监督检查/整改销项/通报风险",
    "personality": "严厉、现场红线",
    "agenda": "质量安全问题闭环",
    "helpsWith": [
      "监督检查",
      "停工整改",
      "销项复查"
    ],
    "blocksWhen": [
      "重大隐患会直接升级"
    ],
    "payloadCategory": "owner_regulator",
    "payloadType": "regulator"
  },
  {
    "id": "fire_design_review_officer",
    "excelId": "NPC029",
    "name": "秦霜",
    "title": "消防设计审查工程师",
    "organization": "消防审查窗口",
    "faction": "government",
    "level": "A",
    "residentRegion": "审批监管区",
    "sandtableRegionId": "approval_regulatory",
    "description": "消防审查/意见回复/设计合规",
    "personality": "专业、重规范",
    "agenda": "消防设计合规、问题闭合",
    "helpsWith": [
      "消防设计审查",
      "意见回复"
    ],
    "blocksWhen": [
      "疏散",
      "联动",
      "材料问题会反复卡"
    ],
    "payloadCategory": "owner_regulator",
    "payloadType": "fire"
  },
  {
    "id": "fire_acceptance_officer",
    "excelId": "NPC030",
    "name": "梁瑜",
    "title": "消防验收专员",
    "organization": "消防验收窗口",
    "faction": "government",
    "level": "A",
    "residentRegion": "审批监管区",
    "sandtableRegionId": "approval_regulatory",
    "description": "消防验收/联动测试/整改销项",
    "personality": "结果导向、看现场",
    "agenda": "现场系统真能联动、资料完整",
    "helpsWith": [
      "消防验收",
      "现场抽查",
      "整改销项"
    ],
    "blocksWhen": [
      "联动测试失败会延迟开业"
    ],
    "payloadCategory": "owner_regulator",
    "payloadType": "fire"
  },
  {
    "id": "civil_defense_window_officer",
    "excelId": "NPC031",
    "name": "贺军",
    "title": "人防窗口经办",
    "organization": "人防审批窗口",
    "faction": "government",
    "level": "B",
    "residentRegion": "审批监管区",
    "sandtableRegionId": "approval_regulatory",
    "description": "人防审批/专项验收/资料补齐",
    "personality": "低调、清单型",
    "agenda": "人防审批和验收不遗漏",
    "helpsWith": [
      "人防专项清单",
      "验收路径"
    ],
    "blocksWhen": [
      "专项资料缺失会后置风险"
    ],
    "payloadCategory": "owner_regulator",
    "payloadType": "regulator"
  },
  {
    "id": "ecology_window_officer",
    "excelId": "NPC032",
    "name": "许萍",
    "title": "生态环境窗口经办",
    "organization": "生态环境窗口",
    "faction": "government",
    "level": "B",
    "residentRegion": "审批监管区",
    "sandtableRegionId": "approval_regulatory",
    "description": "环保审批/扰民投诉/整改回应",
    "personality": "谨慎、重投诉风险",
    "agenda": "环保事项不引发投诉",
    "helpsWith": [
      "环保审批",
      "噪声扬尘提醒"
    ],
    "blocksWhen": [
      "施工扰民会触发舆情事件"
    ],
    "payloadCategory": "owner_regulator",
    "payloadType": "regulator"
  },
  {
    "id": "water_drainage_window_officer",
    "excelId": "NPC033",
    "name": "田沐",
    "title": "水务排水接入专员",
    "organization": "水务窗口",
    "faction": "government",
    "level": "B",
    "residentRegion": "审批监管区",
    "sandtableRegionId": "approval_regulatory",
    "description": "水务排水/接入方案/市政接口",
    "personality": "务实、接口导向",
    "agenda": "排水接入方案可实施",
    "helpsWith": [
      "临水排水",
      "管网接驳"
    ],
    "blocksWhen": [
      "现场条件不符会要求改线"
    ],
    "payloadCategory": "owner_regulator",
    "payloadType": "regulator"
  },
  {
    "id": "municipal_garden_window_officer",
    "excelId": "NPC034",
    "name": "卢园",
    "title": "市政园林窗口经办",
    "organization": "市政园林窗口",
    "faction": "government",
    "level": "B",
    "residentRegion": "审批监管区",
    "sandtableRegionId": "approval_regulatory",
    "description": "占道开口/绿化迁改/市政协调",
    "personality": "细节控、重影响面",
    "agenda": "占道开口绿化手续合规",
    "helpsWith": [
      "占道",
      "开口",
      "绿化迁改"
    ],
    "blocksWhen": [
      "影响交通和绿化会被投诉"
    ],
    "payloadCategory": "owner_regulator",
    "payloadType": "regulator"
  },
  {
    "id": "public_resource_center_officer",
    "excelId": "NPC035",
    "name": "钱澈",
    "title": "交易中心项目经办",
    "organization": "公共资源交易中心",
    "faction": "government",
    "level": "B",
    "residentRegion": "审批监管区",
    "sandtableRegionId": "approval_regulatory",
    "description": "交易流程/开评标/公示节点",
    "personality": "中立、程序控",
    "agenda": "交易流程公开透明",
    "helpsWith": [
      "场地预约",
      "开评标流程",
      "公示衔接"
    ],
    "blocksWhen": [
      "流程错误可能导致投诉"
    ],
    "payloadCategory": "owner_regulator",
    "payloadType": "regulator"
  },
  {
    "id": "completion_filing_officer",
    "excelId": "NPC036",
    "name": "周明远",
    "title": "竣工备案审查员",
    "organization": "竣工备案窗口",
    "faction": "government",
    "level": "B",
    "residentRegion": "审批监管区",
    "sandtableRegionId": "approval_regulatory",
    "description": "竣工备案/资料一致性/归档",
    "personality": "严谨、归档思维",
    "agenda": "备案资料完整一致",
    "helpsWith": [
      "备案清单",
      "资料审查",
      "归档口径"
    ],
    "blocksWhen": [
      "资料前后不一致会退回"
    ],
    "payloadCategory": "owner_regulator",
    "payloadType": "regulator"
  },
  {
    "id": "design_lead",
    "excelId": "NPC037",
    "name": "蓝澈",
    "title": "设计总负责人",
    "organization": "设计院",
    "faction": "consultant",
    "level": "A",
    "residentRegion": "专业服务区",
    "sandtableRegionId": "professional_service",
    "description": "设计答疑/方案优化/变更控制",
    "personality": "专业、愿意解释",
    "agenda": "设计意图落地、变更可控",
    "helpsWith": [
      "设计答疑",
      "变更优化",
      "图纸协调"
    ],
    "blocksWhen": [
      "不接受现场私自变更"
    ],
    "payloadCategory": "design_supply",
    "payloadType": "design"
  },
  {
    "id": "survey_unit_lead",
    "excelId": "NPC038",
    "name": "韩砚",
    "title": "勘察项目负责人",
    "organization": "勘察单位",
    "faction": "consultant",
    "level": "B",
    "residentRegion": "专业服务区",
    "sandtableRegionId": "professional_service",
    "description": "地勘复核/基础风险/补充勘察",
    "personality": "稳重、看数据",
    "agenda": "基础条件判断准确",
    "helpsWith": [
      "地勘解释",
      "补勘建议",
      "地基风险"
    ],
    "blocksWhen": [
      "数据不足会建议保守处理"
    ],
    "payloadCategory": "design_supply",
    "payloadType": "design"
  },
  {
    "id": "drawing_review_lead",
    "excelId": "NPC039",
    "name": "宋审",
    "title": "施工图审查工程师",
    "organization": "图审机构",
    "faction": "consultant",
    "level": "A",
    "residentRegion": "专业服务区",
    "sandtableRegionId": "professional_service",
    "description": "图审意见/合规修改/审查闭环",
    "personality": "挑错、规范导向",
    "agenda": "图纸审查问题闭合",
    "helpsWith": [
      "图审意见",
      "修改清单",
      "合规把关"
    ],
    "blocksWhen": [
      "审查意见未闭合会卡许可"
    ],
    "payloadCategory": "design_supply",
    "payloadType": "design"
  },
  {
    "id": "cost_consultant_lead",
    "excelId": "NPC040",
    "name": "孟乔",
    "title": "造价咨询负责人",
    "organization": "造价咨询公司",
    "faction": "consultant",
    "level": "A",
    "residentRegion": "专业服务区",
    "sandtableRegionId": "professional_service",
    "description": "清单控制价/预算审核/成本测算",
    "personality": "数字敏感、边界清楚",
    "agenda": "控制价准确、清单不漏项",
    "helpsWith": [
      "清单控制价",
      "预算审核",
      "成本测算"
    ],
    "blocksWhen": [
      "漏项错项会引发争议"
    ],
    "payloadCategory": "professional_consulting",
    "payloadType": "consultant"
  },
  {
    "id": "bidding_agent_lead",
    "excelId": "NPC041",
    "name": "朱远",
    "title": "招标代理项目经理",
    "organization": "招标代理公司",
    "faction": "consultant",
    "level": "B",
    "residentRegion": "专业服务区",
    "sandtableRegionId": "professional_service",
    "description": "招标文件/答疑澄清/开评标",
    "personality": "流程熟、怕投诉",
    "agenda": "招标文件合法、评标顺利",
    "helpsWith": [
      "招标公告",
      "文件编制",
      "答疑澄清"
    ],
    "blocksWhen": [
      "条款歧义会引发质疑"
    ],
    "payloadCategory": "professional_consulting",
    "payloadType": "consultant"
  },
  {
    "id": "whole_process_consultant",
    "excelId": "NPC042",
    "name": "方竹",
    "title": "全过程咨询项目经理",
    "organization": "全过程咨询单位",
    "faction": "consultant",
    "level": "A",
    "residentRegion": "专业服务区",
    "sandtableRegionId": "professional_service",
    "description": "全过程统筹/节点策划/风险预警",
    "personality": "全局观、善提醒",
    "agenda": "前后节点衔接顺畅",
    "helpsWith": [
      "计划统筹",
      "风险提示",
      "会议推动"
    ],
    "blocksWhen": [
      "可能提出额外管理动作"
    ],
    "payloadCategory": "professional_consulting",
    "payloadType": "consultant"
  },
  {
    "id": "material_testing_engineer",
    "excelId": "NPC043",
    "name": "段明",
    "title": "材料检测工程师",
    "organization": "材料检测机构",
    "faction": "consultant",
    "level": "B",
    "residentRegion": "专业服务区",
    "sandtableRegionId": "professional_service",
    "description": "材料检测/报告复核/不合格处置",
    "personality": "严谨、看报告",
    "agenda": "材料复检真实有效",
    "helpsWith": [
      "取样送检",
      "报告解释",
      "不合格处置"
    ],
    "blocksWhen": [
      "不合格批次会影响进度"
    ],
    "payloadCategory": "professional_consulting",
    "payloadType": "consultant"
  },
  {
    "id": "pile_foundation_testing_engineer",
    "excelId": "NPC044",
    "name": "罗启航",
    "title": "桩基/基坑检测负责人",
    "organization": "桩基检测机构",
    "faction": "consultant",
    "level": "B",
    "residentRegion": "专业服务区",
    "sandtableRegionId": "professional_service",
    "description": "桩基检测/基坑监测/异常预警",
    "personality": "技术派、重安全",
    "agenda": "基坑和桩基风险可控",
    "helpsWith": [
      "检测方案",
      "监测报告",
      "异常预警"
    ],
    "blocksWhen": [
      "异常数据会触发停工讨论"
    ],
    "payloadCategory": "professional_consulting",
    "payloadType": "consultant"
  },
  {
    "id": "settlement_monitoring_engineer",
    "excelId": "NPC045",
    "name": "常观",
    "title": "沉降监测工程师",
    "organization": "监测单位",
    "faction": "consultant",
    "level": "B",
    "residentRegion": "专业服务区",
    "sandtableRegionId": "professional_service",
    "description": "沉降观测/趋势分析/预警",
    "personality": "沉稳、数据敏感",
    "agenda": "沉降数据连续可信",
    "helpsWith": [
      "沉降观测",
      "预警阈值",
      "趋势判断"
    ],
    "blocksWhen": [
      "数据异常会要求复核和加固"
    ],
    "payloadCategory": "professional_consulting",
    "payloadType": "consultant"
  },
  {
    "id": "fire_testing_engineer",
    "excelId": "NPC046",
    "name": "苗火",
    "title": "消防检测工程师",
    "organization": "消防检测机构",
    "faction": "consultant",
    "level": "A",
    "residentRegion": "专业服务区",
    "sandtableRegionId": "professional_service",
    "description": "消防检测/联动测试/报告",
    "personality": "专业、实测导向",
    "agenda": "消防系统检测通过",
    "helpsWith": [
      "单机测试",
      "联动检测",
      "报告出具"
    ],
    "blocksWhen": [
      "系统联动不过会打回整改"
    ],
    "payloadCategory": "professional_consulting",
    "payloadType": "consultant"
  },
  {
    "id": "environment_testing_engineer",
    "excelId": "NPC047",
    "name": "靳环",
    "title": "环境检测工程师",
    "organization": "环境检测机构",
    "faction": "consultant",
    "level": "B",
    "residentRegion": "专业服务区",
    "sandtableRegionId": "professional_service",
    "description": "环境检测/噪声监测/室内空气",
    "personality": "客观、看指标",
    "agenda": "环境检测指标合格",
    "helpsWith": [
      "室内环境检测",
      "噪声监测"
    ],
    "blocksWhen": [
      "检测超标会影响移交"
    ],
    "payloadCategory": "professional_consulting",
    "payloadType": "consultant"
  },
  {
    "id": "green_building_consultant",
    "excelId": "NPC048",
    "name": "林绿",
    "title": "节能绿建咨询师",
    "organization": "绿建咨询单位",
    "faction": "consultant",
    "level": "B",
    "residentRegion": "专业服务区",
    "sandtableRegionId": "professional_service",
    "description": "节能绿建/专项资料/验收咨询",
    "personality": "专业、文件控",
    "agenda": "节能绿建资料闭合",
    "helpsWith": [
      "节能计算",
      "绿建资料",
      "专项验收"
    ],
    "blocksWhen": [
      "资料缺项会拖验收"
    ],
    "payloadCategory": "professional_consulting",
    "payloadType": "consultant"
  },
  {
    "id": "survey_mapping_engineer",
    "excelId": "NPC049",
    "name": "何图",
    "title": "测绘项目负责人",
    "organization": "测绘单位",
    "faction": "consultant",
    "level": "B",
    "residentRegion": "专业服务区",
    "sandtableRegionId": "professional_service",
    "description": "竣工测绘/规划核实/面积测算",
    "personality": "精准、坐标控",
    "agenda": "竣工测量准确",
    "helpsWith": [
      "规划核实",
      "竣工测绘",
      "面积测算"
    ],
    "blocksWhen": [
      "数据不一致会影响备案"
    ],
    "payloadCategory": "professional_consulting",
    "payloadType": "consultant"
  },
  {
    "id": "audit_settlement_officer",
    "excelId": "NPC050",
    "name": "严审",
    "title": "审计结算负责人",
    "organization": "审计结算单位",
    "faction": "consultant",
    "level": "A",
    "residentRegion": "专业服务区",
    "sandtableRegionId": "professional_service",
    "description": "结算审计/争议复核/成本核减",
    "personality": "强势、证据导向",
    "agenda": "结算依据完整、争议可控",
    "helpsWith": [
      "结算审计",
      "成本复核",
      "争议裁决"
    ],
    "blocksWhen": [
      "资料证据不足会核减"
    ],
    "payloadCategory": "professional_consulting",
    "payloadType": "consultant"
  },
  {
    "id": "special_consultant",
    "excelId": "NPC051",
    "name": "季临",
    "title": "专项顾问",
    "organization": "专项顾问单位",
    "faction": "consultant",
    "level": "A",
    "residentRegion": "专业服务区",
    "sandtableRegionId": "professional_service",
    "description": "专项诊断/专家意见/方案比选",
    "personality": "经验丰富、点到为止",
    "agenda": "专项难题找到路径",
    "helpsWith": [
      "疑难问题诊断",
      "专家意见",
      "替代方案"
    ],
    "blocksWhen": [
      "顾问意见可能推翻原方案"
    ],
    "payloadCategory": "professional_consulting",
    "payloadType": "consultant"
  },
  {
    "id": "site_main_gate_officer",
    "excelId": "NPC052",
    "name": "马卫",
    "title": "门卫与实名制管理员",
    "organization": "总包后勤",
    "faction": "contractor",
    "level": "C",
    "residentRegion": "施工现场",
    "sandtableRegionId": "construction_site",
    "description": "门禁实名/访客登记/异常拦截",
    "personality": "认真、守门型",
    "agenda": "人员车辆出入可控",
    "helpsWith": [
      "门禁记录",
      "访客登记",
      "异常提醒"
    ],
    "blocksWhen": [
      "违规进场会触发安全事件"
    ],
    "payloadCategory": "construction",
    "payloadType": "contractor"
  },
  {
    "id": "site_vehicle_wash_officer",
    "excelId": "NPC053",
    "name": "何机",
    "title": "车辆与机械调度员",
    "organization": "总包生产",
    "faction": "contractor",
    "level": "B",
    "residentRegion": "施工现场",
    "sandtableRegionId": "construction_site",
    "description": "车辆调度/机械协调/物流冲突",
    "personality": "粗中有细、看线路",
    "agenda": "车辆通行顺畅、不堵门",
    "helpsWith": [
      "车辆调度",
      "卸货排队",
      "机械协调"
    ],
    "blocksWhen": [
      "材料集中进场会造成拥堵"
    ],
    "payloadCategory": "construction",
    "payloadType": "contractor"
  },
  {
    "id": "temp_utilities_officer",
    "excelId": "NPC054",
    "name": "赵电",
    "title": "临电电工",
    "organization": "总包机电",
    "faction": "contractor",
    "level": "B",
    "residentRegion": "施工现场",
    "sandtableRegionId": "construction_site",
    "description": "临电巡检/用电安全/整改",
    "personality": "谨慎、怕事故",
    "agenda": "临电安全、送电稳定",
    "helpsWith": [
      "临电巡检",
      "配电箱整改",
      "用电交底"
    ],
    "blocksWhen": [
      "私拉乱接会立即断电"
    ],
    "payloadCategory": "construction",
    "payloadType": "contractor"
  },
  {
    "id": "site_temp_road_officer",
    "excelId": "NPC055",
    "name": "王水",
    "title": "临水排水工长",
    "organization": "总包机电",
    "faction": "contractor",
    "level": "B",
    "residentRegion": "施工现场",
    "sandtableRegionId": "construction_site",
    "description": "临水排水/防汛/沉淀池",
    "personality": "务实、看水路",
    "agenda": "临水排水可靠、不积水",
    "helpsWith": [
      "排水沟",
      "沉淀池",
      "临水泵房维护"
    ],
    "blocksWhen": [
      "暴雨会暴露排水短板"
    ],
    "payloadCategory": "construction",
    "payloadType": "contractor"
  },
  {
    "id": "site_safety_officer",
    "excelId": "NPC056",
    "name": "申安",
    "title": "安全体验区讲解员",
    "organization": "总包安全",
    "faction": "contractor",
    "level": "C",
    "residentRegion": "施工现场",
    "sandtableRegionId": "construction_site",
    "description": "安全教育/文明施工/交底",
    "personality": "活跃、宣传型",
    "agenda": "工人完成安全教育",
    "helpsWith": [
      "安全教育",
      "体验培训",
      "文明施工"
    ],
    "blocksWhen": [
      "培训流于形式会被检查扣分"
    ],
    "payloadCategory": "construction",
    "payloadType": "contractor"
  },
  {
    "id": "site_office_admin",
    "excelId": "NPC057",
    "name": "丁勤",
    "title": "后勤主管",
    "organization": "总包后勤",
    "faction": "contractor",
    "level": "B",
    "residentRegion": "施工现场",
    "sandtableRegionId": "construction_site",
    "description": "后勤保障/生活区管理/突发应急",
    "personality": "能张罗、讲人情",
    "agenda": "生活区稳定、后勤不断供",
    "helpsWith": [
      "食堂",
      "宿舍",
      "医务",
      "后勤调配"
    ],
    "blocksWhen": [
      "生活区矛盾会影响劳动力稳定"
    ],
    "payloadCategory": "construction",
    "payloadType": "contractor"
  },
  {
    "id": "site_material_yard_manager",
    "excelId": "NPC058",
    "name": "孙仓",
    "title": "材料仓库管理员",
    "organization": "总包材料",
    "faction": "contractor",
    "level": "B",
    "residentRegion": "施工现场",
    "sandtableRegionId": "construction_site",
    "description": "仓库台账/领料控制/库存预警",
    "personality": "抠细节、会算账",
    "agenda": "材料入库出库清楚",
    "helpsWith": [
      "仓储台账",
      "领料控制",
      "库存预警"
    ],
    "blocksWhen": [
      "台账不清会引发材料争议"
    ],
    "payloadCategory": "construction",
    "payloadType": "contractor"
  },
  {
    "id": "site_medical_officer",
    "excelId": "NPC059",
    "name": "沈危",
    "title": "危化品管理员",
    "organization": "总包安全",
    "faction": "contractor",
    "level": "C",
    "residentRegion": "施工现场",
    "sandtableRegionId": "construction_site",
    "description": "危化品管理/消防隐患/专项整改",
    "personality": "紧张、按规矩",
    "agenda": "危化品存放合规、安全可控",
    "helpsWith": [
      "危化品台账",
      "防火防爆",
      "巡查整改"
    ],
    "blocksWhen": [
      "违规存放会触发重大隐患"
    ],
    "payloadCategory": "construction",
    "payloadType": "contractor"
  },
  {
    "id": "site_rebar_processing_lead",
    "excelId": "NPC060",
    "name": "张钢",
    "title": "钢筋工长",
    "organization": "班组",
    "faction": "labor",
    "level": "B",
    "residentRegion": "施工现场",
    "sandtableRegionId": "construction_site",
    "description": "钢筋加工/班组协调/质量返工",
    "personality": "硬朗、重效率",
    "agenda": "钢筋加工及时、质量过关",
    "helpsWith": [
      "钢筋加工",
      "绑扎协调",
      "材料反馈"
    ],
    "blocksWhen": [
      "返工和材料短缺会影响情绪"
    ],
    "payloadCategory": "construction",
    "payloadType": "subcontractor"
  },
  {
    "id": "site_carpentry_lead",
    "excelId": "NPC061",
    "name": "木林",
    "title": "木工工长",
    "organization": "班组",
    "faction": "labor",
    "level": "B",
    "residentRegion": "施工现场",
    "sandtableRegionId": "construction_site",
    "description": "模板加工/木料防火/支模质量",
    "personality": "经验派、重手艺",
    "agenda": "模板加工顺手、周转不乱",
    "helpsWith": [
      "模板加工",
      "支模交底",
      "木料防火"
    ],
    "blocksWhen": [
      "赶工时容易忽视防火管理"
    ],
    "payloadCategory": "construction",
    "payloadType": "subcontractor"
  },
  {
    "id": "site_mep_processing_lead",
    "excelId": "NPC062",
    "name": "余成电",
    "title": "机电工长",
    "organization": "机电分包",
    "faction": "labor",
    "level": "A",
    "residentRegion": "施工现场",
    "sandtableRegionId": "construction_site",
    "description": "机电安装/管线综合/系统调试",
    "personality": "能干、怕返工",
    "agenda": "机电安装少碰撞、调试能通过",
    "helpsWith": [
      "机电加工",
      "管线安装",
      "系统调试"
    ],
    "blocksWhen": [
      "图纸变更会造成大量返工"
    ],
    "payloadCategory": "construction",
    "payloadType": "subcontractor"
  },
  {
    "id": "engineering_supervisor_lead",
    "excelId": "NPC063",
    "name": "罗幕",
    "title": "幕墙工长",
    "organization": "幕墙分包",
    "faction": "labor",
    "level": "B",
    "residentRegion": "施工现场",
    "sandtableRegionId": "construction_site",
    "description": "幕墙施工/吊装协调/外立面收口",
    "personality": "看天气、重吊装",
    "agenda": "外立面进度和安全可控",
    "helpsWith": [
      "幕墙材料",
      "吊装计划",
      "外立面收口"
    ],
    "blocksWhen": [
      "天气和交叉作业会拖进度"
    ],
    "payloadCategory": "construction",
    "payloadType": "subcontractor"
  },
  {
    "id": "finishing_team_lead",
    "excelId": "NPC064",
    "name": "梁装",
    "title": "精装工长",
    "organization": "精装分包",
    "faction": "labor",
    "level": "B",
    "residentRegion": "施工现场",
    "sandtableRegionId": "construction_site",
    "description": "精装施工/成品保护/观感质量",
    "personality": "细节多、怕污染",
    "agenda": "成品保护和观感达标",
    "helpsWith": [
      "精装材料",
      "样板执行",
      "成品保护"
    ],
    "blocksWhen": [
      "交叉施工破坏成品会爆冲突"
    ],
    "payloadCategory": "construction",
    "payloadType": "subcontractor"
  },
  {
    "id": "site_unloading_dispatcher",
    "excelId": "NPC065",
    "name": "费衡",
    "title": "周转材料管理员",
    "organization": "总包材料",
    "faction": "contractor",
    "level": "B",
    "residentRegion": "施工现场",
    "sandtableRegionId": "construction_site",
    "description": "周转材料/损耗控制/调配",
    "personality": "节省、管控型",
    "agenda": "周转材料不丢不乱",
    "helpsWith": [
      "周转材料调配",
      "损耗控制"
    ],
    "blocksWhen": [
      "材料归还和赔偿会引发争议"
    ],
    "payloadCategory": "construction",
    "payloadType": "contractor"
  },
  {
    "id": "site_equipment_yard_manager",
    "excelId": "NPC066",
    "name": "许设",
    "title": "设备管理员",
    "organization": "总包设备",
    "faction": "contractor",
    "level": "B",
    "residentRegion": "施工现场",
    "sandtableRegionId": "construction_site",
    "description": "设备验收/台账/维保",
    "personality": "稳妥、看保养",
    "agenda": "设备进场验收与维护正常",
    "helpsWith": [
      "设备台账",
      "进场验收",
      "维保提醒"
    ],
    "blocksWhen": [
      "设备故障会拖关键线路"
    ],
    "payloadCategory": "construction",
    "payloadType": "contractor"
  },
  {
    "id": "logistics_lane_coordinator",
    "excelId": "NPC067",
    "name": "牛清",
    "title": "垃圾清运负责人",
    "organization": "后勤分包",
    "faction": "labor",
    "level": "C",
    "residentRegion": "施工现场",
    "sandtableRegionId": "construction_site",
    "description": "垃圾清运/文明施工/环保投诉",
    "personality": "现实、看排班",
    "agenda": "垃圾及时清运、不影响形象",
    "helpsWith": [
      "垃圾堆放",
      "清运路线",
      "环保检查"
    ],
    "blocksWhen": [
      "清运不及时会引发投诉和扣分"
    ],
    "payloadCategory": "construction",
    "payloadType": "subcontractor"
  },
  {
    "id": "floor_construction_worker",
    "excelId": "NPC068",
    "name": "周栋",
    "title": "栋号长",
    "organization": "总包生产",
    "faction": "contractor",
    "level": "A",
    "residentRegion": "施工现场",
    "sandtableRegionId": "construction_site",
    "description": "楼栋推进/工序穿插/现场协调",
    "personality": "现场掌控强",
    "agenda": "楼栋作业面连续推进",
    "helpsWith": [
      "楼层协调",
      "工序穿插",
      "问题上报"
    ],
    "blocksWhen": [
      "多个专业抢作业面会爆冲突"
    ],
    "payloadCategory": "construction",
    "payloadType": "contractor"
  },
  {
    "id": "mep_system_lead",
    "excelId": "NPC069",
    "name": "江防",
    "title": "水电消防工长",
    "organization": "机电/消防分包",
    "faction": "labor",
    "level": "A",
    "residentRegion": "施工现场",
    "sandtableRegionId": "construction_site",
    "description": "消防系统/水电调试/联动整改",
    "personality": "专业、急于调试",
    "agenda": "消防水电系统顺利联动",
    "helpsWith": [
      "消防泵房",
      "水池",
      "控制室",
      "管线调试"
    ],
    "blocksWhen": [
      "联动失败会影响验收和开业"
    ],
    "payloadCategory": "construction",
    "payloadType": "subcontractor"
  },
  {
    "id": "fire_pump_room_engineer",
    "excelId": "NPC070",
    "name": "田梯",
    "title": "电梯厂家工程师",
    "organization": "设备厂家",
    "faction": "supplier",
    "level": "B",
    "residentRegion": "施工现场",
    "sandtableRegionId": "construction_site",
    "description": "电梯安装/厂家调试/移交条件",
    "personality": "标准化、按厂家流程",
    "agenda": "电梯安装调试按节点完成",
    "helpsWith": [
      "电梯机房",
      "井道条件",
      "调试验收"
    ],
    "blocksWhen": [
      "土建移交条件不满足会拒绝进场"
    ],
    "payloadCategory": "design_supply",
    "payloadType": "supplier"
  },
  {
    "id": "hvac_room_engineer",
    "excelId": "NPC071",
    "name": "黄暖",
    "title": "暖通工程师",
    "organization": "暖通分包",
    "faction": "labor",
    "level": "B",
    "residentRegion": "施工现场",
    "sandtableRegionId": "construction_site",
    "description": "暖通安装/风量调试/设备运行",
    "personality": "技术型、看参数",
    "agenda": "暖通设备运行达标",
    "helpsWith": [
      "暖通机房",
      "风管",
      "调试参数"
    ],
    "blocksWhen": [
      "风量和噪声问题会拖试运行"
    ],
    "payloadCategory": "construction",
    "payloadType": "subcontractor"
  },
  {
    "id": "outdoor_municipal_coordinator",
    "excelId": "NPC072",
    "name": "管维",
    "title": "市政管网工长",
    "organization": "市政分包",
    "faction": "labor",
    "level": "B",
    "residentRegion": "施工现场",
    "sandtableRegionId": "construction_site",
    "description": "室外管网/市政接驳/接口协调",
    "personality": "接口型、看外部条件",
    "agenda": "室外管网顺利接驳",
    "helpsWith": [
      "雨污水",
      "给水",
      "电力",
      "通信接入"
    ],
    "blocksWhen": [
      "外部接口不明会延误接驳"
    ],
    "payloadCategory": "construction",
    "payloadType": "subcontractor"
  },
  {
    "id": "site_fire_lane_officer",
    "excelId": "NPC073",
    "name": "严保",
    "title": "消防车道巡查员",
    "organization": "总包安全",
    "faction": "contractor",
    "level": "C",
    "residentRegion": "施工现场",
    "sandtableRegionId": "construction_site",
    "description": "消防车道/通道清障/安全巡查",
    "personality": "较真、看通行",
    "agenda": "消防通道不被占用",
    "helpsWith": [
      "消防车道巡查",
      "临时堆放清理"
    ],
    "blocksWhen": [
      "占道堆料会直接开整改单"
    ],
    "payloadCategory": "construction",
    "payloadType": "contractor"
  },
  {
    "id": "atrium_operations_lead",
    "excelId": "NPC074",
    "name": "潘景",
    "title": "景观工程师",
    "organization": "景观分包",
    "faction": "labor",
    "level": "B",
    "residentRegion": "施工现场",
    "sandtableRegionId": "construction_site",
    "description": "景观施工/铺装绿化/效果控制",
    "personality": "重效果、怕返工",
    "agenda": "景观节点按效果落地",
    "helpsWith": [
      "景观广场",
      "铺装",
      "绿化协调"
    ],
    "blocksWhen": [
      "地下管线未完成会影响景观"
    ],
    "payloadCategory": "construction",
    "payloadType": "subcontractor"
  },
  {
    "id": "parking_lot_manager",
    "excelId": "NPC075",
    "name": "裴车",
    "title": "停车系统工程师",
    "organization": "停车系统单位",
    "faction": "supplier",
    "level": "B",
    "residentRegion": "施工现场",
    "sandtableRegionId": "construction_site",
    "description": "停车系统/道闸调试/车流组织",
    "personality": "系统化、重调试",
    "agenda": "停车系统可运行",
    "helpsWith": [
      "停车场设备",
      "道闸",
      "车流组织"
    ],
    "blocksWhen": [
      "弱电和土建条件不齐会拖调试"
    ],
    "payloadCategory": "design_supply",
    "payloadType": "supplier"
  },
  {
    "id": "site_canteen_manager",
    "excelId": "NPC076",
    "name": "邱卸",
    "title": "卸货调度员",
    "organization": "后勤分包",
    "faction": "labor",
    "level": "C",
    "residentRegion": "施工现场",
    "sandtableRegionId": "construction_site",
    "description": "卸货调度/物流排队/临堆管理",
    "personality": "灵活、会协调",
    "agenda": "卸货不堵、不乱堆",
    "helpsWith": [
      "卸货排队",
      "收货路线",
      "临时堆放"
    ],
    "blocksWhen": [
      "高峰期容易和班组冲突"
    ],
    "payloadCategory": "construction",
    "payloadType": "subcontractor"
  },
  {
    "id": "site_realname_officer",
    "excelId": "NPC077",
    "name": "程信",
    "title": "通信接入工程师",
    "organization": "通信单位",
    "faction": "supplier",
    "level": "B",
    "residentRegion": "施工现场",
    "sandtableRegionId": "construction_site",
    "description": "通信接入/弱电接口/运营商协调",
    "personality": "接口型、守流程",
    "agenda": "通信接入开通",
    "helpsWith": [
      "通信管线",
      "弱电接口",
      "运营商协调"
    ],
    "blocksWhen": [
      "外线资源不到位会影响中控"
    ],
    "payloadCategory": "design_supply",
    "payloadType": "supplier"
  },
  {
    "id": "supplier_representative",
    "excelId": "NPC078",
    "name": "冯燃",
    "title": "燃气接入协调人",
    "organization": "燃气单位",
    "faction": "supplier",
    "level": "C",
    "residentRegion": "施工现场",
    "sandtableRegionId": "construction_site",
    "description": "燃气接驳/安全审查/外线协调",
    "personality": "谨慎、审批型",
    "agenda": "燃气接入安全合规",
    "helpsWith": [
      "燃气接驳",
      "方案审核",
      "安全交底"
    ],
    "blocksWhen": [
      "燃气条件不满足会推迟接驳"
    ],
    "payloadCategory": "design_supply",
    "payloadType": "supplier"
  },
  {
    "id": "subcontractor_lead",
    "excelId": "NPC079",
    "name": "邓国强",
    "title": "供电接入经理",
    "organization": "供电单位",
    "faction": "supplier",
    "level": "B",
    "residentRegion": "施工现场",
    "sandtableRegionId": "construction_site",
    "description": "电力接入/送电计划/报装",
    "personality": "强流程、重计划",
    "agenda": "电力接入按计划送电",
    "helpsWith": [
      "外电接入",
      "配电室送电",
      "报装协调"
    ],
    "blocksWhen": [
      "供电计划延迟会影响整体调试"
    ],
    "payloadCategory": "design_supply",
    "payloadType": "supplier"
  },
  {
    "id": "quality_supervision_officer",
    "excelId": "NPC080",
    "name": "温泉",
    "title": "给水接入经理",
    "organization": "水务单位",
    "faction": "supplier",
    "level": "B",
    "residentRegion": "施工现场",
    "sandtableRegionId": "construction_site",
    "description": "给水接入/试压/水压问题",
    "personality": "务实、看接口",
    "agenda": "给水接驳和水压稳定",
    "helpsWith": [
      "给水接入",
      "水表",
      "试压协调"
    ],
    "blocksWhen": [
      "水压不足会影响消防和生活水"
    ],
    "payloadCategory": "design_supply",
    "payloadType": "supplier"
  },
  {
    "id": "opening_leasing_manager",
    "excelId": "NPC081",
    "name": "沈嘉",
    "title": "招商经理",
    "organization": "运营方",
    "faction": "merchant",
    "level": "A",
    "residentRegion": "开业筹备",
    "sandtableRegionId": "opening_prep",
    "description": "招商租赁/商户需求/开业目标",
    "personality": "外向、目标导向",
    "agenda": "招商落位、租户按时进场",
    "helpsWith": [
      "招商谈判",
      "租赁合同",
      "商户需求"
    ],
    "blocksWhen": [
      "商户要求会倒逼工程变更"
    ],
    "payloadCategory": "operation",
    "payloadType": "merchant"
  },
  {
    "id": "merchant_fitout_manager",
    "excelId": "NPC082",
    "name": "麦然",
    "title": "商户服务专员",
    "organization": "运营方",
    "faction": "merchant",
    "level": "B",
    "residentRegion": "开业筹备",
    "sandtableRegionId": "opening_prep",
    "description": "商户服务/进场协调/投诉处置",
    "personality": "亲和、救火型",
    "agenda": "商户问题及时响应",
    "helpsWith": [
      "商户进场",
      "证照材料",
      "装修提醒"
    ],
    "blocksWhen": [
      "商户抱怨会快速扩散"
    ],
    "payloadCategory": "operation",
    "payloadType": "merchant"
  },
  {
    "id": "second_fitout_admin",
    "excelId": "NPC083",
    "name": "谢承二",
    "title": "二装管理员",
    "organization": "物业/运营",
    "faction": "property",
    "level": "B",
    "residentRegion": "开业筹备",
    "sandtableRegionId": "opening_prep",
    "description": "二装管理/巡查整改/商户冲突",
    "personality": "严格、怕违规",
    "agenda": "商户二装安全合规",
    "helpsWith": [
      "二装报审",
      "进场交底",
      "巡查整改"
    ],
    "blocksWhen": [
      "违规动火和私改消防会触发事件"
    ],
    "payloadCategory": "operation",
    "payloadType": "property"
  },
  {
    "id": "property_customer_manager",
    "excelId": "NPC084",
    "name": "乔安",
    "title": "物业客服主管",
    "organization": "物业公司",
    "faction": "property",
    "level": "B",
    "residentRegion": "开业筹备",
    "sandtableRegionId": "opening_prep",
    "description": "客服报修/服务保障/投诉闭环",
    "personality": "服务意识强、怕差评",
    "agenda": "报修受理顺畅、客户体验稳定",
    "helpsWith": [
      "客服报修",
      "问题派单",
      "开业服务"
    ],
    "blocksWhen": [
      "问题闭环慢会引发投诉"
    ],
    "payloadCategory": "operation",
    "payloadType": "property"
  },
  {
    "id": "property_engineering_manager",
    "excelId": "NPC085",
    "name": "郝工",
    "title": "物业工程经理",
    "organization": "物业公司",
    "faction": "property",
    "level": "A",
    "residentRegion": "开业筹备",
    "sandtableRegionId": "opening_prep",
    "description": "物业接管/设备移交/缺陷销项",
    "personality": "专业、接管视角",
    "agenda": "设备资料和现场都能接得住",
    "helpsWith": [
      "物业接管",
      "设备巡检",
      "缺陷销项"
    ],
    "blocksWhen": [
      "不接受带病移交"
    ],
    "payloadCategory": "operation",
    "payloadType": "property"
  },
  {
    "id": "fire_control_room_officer",
    "excelId": "NPC086",
    "name": "叶青",
    "title": "消防控制室值班长",
    "organization": "物业公司",
    "faction": "property",
    "level": "A",
    "residentRegion": "开业筹备",
    "sandtableRegionId": "opening_prep",
    "description": "消防值守/报警处理/联动测试",
    "personality": "稳、红线强",
    "agenda": "消防主机稳定、值守合规",
    "helpsWith": [
      "消防控制室值守",
      "报警处理",
      "联动测试"
    ],
    "blocksWhen": [
      "误报频发会影响试营业"
    ],
    "payloadCategory": "operation",
    "payloadType": "property"
  },
  {
    "id": "security_roster_manager",
    "excelId": "NPC087",
    "name": "高安",
    "title": "安保经理",
    "organization": "物业公司",
    "faction": "property",
    "level": "B",
    "residentRegion": "开业筹备",
    "sandtableRegionId": "opening_prep",
    "description": "安保排班/应急预案/秩序维护",
    "personality": "纪律强、看秩序",
    "agenda": "开业安保和应急响应有序",
    "helpsWith": [
      "安保排班",
      "巡逻路线",
      "突发处置"
    ],
    "blocksWhen": [
      "人流车流失控会触发危机"
    ],
    "payloadCategory": "operation",
    "payloadType": "property"
  },
  {
    "id": "site_living_area_manager",
    "excelId": "NPC088",
    "name": "温洁",
    "title": "保洁环境经理",
    "organization": "物业公司",
    "faction": "property",
    "level": "B",
    "residentRegion": "开业筹备",
    "sandtableRegionId": "opening_prep",
    "description": "保洁环境/垃圾协调/品质巡查",
    "personality": "细致、重形象",
    "agenda": "环境整洁、垃圾清运顺畅",
    "helpsWith": [
      "保洁计划",
      "环境巡查",
      "垃圾点管理"
    ],
    "blocksWhen": [
      "清洁不到位会影响开业形象"
    ],
    "payloadCategory": "operation",
    "payloadType": "property"
  },
  {
    "id": "parking_operation_manager",
    "excelId": "NPC089",
    "name": "裴景",
    "title": "停车场运营经理",
    "organization": "运营方",
    "faction": "merchant",
    "level": "B",
    "residentRegion": "开业筹备",
    "sandtableRegionId": "opening_prep",
    "description": "停车运营/系统联调/车流组织",
    "personality": "系统思维、看流量",
    "agenda": "停车场开业可运行",
    "helpsWith": [
      "车流组织",
      "收费系统",
      "道闸联调"
    ],
    "blocksWhen": [
      "停车拥堵会影响客流体验"
    ],
    "payloadCategory": "operation",
    "payloadType": "merchant"
  },
  {
    "id": "smart_weak_current_manager",
    "excelId": "NPC090",
    "name": "罗智",
    "title": "智能化运维工程师",
    "organization": "物业/弱电单位",
    "faction": "property",
    "level": "B",
    "residentRegion": "开业筹备",
    "sandtableRegionId": "opening_prep",
    "description": "智能化运维/弱电中控/系统联调",
    "personality": "技术宅、看系统",
    "agenda": "监控、网络、门禁稳定运行",
    "helpsWith": [
      "弱电中控",
      "监控",
      "网络",
      "门禁调试"
    ],
    "blocksWhen": [
      "系统掉线会影响运营响应"
    ],
    "payloadCategory": "operation",
    "payloadType": "property"
  },
  {
    "id": "floor_supervision_engineer",
    "excelId": "NPC091",
    "name": "唐检",
    "title": "开业联检总协调",
    "organization": "业主/运营",
    "faction": "owner",
    "level": "A",
    "residentRegion": "开业筹备",
    "sandtableRegionId": "opening_prep",
    "description": "开业联检/问题派单/整改销项",
    "personality": "推进型、清单控",
    "agenda": "开业前问题全部销项",
    "helpsWith": [
      "联检清单",
      "问题派单",
      "整改复查"
    ],
    "blocksWhen": [
      "问题堆积会逼近开业红线"
    ],
    "payloadCategory": "operation",
    "payloadType": "owner"
  },
  {
    "id": "owner_pre_approval_officer",
    "excelId": "NPC092",
    "name": "袁值",
    "title": "试营业值班指挥官",
    "organization": "运营方",
    "faction": "merchant",
    "level": "A",
    "residentRegion": "开业筹备",
    "sandtableRegionId": "opening_prep",
    "description": "试营业指挥/突发响应/资源调度",
    "personality": "临场强、抗压",
    "agenda": "试营业问题快速响应",
    "helpsWith": [
      "试营业指挥",
      "突发事件",
      "资源调度"
    ],
    "blocksWhen": [
      "响应慢会引发舆情"
    ],
    "payloadCategory": "operation",
    "payloadType": "merchant"
  },
  {
    "id": "merchant_representative",
    "excelId": "NPC093",
    "name": "钟证",
    "title": "商户证照专员",
    "organization": "运营方",
    "faction": "merchant",
    "level": "B",
    "residentRegion": "开业筹备",
    "sandtableRegionId": "opening_prep",
    "description": "商户证照/手续协助/资料补正",
    "personality": "耐心、资料控",
    "agenda": "商户证照齐全",
    "helpsWith": [
      "证照资料",
      "消防材料",
      "营业手续"
    ],
    "blocksWhen": [
      "商户材料拖延会影响开业"
    ],
    "payloadCategory": "operation",
    "payloadType": "merchant"
  },
  {
    "id": "wayfinding_design_lead",
    "excelId": "NPC094",
    "name": "米陈",
    "title": "导视美陈设计师",
    "organization": "运营方",
    "faction": "merchant",
    "level": "B",
    "residentRegion": "开业筹备",
    "sandtableRegionId": "opening_prep",
    "description": "导视美陈/品牌落地/效果调整",
    "personality": "审美强、爱改稿",
    "agenda": "导视美陈按效果落地",
    "helpsWith": [
      "导视",
      "标识",
      "美陈",
      "品牌氛围"
    ],
    "blocksWhen": [
      "工程条件不匹配会反复调整"
    ],
    "payloadCategory": "operation",
    "payloadType": "merchant"
  },
  {
    "id": "logistics_receiving_coordinator",
    "excelId": "NPC095",
    "name": "孙后",
    "title": "后勤收货协调人",
    "organization": "运营方",
    "faction": "merchant",
    "level": "B",
    "residentRegion": "开业筹备",
    "sandtableRegionId": "opening_prep",
    "description": "后勤收货/垃圾清运/路线协调",
    "personality": "灵活、会排队",
    "agenda": "收货清运不乱套",
    "helpsWith": [
      "商户收货",
      "垃圾清运",
      "后勤路线"
    ],
    "blocksWhen": [
      "收货高峰会堵塞通道"
    ],
    "payloadCategory": "operation",
    "payloadType": "merchant"
  }
];

export function getNpcProfileById(id: string): NpcProfile | undefined {
  return NPC_PROFILES.find((npc) => npc.id === id);
}

export function getNpcProfilesByIds(ids: string[]): NpcProfile[] {
  const map = new Map(NPC_PROFILES.map((npc) => [npc.id, npc]));
  return ids.map((id) => map.get(id)).filter(Boolean) as NpcProfile[];
}
