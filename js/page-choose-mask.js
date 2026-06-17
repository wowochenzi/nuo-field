const stage = document.getElementById("chooseStage");
const canvas = document.getElementById("chooseMaskCanvas");
const grid = document.getElementById("chooseGrid");
const confirm = document.getElementById("confirmMask");
const statusEl = document.getElementById("chooseStatus");
const kaishanOverlay = document.getElementById("chooseKaishanOverlay");
const kaishanBack = document.getElementById("chooseKaishanBack");
const detailCallouts = document.getElementById("chooseDetailCallouts");
const detailInfo = document.getElementById("chooseDetailInfo");
const kaishanCalloutsMarkup = detailCallouts?.innerHTML || "";
const kaishanInfoMarkup = detailInfo?.innerHTML || "";

const masks = window.NuoData?.maskData || [];
let selected = null;
let threeState = null;
let detailTransitioning = false;
let detailActive = false;
let detailIndex = null;

const kaishanMaskId = "guizhou-kaishan-mangjiang";
const figmaDetailFrame = {
  width: 1366,
  height: 768
};

const reducedGlowMaskIds = new Set([
  "jiangxi-yinjiao"
]);

const denseParticleMaskIds = new Set([
  "guizhou-xianfeng-xiaojie",
  "hubei-chenghuang-tudi",
  "zhejiang-liuchoupo"
]);

