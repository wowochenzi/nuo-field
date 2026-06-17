(function () {
  const maskData = [
    {
      id: "guizhou-kaishan-mangjiang",
      name: "开山莽将",
      region: "贵州",
      role: "开山猛将 / 镇邪武神",
      meaning: "驱邪开路，具有强烈的震慑与开辟意味。",
      keywords: ["威猛", "粗犷", "力量感", "开山"],
      image: "assets/images/masks/guizhou-kaishan-mangjiang.png",
      model: "assets/models/masks/guizhou-kaishan-mangjiang.glb",
      description: "贵州傩戏中的代表性面具之一，强调仪式力量与开路驱邪功能。"
    },
    {
      id: "guizhou-xianfeng-xiaojie",
      name: "先锋小姐",
      region: "贵州",
      role: "先锋 / 人物角色",
      meaning: "祈福迎祥、勾消愿信、柔中护佑",
      keywords: ["灵动", "人物化", "先锋", "引导"],
      image: "assets/images/masks/guizhou-xianfeng-xiaojie.png",
      model: "assets/models/masks/guizhou-xianfeng-xiaojie.glb",
      description: "先锋小姐是傩堂戏中温婉善良的女性神祇形象，常以轻柔舞姿和唱做为主家祈福迎祥。她不同于凶神镇邪的威猛姿态，而以柔和、端庄、慈善的形象承担传愿、勾愿、护佑家宅平安的职能。",
      source: "见于土家族傩戏面具资料及《勾愿先锋》等剧目整理，将其列为傩堂戏中为主家祈福迎祥的重要女性角色。"
    },
    {
      id: "guizhou-huoshen-lingguan",
      name: "火神灵官",
      region: "贵州",
      role: "火神 / 灵官 / 护法神将",
      meaning: "纠察邪祟、烈火镇魔、守护坛场",
      keywords: ["火焰", "护法", "神性", "威严"],
      image: "assets/images/masks/guizhou-huoshen-lingguan.png",
      model: "assets/models/masks/guizhou-huoshen-lingguan.glb",
      description: "火神灵官多对应傩堂戏中的王灵官形象，是道教护法神进入傩坛后的神将角色。其面具常为赤面、怒目、额有纵目，道冠加身，形象威严凶猛，象征以火府神威搜捕邪魔、监察坛场、护持科仪秩序。",
      source: "见于贵州傩堂戏面具资料及王灵官信仰记载，称其为“玉枢火府天将”，在傩堂中承担搜捕邪魔妖鬼之职。"
    },
    {
      id: "jiangxi-leigong",
      name: "雷公",
      region: "江西南丰",
      role: "雷神 / 镇邪神灵",
      meaning: "雷霆震邪、主持正义、祈雨护民",
      keywords: ["雷霆", "夸张五官", "神性", "震慑"],
      image: "assets/images/masks/jiangxi-leigong.png",
      model: "assets/models/masks/jiangxi-leigong.glb",
      description: "雷公是南丰傩舞中带有自然神属性的威猛神祇，常以青面、怒目、夸张五官表现雷电之威。表演中常配合斧、凿等动作，象征电闪雷鸣、驱邪惩恶，也寄托民间对风调雨顺、五谷丰登的祈愿。",
      source: "见于江西南丰石邮村傩戏面具资料及南丰跳傩相关记录，包含驱疫神祇、民间俗神、释道神仙等多类角色。"
    },
    {
      id: "jiangxi-yinjiao",
      name: "殷郊",
      region: "江西南丰",
      role: "护法神将",
      meaning: "镇煞除凶、执掌太岁、威慑邪祟",
      keywords: ["庄严", "威猛", "神将", "护法"],
      image: "assets/images/masks/jiangxi-yinjiao.png",
      model: "assets/models/masks/jiangxi-yinjiao.glb",
      description: "殷郊又称太岁殷元帅，是受《封神演义》影响进入傩神系统的威猛神将。其形象多带青面、竖发、开天目或多臂法相，手执法器，具有强烈的神魔色彩，象征掌管凶煞、杀伐镇邪、护持人间秩序。",
      source: "见于南丰木质傩面具资料及《封神演义》人物系统，称殷郊在江西傩舞发展中被列入傩神系统接受供奉。"
    },
    {
      id: "hubei-chenghuang-tudi",
      name: "城隍土地",
      region: "湖北恩施",
      role: "地方守护神",
      meaning: "守护一方、赐福添寿、护佑乡里",
      keywords: ["守护", "地方性", "庇佑", "秩序"],
      image: "assets/images/masks/hubei-chenghuang-tudi.png",
      model: "assets/models/masks/hubei-chenghuang-tudi.glb",
      description: "城隍土地兼具地方守护神与乡土小神的特征。城隍主守城池、察民善恶，土地主一方水土、家宅村寨。其面具形象多偏文官或慈祥老者，象征地方秩序、乡土庇护与民间对安居乐业的祈愿。",
      source: "见于恩施木质傩面具资料、傩堂戏面具资料及民间城隍土地信仰整理，恩施傩戏中亦保存土地公等面具形象。"
    },
    {
      id: "zhejiang-liuchoupo",
      name: "刘丑婆",
      region: "浙江东阳",
      role: "丑角 / 世俗人物",
      meaning: "丑中见善、娱神娱人、祈求丰年",
      keywords: ["戏剧性", "人物感", "世俗性", "东阳"],
      image: "assets/images/masks/zhejiang-liuchoupo.png",
      model: "assets/models/masks/zhejiang-liuchoupo.glb",
      description: "刘丑婆是东阳傩戏中带有丑角意味的女性角色，形象多夸张而富有乡土气息。她以滑稽、怪诞、生活化的面貌进入仪式表演，在“丑”的外形中承载驱邪、调笑、活跃场面的功能，也体现民间傩戏娱神娱人的一面。",
      source: "可归入浙江东阳傩戏、傀儡戏及《报宁寺》相关角色系统。"
    },
    {
      id: "hebei-datou-heshang",
      name: "大头和尚",
      region: "河北武安",
      role: "民间人物 / 戏剧角色",
      meaning: "诙谐醒世、检斋劝善、驱邪纳福",
      keywords: ["夸张", "民间性", "戏剧感", "武安"],
      image: "assets/images/masks/hebei-datou-heshang.png",
      model: "assets/models/masks/hebei-datou-heshang.glb",
      description: "大头和尚是武安傩戏中富有世俗喜剧色彩的角色，形象多为头部夸张、神态滑稽的和尚面貌。其功能不只在于逗趣，也承担检视斋供、劝善醒世、调和仪式气氛的作用，使傩戏在庄重祭祀之外具有鲜明的民间生活意味。",
      source: "见于河北武安傩戏角色资料及傩堂戏“和尚”“笑和尚”类角色记载。在法事中承担检斋职能。"
    }
  ];

  const regionData = [
    {
      id: "guizhou",
      name: "贵州",
      title: "贵州傩堂戏谱系",
      maskIds: ["guizhou-kaishan-mangjiang", "guizhou-xianfeng-xiaojie", "guizhou-huoshen-lingguan"],
      description: "师徒传承、村社仪式、法事系统与傩堂戏谱系在此交织。"
    },
    {
      id: "jiangxi",
      name: "江西南丰",
      title: "南丰傩舞与神灵角色",
      maskIds: ["jiangxi-leigong", "jiangxi-yinjiao"],
      description: "南丰傩舞 / 傩戏传承强调神灵角色、驱邪镇祟与地方节庆。"
    },
    {
      id: "hubei",
      name: "湖北恩施",
      title: "乡土守护与地方神祇",
      maskIds: ["hubei-chenghuang-tudi"],
      description: "地方守护神信仰、乡土仪式和村社秩序在面具形象中沉淀。"
    },
    {
      id: "zhejiang",
      name: "浙江东阳",
      title: "东阳人物角色",
      maskIds: ["zhejiang-liuchoupo"],
      description: "东阳傩戏的地方人物角色具有戏剧化和世俗化特征。"
    },
    {
      id: "hebei",
      name: "河北武安",
      title: "武安赛戏传统",
      maskIds: ["hebei-datou-heshang"],
      description: "武安傩戏 / 赛戏传统中的民间人物形象体现北方支系差异。"
    }
  ];

  const craftStages = [
    { id: "initial", name: "木头", tool: "pencil", action: "画型", desc: "在木胚表面定位五官和纹样，先让面具从木头里显出轮廓。" },
    { id: "draw", name: "画型", tool: "knife", action: "雕刻", desc: "沿线稿刻出大形，明确眉眼、嘴鼻和装饰纹路的走势。" },
    { id: "carveProgress", name: "雕刻过程", tool: "knife", action: "继续雕刻", desc: "逐步加深层次，保留木屑、刻痕和未完成的粗粝感。" },
    { id: "carved", name: "雕刻完成", tool: "brush", action: "上色", desc: "面具结构成型，准备以传统色彩强化角色神态。" },
    { id: "painted", name: "上色", tool: "sandpaper", action: "打磨抛光", desc: "颜色完成后修整表面和边缘，让纹样更清晰。" },
    { id: "polished", name: "打磨抛光", tool: null, action: "完成", desc: "面具完成最后光泽，进入戴面入场。" }
  ];

  const tools = [
    { id: "pencil", name: "铅笔", image: "assets/images/craft-demo/tool-pencil.png" },
    { id: "knife", name: "刻刀", image: "assets/images/craft-demo/tool-knife.png" },
    { id: "brush", name: "毛笔", image: "assets/images/craft-demo/tool-brush.png" },
    { id: "sandpaper", name: "打磨纸", image: "assets/images/craft-demo/tool-sandpaper.png" }
  ];

  const gestures = [
    { id: "zushijue", name: "祖师诀", meaning: "请祖师入坛，开启仪式秩序。", core: true },
    { id: "dujiaojianjunjue", name: "独角将军诀", meaning: "召请将军护持，强调镇邪与开路。", core: true },
    { id: "lingguanjue", name: "灵官诀", meaning: "护法灵官守场，维持坛场边界。" },
    { id: "siyuanjiakaojue", name: "四元枷拷诀", meaning: "约束邪祟，象征法度与规训。" },
    { id: "tongchuijue", name: "铜锤诀", meaning: "以锤势震慑，强化动作力量。" },
    { id: "wuchangjue", name: "五猖诀", meaning: "调动五猖之势，完成仪式推进。", core: true },
    { id: "jiandaolijianjue", name: "尖刀利剪诀", meaning: "断除秽气，形成切割和净化的动作意象。" },
    { id: "daguijue", name: "打鬼诀", meaning: "驱赶邪祟，体现傩仪的镇压功能。" },
    { id: "liantaijue", name: "莲台诀", meaning: "收束仪式，使场域回归安定。" }
  ];

  const instruments = [
    { id: "kaishanfu", name: "开山斧", symbol: "斧", desc: "开路镇邪，动作沉重有力。" },
    { id: "lingqi", name: "令旗", symbol: "旗", desc: "发令召引，连接坛场与队列。" },
    { id: "toufu", name: "投斧", symbol: "投", desc: "投掷与震慑的动作象征。" },
    { id: "luogu", name: "锣鼓", symbol: "鼓", desc: "以声驱动身体节奏和仪式气氛。" },
    { id: "shidao", name: "师刀", symbol: "刀", desc: "师者持刀，象征开辟、驱邪与护持。" }
  ];

  const music = [
    { id: "gu", name: "鼓", symbol: "鼓", freq: 92 },
    { id: "luo", name: "锣", symbol: "锣", freq: 196 },
    { id: "suona", name: "唢呐", symbol: "呐", freq: 392 },
    { id: "bo", name: "钹", symbol: "钹", freq: 530 }
  ];

  window.NuoData = { maskData, regionData, craftStages, tools, gestures, instruments, music };
})();
