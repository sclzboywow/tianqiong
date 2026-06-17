export type InkStoryDef = {
  intro: string;
  choices: { text: string; id: string; result: string }[];
};

export const STAGE_INK_STORIES: Record<string, InkStoryDef> = {
  setup_project_team: {
    intro:
      "启动会的咖啡还没凉，甲方代表就把一份组织架构草稿拍在会议桌上。\n\n" +
      "「总包、监理、设计、造价——接口人都在了，但有三块职责重叠。」他敲了敲桌面，「今天不定稿，下周的协调会排不进去。」\n\n" +
      "走廊里，资料员探头催你：「名单今晚能发吗？各方都在等。」",
    choices: [
      {
        text: "先把各方拉回会议室，对齐后再发正式名单",
        id: "steady_push",
        result:
          "你临时加开半日对齐会，逐条确认岗位职责。次日发布正式名单，各方签字认可——比预期晚一天，但没人再追问「这块到底谁管」。",
      },
      {
        text: "今天就发正式名单，边跑边改接口",
        id: "fast_push",
        result:
          "你当天发布正式组织架构，接口人全部到位。甲方当场点赞，总包却在群里补了句：「有两条边界会后还要澄清。」",
      },
      {
        text: "先用临时名单顶一下，承诺下周定稿",
        id: "delay_coord",
        result:
          "你发出临时名单，口头承诺下周定稿。会场上鼓了掌，散场后监理私信你：「临时名单不算数，出了事谁签字？」",
      },
    ],
  },
  prepare_master_plan: {
    intro:
      "项目管理部的白板上，造价咨询的里程碑和设计院的出图节点用红笔圈出了三处冲突。\n\n" +
      "总包现场负责人在门外打电话：「能不能先动？计划回头再补。」资料员把一叠旧项目的总控计划模板推过来：「套一下最快。」\n\n" +
      "甲方代表只看向你：「这周我需要一版能拿去汇报的——完整不完整另说。」",
    choices: [
      {
        text: "牵头专题会，把节点和责任人对齐后再出完整版",
        id: "steady_push",
        result:
          "专题会从下午开到傍晚。你带着带依赖关系的完整总控计划走出会议室——口径统一，报批和招采都有了锚点，只是比原计划多耗两天。",
      },
      {
        text: "先出里程碑版计划，细节边施工边补",
        id: "fast_push",
        result:
          "里程碑版计划当天发出，关键报批节点全部标注。进度表上追回了一截，但机电专业的接口时间仍标着「待确认」。",
      },
      {
        text: "套用旧项目模板，先交差再微调",
        id: "delay_coord",
        result:
          "旧项目模板改个标题就发出去了。甲方暂时满意，设计院的接口人在群里问：「这些节点跟我们出图对得上吗？」",
      },
    ],
  },
  create_risk_register: {
    intro:
      "走廊公告栏上贴着消防整改通知，资料室又传来「缺原件」的争吵。进度群里，有人@全体成员：「再拖要影响报批了。」\n\n" +
      "监理工程师递来一张表格：「按概率和影响分级，这是规范做法。」总包安全员摆手：「先列清单，分级以后再说。」\n\n" +
      "甲方代表只看日期：「周五前我要能在会上翻到这份台账。」",
    choices: [
      {
        text: "开专题会，当场分级并指定跟踪责任人",
        id: "steady_push",
        result:
          "半天专题会后，分级风险台账正式启用，每条隐患都有责任人和复查频率。台账厚实，但你知道这周最耗神的会开完了。",
      },
      {
        text: "先汇总清单发出去，分级规则下周补",
        id: "fast_push",
        result:
          "风险清单周五准时出现在甲方桌上。条目齐全，但有三处等级标着「待核实」——至少没再被问「风险在哪」。",
      },
      {
        text: "口头同步主要隐患，书面台账下周再整理",
        id: "delay_coord",
        result:
          "你在协调群里口头同步了主要隐患。总包回复「收到」，监理追问：「没有书面台账，出了事算谁的？」",
      },
    ],
  },
  create_document_ledger: {
    intro:
      "档案资料室的空调嗡嗡响，地上堆着总包、监理、设计三家送来的文件夹，标签风格各不相同。\n\n" +
      "监理资料员揉着太阳穴：「按设计、施工、验收、移交四类建目录，不然后面归档要炸。」甲方在电话里问：「报批那套关键资料，清单今天能给我吗？」\n\n" +
      "资料室管理员指了指仅剩的空架子：「再拖，这些纸没地方放。」",
    choices: [
      {
        text: "今天就把四类目录和责任人定死，统一台账",
        id: "steady_push",
        result:
          "你在资料室待到闭灯。统一台账贴上墙的那一刻，监理终于停止追问「原件在哪」——整理很累，但后面归档有了抓手。",
      },
      {
        text: "先梳理报批关键资料，其余分步纳入",
        id: "fast_push",
        result:
          "关键资料目录当天发出，报批包里的缺项一目了然。甲方很快看到成果，次要资料的条目仍标着「待补充」。",
      },
      {
        text: "让各单位按习惯先整理，以后再合并",
        id: "delay_coord",
        result:
          "你决定各管各的，先不统一格式。资料室管理员发了个「呵呵」表情：「到时候合并台账，工作量翻倍哦。」",
      },
    ],
  },
  coordinate_first_meeting: {
    intro:
      "下午三点，项目管理部会议室坐满了人。议程表上两项标红：总包与监理的职责界面、设计变更该找谁拍板。\n\n" +
      "甲方代表敲敲杯子：「今天别又开成讨论会——散会时我要能签字的纪要。」\n\n" +
      "总包和监理交换了一个眼神，你知道那意味着争论还没开始。",
    choices: [
      {
        text: "逐项对线，散会前把职责和联络机制写进纪要",
        id: "steady_push",
        result:
          "会议延长四十分钟，但纪要上每条结论都有责任人和时限。各方签字确认，甲方代表难得地没再追加「再研究研究」。",
      },
      {
        text: "先闭合总控计划和风险清单，接口细节会后补",
        id: "fast_push",
        result:
          "总控计划和风险清单两项主议题按时闭合，接口细节会后书面补充。会议准点散场，监理在走廊低声说：「边界那几条还得再谈。」",
      },
      {
        text: "资料还不齐，建议改期再开正式协调会",
        id: "delay_coord",
        result:
          "你提出改期，各方松了口气也皱起了眉。甲方代表记下「待重开」，阶段推进表上多了一个空白周。",
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