const detailMaskContent = {
  "guizhou-kaishan-mangjiang": {
    english: "KAI SHAN MANG JIANG",
    source: "贵州傩堂戏",
    paragraphs: [
      "开山莽将，又称“开山猛将”，是贵州、湘西一带傩堂戏中极具代表性的威猛神将形象。相关资料记载，他通常被塑造成“头生双角、满口獠牙、眼球凸出”的凶神面貌，手执金光钺斧，专门砍杀五方邪魔，并为人们追回失去的魂魄。中央美术学院非遗研究资料也提到，开山莽将一般被安排在傩堂戏下半坛出场，属于“凶神”系列，但其凶恶外形并不代表恶，而是以勇猛凶悍的神力扶弱惩强、扫除妖邪。",
      "因此，开山莽将的寓意集中在驱邪逐疫、开山辟路、镇压凶祟。他的红角、獠牙、怒目和武器共同构成一种强烈的威慑感，象征傩仪中“以凶制凶”的力量。它不是单纯恐怖的面具，而是民间信仰中保护村寨、驱除不祥、维持仪式秩序的镇妖猛将。"
    ],
    colors: ["#7c0f08", "#d33b1f", "#f2d19a", "#2f1510"],
    callouts: [
      { title: "头冠与犄角", text: "面具顶部设双角与横向头冠，形成向上伸展的威猛轮廓。双角强化神将的非人化特征，象征震慑、镇邪与开山辟路的神力。", top: "13%" },
      { title: "额饰纹样", text: "额部以卷云、火焰与点状纹样组合，纹样集中于面具上方视觉中心，增强神灵威严感。其繁密装饰表现傩面具古拙、神秘而具有仪式性的审美特征。", top: "31%" },
      { title: "面颊纹样", text: "面颊两侧分布大量红色点状纹与卷曲纹饰，形成左右对称的装饰结构。密集纹样既丰富面部层次，也突出傩面具夸张、强烈的视觉张力。", top: "53%" },
      { title: "獠牙与口部", text: "口部横向张开，露出牙齿与獠牙。獠牙是威猛神将的重要特征，象征以凶制凶、驱逐妖邪的力量；夸张口部也增强了面具的震慑性。", top: "78%" }
    ]
  },
  "guizhou-xianfeng-xiaojie": {
    english: "XIAN FENG XIAO JIE",
    source: "贵州傩堂戏",
    paragraphs: [
      "先锋小姐又称“仙锋小姐”，是傩堂戏正戏《武先锋》中的重要角色。资料记载，她在傩堂中司“催愿”和“勾愿”之职，面具造型多为弯眉细眼、面色红润、清秀端庄，常呈现小旦或女性武将形象。虽然外貌柔美，但她并不是单纯的闺阁女性，而是“巾帼不让须眉”的武先锋；相关戏文还将她描写为容貌细雅、气质端正的女性角色。",
      "先锋小姐的寓意主要在于护愿、传令、引导和女性勇武。她既有女性角色的端庄秀美，也承担着武先锋的行动职能，体现傩戏中“柔美”与“勇武”并存的角色特征。她的面具不像开山莽将那样以凶猛震慑邪魔，而是通过清秀面容、凤冠装饰和武将身份，象征愿望传达、仪式秩序与巾帼英气。"
    ],
    colors: ["#120706", "#c52614", "#f8a56d", "#ffd39a"],
    callouts: [
      { title: "头冠与发饰", text: "先锋小姐面具顶部多配冠饰或头箍，整体轮廓端正秀雅。冠饰强化其“先锋”身份，使人物既有女性角色的柔和感，也具有武将出场的仪式感。", x: 430, y: 103, w: 384, h: 93, shape: { src: "xianfeng-head.svg", x: 0, y: 4, w: 191, h: 78 }, copy: { x: 176, y: 0, w: 188 } },
      { title: "眉眼造型", text: "眉形细长，眼部平缓含蓄，呈现温和、沉静的神态。眼神不以威吓为主，而是表现女性角色的灵动与引导感。", x: 400, y: 238, w: 414, h: 146, shape: { src: "xianfeng-brow.svg", x: 0, y: 6, w: 208, h: 140 }, copy: { x: 193, y: 0, w: 201 } },
      { title: "面部轮廓", text: "面具脸型圆润饱满，线条较为柔和，与凶神类面具形成鲜明对比。整体造型突出端庄、清秀和人物化特征。", x: 420, y: 544, w: 318, h: 89, shape: { src: "xianfeng-face.svg", x: 0, y: 6, w: 114, h: 83 }, copy: { x: 110, y: 0, w: 201 } }
    ]
  },
  "guizhou-huoshen-lingguan": {
    english: "HUO SHEN LING GUAN",
    source: "贵州傩堂戏",
    paragraphs: [
      "火神灵官可结合傩堂戏中的“灵官”或“王灵官”形象理解。资料记载，灵官即王灵官，是道教护法神，在傩堂中的任务是搜捕混入傩堂的邪魔妖鬼；其面具通常面色赤红、形貌凶猛，头戴道冠，额际有一只“纵目”。另有遵义傩堂戏资料提到，王灵官具有天上、人间纠察之职，民间也有“三眼能观天下事，一鞭惊醒世间人”的说法。",
      "火神灵官的寓意主要是护法镇坛、纠察善恶、烈火净秽、驱邪捉鬼。赤红面色与纵目造型强化了其神威和监察能力，火的意象则常与净化、惩戒和驱逐邪秽相连。作为护法神将，他代表的不是普通武力，而是带有神圣审判意味的威严力量。"
    ],
    colors: ["#c41610", "#0b7a42", "#f8e0b2", "#e37a2e"],
    callouts: [
      { title: "头冠", text: "火神灵官常配有华丽头冠，形成强烈的武神轮廓，表现神将身份，增强其出阵、护法、镇坛的气势。", x: 357, y: 103, w: 404, h: 77, shape: { src: "huoshen-head.svg", x: 0, y: 3, w: 209, h: 35 }, copy: { x: 190, y: 0, w: 190 } },
      { title: "额部神目", text: "额部常设第三只“纵目”或火焰状纹样，象征监察四方、辨别善恶的神力。纵目也是灵官类护法神的重要识别特征。", x: 351, y: 209, w: 491, h: 116, shape: { src: "huoshen-forehead.svg", x: 0, y: 0, w: 285, h: 56 }, copy: { x: 260, y: 39, w: 201 } },
      { title: "鼻部与面中轴", text: "鼻梁突出，面部中轴清晰，增强神像般的正面威仪。面中结构稳定，使角色显得庄严而不可侵犯。", x: 341, y: 407, w: 499, h: 77, shape: { src: "huoshen-nose.svg", x: 0, y: 6, w: 295, h: 53 }, copy: { x: 268, y: 0, w: 201 } },
      { title: "面部主色", text: "面具多以赤红色为主，红色象征火焰、威严、驱邪与神力。强烈的红色面部使角色具有极高的视觉冲击力。", x: 430, y: 511, w: 355, h: 77, shape: { src: "huoshen-color.svg", x: 0, y: 4, w: 151, h: 36 }, copy: { x: 146, y: 0, w: 201 } },
      { title: "獠牙与口部", text: "口部张开，獠牙外露，表现护法神将的凶猛力量。其狰狞并非恶相，而是用于震慑邪祟、守护傩坛。", x: 350, y: 600, w: 377, h: 101, shape: { src: "huoshen-mouth.svg", x: 0, y: 0, w: 184, h: 39 }, copy: { x: 175, y: 24, w: 188 } }
    ]
  },
  "jiangxi-leigong": {
    english: "LEI GONG",
    source: "江西南丰傩舞",
    paragraphs: [
      "雷公属于南丰傩舞中的神灵类角色。南丰县资料指出，面具是南丰“跳傩”的重要特征，在傩仪中是神灵的载体，在傩舞中是角色造型的重要手段；国家级非遗资料也提到，南丰傩舞源自古代“驱傩”仪式，具有驱鬼逐疫的传统背景。雷公作为雷神形象，通常与雷霆、天威、震慑和驱邪等观念相联系。",
      "雷公面具的寓意集中在雷霆天威、震慑邪祟、惩恶除秽。它夸张的眼部、尖锐的五官和非人化神灵感，表现的是雷电降临时突然、猛烈、不可抗拒的力量。与温和的地方守护神不同，雷公更像是天界秩序的执行者，以雷霆之威驱逐不祥、震慑邪恶。"
    ],
    colors: ["#1f7a2d", "#efe34b", "#d7371e", "#f2e9c6"],
    callouts: [
      { title: "头部轮廓", text: "雷公面具造型多夸张奇异，顶部常有角状、尖状或冠饰结构，强化其非人化神灵身份。整体轮廓强调突兀、强烈和不可侵犯。", x: 477, y: 83, w: 332, h: 133, shape: { src: "leigong-head.svg", x: 0, y: 0, w: 139, h: 55 }, copy: { x: 128, y: 40, w: 188 } },
      { title: "额部纹样", text: "额部常有类似眼状、雷纹或火焰状装饰，用以突出天神属性。中心纹样强调雷公作为雷神的神圣权能。", x: 359, y: 142, w: 463, h: 163, shape: { src: "leigong-forehead.svg", x: 0, y: 0, w: 257, h: 103 }, copy: { x: 230, y: 86, w: 201 } },
      { title: "角饰与侧翼", text: "头部两侧常有角状或耳状装饰，增强面具的尖锐感和威慑力。侧翼结构也让角色在舞台表演中更具辨识度。", x: 450, y: 315, w: 250, h: 159, shape: { src: "leigong-side.svg", x: 0, y: 0, w: 46, h: 99 }, copy: { x: 49, y: 82, w: 201 } },
      { title: "鼻部与嘴部", text: "鼻部突出，嘴部形态尖锐或收紧，呈现非人化的神怪特征。这种造型使雷公区别于普通人物面具，更接近自然神灵形象。", x: 324, y: 500, w: 487, h: 200, shape: { src: "leigong-mouth.svg", x: 0, y: 0, w: 294, h: 122 }, copy: { x: 269, y: 107, w: 188 } }
    ]
  },
  "jiangxi-yinjiao": {
    english: "YIN JIAO",
    source: "江西南丰傩舞",
    paragraphs: [
      "殷郊又称殷交、太岁神、太岁殷元帅，是南丰傩面具系统中的威猛神将形象。相关资料记载，殷郊元帅在道教中被尊称为“上清武春猛吏太岁”“地司猛吏太岁”或“地司太岁大威德神王”，是执掌太岁凶煞、司职杀伐镇邪的神将。资料还指出，受《封神演义》影响，殷郊也被列入江西傩神系统接受供奉。",
      "殷郊的寓意主要是执掌凶煞、杀伐镇邪、护持秩序。与雷公偏向“天威雷霆”不同，殷郊更强调太岁神将的威严权能。他的面具常以强烈色彩和夸张表情表现神将气势，象征对灾厄、凶煞和不祥力量的压制，也体现民间信仰中对神将护佑与镇邪能力的期待。"
    ],
    colors: ["#f1c946", "#c31913", "#f5e3bd", "#4b3426"],
    callouts: [
      { title: "头冠结构", text: "殷郊面具顶部常设冠饰或尖角装饰，表现其神将身份。头冠使面具整体更庄严，也强化太岁神将的权威感。", x: 369, y: 55, w: 390, h: 125, shape: { src: "yinjiao-head.svg", x: 0, y: 0, w: 197, h: 63 }, copy: { x: 182, y: 48, w: 188 } },
      { title: "额部纹样", text: "额部以卷云、火焰与点状纹样组合，纹样集中于面具上方视觉中心，增强神灵威严感。其繁密装饰表现傩面具古拙、神秘而具有仪式性的审美特征。", x: 410, y: 238, w: 432, h: 101, shape: { src: "yinjiao-forehead.svg", x: 0, y: 6, w: 226, h: 95 }, copy: { x: 211, y: 0, w: 201 } },
      { title: "面部主色", text: "殷郊面具多使用黄色、红色、黑色等强烈色彩。黄色具有神圣、威严之意，红色表现杀伐与驱邪力量，黑色用于增强庄重感。", x: 415, y: 387, w: 365, h: 174, shape: { src: "yinjiao-color.svg", x: 0, y: 6, w: 161, h: 168 }, copy: { x: 144, y: 0, w: 201 } },
      { title: "面部纹饰", text: "面部纹样多呈对称分布，强调秩序感和神将身份。纹样既装饰面部，也强化角色的威猛与庄严。", x: 389, y: 589, w: 348, h: 97, shape: { src: "yinjiao-face-mark.svg", x: 0, y: 0, w: 155, h: 35 }, copy: { x: 140, y: 20, w: 188 } }
    ]
  },
  "hubei-chenghuang-tudi": {
    english: "CHENG HUANG TU DI",
    source: "湖北恩施傩戏",
    paragraphs: [
      "城隍土地属于地方守护神系统。恩施傩戏资料中提到，当地保存有钟馗、土地公等木雕傩面具；恩施傩戏是湖北民间戏剧种类之一，傩面具是其重要道具，也是傩文化的重要组成部分。中国傩戏网关于“城隍土地”面具的资料指出，城隍又称城隍爷，是中国民间和道教信奉的守护城池之神，常由有功于地方民众的名臣英雄充当。",
      "城隍土地的寓意主要是护佑乡土、安定村社、守护百姓、监察善恶。它不同于开山莽将、雷公、殷郊这类威猛神将，更强调地方性和日常性。城隍守城，土地护土，二者共同指向民间社会对一方水土平安、村落秩序稳定和百姓生活安宁的祈愿。"
    ],
    colors: ["#f0d7aa", "#0b704b", "#7a5235", "#b4492b"],
    callouts: [
      { title: "头帽结构", text: "城隍土地面具常配官帽、方巾或地方神祇式头饰，表现其地方守护神身份。头帽造型相对朴素，强调亲近民间的气质。", x: 457, y: 63, w: 332, h: 133, shape: { src: "chenghuang-head.svg", x: 0, y: 0, w: 139, h: 55 }, copy: { x: 134, y: 40, w: 188 } },
      { title: "眉眼造型", text: "眉眼弯曲柔和，常呈微笑或慈祥神态。眼部不以威吓为主，而表现地方神祇对百姓生活的庇护感。", x: 360, y: 238, w: 432, h: 120, shape: { src: "chenghuang-brow.svg", x: 0, y: 6, w: 226, h: 114 }, copy: { x: 211, y: 0, w: 201 } },
      { title: "帽饰与边缘装饰", text: "帽饰多为深色或青绿色，线条较简洁，不追求华丽。装饰克制，体现地方守护神的稳重气质。", x: 462, y: 297, w: 278, h: 187, shape: { src: "chenghuang-edge.svg", x: 0, y: 0, w: 74, h: 127 }, copy: { x: 77, y: 110, w: 201 } },
      { title: "鼻口结构", text: "鼻部端正，嘴部上扬，形成亲和的面部表情。温和的五官使其更接近民间人物和乡土神像。", x: 347, y: 533, w: 394, h: 112, shape: { src: "chenghuang-mouth.svg", x: 0, y: 0, w: 201, h: 50 }, copy: { x: 186, y: 35, w: 188 } }
    ]
  },
  "zhejiang-liuchoupo": {
    english: "LIU CHOU PO",
    source: "浙江东阳傩戏",
    paragraphs: [
      "刘丑婆可归入东阳傩戏中的世俗人物、丑角类角色。东阳傩戏当地又称“傀儡戏”，在东阳多地都有分布。资料记载，演出时演员在锣鼓伴奏下头戴不同角色面具，不说不唱，只通过夸张的肢体动作表现角色和剧情，并以此祭祀五谷神、祈求五谷丰登。东阳傩戏据传在清代康熙年间已有流传，后经重新挖掘恢复。",
      "刘丑婆的寓意主要是诙谐世俗、生活气息、民间喜感与戏剧张力。她不像神将角色那样承担镇邪杀伐的神职，而是更接近日常生活中的人物形象，通过夸张体态、丑角表情和民俗化服饰表现乡土社会中的幽默感与人情味。她体现的是傩戏中“娱神”之外的“娱人”功能，也让面具系统中不只有神灵与威严，还保留了民间生活的鲜活一面。"
    ],
    colors: ["#f6d4bd", "#1d1f24", "#f24a3f", "#e77970", "#b98b63"],
    callouts: [
      { title: "发髻与头饰", text: "刘丑婆面具常有女性发髻或头饰，造型夸张而富有戏剧性。发饰强化其女性人物身份，也增强角色的表演趣味。", x: 437, y: 153, w: 392, h: 122, shape: { src: "liuchoupo-hair.svg", x: 0, y: 0, w: 199, h: 44 }, copy: { x: 184, y: 29, w: 188 } },
      { title: "面部轮廓", text: "脸型圆润，表情带有笑意或俏皮感。面具整体不像神将那样威严，而是更接近民间戏剧中的生活人物。", x: 503, y: 407, w: 337, h: 77, shape: { src: "liuchoupo-face.svg", x: 0, y: 6, w: 133, h: 47 }, copy: { x: 121, y: 0, w: 201 } },
      { title: "腮红与妆饰", text: "脸颊常有明显腮红，增强舞台妆感和女性化特征。浓重腮红使人物更活泼，也突出民间戏剧的夸张表达。", x: 433, y: 514, w: 389, h: 84, shape: { src: "liuchoupo-cheek.svg", x: 0, y: 0, w: 183, h: 35 }, copy: { x: 168, y: 7, w: 201 } },
      { title: "鼻口结构", text: "鼻部小巧，嘴部微笑，整体表情亲切而带喜感。嘴角的上扬强化了角色的诙谐气质。", x: 299, y: 594, w: 502, h: 139, shape: { src: "liuchoupo-mouth.svg", x: 0, y: 0, w: 305, h: 71.001 }, copy: { x: 274, y: 62, w: 188 }, extras: [{ src: "liuchoupo-extra-dot.svg", x: 259.5, y: 64.5, w: 11, h: 11 }] }
    ]
  },
  "hebei-datou-heshang": {
    english: "DA TOU HE SHANG",
    source: "河北武安傩戏",
    paragraphs: [
      "大头和尚是河北武安傩戏中的民间戏剧角色。中国戏曲学院戏曲教育数字博物馆资料显示，武安傩戏传统剧目包括《捉黄鬼》《大头和尚戏柳翠》《吊黑虎》等，武安傩戏没有唱腔，主要靠演员使用地方语言的道白、韵白表现人物和故事，并以锣鼓伴奏。中国傩戏网资料也记载，武安傩戏中使用的面具达三四十个，角色包括城隍、判官、关公、土地爷、大头和尚等。",
      "大头和尚的寓意主要是滑稽戏谑、民间娱乐、俗世欲望与喜剧性。他常与“柳翠”共同出现，属于带有调笑意味的民间人物角色。圆润夸张的大头、和尚身份与喜剧化表演之间形成反差，使这一角色既有宗教身份的外壳，又带有浓厚的世俗趣味，体现武安傩戏粗犷、热闹、民间化的表演风格。"
    ],
    colors: ["#120905", "#c56621", "#d39447", "#b59a72"],
    callouts: [
      { title: "头部造型", text: "大头和尚最突出的特征是圆润饱满的大头造型。夸张的头部比例带来强烈喜剧效果，也是角色名称与身份识别的核心。", x: 495, y: 65, w: 334, h: 131, shape: { src: "datou-head.svg", x: 0, y: 0, w: 141, h: 53 }, copy: { x: 136, y: 38, w: 188 } },
      { title: "额部标记", text: "额部常有圆点或简洁装饰，既可强化和尚身份，也使面部中心更醒目。装饰不复杂，突出简洁、圆润的视觉特征。", x: 300, y: 238, w: 542, h: 77, shape: { src: "datou-forehead.svg", x: 0, y: 3, w: 336, h: 35 }, copy: { x: 311, y: 0, w: 201 } },
      { title: "面部轮廓", text: "脸型圆滑，面部饱满，整体造型亲和而滑稽。与凶神面具不同，大头和尚强调的是戏谑和娱乐性。", x: 459, y: 407, w: 381, h: 137, shape: { src: "datou-face.svg", x: 0, y: 6, w: 177, h: 131 }, copy: { x: 170, y: 0, w: 201 } },
      { title: "鼻口结构", text: "鼻部圆润，嘴部带笑，表情轻松。整体五官强化喜剧感，而非神将式威慑。", x: 326, y: 584, w: 520, h: 109, shape: { src: "datou-mouth.svg", x: 0, y: 0, w: 312, h: 63 }, copy: { x: 287, y: 48, w: 203 } }
    ]
  }
};

