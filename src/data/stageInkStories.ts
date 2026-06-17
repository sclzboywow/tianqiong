export type InkStoryDef = {
  intro: string;
  choices: { text: string; id: string; result: string }[];
};

export const STAGE_INK_STORIES: Record<string, InkStoryDef> = {
  setup_project_team: {
    intro:
      "项目启动会刚结束，甲方代表把一份组织架构草稿推到你面前。\n\n" +
      "总包、监理、设计、造价咨询各派了接口人，但岗位职责还有三处重叠。资料员催你尽快发布正式名单，否则后续协调会排不了日程。\n\n" +
      "你需要在今天内给出推进方案。",
    choices: [
      {
        text: "稳妥推进：组织对齐会后再发布正式架构",
        id: "steady_push",
        result: "你组织半日对齐会，逐条确认岗位职责与接口关系，次日发布正式组织架构。各方认可度高，但比预期晚一天。",
      },
      {
        text: "快速推进：当天发布正式组织架构",
        id: "fast_push",
        result: "你当天发布正式组织架构，明确各岗位接口人。甲方表示满意，但有单位反馈部分职责仍需后续澄清。",
      },
      {
        text: "暂缓协调：先用临时名单顶一下",
        id: "delay_coord",
        result: "你先用临时名单应付，承诺下周再正式定稿。消耗最少，但接口责任仍不清晰。",
      },
    ],
  },
  prepare_master_plan: {
    intro:
      "总控计划是后续报批和招采的基准。现场有人想跳过计划直接开工，资料员在等你的意见。\n\n" +
      "造价咨询提交了初版里程碑，但与设计院的出图节点对不上。甲方代表问：能不能先出一个能用的版本？\n\n" +
      "你需要决定总控计划的编制节奏。",
    choices: [
      {
        text: "稳妥推进：按节点编制完整总控计划",
        id: "steady_push",
        result: "你牵头组织专题会，逐条核对关键节点与责任主体，编制了带依赖关系的完整总控计划。口径统一，但多花两天。",
      },
      {
        text: "快速推进：先出里程碑版计划",
        id: "fast_push",
        result: "你先发布里程碑版总控计划，明确报批与招采关键节点。进度追回，但部分专业细节待补充。",
      },
      {
        text: "暂缓协调：沿用旧项目模板",
        id: "delay_coord",
        result: "你套用了类似项目的总控模板，先让各方有参照。省时省力，但部分节点可能不适用本项目。",
      },
    ],
  },
  create_risk_register: {
    intro:
      "现场已经暴露出消防、资料、进度等多条隐患线索。项目部需要一份正式风险登记台账。\n\n" +
      "监理建议按「发生概率 × 影响程度」分级，总包希望先列清单再分级。甲方代表要求本周内能看到初稿。\n\n" +
      "你决定怎么建立这份台账。",
    choices: [
      {
        text: "稳妥推进：组织专题会建立分级台账",
        id: "steady_push",
        result: "你组织专题会，汇总各部门风险点并建立分级台账，明确责任人与跟踪频率。台账质量高，会议占用半天。",
      },
      {
        text: "快速推进：先汇总清单再补充分级",
        id: "fast_push",
        result: "你先快速汇总各部门风险点形成清单，分级规则后续补充。台账本周内可见，但部分条目仍需核实。",
      },
      {
        text: "暂缓协调：暂时口头同步",
        id: "delay_coord",
        result: "你选择先口头同步主要风险，书面台账下周再整理。当前消耗少，但缺少正式留痕。",
      },
    ],
  },
  create_document_ledger: {
    intro:
      "竣工资料散落在各家单位手里，没有统一台账。资料员担心后面归档会失控。\n\n" +
      "档案资料室空间有限，监理提出需要按「设计、施工、验收、移交」四类建立目录。甲方希望先看到关键资料清单。\n\n" +
      "你准备如何建立资料台账。",
    choices: [
      {
        text: "稳妥推进：建立统一资料台账",
        id: "steady_push",
        result: "你在档案资料室建立统一台账，明确每类资料的责任人、截止节点与存放位置。归档路径清晰，整理耗时较多。",
      },
      {
        text: "快速推进：先梳理关键资料目录",
        id: "fast_push",
        result: "你先梳理报批与验收关键资料目录，台账分步建立。甲方很快看到成果，但次要资料尚未纳入。",
      },
      {
        text: "暂缓协调：等各单位自行整理",
        id: "delay_coord",
        result: "你决定先不统一格式，各单位按习惯自行整理。短期省事，后续合并台账工作量会更大。",
      },
    ],
  },
  coordinate_first_meeting: {
    intro:
      "首次项目协调会定在下午三点。参建各方已到场，但议程表上还有两项争议：总包与监理的职责界面、设计变更的联络机制。\n\n" +
      "甲方代表希望你能在会上形成可执行的纪要，而不是又开一场「讨论会」。\n\n" +
      "你准备怎么推进这次协调会。",
    choices: [
      {
        text: "稳妥推进：逐项确认职责界面后再散会",
        id: "steady_push",
        result: "你按议程逐项确认职责界面与联络机制，形成带责任人的会议纪要。各方签字确认，会议延长四十分钟。",
      },
      {
        text: "快速推进：先定主议题，细节会后补",
        id: "fast_push",
        result: "你优先闭合总控计划与风险清单两项主议题，接口细节会后书面补充。会议按时结束，部分边界仍待澄清。",
      },
      {
        text: "暂缓协调：改期等资料齐备再开",
        id: "delay_coord",
        result: "你判断部分输入资料不齐，建议改期召开正式协调会。当前消耗少，但阶段推进节奏放缓。",
      },
    ],
  },
  confirm_approval_path: {
    intro: "前期报批涉及规划、消防、施工许可等多条路径。甲方询问哪条路径最稳妥。",
    choices: [
      { text: "梳理最优报批路径并汇报", id: "immediate_fix", result: "你梳理了报批路径图，向甲方正式汇报。" },
      { text: "先与审批部门预沟通", id: "schedule_fix", result: "你先预沟通，再确定正式路径。" },
      { text: "按经验先走一条试试", id: "ignore_sign", result: "你凭经验选了一条路径，未做充分论证。" },
    ],
  },
  confirm_planning_condition: {
    intro: "规划条件直接影响后续设计和报建。设计院催要确认函，否则无法深化。",
    choices: [
      { text: "尽快取得规划条件确认", id: "immediate_fix", result: "你协调取得了规划条件确认文件。" },
      { text: "先出工作版条件", id: "schedule_fix", result: "你先出工作版条件供设计参考。" },
      { text: "让设计先按假设推进", id: "ignore_sign", result: "你让设计先假设条件推进，存在返工风险。" },
    ],
  },
  prepare_approval_docs: {
    intro: "报批资料缺口明显，部分检测报告和图纸版本不一致。报建窗口期正在逼近。",
    choices: [
      { text: "集中补齐报批资料", id: "immediate_fix", result: "你组织集中办公，补齐了报批资料。" },
      { text: "分批次提交资料", id: "schedule_fix", result: "你安排分批次提交，先保证主项。" },
      { text: "先提交现有版本", id: "ignore_sign", result: "你先提交现有版本，缺项后补。" },
    ],
  },
  plan_construction_permit: {
    intro: "施工许可涉及消防、质监、安监等多前置条件。班组已在问何时能正式开工。",
    choices: [
      { text: "制定详细许可取得计划", id: "immediate_fix", result: "你制定了许可取得计划，责任到人。" },
      { text: "先明确关键前置条件", id: "schedule_fix", result: "你先明确关键前置，计划逐步细化。" },
      { text: "口头承诺尽快取证", id: "ignore_sign", result: "你口头承诺尽快取证，计划尚未落地。" },
    ],
  },
  complete_scheme_design: {
    intro: "方案设计影响中庭效果和商户动线。甲方代表提出还要再比选一版。",
    choices: [
      { text: "组织方案评审定稿", id: "immediate_fix", result: "你组织评审会，方案设计正式定稿。" },
      { text: "再出一版比选方案", id: "schedule_fix", result: "你安排比选方案，评审延后一周。" },
      { text: "维持原方案推进", id: "ignore_sign", result: "你决定维持原方案，甲方略有顾虑。" },
    ],
  },
  push_construction_drawings: {
    intro: "施工图出图滞后，现场班组无图施工。设计院表示人力紧张。",
    choices: [
      { text: "催图并派驻设计代表", id: "immediate_fix", result: "你催图成功，并派驻设计代表驻场。" },
      { text: "分区域分批出图", id: "schedule_fix", result: "你协调分区域出图，优先关键部位。" },
      { text: "现场临时做法", id: "ignore_sign", result: "你允许现场临时做法，图纸后补。" },
    ],
  },
  organize_drawing_review: {
    intro: "图纸会审发现多处碰撞和缺项。监理要求会审闭合后才能大面积施工。",
    choices: [
      { text: "组织正式图纸会审", id: "immediate_fix", result: "你组织了正式会审，问题清单已下发。" },
      { text: "先会审关键专业", id: "schedule_fix", result: "你先会审机电与结构关键专业。" },
      { text: "边施工边会审", id: "ignore_sign", result: "你选择边施工边会审，风险较高。" },
    ],
  },
  close_design_issues: {
    intro: "设计问题清单上还有十几条未闭合。验收组可能据此卡脖子。",
    choices: [
      { text: "逐项闭合设计问题", id: "immediate_fix", result: "你逐项跟踪，设计问题基本闭合。" },
      { text: "先闭合影响验收项", id: "schedule_fix", result: "你优先闭合影响验收的问题。" },
      { text: "标记为后续变更", id: "ignore_sign", result: "你把部分问题标记为后续变更。" },
    ],
  },
  prepare_cost_estimate: {
    intro: "控制价是招采的基准。造价咨询提交的初稿偏高，甲方质疑合理性。",
    choices: [
      { text: "组织控制价审核定稿", id: "immediate_fix", result: "你组织审核，控制价定稿完成。" },
      { text: "先核对主要清单项", id: "schedule_fix", result: "你先核对主要清单，整体定稿延后。" },
      { text: "直接采用咨询初稿", id: "ignore_sign", result: "你直接采用初稿，成本压力较大。" },
    ],
  },
  finalize_tender_docs: {
    intro: "招标文件条款有几处合同边界模糊。参建单位可能据此扯皮。",
    choices: [
      { text: "完善招标文件并会签", id: "immediate_fix", result: "你完善招标文件，完成会签。" },
      { text: "先定主条款后补附件", id: "schedule_fix", result: "你先定主条款，附件逐步完善。" },
      { text: "沿用标准模板", id: "ignore_sign", result: "你沿用标准模板，边界仍不够清晰。" },
    ],
  },
  select_main_contractor: {
    intro: "主要施工单位确定关系到全场节奏。两家单位报价接近，甲方等你建议。",
    choices: [
      { text: "综合评估后确定单位", id: "immediate_fix", result: "你完成综合评估，主要单位确定。" },
      { text: "再组织一轮澄清", id: "schedule_fix", result: "你组织澄清会，定标延后。" },
      { text: "选报价最低者", id: "ignore_sign", result: "你选了报价最低者，质量风险需关注。" },
    ],
  },
  clarify_contract_boundary: {
    intro: "总包与机电、消防分包界面不清，现场已出现互相推诿。",
    choices: [
      { text: "梳理界面划分并签补充协议", id: "immediate_fix", result: "你梳理界面划分，补充协议已签署。" },
      { text: "先出界面划分表", id: "schedule_fix", result: "你先出界面划分表，协议后续签。" },
      { text: "现场谁方便谁做", id: "ignore_sign", result: "你暂时默许现场灵活处理。" },
    ],
  },
  ready_start_condition: {
    intro: "开工条件检查发现临电、临水、围挡、安全培训几项未达标。",
    choices: [
      { text: "逐项整改达到开工条件", id: "immediate_fix", result: "你逐项整改，开工条件具备。" },
      { text: "先满足安全必备项", id: "schedule_fix", result: "你先满足安全必备项，其余并行。" },
      { text: "先小范围试开工", id: "ignore_sign", result: "你同意小范围试开工，存在隐患。" },
    ],
  },
  complete_main_structure: {
    intro: "主体结构还有一层未封顶，甲方询问能否调整验收节点。",
    choices: [
      { text: "组织冲刺封顶", id: "immediate_fix", result: "你组织冲刺，主体结构按期封顶。" },
      { text: "优化工序并行推进", id: "schedule_fix", result: "你优化工序，结构进度追回。" },
      { text: "接受节点顺延", id: "ignore_sign", result: "你接受节点顺延，后续压力增大。" },
    ],
  },
  complete_mep_system: {
    intro: "机电系统调试发现多处阀门、风机未按图安装。调试队等待指令。",
    choices: [
      { text: "整改后全面调试", id: "immediate_fix", result: "你要求整改后全面调试，系统基本可用。" },
      { text: "分区调试先用起来", id: "schedule_fix", result: "你安排分区调试，先保关键区域。" },
      { text: "带问题先调试", id: "ignore_sign", result: "你带问题调试，后续整改压力大。" },
    ],
  },
  complete_decoration: {
    intro: "装饰装修收尾阶段，成品保护和质量巡检矛盾突出。",
    choices: [
      { text: "加强成品保护完成装修", id: "immediate_fix", result: "你加强成品保护，装修顺利收尾。" },
      { text: "分区域交付装修", id: "schedule_fix", result: "你分区域交付，整体进度可控。" },
      { text: "赶工优先忽略保护", id: "ignore_sign", result: "你优先赶工，多处返修。" },
    ],
  },
  pass_fire_acceptance: {
    intro: "消防验收组明天到场。喷淋、报警、疏散指示还有几项待确认。",
    choices: [
      { text: "连夜排查消防短板", id: "immediate_fix", result: "你组织连夜排查，消防项基本就绪。" },
      { text: "先保必检项", id: "schedule_fix", result: "你先保必检项，其余边验边改。" },
      { text: "按现有状态迎检", id: "ignore_sign", result: "你按现有状态迎检，心里没底。" },
    ],
  },
  pass_completion_acceptance: {
    intro: "竣工验收资料与现场实物需逐项对应。质监站提出多处疑问。",
    choices: [
      { text: "全面消项迎竣工验收", id: "immediate_fix", result: "你全面消项，竣工验收顺利通过。" },
      { text: "先过主项后补资料", id: "schedule_fix", result: "你先过主项，资料持续补齐。" },
      { text: "申请有条件验收", id: "ignore_sign", result: "你申请有条件验收，留有尾巴。" },
    ],
  },
  complete_archive: {
    intro: "竣工资料归档窗口即将关闭。多家分包资料仍未提交。",
    choices: [
      { text: "集中归档并补齐缺项", id: "immediate_fix", result: "你集中归档，资料完整度明显提升。" },
      { text: "先归档主项资料", id: "schedule_fix", result: "你先归档主项，分包资料催收中。" },
      { text: "延期归档", id: "ignore_sign", result: "你申请延期归档，完整度受影响。" },
    ],
  },
  complete_property_handover: {
    intro: "物业移交涉及钥匙、图纸、设备台账和缺陷清单。物业方希望一次交清。",
    choices: [
      { text: "按清单完成物业移交", id: "immediate_fix", result: "你按清单完成移交，双方签字确认。" },
      { text: "分批次移交", id: "schedule_fix", result: "你分批次移交，关键项已交接。" },
      { text: "先交钥匙后补资料", id: "ignore_sign", result: "你先交钥匙，资料后补。" },
    ],
  },
};
