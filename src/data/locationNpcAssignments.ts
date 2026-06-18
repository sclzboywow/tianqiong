import type { ProjectStageId } from "@/game/projectStages";
import type { LocationRegionId } from "@/game/locationSandtablePresentationEngine";
import type { NpcLevel } from "./npcProfiles";

export type LocationNpcRole =
  | "primary"
  | "support"
  | "regulator"
  | "blocker"
  | "temporary";

export type LocationNpcAssignment = {
  locationId: string;
  npcId: string;
  level: NpcLevel;
  role: LocationNpcRole;
  regionId?: LocationRegionId;
  zoneId?: string;
  appearStage?: ProjectStageId;
  taskHooks?: string[];
  eventHooks?: string[];
  note?: string;
};

export const LOCATION_NPC_ASSIGNMENTS: LocationNpcAssignment[] = [
  {
    "locationId": "owner_project_management_dept",
    "npcId": "owner_project_director",
    "level": "S",
    "role": "primary",
    "regionId": "owner_hub",
    "note": "林知远在【业主·项目管理部】围绕「主线任务/综合协调/问题闭环」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "owner_project_management_dept",
    "npcId": "owner_project_coordinator",
    "level": "A",
    "role": "support",
    "regionId": "owner_hub",
    "note": "赵清在【业主·项目管理部】围绕「计划管理/会议纪要/催办闭环」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "owner_project_management_dept",
    "npcId": "owner_archive_manager",
    "level": "B",
    "role": "support",
    "regionId": "owner_hub",
    "note": "何静在【业主·项目管理部】围绕「资料归档/版本校验/验收资料」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "owner_gm_office",
    "npcId": "owner_general_manager",
    "level": "S",
    "role": "primary",
    "regionId": "owner_hub",
    "note": "许承岳在【业主·总经理办公室】围绕「重大决策/资源申请/阶段汇报」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "owner_gm_office",
    "npcId": "owner_project_director",
    "level": "S",
    "role": "support",
    "regionId": "owner_hub",
    "note": "林知远在【业主·总经理办公室】围绕「主线任务/综合协调/问题闭环」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "owner_gm_office",
    "npcId": "legal_audit_liaison",
    "level": "C",
    "role": "support",
    "regionId": "owner_hub",
    "note": "方砚在【业主·总经理办公室】围绕「法审审计/程序风险/证据链」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "owner_leader_office",
    "npcId": "owner_executive_leader",
    "level": "S",
    "role": "primary",
    "regionId": "owner_hub",
    "note": "周岚在【业主·分管领导办公室】围绕「节点督办/风险压降/专项协调」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "owner_leader_office",
    "npcId": "owner_project_director",
    "level": "S",
    "role": "support",
    "regionId": "owner_hub",
    "note": "林知远在【业主·分管领导办公室】围绕「主线任务/综合协调/问题闭环」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "owner_leader_office",
    "npcId": "owner_cost_contract_lead",
    "level": "A",
    "role": "support",
    "regionId": "owner_hub",
    "note": "马衡在【业主·分管领导办公室】围绕「合同边界/签证变更/成本预警」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "owner_archive_room",
    "npcId": "owner_archive_manager",
    "level": "B",
    "role": "primary",
    "regionId": "owner_hub",
    "note": "何静在【业主·档案资料室】围绕「资料归档/版本校验/验收资料」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "owner_archive_room",
    "npcId": "owner_project_coordinator",
    "level": "A",
    "role": "support",
    "regionId": "owner_hub",
    "note": "赵清在【业主·档案资料室】围绕「计划管理/会议纪要/催办闭环」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "owner_archive_room",
    "npcId": "completion_filing_officer",
    "level": "B",
    "role": "regulator",
    "regionId": "owner_hub",
    "note": "周明远在【业主·档案资料室】围绕「竣工备案/资料一致性/归档」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "owner_cost_contract_dept",
    "npcId": "owner_cost_contract_lead",
    "level": "A",
    "role": "primary",
    "regionId": "owner_hub",
    "note": "马衡在【业主·成本合约部】围绕「合同边界/签证变更/成本预警」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "owner_cost_contract_dept",
    "npcId": "contractor_business_lead",
    "level": "A",
    "role": "blocker",
    "regionId": "owner_hub",
    "note": "顾言在【业主·成本合约部】围绕「计量签证/商务谈判/索赔争议」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "owner_cost_contract_dept",
    "npcId": "legal_audit_liaison",
    "level": "C",
    "role": "blocker",
    "regionId": "owner_hub",
    "note": "方砚在【业主·成本合约部】围绕「法审审计/程序风险/证据链」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "owner_procurement_office",
    "npcId": "owner_procurement_lead",
    "level": "A",
    "role": "primary",
    "regionId": "owner_hub",
    "note": "苏曼在【业主·招采办公室】围绕「招采流程/文件审查/开标组织」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "owner_procurement_office",
    "npcId": "bidding_agent_lead",
    "level": "B",
    "role": "support",
    "regionId": "owner_hub",
    "note": "朱远在【业主·招采办公室】围绕「招标文件/答疑澄清/开评标」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "owner_procurement_office",
    "npcId": "public_resource_center_officer",
    "level": "B",
    "role": "support",
    "regionId": "owner_hub",
    "note": "钱澈在【业主·招采办公室】围绕「交易流程/开评标/公示节点」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "owner_finance_dept",
    "npcId": "owner_finance_reviewer",
    "level": "A",
    "role": "primary",
    "regionId": "owner_hub",
    "note": "唐远在【业主·财务资金部】围绕「资金计划/付款审核/现金流压力」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "owner_finance_dept",
    "npcId": "owner_cost_contract_lead",
    "level": "A",
    "role": "support",
    "regionId": "owner_hub",
    "note": "马衡在【业主·财务资金部】围绕「合同边界/签证变更/成本预警」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "owner_finance_dept",
    "npcId": "owner_general_manager",
    "level": "S",
    "role": "primary",
    "regionId": "owner_hub",
    "note": "许承岳在【业主·财务资金部】围绕「重大决策/资源申请/阶段汇报」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "owner_operation_prep_office",
    "npcId": "owner_operation_prep_lead",
    "level": "A",
    "role": "primary",
    "regionId": "owner_hub",
    "note": "陆宁在【业主·运营筹备办公室】围绕「开业筹备/商户进场/运营移交」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "owner_operation_prep_office",
    "npcId": "opening_leasing_manager",
    "level": "A",
    "role": "support",
    "regionId": "owner_hub",
    "note": "沈嘉在【业主·运营筹备办公室】围绕「招商租赁/商户需求/开业目标」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "owner_operation_prep_office",
    "npcId": "property_engineering_manager",
    "level": "A",
    "role": "support",
    "regionId": "owner_hub",
    "note": "郝工在【业主·运营筹备办公室】围绕「物业接管/设备移交/缺陷销项」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "project_meeting_room",
    "npcId": "owner_project_director",
    "level": "S",
    "role": "primary",
    "regionId": "command_center",
    "note": "林知远在【项目部·综合会议室】围绕「主线任务/综合协调/问题闭环」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "project_meeting_room",
    "npcId": "contractor_project_manager",
    "level": "S",
    "role": "support",
    "regionId": "command_center",
    "note": "陈建峰在【项目部·综合会议室】围绕「生产统筹/资源调配/总包协调」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "project_meeting_room",
    "npcId": "chief_supervisor",
    "level": "A",
    "role": "support",
    "regionId": "command_center",
    "note": "魏诚在【项目部·综合会议室】围绕「监理签认/旁站验收/整改闭合」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_contractor_pm_office",
    "npcId": "contractor_project_manager",
    "level": "S",
    "role": "primary",
    "regionId": "command_center",
    "note": "陈建峰在【项目部·总包项目经理办公室】围绕「生产统筹/资源调配/总包协调」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_contractor_pm_office",
    "npcId": "contractor_production_manager",
    "level": "A",
    "role": "primary",
    "regionId": "command_center",
    "note": "罗志强在【项目部·总包项目经理办公室】围绕「施工组织/穿插计划/抢工安排」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_contractor_pm_office",
    "npcId": "contractor_business_lead",
    "level": "A",
    "role": "support",
    "regionId": "command_center",
    "note": "顾言在【项目部·总包项目经理办公室】围绕「计量签证/商务谈判/索赔争议」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_production_dispatch_room",
    "npcId": "contractor_production_manager",
    "level": "A",
    "role": "primary",
    "regionId": "command_center",
    "note": "罗志强在【项目部·生产调度室】围绕「施工组织/穿插计划/抢工安排」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_production_dispatch_room",
    "npcId": "floor_construction_worker",
    "level": "A",
    "role": "support",
    "regionId": "command_center",
    "note": "周栋在【项目部·生产调度室】围绕「楼栋推进/工序穿插/现场协调」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_production_dispatch_room",
    "npcId": "labor_realname_officer",
    "level": "B",
    "role": "support",
    "regionId": "command_center",
    "note": "胡勇在【项目部·生产调度室】围绕「实名制/考勤/劳务风险」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_tech_bim_room",
    "npcId": "bim_technical_lead",
    "level": "A",
    "role": "primary",
    "regionId": "command_center",
    "note": "秦越在【项目部·技术/BIM室】围绕「图纸会审/BIM协调/技术方案」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_tech_bim_room",
    "npcId": "design_lead",
    "level": "A",
    "role": "support",
    "regionId": "command_center",
    "note": "蓝澈在【项目部·技术/BIM室】围绕「设计答疑/方案优化/变更控制」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_tech_bim_room",
    "npcId": "drawing_review_lead",
    "level": "A",
    "role": "support",
    "regionId": "command_center",
    "note": "宋审在【项目部·技术/BIM室】围绕「图审意见/合规修改/审查闭环」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_safety_quality_office",
    "npcId": "contractor_safety_quality_lead",
    "level": "A",
    "role": "primary",
    "regionId": "command_center",
    "note": "谢安在【项目部·安全质量办公室】围绕「安全检查/隐患整改/应急演练」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_safety_quality_office",
    "npcId": "contractor_technical_lead",
    "level": "A",
    "role": "primary",
    "regionId": "command_center",
    "note": "白雨在【项目部·安全质量办公室】围绕「质量验收/样板先行/返工闭合」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_safety_quality_office",
    "npcId": "quality_safety_station_officer",
    "level": "A",
    "role": "regulator",
    "regionId": "command_center",
    "note": "袁海在【项目部·安全质量办公室】围绕「监督检查/整改销项/通报风险」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_business_contract_room",
    "npcId": "contractor_business_lead",
    "level": "A",
    "role": "primary",
    "regionId": "command_center",
    "note": "顾言在【项目部·商务合约室】围绕「计量签证/商务谈判/索赔争议」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_business_contract_room",
    "npcId": "owner_cost_contract_lead",
    "level": "A",
    "role": "support",
    "regionId": "command_center",
    "note": "马衡在【项目部·商务合约室】围绕「合同边界/签证变更/成本预警」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_business_contract_room",
    "npcId": "audit_settlement_officer",
    "level": "A",
    "role": "support",
    "regionId": "command_center",
    "note": "严审在【项目部·商务合约室】围绕「结算审计/争议复核/成本核减」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_material_equipment_office",
    "npcId": "contractor_material_equipment_lead",
    "level": "B",
    "role": "primary",
    "regionId": "command_center",
    "note": "孙泽在【项目部·材料设备办公室】围绕「材料计划/进场验收/设备管理」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_material_equipment_office",
    "npcId": "material_testing_engineer",
    "level": "B",
    "role": "regulator",
    "regionId": "command_center",
    "note": "段明在【项目部·材料设备办公室】围绕「材料检测/报告复核/不合格处置」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_material_equipment_office",
    "npcId": "site_equipment_yard_manager",
    "level": "B",
    "role": "support",
    "regionId": "command_center",
    "note": "许设在【项目部·材料设备办公室】围绕「设备验收/台账/维保」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "project_document_room",
    "npcId": "supervisor_document_engineer",
    "level": "B",
    "role": "primary",
    "regionId": "command_center",
    "note": "宋倩在【项目部·资料室】围绕「资料报审/隐蔽验收/资料补正」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "project_document_room",
    "npcId": "owner_archive_manager",
    "level": "B",
    "role": "support",
    "regionId": "command_center",
    "note": "何静在【项目部·资料室】围绕「资料归档/版本校验/验收资料」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "project_document_room",
    "npcId": "chief_supervisor",
    "level": "A",
    "role": "support",
    "regionId": "command_center",
    "note": "魏诚在【项目部·资料室】围绕「监理签认/旁站验收/整改闭合」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_supervisor_office",
    "npcId": "chief_supervisor",
    "level": "A",
    "role": "primary",
    "regionId": "command_center",
    "note": "魏诚在【项目部·监理办公室】围绕「监理签认/旁站验收/整改闭合」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_supervisor_office",
    "npcId": "supervisor_engineer",
    "level": "B",
    "role": "support",
    "regionId": "command_center",
    "note": "叶宁在【项目部·监理办公室】围绕「专业巡查/见证取样/工序验收」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_supervisor_office",
    "npcId": "quality_safety_station_officer",
    "level": "A",
    "role": "regulator",
    "regionId": "command_center",
    "note": "袁海在【项目部·监理办公室】围绕「监督检查/整改销项/通报风险」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_labor_realname_office",
    "npcId": "labor_realname_officer",
    "level": "B",
    "role": "primary",
    "regionId": "command_center",
    "note": "胡勇在【项目部·劳务实名制办公室】围绕「实名制/考勤/劳务风险」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_labor_realname_office",
    "npcId": "contractor_production_manager",
    "level": "A",
    "role": "support",
    "regionId": "command_center",
    "note": "罗志强在【项目部·劳务实名制办公室】围绕「施工组织/穿插计划/抢工安排」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_labor_realname_office",
    "npcId": "site_main_gate_officer",
    "level": "C",
    "role": "support",
    "regionId": "command_center",
    "note": "马卫在【项目部·劳务实名制办公室】围绕「门禁实名/访客登记/异常拦截」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_team_coordination_room",
    "npcId": "team_coordination_lead",
    "level": "B",
    "role": "primary",
    "regionId": "command_center",
    "note": "刘铁生在【项目部·班组协调室】围绕「班组执行/工序交底/现场反馈」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_team_coordination_room",
    "npcId": "contractor_production_manager",
    "level": "A",
    "role": "support",
    "regionId": "command_center",
    "note": "罗志强在【项目部·班组协调室】围绕「施工组织/穿插计划/抢工安排」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_team_coordination_room",
    "npcId": "contractor_safety_quality_lead",
    "level": "A",
    "role": "support",
    "regionId": "command_center",
    "note": "谢安在【项目部·班组协调室】围绕「安全检查/隐患整改/应急演练」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_sample_disclosure_room",
    "npcId": "sample_disclosure_lead",
    "level": "A",
    "role": "primary",
    "regionId": "command_center",
    "note": "沈璃在【项目部·样板交底室】围绕「样板确认/精装交底/观感质量」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_sample_disclosure_room",
    "npcId": "contractor_technical_lead",
    "level": "A",
    "role": "support",
    "regionId": "command_center",
    "note": "白雨在【项目部·样板交底室】围绕「质量验收/样板先行/返工闭合」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_sample_disclosure_room",
    "npcId": "finishing_team_lead",
    "level": "B",
    "role": "support",
    "regionId": "command_center",
    "note": "梁装在【项目部·样板交底室】围绕「精装施工/成品保护/观感质量」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "gov_service_center",
    "npcId": "government_window_officer",
    "level": "B",
    "role": "primary",
    "regionId": "approval_regulatory",
    "note": "杜青在【政务服务中心·工程建设项目综合窗口】围绕「审批受理/材料清单/退件补正」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "gov_service_center",
    "npcId": "housing_bureau_officer",
    "level": "A",
    "role": "support",
    "regionId": "approval_regulatory",
    "note": "蒋睿在【政务服务中心·工程建设项目综合窗口】围绕「施工许可/监管备案/竣工手续」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "gov_service_center",
    "npcId": "owner_project_director",
    "level": "S",
    "role": "support",
    "regionId": "approval_regulatory",
    "note": "林知远在【政务服务中心·工程建设项目综合窗口】围绕「主线任务/综合协调/问题闭环」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_dev_reform_window",
    "npcId": "dev_reform_window_officer",
    "level": "B",
    "role": "regulator",
    "regionId": "approval_regulatory",
    "note": "李文博在【发改窗口 / 投资项目审批窗口】围绕「立项备案/投资审批/口径校验」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_dev_reform_window",
    "npcId": "owner_project_director",
    "level": "S",
    "role": "support",
    "regionId": "approval_regulatory",
    "note": "林知远在【发改窗口 / 投资项目审批窗口】围绕「主线任务/综合协调/问题闭环」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_dev_reform_window",
    "npcId": "legal_audit_liaison",
    "level": "C",
    "role": "support",
    "regionId": "approval_regulatory",
    "note": "方砚在【发改窗口 / 投资项目审批窗口】围绕「法审审计/程序风险/证据链」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "gov_natural_resources",
    "npcId": "natural_resources_officer",
    "level": "A",
    "role": "primary",
    "regionId": "approval_regulatory",
    "note": "高启明在【自然资源和规划局】围绕「规划审查/指标校核/方案调整」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "gov_natural_resources",
    "npcId": "design_lead",
    "level": "A",
    "role": "support",
    "regionId": "approval_regulatory",
    "note": "蓝澈在【自然资源和规划局】围绕「设计答疑/方案优化/变更控制」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "gov_natural_resources",
    "npcId": "survey_mapping_engineer",
    "level": "B",
    "role": "support",
    "regionId": "approval_regulatory",
    "note": "何图在【自然资源和规划局】围绕「竣工测绘/规划核实/面积测算」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "gov_housing_construction",
    "npcId": "housing_bureau_officer",
    "level": "A",
    "role": "primary",
    "regionId": "approval_regulatory",
    "note": "蒋睿在【住房城乡建设局】围绕「施工许可/监管备案/竣工手续」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "gov_housing_construction",
    "npcId": "quality_safety_station_officer",
    "level": "A",
    "role": "support",
    "regionId": "approval_regulatory",
    "note": "袁海在【住房城乡建设局】围绕「监督检查/整改销项/通报风险」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "gov_housing_construction",
    "npcId": "completion_filing_officer",
    "level": "B",
    "role": "regulator",
    "regionId": "approval_regulatory",
    "note": "周明远在【住房城乡建设局】围绕「竣工备案/资料一致性/归档」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_quality_safety_station",
    "npcId": "quality_safety_station_officer",
    "level": "A",
    "role": "primary",
    "regionId": "approval_regulatory",
    "note": "袁海在【质量安全监督站】围绕「监督检查/整改销项/通报风险」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_quality_safety_station",
    "npcId": "contractor_safety_quality_lead",
    "level": "A",
    "role": "support",
    "regionId": "approval_regulatory",
    "note": "谢安在【质量安全监督站】围绕「安全检查/隐患整改/应急演练」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_quality_safety_station",
    "npcId": "chief_supervisor",
    "level": "A",
    "role": "support",
    "regionId": "approval_regulatory",
    "note": "魏诚在【质量安全监督站】围绕「监理签认/旁站验收/整改闭合」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_fire_design_review_window",
    "npcId": "fire_design_review_officer",
    "level": "A",
    "role": "primary",
    "regionId": "approval_regulatory",
    "note": "秦霜在【消防设计审查窗口】围绕「消防审查/意见回复/设计合规」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_fire_design_review_window",
    "npcId": "design_lead",
    "level": "A",
    "role": "support",
    "regionId": "approval_regulatory",
    "note": "蓝澈在【消防设计审查窗口】围绕「设计答疑/方案优化/变更控制」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_fire_design_review_window",
    "npcId": "bim_technical_lead",
    "level": "A",
    "role": "support",
    "regionId": "approval_regulatory",
    "note": "秦越在【消防设计审查窗口】围绕「图纸会审/BIM协调/技术方案」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_fire_acceptance_window",
    "npcId": "fire_acceptance_officer",
    "level": "A",
    "role": "primary",
    "regionId": "approval_regulatory",
    "note": "梁瑜在【消防验收窗口】围绕「消防验收/联动测试/整改销项」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_fire_acceptance_window",
    "npcId": "fire_testing_engineer",
    "level": "A",
    "role": "regulator",
    "regionId": "approval_regulatory",
    "note": "苗火在【消防验收窗口】围绕「消防检测/联动测试/报告」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_fire_acceptance_window",
    "npcId": "mep_system_lead",
    "level": "A",
    "role": "support",
    "regionId": "approval_regulatory",
    "note": "江防在【消防验收窗口】围绕「消防系统/水电调试/联动整改」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_civil_defense_window",
    "npcId": "civil_defense_window_officer",
    "level": "B",
    "role": "primary",
    "regionId": "approval_regulatory",
    "note": "贺军在【人防审批窗口】围绕「人防审批/专项验收/资料补齐」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_civil_defense_window",
    "npcId": "design_lead",
    "level": "A",
    "role": "support",
    "regionId": "approval_regulatory",
    "note": "蓝澈在【人防审批窗口】围绕「设计答疑/方案优化/变更控制」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_civil_defense_window",
    "npcId": "supervisor_document_engineer",
    "level": "B",
    "role": "support",
    "regionId": "approval_regulatory",
    "note": "宋倩在【人防审批窗口】围绕「资料报审/隐蔽验收/资料补正」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_ecology_window",
    "npcId": "ecology_window_officer",
    "level": "B",
    "role": "primary",
    "regionId": "approval_regulatory",
    "note": "许萍在【生态环境窗口】围绕「环保审批/扰民投诉/整改回应」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_ecology_window",
    "npcId": "environment_testing_engineer",
    "level": "B",
    "role": "regulator",
    "regionId": "approval_regulatory",
    "note": "靳环在【生态环境窗口】围绕「环境检测/噪声监测/室内空气」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_ecology_window",
    "npcId": "logistics_lane_coordinator",
    "level": "C",
    "role": "support",
    "regionId": "approval_regulatory",
    "note": "牛清在【生态环境窗口】围绕「垃圾清运/文明施工/环保投诉」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_water_drainage_window",
    "npcId": "water_drainage_window_officer",
    "level": "B",
    "role": "primary",
    "regionId": "approval_regulatory",
    "note": "田沐在【水务 / 排水接入窗口】围绕「水务排水/接入方案/市政接口」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_water_drainage_window",
    "npcId": "site_temp_road_officer",
    "level": "B",
    "role": "support",
    "regionId": "approval_regulatory",
    "note": "王水在【水务 / 排水接入窗口】围绕「临水排水/防汛/沉淀池」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_water_drainage_window",
    "npcId": "quality_supervision_officer",
    "level": "B",
    "role": "support",
    "regionId": "approval_regulatory",
    "note": "温泉在【水务 / 排水接入窗口】围绕「给水接入/试压/水压问题」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_municipal_garden_window",
    "npcId": "municipal_garden_window_officer",
    "level": "B",
    "role": "primary",
    "regionId": "approval_regulatory",
    "note": "卢园在【市政园林 / 占道开口窗口】围绕「占道开口/绿化迁改/市政协调」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_municipal_garden_window",
    "npcId": "outdoor_municipal_coordinator",
    "level": "B",
    "role": "support",
    "regionId": "approval_regulatory",
    "note": "管维在【市政园林 / 占道开口窗口】围绕「室外管网/市政接驳/接口协调」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_municipal_garden_window",
    "npcId": "site_fire_lane_officer",
    "level": "C",
    "role": "support",
    "regionId": "approval_regulatory",
    "note": "严保在【市政园林 / 占道开口窗口】围绕「消防车道/通道清障/安全巡查」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_public_resource_center",
    "npcId": "public_resource_center_officer",
    "level": "B",
    "role": "regulator",
    "regionId": "approval_regulatory",
    "note": "钱澈在【公共资源交易中心】围绕「交易流程/开评标/公示节点」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_public_resource_center",
    "npcId": "owner_procurement_lead",
    "level": "A",
    "role": "support",
    "regionId": "approval_regulatory",
    "note": "苏曼在【公共资源交易中心】围绕「招采流程/文件审查/开标组织」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_public_resource_center",
    "npcId": "bidding_agent_lead",
    "level": "B",
    "role": "support",
    "regionId": "approval_regulatory",
    "note": "朱远在【公共资源交易中心】围绕「招标文件/答疑澄清/开评标」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_completion_filing_window",
    "npcId": "completion_filing_officer",
    "level": "B",
    "role": "regulator",
    "regionId": "approval_regulatory",
    "note": "周明远在【竣工验收备案窗口】围绕「竣工备案/资料一致性/归档」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_completion_filing_window",
    "npcId": "owner_archive_manager",
    "level": "B",
    "role": "support",
    "regionId": "approval_regulatory",
    "note": "何静在【竣工验收备案窗口】围绕「资料归档/版本校验/验收资料」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_completion_filing_window",
    "npcId": "supervisor_document_engineer",
    "level": "B",
    "role": "support",
    "regionId": "approval_regulatory",
    "note": "宋倩在【竣工验收备案窗口】围绕「资料报审/隐蔽验收/资料补正」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "third_design_institute",
    "npcId": "design_lead",
    "level": "A",
    "role": "primary",
    "regionId": "professional_service",
    "note": "蓝澈在【设计院】围绕「设计答疑/方案优化/变更控制」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "third_design_institute",
    "npcId": "bim_technical_lead",
    "level": "A",
    "role": "support",
    "regionId": "professional_service",
    "note": "秦越在【设计院】围绕「图纸会审/BIM协调/技术方案」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "third_design_institute",
    "npcId": "fire_design_review_officer",
    "level": "A",
    "role": "support",
    "regionId": "professional_service",
    "note": "秦霜在【设计院】围绕「消防审查/意见回复/设计合规」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_survey_unit",
    "npcId": "survey_unit_lead",
    "level": "B",
    "role": "primary",
    "regionId": "professional_service",
    "note": "韩砚在【勘察单位】围绕「地勘复核/基础风险/补充勘察」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_survey_unit",
    "npcId": "pile_foundation_testing_engineer",
    "level": "B",
    "role": "regulator",
    "regionId": "professional_service",
    "note": "罗启航在【勘察单位】围绕「桩基检测/基坑监测/异常预警」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_survey_unit",
    "npcId": "bim_technical_lead",
    "level": "A",
    "role": "support",
    "regionId": "professional_service",
    "note": "秦越在【勘察单位】围绕「图纸会审/BIM协调/技术方案」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_drawing_review_agency",
    "npcId": "drawing_review_lead",
    "level": "A",
    "role": "primary",
    "regionId": "professional_service",
    "note": "宋审在【施工图审查机构】围绕「图审意见/合规修改/审查闭环」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_drawing_review_agency",
    "npcId": "design_lead",
    "level": "A",
    "role": "support",
    "regionId": "professional_service",
    "note": "蓝澈在【施工图审查机构】围绕「设计答疑/方案优化/变更控制」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_drawing_review_agency",
    "npcId": "housing_bureau_officer",
    "level": "A",
    "role": "support",
    "regionId": "professional_service",
    "note": "蒋睿在【施工图审查机构】围绕「施工许可/监管备案/竣工手续」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "third_cost_consultant",
    "npcId": "cost_consultant_lead",
    "level": "A",
    "role": "primary",
    "regionId": "professional_service",
    "note": "孟乔在【造价咨询公司】围绕「清单控制价/预算审核/成本测算」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "third_cost_consultant",
    "npcId": "owner_cost_contract_lead",
    "level": "A",
    "role": "support",
    "regionId": "professional_service",
    "note": "马衡在【造价咨询公司】围绕「合同边界/签证变更/成本预警」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "third_cost_consultant",
    "npcId": "contractor_business_lead",
    "level": "A",
    "role": "support",
    "regionId": "professional_service",
    "note": "顾言在【造价咨询公司】围绕「计量签证/商务谈判/索赔争议」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_bidding_agent",
    "npcId": "bidding_agent_lead",
    "level": "B",
    "role": "primary",
    "regionId": "professional_service",
    "note": "朱远在【招标代理公司】围绕「招标文件/答疑澄清/开评标」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_bidding_agent",
    "npcId": "owner_procurement_lead",
    "level": "A",
    "role": "support",
    "regionId": "professional_service",
    "note": "苏曼在【招标代理公司】围绕「招采流程/文件审查/开标组织」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_bidding_agent",
    "npcId": "public_resource_center_officer",
    "level": "B",
    "role": "support",
    "regionId": "professional_service",
    "note": "钱澈在【招标代理公司】围绕「交易流程/开评标/公示节点」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_whole_process_consultant",
    "npcId": "whole_process_consultant",
    "level": "A",
    "role": "primary",
    "regionId": "professional_service",
    "note": "方竹在【全过程咨询单位】围绕「全过程统筹/节点策划/风险预警」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_whole_process_consultant",
    "npcId": "owner_project_director",
    "level": "S",
    "role": "support",
    "regionId": "professional_service",
    "note": "林知远在【全过程咨询单位】围绕「主线任务/综合协调/问题闭环」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_whole_process_consultant",
    "npcId": "owner_project_coordinator",
    "level": "A",
    "role": "support",
    "regionId": "professional_service",
    "note": "赵清在【全过程咨询单位】围绕「计划管理/会议纪要/催办闭环」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_engineering_supervisor",
    "npcId": "chief_supervisor",
    "level": "A",
    "role": "primary",
    "regionId": "professional_service",
    "note": "魏诚在【工程监理单位】围绕「监理签认/旁站验收/整改闭合」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_engineering_supervisor",
    "npcId": "supervisor_engineer",
    "level": "B",
    "role": "support",
    "regionId": "professional_service",
    "note": "叶宁在【工程监理单位】围绕「专业巡查/见证取样/工序验收」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_engineering_supervisor",
    "npcId": "quality_safety_station_officer",
    "level": "A",
    "role": "regulator",
    "regionId": "professional_service",
    "note": "袁海在【工程监理单位】围绕「监督检查/整改销项/通报风险」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "third_testing_center",
    "npcId": "material_testing_engineer",
    "level": "B",
    "role": "primary",
    "regionId": "professional_service",
    "note": "段明在【材料检测机构】围绕「材料检测/报告复核/不合格处置」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "third_testing_center",
    "npcId": "contractor_material_equipment_lead",
    "level": "B",
    "role": "support",
    "regionId": "professional_service",
    "note": "孙泽在【材料检测机构】围绕「材料计划/进场验收/设备管理」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "third_testing_center",
    "npcId": "supervisor_engineer",
    "level": "B",
    "role": "support",
    "regionId": "professional_service",
    "note": "叶宁在【材料检测机构】围绕「专业巡查/见证取样/工序验收」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_pile_foundation_testing",
    "npcId": "pile_foundation_testing_engineer",
    "level": "B",
    "role": "primary",
    "regionId": "professional_service",
    "note": "罗启航在【桩基 / 基坑检测机构】围绕「桩基检测/基坑监测/异常预警」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_pile_foundation_testing",
    "npcId": "survey_unit_lead",
    "level": "B",
    "role": "support",
    "regionId": "professional_service",
    "note": "韩砚在【桩基 / 基坑检测机构】围绕「地勘复核/基础风险/补充勘察」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_pile_foundation_testing",
    "npcId": "quality_safety_station_officer",
    "level": "A",
    "role": "regulator",
    "regionId": "professional_service",
    "note": "袁海在【桩基 / 基坑检测机构】围绕「监督检查/整改销项/通报风险」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_settlement_monitoring_unit",
    "npcId": "settlement_monitoring_engineer",
    "level": "B",
    "role": "primary",
    "regionId": "professional_service",
    "note": "常观在【沉降观测 / 基坑监测单位】围绕「沉降观测/趋势分析/预警」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_settlement_monitoring_unit",
    "npcId": "pile_foundation_testing_engineer",
    "level": "B",
    "role": "support",
    "regionId": "professional_service",
    "note": "罗启航在【沉降观测 / 基坑监测单位】围绕「桩基检测/基坑监测/异常预警」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_settlement_monitoring_unit",
    "npcId": "contractor_safety_quality_lead",
    "level": "A",
    "role": "support",
    "regionId": "professional_service",
    "note": "谢安在【沉降观测 / 基坑监测单位】围绕「安全检查/隐患整改/应急演练」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_fire_testing_agency",
    "npcId": "fire_testing_engineer",
    "level": "A",
    "role": "primary",
    "regionId": "professional_service",
    "note": "苗火在【消防检测机构】围绕「消防检测/联动测试/报告」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_fire_testing_agency",
    "npcId": "mep_system_lead",
    "level": "A",
    "role": "support",
    "regionId": "professional_service",
    "note": "江防在【消防检测机构】围绕「消防系统/水电调试/联动整改」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_fire_testing_agency",
    "npcId": "fire_acceptance_officer",
    "level": "A",
    "role": "regulator",
    "regionId": "professional_service",
    "note": "梁瑜在【消防检测机构】围绕「消防验收/联动测试/整改销项」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_environment_testing_agency",
    "npcId": "environment_testing_engineer",
    "level": "B",
    "role": "primary",
    "regionId": "professional_service",
    "note": "靳环在【环境检测机构】围绕「环境检测/噪声监测/室内空气」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_environment_testing_agency",
    "npcId": "ecology_window_officer",
    "level": "B",
    "role": "support",
    "regionId": "professional_service",
    "note": "许萍在【环境检测机构】围绕「环保审批/扰民投诉/整改回应」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_environment_testing_agency",
    "npcId": "site_living_area_manager",
    "level": "B",
    "role": "support",
    "regionId": "professional_service",
    "note": "温洁在【环境检测机构】围绕「保洁环境/垃圾协调/品质巡查」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_green_building_consultant",
    "npcId": "green_building_consultant",
    "level": "B",
    "role": "primary",
    "regionId": "professional_service",
    "note": "林绿在【节能 / 绿建咨询单位】围绕「节能绿建/专项资料/验收咨询」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_green_building_consultant",
    "npcId": "design_lead",
    "level": "A",
    "role": "support",
    "regionId": "professional_service",
    "note": "蓝澈在【节能 / 绿建咨询单位】围绕「设计答疑/方案优化/变更控制」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_green_building_consultant",
    "npcId": "completion_filing_officer",
    "level": "B",
    "role": "regulator",
    "regionId": "professional_service",
    "note": "周明远在【节能 / 绿建咨询单位】围绕「竣工备案/资料一致性/归档」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_survey_mapping_unit",
    "npcId": "survey_mapping_engineer",
    "level": "B",
    "role": "primary",
    "regionId": "professional_service",
    "note": "何图在【测绘单位】围绕「竣工测绘/规划核实/面积测算」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_survey_mapping_unit",
    "npcId": "natural_resources_officer",
    "level": "A",
    "role": "support",
    "regionId": "professional_service",
    "note": "高启明在【测绘单位】围绕「规划审查/指标校核/方案调整」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_survey_mapping_unit",
    "npcId": "completion_filing_officer",
    "level": "B",
    "role": "regulator",
    "regionId": "professional_service",
    "note": "周明远在【测绘单位】围绕「竣工备案/资料一致性/归档」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_audit_settlement_unit",
    "npcId": "audit_settlement_officer",
    "level": "A",
    "role": "primary",
    "regionId": "professional_service",
    "note": "严审在【审计结算单位】围绕「结算审计/争议复核/成本核减」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_audit_settlement_unit",
    "npcId": "owner_cost_contract_lead",
    "level": "A",
    "role": "support",
    "regionId": "professional_service",
    "note": "马衡在【审计结算单位】围绕「合同边界/签证变更/成本预警」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_audit_settlement_unit",
    "npcId": "contractor_business_lead",
    "level": "A",
    "role": "support",
    "regionId": "professional_service",
    "note": "顾言在【审计结算单位】围绕「计量签证/商务谈判/索赔争议」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_special_consultant",
    "npcId": "special_consultant",
    "level": "A",
    "role": "primary",
    "regionId": "professional_service",
    "note": "季临在【专项顾问单位】围绕「专项诊断/专家意见/方案比选」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_special_consultant",
    "npcId": "owner_project_director",
    "level": "S",
    "role": "support",
    "regionId": "professional_service",
    "note": "林知远在【专项顾问单位】围绕「主线任务/综合协调/问题闭环」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_special_consultant",
    "npcId": "design_lead",
    "level": "A",
    "role": "support",
    "regionId": "professional_service",
    "note": "蓝澈在【专项顾问单位】围绕「设计答疑/方案优化/变更控制」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_main_gate",
    "npcId": "site_main_gate_officer",
    "level": "C",
    "role": "primary",
    "regionId": "construction_site",
    "note": "马卫在【施工现场·主大门】围绕「门禁实名/访客登记/异常拦截」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_main_gate",
    "npcId": "site_vehicle_wash_officer",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "何机在【施工现场·主大门】围绕「车辆调度/机械协调/物流冲突」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_main_gate",
    "npcId": "contractor_safety_quality_lead",
    "level": "A",
    "role": "regulator",
    "regionId": "construction_site",
    "note": "谢安在【施工现场·主大门】围绕「安全检查/隐患整改/应急演练」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_realname_channel",
    "npcId": "site_main_gate_officer",
    "level": "C",
    "role": "primary",
    "regionId": "construction_site",
    "note": "马卫在【施工现场·门卫实名制通道】围绕「门禁实名/访客登记/异常拦截」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_realname_channel",
    "npcId": "labor_realname_officer",
    "level": "B",
    "role": "regulator",
    "regionId": "construction_site",
    "note": "胡勇在【施工现场·门卫实名制通道】围绕「实名制/考勤/劳务风险」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_realname_channel",
    "npcId": "contractor_safety_quality_lead",
    "level": "A",
    "role": "support",
    "regionId": "construction_site",
    "note": "谢安在【施工现场·门卫实名制通道】围绕「安全检查/隐患整改/应急演练」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_vehicle_wash",
    "npcId": "site_vehicle_wash_officer",
    "level": "B",
    "role": "primary",
    "regionId": "construction_site",
    "note": "何机在【施工现场·车辆冲洗区】围绕「车辆调度/机械协调/物流冲突」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_vehicle_wash",
    "npcId": "site_temp_road_officer",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "王水在【施工现场·车辆冲洗区】围绕「临水排水/防汛/沉淀池」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_vehicle_wash",
    "npcId": "ecology_window_officer",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "许萍在【施工现场·车辆冲洗区】围绕「环保审批/扰民投诉/整改回应」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_temp_road",
    "npcId": "site_vehicle_wash_officer",
    "level": "B",
    "role": "primary",
    "regionId": "construction_site",
    "note": "何机在【施工现场·临时道路】围绕「车辆调度/机械协调/物流冲突」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_temp_road",
    "npcId": "site_fire_lane_officer",
    "level": "C",
    "role": "support",
    "regionId": "construction_site",
    "note": "严保在【施工现场·临时道路】围绕「消防车道/通道清障/安全巡查」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_temp_road",
    "npcId": "contractor_production_manager",
    "level": "A",
    "role": "support",
    "regionId": "construction_site",
    "note": "罗志强在【施工现场·临时道路】围绕「施工组织/穿插计划/抢工安排」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_fire_lane",
    "npcId": "site_fire_lane_officer",
    "level": "C",
    "role": "primary",
    "regionId": "construction_site",
    "note": "严保在【施工现场·消防通道】围绕「消防车道/通道清障/安全巡查」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_fire_lane",
    "npcId": "contractor_safety_quality_lead",
    "level": "A",
    "role": "support",
    "regionId": "construction_site",
    "note": "谢安在【施工现场·消防通道】围绕「安全检查/隐患整改/应急演练」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_fire_lane",
    "npcId": "fire_acceptance_officer",
    "level": "A",
    "role": "regulator",
    "regionId": "construction_site",
    "note": "梁瑜在【施工现场·消防通道】围绕「消防验收/联动测试/整改销项」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_temp_power",
    "npcId": "temp_utilities_officer",
    "level": "B",
    "role": "primary",
    "regionId": "construction_site",
    "note": "赵电在【施工现场·临电配电房】围绕「临电巡检/用电安全/整改」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_temp_power",
    "npcId": "contractor_safety_quality_lead",
    "level": "A",
    "role": "support",
    "regionId": "construction_site",
    "note": "谢安在【施工现场·临电配电房】围绕「安全检查/隐患整改/应急演练」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_temp_power",
    "npcId": "supervisor_engineer",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "叶宁在【施工现场·临电配电房】围绕「专业巡查/见证取样/工序验收」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_temp_water",
    "npcId": "site_temp_road_officer",
    "level": "B",
    "role": "primary",
    "regionId": "construction_site",
    "note": "王水在【施工现场·临水泵房】围绕「临水排水/防汛/沉淀池」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_temp_water",
    "npcId": "quality_supervision_officer",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "温泉在【施工现场·临水泵房】围绕「给水接入/试压/水压问题」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_temp_water",
    "npcId": "contractor_safety_quality_lead",
    "level": "A",
    "role": "support",
    "regionId": "construction_site",
    "note": "谢安在【施工现场·临水泵房】围绕「安全检查/隐患整改/应急演练」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_rain_sewage_pipe",
    "npcId": "site_temp_road_officer",
    "level": "B",
    "role": "primary",
    "regionId": "construction_site",
    "note": "王水在【施工现场·沉淀池 / 排水沟】围绕「临水排水/防汛/沉淀池」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_rain_sewage_pipe",
    "npcId": "ecology_window_officer",
    "level": "B",
    "role": "regulator",
    "regionId": "construction_site",
    "note": "许萍在【施工现场·沉淀池 / 排水沟】围绕「环保审批/扰民投诉/整改回应」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_rain_sewage_pipe",
    "npcId": "logistics_lane_coordinator",
    "level": "C",
    "role": "support",
    "regionId": "construction_site",
    "note": "牛清在【施工现场·沉淀池 / 排水沟】围绕「垃圾清运/文明施工/环保投诉」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_fire_lane",
    "npcId": "site_safety_officer",
    "level": "C",
    "role": "primary",
    "regionId": "construction_site",
    "note": "申安在【施工现场·安全体验区】围绕「安全教育/文明施工/交底」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_fire_lane",
    "npcId": "contractor_safety_quality_lead",
    "level": "A",
    "role": "primary",
    "regionId": "construction_site",
    "note": "谢安在【施工现场·安全体验区】围绕「安全检查/隐患整改/应急演练」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_fire_lane",
    "npcId": "labor_realname_officer",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "胡勇在【施工现场·安全体验区】围绕「实名制/考勤/劳务风险」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_main_gate",
    "npcId": "site_safety_officer",
    "level": "C",
    "role": "primary",
    "regionId": "construction_site",
    "note": "申安在【施工现场·五牌一图展示区】围绕「安全教育/文明施工/交底」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_main_gate",
    "npcId": "owner_project_coordinator",
    "level": "A",
    "role": "support",
    "regionId": "construction_site",
    "note": "赵清在【施工现场·五牌一图展示区】围绕「计划管理/会议纪要/催办闭环」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_main_gate",
    "npcId": "quality_safety_station_officer",
    "level": "A",
    "role": "support",
    "regionId": "construction_site",
    "note": "袁海在【施工现场·五牌一图展示区】围绕「监督检查/整改销项/通报风险」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_project_office_building",
    "npcId": "contractor_project_manager",
    "level": "S",
    "role": "primary",
    "regionId": "construction_site",
    "note": "陈建峰在【施工现场·现场办公室】围绕「生产统筹/资源调配/总包协调」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_project_office_building",
    "npcId": "contractor_production_manager",
    "level": "A",
    "role": "primary",
    "regionId": "construction_site",
    "note": "罗志强在【施工现场·现场办公室】围绕「施工组织/穿插计划/抢工安排」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_project_office_building",
    "npcId": "supervisor_document_engineer",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "宋倩在【施工现场·现场办公室】围绕「资料报审/隐蔽验收/资料补正」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_worker_dorm",
    "npcId": "site_office_admin",
    "level": "B",
    "role": "primary",
    "regionId": "construction_site",
    "note": "丁勤在【施工现场·工人生活区】围绕「后勤保障/生活区管理/突发应急」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_worker_dorm",
    "npcId": "labor_realname_officer",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "胡勇在【施工现场·工人生活区】围绕「实名制/考勤/劳务风险」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_worker_dorm",
    "npcId": "contractor_safety_quality_lead",
    "level": "A",
    "role": "support",
    "regionId": "construction_site",
    "note": "谢安在【施工现场·工人生活区】围绕「安全检查/隐患整改/应急演练」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_canteen_market",
    "npcId": "site_office_admin",
    "level": "B",
    "role": "primary",
    "regionId": "construction_site",
    "note": "丁勤在【施工现场·食堂】围绕「后勤保障/生活区管理/突发应急」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_canteen_market",
    "npcId": "contractor_safety_quality_lead",
    "level": "A",
    "role": "support",
    "regionId": "construction_site",
    "note": "谢安在【施工现场·食堂】围绕「安全检查/隐患整改/应急演练」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_canteen_market",
    "npcId": "site_living_area_manager",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "温洁在【施工现场·食堂】围绕「保洁环境/垃圾协调/品质巡查」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_medical_room",
    "npcId": "site_office_admin",
    "level": "B",
    "role": "primary",
    "regionId": "construction_site",
    "note": "丁勤在【施工现场·医务 / 应急点】围绕「后勤保障/生活区管理/突发应急」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_medical_room",
    "npcId": "contractor_safety_quality_lead",
    "level": "A",
    "role": "support",
    "regionId": "construction_site",
    "note": "谢安在【施工现场·医务 / 应急点】围绕「安全检查/隐患整改/应急演练」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_medical_room",
    "npcId": "site_safety_officer",
    "level": "C",
    "role": "support",
    "regionId": "construction_site",
    "note": "申安在【施工现场·医务 / 应急点】围绕「安全教育/文明施工/交底」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_material_yard",
    "npcId": "site_material_yard_manager",
    "level": "B",
    "role": "primary",
    "regionId": "construction_site",
    "note": "孙仓在【施工现场·材料仓库】围绕「仓库台账/领料控制/库存预警」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_material_yard",
    "npcId": "contractor_material_equipment_lead",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "孙泽在【施工现场·材料仓库】围绕「材料计划/进场验收/设备管理」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_material_yard",
    "npcId": "supervisor_engineer",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "叶宁在【施工现场·材料仓库】围绕「专业巡查/见证取样/工序验收」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_material_yard",
    "npcId": "site_medical_officer",
    "level": "C",
    "role": "primary",
    "regionId": "construction_site",
    "note": "沈危在【施工现场·危化品库】围绕「危化品管理/消防隐患/专项整改」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_material_yard",
    "npcId": "contractor_safety_quality_lead",
    "level": "A",
    "role": "support",
    "regionId": "construction_site",
    "note": "谢安在【施工现场·危化品库】围绕「安全检查/隐患整改/应急演练」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_material_yard",
    "npcId": "fire_acceptance_officer",
    "level": "A",
    "role": "regulator",
    "regionId": "construction_site",
    "note": "梁瑜在【施工现场·危化品库】围绕「消防验收/联动测试/整改销项」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_rebar_processing",
    "npcId": "site_rebar_processing_lead",
    "level": "B",
    "role": "primary",
    "regionId": "construction_site",
    "note": "张钢在【施工现场·钢筋加工棚】围绕「钢筋加工/班组协调/质量返工」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_rebar_processing",
    "npcId": "contractor_technical_lead",
    "level": "A",
    "role": "support",
    "regionId": "construction_site",
    "note": "白雨在【施工现场·钢筋加工棚】围绕「质量验收/样板先行/返工闭合」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_rebar_processing",
    "npcId": "material_testing_engineer",
    "level": "B",
    "role": "regulator",
    "regionId": "construction_site",
    "note": "段明在【施工现场·钢筋加工棚】围绕「材料检测/报告复核/不合格处置」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_carpentry_processing",
    "npcId": "site_carpentry_lead",
    "level": "B",
    "role": "primary",
    "regionId": "construction_site",
    "note": "木林在【施工现场·木工加工棚】围绕「模板加工/木料防火/支模质量」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_carpentry_processing",
    "npcId": "contractor_safety_quality_lead",
    "level": "A",
    "role": "support",
    "regionId": "construction_site",
    "note": "谢安在【施工现场·木工加工棚】围绕「安全检查/隐患整改/应急演练」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_carpentry_processing",
    "npcId": "site_fire_lane_officer",
    "level": "C",
    "role": "support",
    "regionId": "construction_site",
    "note": "严保在【施工现场·木工加工棚】围绕「消防车道/通道清障/安全巡查」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_mep_processing",
    "npcId": "site_mep_processing_lead",
    "level": "A",
    "role": "primary",
    "regionId": "construction_site",
    "note": "余成电在【施工现场·机电加工区】围绕「机电安装/管线综合/系统调试」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_mep_processing",
    "npcId": "bim_technical_lead",
    "level": "A",
    "role": "support",
    "regionId": "construction_site",
    "note": "秦越在【施工现场·机电加工区】围绕「图纸会审/BIM协调/技术方案」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_mep_processing",
    "npcId": "supervisor_engineer",
    "level": "B",
    "role": "regulator",
    "regionId": "construction_site",
    "note": "叶宁在【施工现场·机电加工区】围绕「专业巡查/见证取样/工序验收」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_material_yard",
    "npcId": "engineering_supervisor_lead",
    "level": "B",
    "role": "primary",
    "regionId": "construction_site",
    "note": "罗幕在【施工现场·幕墙材料堆场】围绕「幕墙施工/吊装协调/外立面收口」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_material_yard",
    "npcId": "finishing_team_lead",
    "level": "B",
    "role": "primary",
    "regionId": "construction_site",
    "note": "梁装在【施工现场·精装材料堆场】围绕「精装施工/成品保护/观感质量」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_material_yard",
    "npcId": "sample_disclosure_lead",
    "level": "A",
    "role": "support",
    "regionId": "construction_site",
    "note": "沈璃在【施工现场·精装材料堆场】围绕「样板确认/精装交底/观感质量」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_material_yard",
    "npcId": "site_material_yard_manager",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "孙仓在【施工现场·精装材料堆场】围绕「仓库台账/领料控制/库存预警」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_equipment_yard",
    "npcId": "site_unloading_dispatcher",
    "level": "B",
    "role": "primary",
    "regionId": "construction_site",
    "note": "费衡在【施工现场·周转材料堆场】围绕「周转材料/损耗控制/调配」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_equipment_yard",
    "npcId": "site_vehicle_wash_officer",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "何机在【施工现场·周转材料堆场】围绕「车辆调度/机械协调/物流冲突」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_equipment_yard",
    "npcId": "contractor_business_lead",
    "level": "A",
    "role": "support",
    "regionId": "construction_site",
    "note": "顾言在【施工现场·周转材料堆场】围绕「计量签证/商务谈判/索赔争议」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_equipment_yard",
    "npcId": "site_equipment_yard_manager",
    "level": "B",
    "role": "primary",
    "regionId": "construction_site",
    "note": "许设在【施工现场·设备堆场】围绕「设备验收/台账/维保」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_equipment_yard",
    "npcId": "contractor_material_equipment_lead",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "孙泽在【施工现场·设备堆场】围绕「材料计划/进场验收/设备管理」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_equipment_yard",
    "npcId": "site_mep_processing_lead",
    "level": "A",
    "role": "support",
    "regionId": "construction_site",
    "note": "余成电在【施工现场·设备堆场】围绕「机电安装/管线综合/系统调试」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_unloading_zone",
    "npcId": "logistics_lane_coordinator",
    "level": "C",
    "role": "primary",
    "regionId": "construction_site",
    "note": "牛清在【施工现场·垃圾集中堆放点】围绕「垃圾清运/文明施工/环保投诉」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_unloading_zone",
    "npcId": "site_living_area_manager",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "温洁在【施工现场·垃圾集中堆放点】围绕「保洁环境/垃圾协调/品质巡查」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_unloading_zone",
    "npcId": "ecology_window_officer",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "许萍在【施工现场·垃圾集中堆放点】围绕「环保审批/扰民投诉/整改回应」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_b2",
    "npcId": "floor_construction_worker",
    "level": "A",
    "role": "primary",
    "regionId": "construction_site",
    "note": "周栋在【楼栋·地下二层 B2】围绕「楼栋推进/工序穿插/现场协调」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_b2",
    "npcId": "mep_system_lead",
    "level": "A",
    "role": "support",
    "regionId": "construction_site",
    "note": "江防在【楼栋·地下二层 B2】围绕「消防系统/水电调试/联动整改」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_b2",
    "npcId": "hvac_room_engineer",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "黄暖在【楼栋·地下二层 B2】围绕「暖通安装/风量调试/设备运行」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "site_b1_mep_corridor",
    "npcId": "floor_construction_worker",
    "level": "A",
    "role": "primary",
    "regionId": "construction_site",
    "note": "周栋在【楼栋·地下一层 B1】围绕「楼栋推进/工序穿插/现场协调」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "site_b1_mep_corridor",
    "npcId": "parking_lot_manager",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "裴车在【楼栋·地下一层 B1】围绕「停车系统/道闸调试/车流组织」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "site_b1_mep_corridor",
    "npcId": "site_mep_processing_lead",
    "level": "A",
    "role": "support",
    "regionId": "construction_site",
    "note": "余成电在【楼栋·地下一层 B1】围绕「机电安装/管线综合/系统调试」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "site_l1_commercial_street",
    "npcId": "floor_construction_worker",
    "level": "A",
    "role": "primary",
    "regionId": "construction_site",
    "note": "周栋在【楼栋·首层 1F】围绕「楼栋推进/工序穿插/现场协调」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "site_l1_commercial_street",
    "npcId": "finishing_team_lead",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "梁装在【楼栋·首层 1F】围绕「精装施工/成品保护/观感质量」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "site_l1_commercial_street",
    "npcId": "fire_acceptance_officer",
    "level": "A",
    "role": "regulator",
    "regionId": "construction_site",
    "note": "梁瑜在【楼栋·首层 1F】围绕「消防验收/联动测试/整改销项」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_2f",
    "npcId": "floor_construction_worker",
    "level": "A",
    "role": "primary",
    "regionId": "construction_site",
    "note": "周栋在【楼栋·商业二层 2F】围绕「楼栋推进/工序穿插/现场协调」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_2f",
    "npcId": "finishing_team_lead",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "梁装在【楼栋·商业二层 2F】围绕「精装施工/成品保护/观感质量」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_2f",
    "npcId": "sample_disclosure_lead",
    "level": "A",
    "role": "support",
    "regionId": "construction_site",
    "note": "沈璃在【楼栋·商业二层 2F】围绕「样板确认/精装交底/观感质量」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_3f",
    "npcId": "floor_construction_worker",
    "level": "A",
    "role": "primary",
    "regionId": "construction_site",
    "note": "周栋在【楼栋·商业三层 3F】围绕「楼栋推进/工序穿插/现场协调」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_3f",
    "npcId": "finishing_team_lead",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "梁装在【楼栋·商业三层 3F】围绕「精装施工/成品保护/观感质量」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_3f",
    "npcId": "site_mep_processing_lead",
    "level": "A",
    "role": "support",
    "regionId": "construction_site",
    "note": "余成电在【楼栋·商业三层 3F】围绕「机电安装/管线综合/系统调试」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_5f",
    "npcId": "floor_construction_worker",
    "level": "A",
    "role": "primary",
    "regionId": "construction_site",
    "note": "周栋在【楼栋·标准层】围绕「楼栋推进/工序穿插/现场协调」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_5f",
    "npcId": "sample_disclosure_lead",
    "level": "A",
    "role": "support",
    "regionId": "construction_site",
    "note": "沈璃在【楼栋·标准层】围绕「样板确认/精装交底/观感质量」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_5f",
    "npcId": "contractor_technical_lead",
    "level": "A",
    "role": "support",
    "regionId": "construction_site",
    "note": "白雨在【楼栋·标准层】围绕「质量验收/样板先行/返工闭合」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_b1",
    "npcId": "site_mep_processing_lead",
    "level": "A",
    "role": "primary",
    "regionId": "construction_site",
    "note": "余成电在【楼栋·设备层】围绕「机电安装/管线综合/系统调试」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_b1",
    "npcId": "hvac_room_engineer",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "黄暖在【楼栋·设备层】围绕「暖通安装/风量调试/设备运行」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_b1",
    "npcId": "fire_pump_room_engineer",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "田梯在【楼栋·设备层】围绕「电梯安装/厂家调试/移交条件」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_roof_floor",
    "npcId": "floor_construction_worker",
    "level": "A",
    "role": "primary",
    "regionId": "construction_site",
    "note": "周栋在【楼栋·屋面层】围绕「楼栋推进/工序穿插/现场协调」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_roof_floor",
    "npcId": "contractor_technical_lead",
    "level": "A",
    "role": "support",
    "regionId": "construction_site",
    "note": "白雨在【楼栋·屋面层】围绕「质量验收/样板先行/返工闭合」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_roof_floor",
    "npcId": "hvac_room_engineer",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "黄暖在【楼栋·屋面层】围绕「暖通安装/风量调试/设备运行」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_atrium",
    "npcId": "engineering_supervisor_lead",
    "level": "B",
    "role": "primary",
    "regionId": "construction_site",
    "note": "罗幕在【楼栋·外立面】围绕「幕墙施工/吊装协调/外立面收口」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_atrium",
    "npcId": "contractor_safety_quality_lead",
    "level": "A",
    "role": "support",
    "regionId": "construction_site",
    "note": "谢安在【楼栋·外立面】围绕「安全检查/隐患整改/应急演练」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_atrium",
    "npcId": "parking_lot_manager",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "裴车在【楼栋·外立面】围绕「停车系统/道闸调试/车流组织」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_strong_power_shaft",
    "npcId": "site_mep_processing_lead",
    "level": "A",
    "role": "primary",
    "regionId": "construction_site",
    "note": "余成电在【机电·强电井】围绕「机电安装/管线综合/系统调试」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_strong_power_shaft",
    "npcId": "temp_utilities_officer",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "赵电在【机电·强电井】围绕「临电巡检/用电安全/整改」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_strong_power_shaft",
    "npcId": "supervisor_engineer",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "叶宁在【机电·强电井】围绕「专业巡查/见证取样/工序验收」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_weak_power_shaft",
    "npcId": "site_mep_processing_lead",
    "level": "A",
    "role": "primary",
    "regionId": "construction_site",
    "note": "余成电在【机电·弱电井】围绕「机电安装/管线综合/系统调试」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_weak_power_shaft",
    "npcId": "site_realname_officer",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "程信在【机电·弱电井】围绕「通信接入/弱电接口/运营商协调」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_weak_power_shaft",
    "npcId": "smart_weak_current_manager",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "罗智在【机电·弱电井】围绕「智能化运维/弱电中控/系统联调」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_hvac_room",
    "npcId": "site_mep_processing_lead",
    "level": "A",
    "role": "primary",
    "regionId": "construction_site",
    "note": "余成电在【机电·水管井】围绕「机电安装/管线综合/系统调试」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_hvac_room",
    "npcId": "site_temp_road_officer",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "王水在【机电·水管井】围绕「临水排水/防汛/沉淀池」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_hvac_room",
    "npcId": "quality_supervision_officer",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "温泉在【机电·水管井】围绕「给水接入/试压/水压问题」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_hvac_room",
    "npcId": "hvac_room_engineer",
    "level": "B",
    "role": "primary",
    "regionId": "construction_site",
    "note": "黄暖在【机电·风管区】围绕「暖通安装/风量调试/设备运行」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_hvac_room",
    "npcId": "bim_technical_lead",
    "level": "A",
    "role": "support",
    "regionId": "construction_site",
    "note": "秦越在【机电·风管区】围绕「图纸会审/BIM协调/技术方案」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_hvac_room",
    "npcId": "supervisor_engineer",
    "level": "B",
    "role": "regulator",
    "regionId": "construction_site",
    "note": "叶宁在【机电·风管区】围绕「专业巡查/见证取样/工序验收」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_transformer_room",
    "npcId": "site_mep_processing_lead",
    "level": "A",
    "role": "primary",
    "regionId": "construction_site",
    "note": "余成电在【机电·变配电室】围绕「机电安装/管线综合/系统调试」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_transformer_room",
    "npcId": "subcontractor_lead",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "邓国强在【机电·变配电室】围绕「电力接入/送电计划/报装」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_transformer_room",
    "npcId": "temp_utilities_officer",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "赵电在【机电·变配电室】围绕「临电巡检/用电安全/整改」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_transformer_room",
    "npcId": "site_equipment_yard_manager",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "许设在【机电·柴油发电机房】围绕「设备验收/台账/维保」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_transformer_room",
    "npcId": "contractor_safety_quality_lead",
    "level": "A",
    "role": "support",
    "regionId": "construction_site",
    "note": "谢安在【机电·柴油发电机房】围绕「安全检查/隐患整改/应急演练」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "site_fire_pump_room",
    "npcId": "mep_system_lead",
    "level": "A",
    "role": "primary",
    "regionId": "construction_site",
    "note": "江防在【机电·消防泵房】围绕「消防系统/水电调试/联动整改」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "site_fire_pump_room",
    "npcId": "fire_testing_engineer",
    "level": "A",
    "role": "regulator",
    "regionId": "construction_site",
    "note": "苗火在【机电·消防泵房】围绕「消防检测/联动测试/报告」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "site_fire_pump_room",
    "npcId": "fire_acceptance_officer",
    "level": "A",
    "role": "regulator",
    "regionId": "construction_site",
    "note": "梁瑜在【机电·消防泵房】围绕「消防验收/联动测试/整改销项」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "site_fire_pump_room",
    "npcId": "site_temp_road_officer",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "王水在【机电·消防水池】围绕「临水排水/防汛/沉淀池」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "site_fire_pump_room",
    "npcId": "quality_supervision_officer",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "温泉在【机电·消防水池】围绕「给水接入/试压/水压问题」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_fire_control_room",
    "npcId": "fire_control_room_officer",
    "level": "A",
    "role": "primary",
    "regionId": "construction_site",
    "note": "叶青在【机电·消防控制室】围绕「消防值守/报警处理/联动测试」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_fire_control_room",
    "npcId": "mep_system_lead",
    "level": "A",
    "role": "support",
    "regionId": "construction_site",
    "note": "江防在【机电·消防控制室】围绕「消防系统/水电调试/联动整改」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_fire_control_room",
    "npcId": "fire_acceptance_officer",
    "level": "A",
    "role": "regulator",
    "regionId": "construction_site",
    "note": "梁瑜在【机电·消防控制室】围绕「消防验收/联动测试/整改销项」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_hvac_room",
    "npcId": "site_mep_processing_lead",
    "level": "A",
    "role": "support",
    "regionId": "construction_site",
    "note": "余成电在【机电·暖通机房】围绕「机电安装/管线综合/系统调试」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_hvac_room",
    "npcId": "fire_testing_engineer",
    "level": "A",
    "role": "regulator",
    "regionId": "construction_site",
    "note": "苗火在【机电·暖通机房】围绕「消防检测/联动测试/报告」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_hvac_room",
    "npcId": "fire_pump_room_engineer",
    "level": "B",
    "role": "primary",
    "regionId": "construction_site",
    "note": "田梯在【机电·电梯机房】围绕「电梯安装/厂家调试/移交条件」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_hvac_room",
    "npcId": "quality_supervision_officer",
    "level": "B",
    "role": "primary",
    "regionId": "construction_site",
    "note": "温泉在【机电·生活水泵房】围绕「给水接入/试压/水压问题」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_hvac_room",
    "npcId": "property_engineering_manager",
    "level": "A",
    "role": "support",
    "regionId": "construction_site",
    "note": "郝工在【机电·生活水泵房】围绕「物业接管/设备移交/缺陷销项」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_rain_sewage_pipe",
    "npcId": "outdoor_municipal_coordinator",
    "level": "B",
    "role": "primary",
    "regionId": "construction_site",
    "note": "管维在【室外·雨污水管网】围绕「室外管网/市政接驳/接口协调」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_rain_sewage_pipe",
    "npcId": "site_temp_road_officer",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "王水在【室外·雨污水管网】围绕「临水排水/防汛/沉淀池」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_rain_sewage_pipe",
    "npcId": "water_drainage_window_officer",
    "level": "B",
    "role": "regulator",
    "regionId": "construction_site",
    "note": "田沐在【室外·雨污水管网】围绕「水务排水/接入方案/市政接口」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_temp_water",
    "npcId": "quality_supervision_officer",
    "level": "B",
    "role": "primary",
    "regionId": "construction_site",
    "note": "温泉在【室外·给水接驳点】围绕「给水接入/试压/水压问题」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_temp_water",
    "npcId": "outdoor_municipal_coordinator",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "管维在【室外·给水接驳点】围绕「室外管网/市政接驳/接口协调」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_temp_water",
    "npcId": "water_drainage_window_officer",
    "level": "B",
    "role": "regulator",
    "regionId": "construction_site",
    "note": "田沐在【室外·给水接驳点】围绕「水务排水/接入方案/市政接口」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_temp_power",
    "npcId": "subcontractor_lead",
    "level": "B",
    "role": "primary",
    "regionId": "construction_site",
    "note": "邓国强在【室外·电力接驳点】围绕「电力接入/送电计划/报装」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_temp_power",
    "npcId": "site_mep_processing_lead",
    "level": "A",
    "role": "support",
    "regionId": "construction_site",
    "note": "余成电在【室外·电力接驳点】围绕「机电安装/管线综合/系统调试」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_temp_power",
    "npcId": "temp_utilities_officer",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "赵电在【室外·电力接驳点】围绕「临电巡检/用电安全/整改」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_temp_power",
    "npcId": "supplier_representative",
    "level": "C",
    "role": "primary",
    "regionId": "construction_site",
    "note": "冯燃在【室外·燃气接驳点】围绕「燃气接驳/安全审查/外线协调」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_temp_power",
    "npcId": "outdoor_municipal_coordinator",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "管维在【室外·燃气接驳点】围绕「室外管网/市政接驳/接口协调」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_temp_power",
    "npcId": "site_realname_officer",
    "level": "B",
    "role": "primary",
    "regionId": "construction_site",
    "note": "程信在【室外·通信接入点】围绕「通信接入/弱电接口/运营商协调」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_temp_power",
    "npcId": "smart_weak_current_manager",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "罗智在【室外·通信接入点】围绕「智能化运维/弱电中控/系统联调」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_atrium",
    "npcId": "parking_lot_manager",
    "level": "B",
    "role": "primary",
    "regionId": "construction_site",
    "note": "裴车在【室外·景观广场】围绕「停车系统/道闸调试/车流组织」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_atrium",
    "npcId": "wayfinding_design_lead",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "米陈在【室外·景观广场】围绕「导视美陈/品牌落地/效果调整」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_atrium",
    "npcId": "property_engineering_manager",
    "level": "A",
    "role": "support",
    "regionId": "construction_site",
    "note": "郝工在【室外·景观广场】围绕「物业接管/设备移交/缺陷销项」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_parking_lot",
    "npcId": "parking_lot_manager",
    "level": "B",
    "role": "primary",
    "regionId": "construction_site",
    "note": "裴车在【室外·停车场】围绕「停车系统/道闸调试/车流组织」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_parking_lot",
    "npcId": "parking_operation_manager",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "裴景在【室外·停车场】围绕「停车运营/系统联调/车流组织」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_parking_lot",
    "npcId": "security_roster_manager",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "高安在【室外·停车场】围绕「安保排班/应急预案/秩序维护」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_unloading_zone",
    "npcId": "site_canteen_manager",
    "level": "C",
    "role": "primary",
    "regionId": "construction_site",
    "note": "邱卸在【室外·卸货区】围绕「卸货调度/物流排队/临堆管理」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_unloading_zone",
    "npcId": "logistics_receiving_coordinator",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "孙后在【室外·卸货区】围绕「后勤收货/垃圾清运/路线协调」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_unloading_zone",
    "npcId": "site_vehicle_wash_officer",
    "level": "B",
    "role": "support",
    "regionId": "construction_site",
    "note": "何机在【室外·卸货区】围绕「车辆调度/机械协调/物流冲突」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_logistics_lane",
    "npcId": "logistics_receiving_coordinator",
    "level": "B",
    "role": "primary",
    "regionId": "construction_site",
    "note": "孙后在【室外·后勤通道】围绕「后勤收货/垃圾清运/路线协调」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_logistics_lane",
    "npcId": "site_canteen_manager",
    "level": "C",
    "role": "support",
    "regionId": "construction_site",
    "note": "邱卸在【室外·后勤通道】围绕「卸货调度/物流排队/临堆管理」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_site_logistics_lane",
    "npcId": "site_fire_lane_officer",
    "level": "C",
    "role": "support",
    "regionId": "construction_site",
    "note": "严保在【室外·后勤通道】围绕「消防车道/通道清障/安全巡查」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "owner_operation_prep_office",
    "npcId": "floor_supervision_engineer",
    "level": "A",
    "role": "support",
    "regionId": "opening_prep",
    "note": "唐检在【运营筹备办公室】围绕「开业联检/问题派单/整改销项」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_opening_leasing_center",
    "npcId": "opening_leasing_manager",
    "level": "A",
    "role": "primary",
    "regionId": "opening_prep",
    "note": "沈嘉在【招商 / 租赁中心】围绕「招商租赁/商户需求/开业目标」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_opening_leasing_center",
    "npcId": "owner_operation_prep_lead",
    "level": "A",
    "role": "support",
    "regionId": "opening_prep",
    "note": "陆宁在【招商 / 租赁中心】围绕「开业筹备/商户进场/运营移交」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_opening_leasing_center",
    "npcId": "owner_cost_contract_lead",
    "level": "A",
    "role": "support",
    "regionId": "opening_prep",
    "note": "马衡在【招商 / 租赁中心】围绕「合同边界/签证变更/成本预警」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_merchant_fitout_service",
    "npcId": "merchant_fitout_manager",
    "level": "B",
    "role": "primary",
    "regionId": "opening_prep",
    "note": "麦然在【商户装修服务中心】围绕「商户服务/进场协调/投诉处置」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_merchant_fitout_service",
    "npcId": "second_fitout_admin",
    "level": "B",
    "role": "support",
    "regionId": "opening_prep",
    "note": "谢承二在【商户装修服务中心】围绕「二装管理/巡查整改/商户冲突」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_merchant_fitout_service",
    "npcId": "merchant_representative",
    "level": "B",
    "role": "support",
    "regionId": "opening_prep",
    "note": "钟证在【商户装修服务中心】围绕「商户证照/手续协助/资料补正」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_second_fitout_office",
    "npcId": "second_fitout_admin",
    "level": "B",
    "role": "primary",
    "regionId": "opening_prep",
    "note": "谢承二在【二装管理办公室】围绕「二装管理/巡查整改/商户冲突」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_second_fitout_office",
    "npcId": "fire_control_room_officer",
    "level": "A",
    "role": "support",
    "regionId": "opening_prep",
    "note": "叶青在【二装管理办公室】围绕「消防值守/报警处理/联动测试」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_second_fitout_office",
    "npcId": "fire_acceptance_officer",
    "level": "A",
    "role": "regulator",
    "regionId": "opening_prep",
    "note": "梁瑜在【二装管理办公室】围绕「消防验收/联动测试/整改销项」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_property_customer_center",
    "npcId": "property_customer_manager",
    "level": "B",
    "role": "primary",
    "regionId": "opening_prep",
    "note": "乔安在【物业客服中心】围绕「客服报修/服务保障/投诉闭环」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_property_customer_center",
    "npcId": "property_engineering_manager",
    "level": "A",
    "role": "support",
    "regionId": "opening_prep",
    "note": "郝工在【物业客服中心】围绕「物业接管/设备移交/缺陷销项」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_property_customer_center",
    "npcId": "owner_pre_approval_officer",
    "level": "A",
    "role": "support",
    "regionId": "opening_prep",
    "note": "袁值在【物业客服中心】围绕「试营业指挥/突发响应/资源调度」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "site_property_handover",
    "npcId": "property_engineering_manager",
    "level": "A",
    "role": "primary",
    "regionId": "opening_prep",
    "note": "郝工在【物业工程部】围绕「物业接管/设备移交/缺陷销项」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "site_property_handover",
    "npcId": "site_mep_processing_lead",
    "level": "A",
    "role": "support",
    "regionId": "opening_prep",
    "note": "余成电在【物业工程部】围绕「机电安装/管线综合/系统调试」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "site_property_handover",
    "npcId": "smart_weak_current_manager",
    "level": "B",
    "role": "support",
    "regionId": "opening_prep",
    "note": "罗智在【物业工程部】围绕「智能化运维/弱电中控/系统联调」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_security_roster_room",
    "npcId": "security_roster_manager",
    "level": "B",
    "role": "primary",
    "regionId": "opening_prep",
    "note": "高安在【安保指挥室】围绕「安保排班/应急预案/秩序维护」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_security_roster_room",
    "npcId": "owner_pre_approval_officer",
    "level": "A",
    "role": "support",
    "regionId": "opening_prep",
    "note": "袁值在【安保指挥室】围绕「试营业指挥/突发响应/资源调度」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_security_roster_room",
    "npcId": "parking_operation_manager",
    "level": "B",
    "role": "support",
    "regionId": "opening_prep",
    "note": "裴景在【安保指挥室】围绕「停车运营/系统联调/车流组织」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_security_roster_room",
    "npcId": "site_living_area_manager",
    "level": "B",
    "role": "primary",
    "regionId": "opening_prep",
    "note": "温洁在【保洁 / 环境管理办公室】围绕「保洁环境/垃圾协调/品质巡查」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_security_roster_room",
    "npcId": "logistics_receiving_coordinator",
    "level": "B",
    "role": "support",
    "regionId": "opening_prep",
    "note": "孙后在【保洁 / 环境管理办公室】围绕「后勤收货/垃圾清运/路线协调」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_security_roster_room",
    "npcId": "property_customer_manager",
    "level": "B",
    "role": "support",
    "regionId": "opening_prep",
    "note": "乔安在【保洁 / 环境管理办公室】围绕「客服报修/服务保障/投诉闭环」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_parking_management_center",
    "npcId": "parking_operation_manager",
    "level": "B",
    "role": "primary",
    "regionId": "opening_prep",
    "note": "裴景在【停车场管理中心】围绕「停车运营/系统联调/车流组织」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_parking_management_center",
    "npcId": "parking_lot_manager",
    "level": "B",
    "role": "support",
    "regionId": "opening_prep",
    "note": "裴车在【停车场管理中心】围绕「停车系统/道闸调试/车流组织」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_parking_management_center",
    "npcId": "security_roster_manager",
    "level": "B",
    "role": "support",
    "regionId": "opening_prep",
    "note": "高安在【停车场管理中心】围绕「安保排班/应急预案/秩序维护」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_smart_weak_current_center",
    "npcId": "smart_weak_current_manager",
    "level": "B",
    "role": "primary",
    "regionId": "opening_prep",
    "note": "罗智在【智能化 / 弱电中控室】围绕「智能化运维/弱电中控/系统联调」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_smart_weak_current_center",
    "npcId": "site_realname_officer",
    "level": "B",
    "role": "support",
    "regionId": "opening_prep",
    "note": "程信在【智能化 / 弱电中控室】围绕「通信接入/弱电接口/运营商协调」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_smart_weak_current_center",
    "npcId": "fire_control_room_officer",
    "level": "A",
    "role": "support",
    "regionId": "opening_prep",
    "note": "叶青在【智能化 / 弱电中控室】围绕「消防值守/报警处理/联动测试」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_opening_joint_command",
    "npcId": "floor_supervision_engineer",
    "level": "A",
    "role": "primary",
    "regionId": "opening_prep",
    "note": "唐检在【开业联检指挥部】围绕「开业联检/问题派单/整改销项」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_opening_joint_command",
    "npcId": "owner_project_director",
    "level": "S",
    "role": "support",
    "regionId": "opening_prep",
    "note": "林知远在【开业联检指挥部】围绕「主线任务/综合协调/问题闭环」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_opening_joint_command",
    "npcId": "property_engineering_manager",
    "level": "A",
    "role": "support",
    "regionId": "opening_prep",
    "note": "郝工在【开业联检指挥部】围绕「物业接管/设备移交/缺陷销项」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_trial_operation_command",
    "npcId": "owner_pre_approval_officer",
    "level": "A",
    "role": "primary",
    "regionId": "opening_prep",
    "note": "袁值在【试营业指挥部】围绕「试营业指挥/突发响应/资源调度」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_trial_operation_command",
    "npcId": "owner_operation_prep_lead",
    "level": "A",
    "role": "support",
    "regionId": "opening_prep",
    "note": "陆宁在【试营业指挥部】围绕「开业筹备/商户进场/运营移交」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_trial_operation_command",
    "npcId": "security_roster_manager",
    "level": "B",
    "role": "support",
    "regionId": "opening_prep",
    "note": "高安在【试营业指挥部】围绕「安保排班/应急预案/秩序维护」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_merchant_license_point",
    "npcId": "merchant_representative",
    "level": "B",
    "role": "primary",
    "regionId": "opening_prep",
    "note": "钟证在【商户证照办理点】围绕「商户证照/手续协助/资料补正」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_merchant_license_point",
    "npcId": "merchant_fitout_manager",
    "level": "B",
    "role": "support",
    "regionId": "opening_prep",
    "note": "麦然在【商户证照办理点】围绕「商户服务/进场协调/投诉处置」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_merchant_license_point",
    "npcId": "fire_acceptance_officer",
    "level": "A",
    "role": "support",
    "regionId": "opening_prep",
    "note": "梁瑜在【商户证照办理点】围绕「消防验收/联动测试/整改销项」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_wayfinding_display_studio",
    "npcId": "wayfinding_design_lead",
    "level": "B",
    "role": "primary",
    "regionId": "opening_prep",
    "note": "米陈在【导视美陈工作室】围绕「导视美陈/品牌落地/效果调整」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_wayfinding_display_studio",
    "npcId": "opening_leasing_manager",
    "level": "A",
    "role": "support",
    "regionId": "opening_prep",
    "note": "沈嘉在【导视美陈工作室】围绕「招商租赁/商户需求/开业目标」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_wayfinding_display_studio",
    "npcId": "parking_lot_manager",
    "level": "B",
    "role": "support",
    "regionId": "opening_prep",
    "note": "裴车在【导视美陈工作室】围绕「停车系统/道闸调试/车流组织」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_logistics_waste_dispatch",
    "npcId": "logistics_receiving_coordinator",
    "level": "B",
    "role": "primary",
    "regionId": "opening_prep",
    "note": "孙后在【后勤收货 / 垃圾清运协调点】围绕「后勤收货/垃圾清运/路线协调」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_logistics_waste_dispatch",
    "npcId": "site_canteen_manager",
    "level": "C",
    "role": "support",
    "regionId": "opening_prep",
    "note": "邱卸在【后勤收货 / 垃圾清运协调点】围绕「卸货调度/物流排队/临堆管理」提出请求、设置条件或触发冲突。"
  },
  {
    "locationId": "area_logistics_waste_dispatch",
    "npcId": "site_living_area_manager",
    "level": "B",
    "role": "support",
    "regionId": "opening_prep",
    "note": "温洁在【后勤收货 / 垃圾清运协调点】围绕「保洁环境/垃圾协调/品质巡查」提出请求、设置条件或触发冲突。"
  }
];

export function getNpcAssignmentsByLocationId(locationId: string): LocationNpcAssignment[] {
  return LOCATION_NPC_ASSIGNMENTS.filter((item) => item.locationId === locationId);
}