function assetPath(path) {
  return window.NuoRouter?.asset ? window.NuoRouter.asset(path) : `../${path}`;
}

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toPercent(value, base) {
  return `${((Number(value) / base) * 100).toFixed(4)}%`;
}

function calloutAsset(src) {
  return assetPath(`assets/images/choose-detail-callouts/${src}`);
}

function detailCalloutStyle(callout, index) {
  const shape = callout.shape || {};
  const copy = callout.copy || {};
  return [
    `--callout-left: ${toPercent(callout.x, figmaDetailFrame.width)}`,
    `--callout-top: ${toPercent(callout.y, figmaDetailFrame.height)}`,
    `--callout-width: ${toPercent(callout.w, figmaDetailFrame.width)}`,
    `--callout-height: ${toPercent(callout.h, figmaDetailFrame.height)}`,
    `--shape-left: ${toPercent(shape.x || 0, callout.w)}`,
    `--shape-top: ${toPercent(shape.y || 0, callout.h)}`,
    `--shape-width: ${toPercent(shape.w || 0, callout.w)}`,
    `--shape-height: ${toPercent(shape.h || 0, callout.h)}`,
    `--copy-left: ${toPercent(copy.x || 0, callout.w)}`,
    `--copy-top: ${toPercent(copy.y || 0, callout.h)}`,
    `--copy-width: ${toPercent(copy.w || 190, callout.w)}`,
    `--callout-delay: ${220 + index * 80}ms`
  ].join("; ");
}

function detailExtraStyle(extra, callout) {
  return [
    `--extra-left: ${toPercent(extra.x || 0, callout.w)}`,
    `--extra-top: ${toPercent(extra.y || 0, callout.h)}`,
    `--extra-width: ${toPercent(extra.w || 0, callout.w)}`,
    `--extra-height: ${toPercent(extra.h || 0, callout.h)}`
  ].join("; ");
}

function renderMaskDetail(mask) {
  if (mask.id === kaishanMaskId) {
    if (detailCallouts) detailCallouts.innerHTML = kaishanCalloutsMarkup;
    if (detailInfo) {
      detailInfo.innerHTML = kaishanInfoMarkup;
      detailInfo.setAttribute("aria-label", "开山莽将文字信息");
    }
    return;
  }

  const content = detailMaskContent[mask.id];
  if (!content || !detailInfo || !detailCallouts) return;

  detailInfo.setAttribute("aria-label", `${mask.name}文字信息`);
  detailInfo.innerHTML = `
    <header>
      <h1>${escapeHtml(mask.name)}</h1>
      <p>${escapeHtml(content.english)}</p>
      <strong>${escapeHtml(content.source)}</strong>
    </header>
    <div class="choose-kaishan-info-body">
      ${content.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
    </div>
    <section class="choose-kaishan-color-row" aria-label="主要颜色">
      <h2>主要颜色</h2>
      <div class="choose-detail-swatches">
        ${content.colors.map((color) => `<span style="--swatch-color: ${escapeHtml(color)}"></span>`).join("")}
      </div>
    </section>
  `;

  detailCallouts.innerHTML = content.callouts
    .map((callout, index) => `
      <article class="choose-kaishan-callout choose-detail-callout" style="${escapeHtml(detailCalloutStyle(callout, index))}">
        <img class="choose-detail-shape" src="${escapeHtml(calloutAsset(callout.shape.src))}" alt="" aria-hidden="true" />
        ${(callout.extras || [])
          .map((extra) => `<img class="choose-detail-extra" src="${escapeHtml(calloutAsset(extra.src))}" alt="" aria-hidden="true" style="${escapeHtml(detailExtraStyle(extra, callout))}" />`)
          .join("")}
        <div class="choose-kaishan-callout-copy">
          <h2>${escapeHtml(callout.title)}</h2>
          <p>${escapeHtml(callout.text)}</p>
        </div>
      </article>
    `)
    .join("");
}

function renderHitGrid() {
  grid.innerHTML = masks
    .map(
      (mask, index) => `
        <button class="choose-mask-slot" type="button" data-index="${index}" aria-label="选择${mask.name}">
          <img src="${assetPath(mask.image)}" alt="" />
          <span>${mask.name}</span>
        </button>
      `
    )
    .join("");

  grid.querySelectorAll(".choose-mask-slot").forEach((slot) => {
    slot.addEventListener("click", () => selectMask(Number(slot.dataset.index)));
  });
}

function selectMask(index) {
  const mask = masks[index];
  if (!mask) return;

  if (detailMaskContent[mask.id] && !detailTransitioning && !detailActive) {
    enterMaskDetail(index);
    return;
  }

  selected = mask;
  window.NuoState?.setSelectedMask?.(mask);
  window.NuoAudio?.playTone?.(210, 0.16, "triangle");
  grid.querySelectorAll(".choose-mask-slot").forEach((slot, slotIndex) => {
    slot.classList.toggle("is-selected", slotIndex === index);
  });
  threeState?.groups.forEach((group, groupIndex) => {
    group.userData.selected = groupIndex === index;
  });
  confirm?.classList.remove("is-disabled");
  setStatus(`已择 ${mask.name}`);
}

function enterMaskDetail(index) {
  const mask = masks[index];
  if (!mask || !detailMaskContent[mask.id]) return;

  detailTransitioning = true;
  detailIndex = index;
  selected = mask;
  renderMaskDetail(mask);
  window.NuoState?.setSelectedMask?.(mask);
  window.NuoAudio?.playTone?.(164, 0.24, "sine");
  document.body.dataset.detailMask = mask.id;
  document.body.classList.add("is-kaishan-transition");
  kaishanOverlay?.setAttribute("aria-hidden", "false");
  grid.querySelectorAll(".choose-mask-slot").forEach((slot, slotIndex) => {
    slot.classList.toggle("is-selected", slotIndex === index);
    slot.classList.toggle("is-transition-target", slotIndex === index);
  });
  threeState?.groups.forEach((group, groupIndex) => {
    group.userData.selected = groupIndex === index;
    group.userData.enteringDetail = groupIndex === index;
    group.userData.transitionMuted = groupIndex !== index;
  });
  confirm?.classList.remove("is-disabled");
  setStatus(`${mask.name}入场`);
  layoutGroups();
  window.setTimeout(() => {
    detailTransitioning = false;
    detailActive = true;
    document.body.classList.add("is-kaishan-detail");
  }, 520);
}

function exitMaskDetail() {
  const selectedIndex = typeof detailIndex === "number" ? detailIndex : masks.findIndex((mask) => mask.id === selected?.id);
  detailActive = false;
  detailTransitioning = false;
  document.body.classList.remove("is-kaishan-detail", "is-kaishan-transition");
  delete document.body.dataset.detailMask;
  kaishanOverlay?.setAttribute("aria-hidden", "true");
  grid.querySelectorAll(".choose-mask-slot").forEach((slot, slotIndex) => {
    slot.classList.remove("is-transition-target");
    slot.classList.toggle("is-selected", slotIndex === selectedIndex);
  });
  threeState?.groups.forEach((group, groupIndex) => {
    group.userData.selected = groupIndex === selectedIndex;
    group.userData.enteringDetail = false;
    group.userData.transitionMuted = false;
  });
  selected = masks[selectedIndex] || null;
  detailIndex = null;
  if (selected) {
    window.NuoState?.setSelectedMask?.(selected);
    confirm?.classList.remove("is-disabled");
    setStatus(`已择 ${selected.name}`);
  } else {
    confirm?.classList.add("is-disabled");
    setStatus("点击面具，择面入戏");
  }
  layoutGroups();
}

kaishanBack?.addEventListener("click", exitMaskDetail);

confirm?.addEventListener("click", () => {
  if (!selected) {
    setStatus("请先点选一副面具");
    return;
  }
  window.NuoState?.setSelectedMask?.(selected);
  window.NuoState?.markComplete?.("completedChooseMask");
  window.NuoRouter?.go?.("pages/craft-mask.html");
});

async function loadThreeDeps() {
  const THREE = await import("three");
  const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
  return { THREE, GLTFLoader };
}

function makeFallbackPlane(THREE, texture, index) {
  const material = new THREE.SpriteMaterial({
    map: texture,
    color: 0xffffff,
    transparent: true,
    opacity: 0.96,
    depthWrite: false
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.55, 1.95, 1);
  sprite.userData.maskIndex = index;
  return sprite;
}

function normalizeObject(THREE, object) {
  const box = new THREE.Box3().setFromObject(object);
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);
  object.position.sub(center);
  const maxAxis = Math.max(size.x, size.y, size.z, 0.001);
  object.scale.multiplyScalar(1.92 / maxAxis);
}

function ensureGeometryAttributes(THREE, geometry) {
  if (!geometry.attributes.uv) {
    const uvs = new Float32Array(geometry.attributes.position.count * 2);
    geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  }
  if (!geometry.attributes.normal) {
    geometry.computeVertexNormals();
  }

  const count = geometry.attributes.position.count;
  const randoms = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count * 3; i += 1) {
    randoms[i] = (Math.random() - 0.5) * 6.0;
  }
  for (let i = 0; i < count; i += 1) {
    seeds[i] = Math.random();
  }
  geometry.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
}

function createSurfaceParticleGeometry(THREE, sourceGeometry, samplesPerTriangle) {
  const baseGeometry = sourceGeometry.index ? sourceGeometry.toNonIndexed() : sourceGeometry.clone();
  const positionAttr = baseGeometry.attributes.position;
  const uvAttr = baseGeometry.attributes.uv;
  const normalAttr = baseGeometry.attributes.normal;
  const triangleCount = Math.floor(positionAttr.count / 3);
  const extraCount = triangleCount * samplesPerTriangle;
  const totalCount = positionAttr.count + extraCount;
  const positions = new Float32Array(totalCount * 3);
  const uvs = new Float32Array(totalCount * 2);
  const normals = new Float32Array(totalCount * 3);
  const randoms = new Float32Array(totalCount * 3);
  const seeds = new Float32Array(totalCount);

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const cb = new THREE.Vector3();
  const n = new THREE.Vector3();
  const uvA = new THREE.Vector2();
  const uvB = new THREE.Vector2();
  const uvC = new THREE.Vector2();
  let write = 0;

  function writeParticle(x, y, z, u, v, nx, ny, nz) {
    positions[write * 3] = x;
    positions[write * 3 + 1] = y;
    positions[write * 3 + 2] = z;
    uvs[write * 2] = u;
    uvs[write * 2 + 1] = v;
    normals[write * 3] = nx;
    normals[write * 3 + 1] = ny;
    normals[write * 3 + 2] = nz;
    randoms[write * 3] = (Math.random() - 0.5) * 6.0;
    randoms[write * 3 + 1] = (Math.random() - 0.5) * 6.0;
    randoms[write * 3 + 2] = (Math.random() - 0.5) * 6.0;
    seeds[write] = Math.random();
    write += 1;
  }

  for (let i = 0; i < positionAttr.count; i += 1) {
    const nx = normalAttr ? normalAttr.getX(i) : 0;
    const ny = normalAttr ? normalAttr.getY(i) : 0;
    const nz = normalAttr ? normalAttr.getZ(i) : 1;
    writeParticle(
      positionAttr.getX(i),
      positionAttr.getY(i),
      positionAttr.getZ(i),
      uvAttr ? uvAttr.getX(i) : 0,
      uvAttr ? uvAttr.getY(i) : 0,
      nx,
      ny,
      nz
    );
  }

  for (let tri = 0; tri < triangleCount; tri += 1) {
    const i0 = tri * 3;
    const i1 = i0 + 1;
    const i2 = i0 + 2;
    a.fromBufferAttribute(positionAttr, i0);
    b.fromBufferAttribute(positionAttr, i1);
    c.fromBufferAttribute(positionAttr, i2);
    n.subVectors(b, a).cross(cb.subVectors(c, a)).normalize();
    if (uvAttr) {
      uvA.fromBufferAttribute(uvAttr, i0);
      uvB.fromBufferAttribute(uvAttr, i1);
      uvC.fromBufferAttribute(uvAttr, i2);
    } else {
      uvA.set(0, 0);
      uvB.set(0, 0);
      uvC.set(0, 0);
    }

    for (let sample = 0; sample < samplesPerTriangle; sample += 1) {
      const r1 = Math.sqrt(Math.random());
      const r2 = Math.random();
      const wa = 1 - r1;
      const wb = r1 * (1 - r2);
      const wc = r1 * r2;
      writeParticle(
        a.x * wa + b.x * wb + c.x * wc,
        a.y * wa + b.y * wb + c.y * wc,
        a.z * wa + b.z * wb + c.z * wc,
        uvA.x * wa + uvB.x * wb + uvC.x * wc,
        uvA.y * wa + uvB.y * wb + uvC.y * wc,
        n.x,
        n.y,
        n.z
      );
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  return geometry;
}

function makeDemoParticleMaterial(THREE, map, color) {
  if (map) {
    map.colorSpace = THREE.SRGBColorSpace;
    map.needsUpdate = true;
  }

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uPointSize: { value: 1.14 },
      uTexture: { value: map || null },
      uHasTexture: { value: map ? 1.0 : 0.0 },
      uColor: { value: color || new THREE.Color(0xcc8855) },
      uFade: { value: 1.0 },
      uGlowScale: { value: 1.16 },
      uPreserveColor: { value: 0.0 }
    },
    vertexShader: `
      uniform float uTime;
      uniform float uProgress;
      uniform float uPointSize;

      attribute vec3 aRandom;
      attribute float aSeed;
      varying vec2 vUv;
      varying float vSeed;

      vec3 noise(vec3 p) {
        return vec3(
          sin(p.x * 5.0 + uTime * 0.5) * 0.015,
          cos(p.y * 5.0 + uTime * 0.5) * 0.015,
          sin(p.z * 5.0 + uTime * 0.5) * 0.015
        );
      }

      void main() {
        vUv = uv;
        vSeed = aSeed;

        vec3 jitter = noise(position) * (0.2 + uProgress * 0.8);
        vec3 basePosition = position + jitter;

        vec3 explodedPosition = basePosition + aRandom * 8.0;
        explodedPosition.y += aRandom.y * uProgress * 6.0;
        explodedPosition.z += aRandom.z * uProgress * 6.0;

        float angle = uProgress * 6.28318;
        mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
        explodedPosition.xz = rot * explodedPosition.xz;

        vec3 finalPosition = mix(basePosition, explodedPosition, uProgress);
        vec4 mvPosition = modelViewMatrix * vec4(finalPosition, 1.0);
        gl_Position = projectionMatrix * mvPosition;

        float grainSize = mix(0.86, 1.32, aSeed);
        float pSize = uPointSize * grainSize * (4.0 / -mvPosition.z) * (1.0 + uProgress * 15.0);
        float dynamicMax = mix(8.0, 100.0, uProgress);
        gl_PointSize = min(pSize, dynamicMax);
      }
    `,
    fragmentShader: `
      uniform sampler2D uTexture;
      uniform float uHasTexture;
      uniform vec3 uColor;
      uniform float uProgress;
      uniform float uFade;
      uniform float uGlowScale;
      uniform float uPreserveColor;

      varying vec2 vUv;
      varying float vSeed;

      float random(float n) {
        return fract(sin(n * 437.143) * 43758.5453123);
      }

      void main() {
        vec2 cxy = 2.0 * gl_PointCoord - 1.0;
        float r = dot(cxy, cxy);
        if (r > 1.0) discard;

        float edgeSoftness = mix(0.6, 0.1, uProgress);
        float alpha = 1.0 - smoothstep(edgeSoftness, 1.0, r);
        float globalAlpha = 1.0 - (uProgress * 0.8);

        vec3 finalColor = uColor;
        if (uHasTexture > 0.5) {
          finalColor = texture2D(uTexture, vUv).rgb;
        }

        vec3 sourceColor = finalColor;
        float luminance = dot(finalColor, vec3(0.299, 0.587, 0.114));
        float blackMass = 1.0 - smoothstep(0.035, 0.24, luminance);
        float lightMass = smoothstep(0.58, 0.92, luminance);
        float grain = 0.82 + random(vSeed) * 0.42;
        float core = exp(-r * mix(4.2, 2.35, random(vSeed + 2.0)));
        float glowBoost = mix(1.9, 3.05, uProgress) * uGlowScale;

        vec3 litColor = finalColor * glowBoost * grain;
        litColor += finalColor * exp(-r * 1.05) * 0.92 * (1.0 - blackMass) * uGlowScale;
        litColor *= mix(1.0, 0.82, lightMass * max(0.0, 1.0 - uGlowScale));
        litColor = min(litColor, vec3(2.12));

        vec3 warmBlack = max(finalColor * 0.9, vec3(0.15, 0.105, 0.065));
        vec3 blackRim = vec3(0.58, 0.29, 0.12) * exp(-r * 1.7) * uGlowScale;
        vec3 visibleBlack = warmBlack + blackRim * 0.5;
        finalColor = mix(litColor, visibleBlack, blackMass * 0.78);

        vec3 preservedBase = sourceColor * mix(1.34, 1.72, uGlowScale) * grain;
        preservedBase += sourceColor * exp(-r * 1.08) * 0.92 * uGlowScale;
        vec3 preservedDark = max(sourceColor * 1.08, vec3(0.055, 0.045, 0.038));
        vec3 preservedColor = mix(preservedBase, preservedDark, blackMass * 0.72);
        preservedColor = min(preservedColor, vec3(1.9));
        finalColor = mix(finalColor, preservedColor, uPreserveColor);
        alpha = max(alpha * core, blackMass * 0.96);

        gl_FragColor = vec4(finalColor, alpha * globalAlpha * uFade);
      }
    `,
    transparent: true,
    depthWrite: true,
    depthTest: true,
    alphaTest: 0.035,
    blending: THREE.NormalBlending
  });
  material.userData.isMaskParticle = true;
  return material;
}

function convertMeshToDemoParticles(THREE, mesh, materialsToUpdate, samplesPerTriangle = 0) {
  const sourceGeometry = mesh.geometry;
  if (!sourceGeometry?.attributes?.position) return;
  const geometry = samplesPerTriangle > 0
    ? createSurfaceParticleGeometry(THREE, sourceGeometry, samplesPerTriangle)
    : sourceGeometry;
  ensureGeometryAttributes(THREE, geometry);

  const sourceMaterial = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
  const map = sourceMaterial?.map || null;
  const color = sourceMaterial?.color ? sourceMaterial.color.clone() : new THREE.Color(0xcc8855);
  const particleMaterial = makeDemoParticleMaterial(THREE, map, color);
  materialsToUpdate.push(particleMaterial);

  const points = new THREE.Points(geometry, particleMaterial);
  points.position.copy(mesh.position);
  points.rotation.copy(mesh.rotation);
  points.scale.copy(mesh.scale);

  const occluderMaterial = new THREE.MeshBasicMaterial({
    colorWrite: false,
    depthWrite: true,
    depthTest: true,
    side: THREE.FrontSide
  });
  const occluderMesh = new THREE.Mesh(sourceGeometry, occluderMaterial);
  occluderMesh.position.copy(mesh.position);
  occluderMesh.rotation.copy(mesh.rotation);
  occluderMesh.scale.copy(mesh.scale);
  occluderMesh.scale.multiplyScalar(0.995);

  const parent = mesh.parent;
  parent.remove(mesh);
  parent.add(points);
  parent.add(occluderMesh);
}

function createDemoMaskObject(THREE, gltf, materialsToUpdate, samplesPerTriangle = 0) {
  const root = new THREE.Group();
  gltf.scene.rotation.set(0, -Math.PI / 2, 0);

  const meshes = [];
  gltf.scene.traverse((child) => {
    if (child.isMesh) meshes.push(child);
  });
  meshes.forEach((mesh) => convertMeshToDemoParticles(THREE, mesh, materialsToUpdate, samplesPerTriangle));

  root.add(gltf.scene);
  normalizeObject(THREE, root);
  return root;
}

function createDemoSandSystem(THREE, count = 720) {
  const sandGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const randoms = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    const radius = 1.0 * Math.sqrt(Math.random());
    const theta = Math.random() * Math.PI * 2;
    positions[i * 3] = radius * Math.cos(theta);
    positions[i * 3 + 1] = (Math.random() - 0.5) * 2.55;
    positions[i * 3 + 2] = radius * Math.sin(theta) * 0.42 - 0.05;
    randoms[i] = Math.random();
  }
  sandGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  sandGeo.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));

  const sandMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(0xffaa44) },
      uFade: { value: 0.56 },
      uSelected: { value: 0.0 }
    },
    vertexShader: `
      uniform float uTime;
      uniform float uSelected;
      attribute float aRandom;
      varying float vAlpha;

      void main() {
        vec3 pos = position;
        float speed = 0.08 + aRandom * 0.15;
        pos.y += uTime * speed;
        pos.y = mod(pos.y + 1.45, 2.9) - 1.45;

        float angle = uTime * (0.05 + aRandom * 0.05) + pos.y * 0.2;
        float radius = length(pos.xz) * (1.0 + uSelected * 0.16);
        pos.x = cos(angle) * radius;
        pos.z = sin(angle) * radius * 0.45 - 0.05;

        pos.x += sin(uTime * 0.3 + aRandom * 10.0) * 0.045;
        pos.z += cos(uTime * 0.3 + aRandom * 10.0) * 0.045;

        vAlpha = smoothstep(-1.45, -0.86, pos.y) * (1.0 - smoothstep(0.86, 1.45, pos.y));
        vAlpha *= (0.15 + aRandom * 0.3) * (1.0 + uSelected * 0.42);

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = (0.7 + aRandom * 1.4 + uSelected * 0.65) * (3.0 / -mvPosition.z);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uFade;
      varying float vAlpha;

      void main() {
        vec2 cxy = 2.0 * gl_PointCoord - 1.0;
        float r = dot(cxy, cxy);
        if (r > 1.0) discard;

        float alpha = exp(-r * 4.0) * vAlpha * uFade;
        gl_FragColor = vec4(uColor * 1.5, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  sandMat.userData.isSandParticle = true;

  return new THREE.Points(sandGeo, sandMat);
}

function layoutGroups() {
  if (!threeState) return;
  const { THREE } = threeState;
  const rect = stage.getBoundingClientRect();
  const aspect = rect.width / Math.max(1, rect.height);
  const viewHeight = 5.65;
  const viewWidth = viewHeight * aspect;
  const cellX = viewWidth / 4;
  const cellY = viewHeight / 2;
  const liftY = cellY * 0.12;

  threeState.camera.left = -viewWidth / 2;
  threeState.camera.right = viewWidth / 2;
  threeState.camera.top = viewHeight / 2;
  threeState.camera.bottom = -viewHeight / 2;
  threeState.camera.updateProjectionMatrix();

  threeState.groups.forEach((group, index) => {
    const col = index % 4;
    const row = Math.floor(index / 4);
    const basePosition = new THREE.Vector3(
      -viewWidth / 2 + cellX * (col + 0.5),
      (row === 0 ? cellY * 0.47 : -cellY * 0.55) + liftY,
      0
    );
    const detailPosition = new THREE.Vector3(
      rect.width < 760 ? 0 : -viewWidth * 0.28,
      rect.width < 760 ? 1.08 : -0.05,
      0
    );
    group.userData.basePosition = basePosition;
    group.userData.detailPosition = detailPosition;
    if (!group.userData.enteringDetail) group.position.copy(basePosition);
  });
}

function resizeRenderer() {
  if (!threeState) return;
  const rect = stage.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 1.55);
  threeState.renderer.setPixelRatio(dpr);
  threeState.renderer.setSize(rect.width, rect.height, false);
  layoutGroups();
}

async function initThreeChoose() {
  try {
    const { THREE, GLTFLoader } = await loadThreeDeps();
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-4, 4, 2.7, -2.7, 0.1, 100);
    camera.position.set(0, 0, 8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setClearAlpha(0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const groups = masks.map((mask, index) => {
      const group = new THREE.Group();
      group.userData.mask = mask;
      group.userData.maskIndex = index;
      group.userData.loaded = false;
      group.userData.selected = false;
      group.userData.reducedGlow = reducedGlowMaskIds.has(mask.id);
      group.userData.samplesPerTriangle = denseParticleMaskIds.has(mask.id) ? 1 : 0;
      group.userData.materials = [];
      scene.add(group);
      return group;
    });

    threeState = { THREE, scene, camera, renderer, groups };
    resizeRenderer();

    scene.add(new THREE.AmbientLight(0xfff1cf, 0.96));

    const loader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();
    async function loadMask(mask, index) {
      const group = groups[index];
      try {
        const gltf = await new Promise((resolve, reject) => {
          loader.load(assetPath(mask.model), resolve, undefined, reject);
        });
        const maskObject = createDemoMaskObject(THREE, gltf, group.userData.materials, group.userData.samplesPerTriangle);
        group.userData.materials.forEach((mat) => {
          mat.uniforms.uFade.value = group.userData.reducedGlow ? 0.9 : (group.userData.samplesPerTriangle > 0 ? 1.08 : 1.02);
          mat.uniforms.uGlowScale.value = group.userData.reducedGlow ? 0.96 : (group.userData.samplesPerTriangle > 0 ? 1.28 : 1.18);
          mat.uniforms.uPreserveColor.value = group.userData.samplesPerTriangle > 0 ? 1.0 : 0.0;
          mat.uniforms.uPointSize.value = 1.28;
        });
        group.add(maskObject);
        group.add(createDemoSandSystem(THREE, 780));
        group.userData.loaded = true;
      } catch (error) {
        const texture = await new Promise((resolve) => {
          textureLoader.load(assetPath(mask.image), resolve, undefined, () => resolve(null));
        });
        if (texture) group.add(makeFallbackPlane(THREE, texture, index));
        group.add(createDemoSandSystem(THREE, 420));
        group.userData.loaded = false;
        grid.querySelector(`[data-index="${index}"]`)?.classList.add("use-fallback");
      }
      const loadedCount = groups.filter((groupItem) => groupItem.children.length > 0).length;
      setStatus(`面具粒子入场 ${loadedCount}/8`);
      if (loadedCount === masks.length) setStatus("点击面具，择面入戏");
    }

    masks.forEach((mask, index) => {
      loadMask(mask, index);
    });

    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const t = clock.getElapsedTime();

      groups.forEach((group) => {
        const selectedMix = group.userData.selected ? 1 : 0;
        const isKaishan = group.userData.mask?.id === kaishanMaskId;
        const isMuted = Boolean(group.userData.transitionMuted);
        group.visible = !(isMuted && detailActive);
        const targetScale = group.userData.enteringDetail
          ? (stage.getBoundingClientRect().width < 760 ? 1.84 : 2.62)
          : (isMuted ? 0.86 : (group.userData.selected ? (isKaishan ? 1.28 : 1.16) : 1));
        const turn = Math.sin(t * 0.24) * (Math.PI / 6);
        group.rotation.y = turn;
        group.rotation.z = Math.sin(t * 0.2) * 0.018;
        group.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.08);
        if (group.userData.enteringDetail && group.userData.detailPosition) {
          group.position.lerp(group.userData.detailPosition, 0.065);
        } else if (group.userData.basePosition) {
          const targetPosition = group.userData.basePosition.clone();
          if (group.userData.selected && group.userData.mask?.id === kaishanMaskId) {
            targetPosition.y -= 0.28;
          }
          group.position.lerp(targetPosition, 0.08);
        }

        group.userData.materials?.forEach((mat) => {
          const isDenseMask = group.userData.samplesPerTriangle > 0;
          const glowScale = group.userData.reducedGlow ? 0.96 : (isDenseMask ? 1.28 : 1.18);
          const selectedGlowScale = group.userData.reducedGlow ? 1.06 : (isDenseMask ? 1.42 : 1.32);
          const fadeTarget = group.userData.reducedGlow
            ? (group.userData.selected ? 1.0 : 0.9)
            : (group.userData.selected ? (isDenseMask ? 1.2 : 1.14) : (isDenseMask ? 1.08 : 1.02));
          const transitionFade = isMuted ? 0 : fadeTarget;
          mat.uniforms.uTime.value += delta;
          mat.uniforms.uProgress.value += (0 - mat.uniforms.uProgress.value) * 0.08;
          mat.uniforms.uFade.value += (transitionFade - mat.uniforms.uFade.value) * 0.08;
          mat.uniforms.uGlowScale.value += ((group.userData.selected ? selectedGlowScale : glowScale) - mat.uniforms.uGlowScale.value) * 0.08;
          mat.uniforms.uPointSize.value += ((group.userData.enteringDetail ? 1.82 : (group.userData.selected ? 1.52 : 1.28)) - mat.uniforms.uPointSize.value) * 0.08;
        });

        group.traverse((node) => {
          if (node.material?.userData?.isSandParticle) {
            node.material.uniforms.uTime.value = t;
            node.material.uniforms.uFade.value = isMuted ? 0 : (group.userData.selected ? 0.72 : 0.52);
            node.material.uniforms.uSelected.value = selectedMix;
          } else if (isMuted && node.material?.transparent && typeof node.material.opacity === "number") {
            node.material.opacity += (0 - node.material.opacity) * 0.12;
          }
        });
      });

      renderer.render(scene, camera);
    }

    animate();
    window.addEventListener("resize", resizeRenderer);
  } catch (error) {
    setStatus("GLB 模型暂不可用，已显示 PNG 兜底");
    grid.classList.add("show-fallbacks");
  }
}

renderHitGrid();
initThreeChoose();
