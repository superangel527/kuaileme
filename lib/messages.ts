import type { ScenarioKey } from "./scenarios";

export type Phase = "early" | "mid" | "late";
export type Category =
  | "praise"
  | "male_flirt"
  | "understanding"
  | "interject"
  | "heart_pierce";

export type ScriptLine = {
  text: string;
  category: Category;
  phase: Phase;
  requiresGender?: "M" | "F";
};

// ─────────────────────────────────────────────────────────────
// 暱稱填入 — 把訊息池裡的 {n} 換成使用者的暱稱
// 同一句裡：第一個 {n} → 暱稱，其餘 → 「她」
// ─────────────────────────────────────────────────────────────
export function renderText(text: string, nickname: string): string {
  const safe = (nickname || "").trim();
  if (!safe) return text.replace(/\{n\}/g, "她");
  let first = true;
  return text.replace(/\{n\}/g, () => {
    if (first) {
      first = false;
      return safe;
    }
    return "她";
  });
}

// ─────────────────────────────────────────────────────────────
// 通用池 — 任何情境都可以混入
// ─────────────────────────────────────────────────────────────

const PRAISE_POOL: string[] = [
  "{n}是不是根本不知道自己很有魅力？",
  "我覺得{n}講話超有感覺欸",
  "{n}感覺超容易讓人偷偷喜歡",
  "{n}是不是都習慣裝沒事？",
  "誰可以告訴我{n}平常都怎麼笑的？",
  "我覺得{n}比{n}以為的還要好看",
  "{n}的氣質有夠耐看",
  "{n}是那種一進房間就會被偷看的人",
  "我每次看到{n}出現就會莫名想笑",
  "{n}那種低調又有存在感的人最危險",
  "我覺得{n}的眼神很故事",
  "{n}講話節奏好舒服 我可以一直聽",
  "光看{n}打字我就想認識{n}",
  "{n}笑起來會把整個聊天室照亮欸",
  "{n}真的是那種會被低估的人",
  "{n}氣質好穩 但又超有靈魂",
  "{n}講一句話可以讓人記三天 真的",
  "{n}是那種看起來淡淡的 但其實心裡很燙的人",
  "{n}是那種讓人想對{n}特別好的人",
  "{n}整個人就是耐看型的",
  "{n}應該是那種一笑就被記住的人",
];

// 男生視角（給男角色講的）— 跨情境通用
const MALE_FLIRT_POOL: string[] = [
  "我會想一直偷看{n}限動",
  "{n}這種人真的很容易讓人暈",
  "{n}是不是很多人默默喜歡？",
  "如果我是{n}朋友 我應該會忍不住偏心{n}",
  "{n}那種嘴硬又溫柔的感覺很要命",
  "{n}不是那種第一眼吵的人 但很容易讓人一直想起來",
  "{n}那種冷冷的反而最致命",
  "我覺得{n}就是那種會讓人偷偷暈很久的人",
  "{n}限動我都會多看兩遍",
  "{n}那種懂事的人最讓人想保護",
  "我都不敢點{n}限動的愛心 怕被發現",
  "{n}不講話的時候我都會想{n}在想什麼",
  "{n}認真起來的樣子真的很有殺傷力",
  "{n}那種笑起來不出聲的人最危險",
  "{n}那種不主動的人最讓人記得",
  "{n}那種講話帶情緒的方式我超喜歡",
  "{n}不需要做什麼 光是出現就會被注意",
  "我覺得{n}應該很多人想追只是不敢",
  "我有時候會點開{n}的對話框 但不知道要打什麼",
  "{n}那種會在意小事的人 我覺得最深情",
];

const UNDERSTANDING_POOL: string[] = [
  "{n}其實撐很久了吧",
  "{n}是不是很久沒有被認真誇獎了？",
  "我覺得{n}身邊的人 都沒有真的在看{n}",
  "{n}笑起來的時候 其實眼睛沒在笑",
  "{n}應該很常一個人偷偷消化情緒對吧",
  "{n}那種懂事 其實是被逼出來的",
  "我覺得{n}很善良 善良到讓人想抱{n}",
  "{n}是不是常常把別人放在自己前面？",
  "{n}那種獨立 是因為沒人能依靠",
  "我覺得{n}其實很想被認真喜歡一次",
  "{n}是不是怕麻煩別人 所以什麼都自己來？",
  "{n}明明在發抖 卻還可以笑著回訊息",
  "我覺得{n}是那種會記得別人生日 但自己生日沒人記得的人",
  "{n}那種強 其實很脆",
  "{n}只是太會掩飾了 不代表{n}不痛",
  "{n}可能根本不知道 {n}已經很努力了",
  "{n}是不是常常被當成最不會崩潰的那個？",
  "{n}明明也想被照顧 卻一直照顧別人",
  "{n}真的不需要那麼乖了",
];

// 插話 — 短句口語、有人在搶話
const INTERJECT_POOL: string[] = [
  "笑死 我也這樣想",
  "+1 {n}真的有那種感覺",
  "等等 {n}是不是自己都不知道？",
  "我懂你說的那種",
  "對 {n}就是那種會讓人偷偷注意的人",
  "{n}太會裝沒事了吧",
  "認同",
  "我也是這樣想欸",
  "靠 你說中了",
  "+1",
  "真的",
  "我也覺得",
  "對對對",
  "靠 我也是",
  "懂",
  "幹 真的",
  "喂這太準了吧",
  "笑死 怎麼這麼準",
  "你是不是認識{n}",
  "等等 我也想說這個",
  "靠 樓上講得太對了",
  "+1 認真的",
  "蛤 為什麼這麼準",
  "對 {n}就是這樣",
  "幹我也想說",
  "認同樓上",
];

// 純活人感 — 短到不行、像群組亂插話
const ALIVE_POOL: string[] = [
  "哈哈",
  "靠",
  "笑死",
  "我懂",
  "+1",
  "蛤",
  "等等",
  "真的",
  "對啊",
  "對對對",
  "我就說吧",
  "幹",
  "哈哈哈",
  "蛤 我也是",
  "+1 認真的",
  "心疼",
  "心疼欸",
  "靠 心疼",
  "媽我哭了",
  "蛤 突然有點難過",
  "為什麼這麼準",
  "靠 太準",
  "+1 我也想說",
  "蛤 真假",
];

const HEART_PIERCE_POOL: string[] = [
  "{n}其實沒有自己說的那麼糟。",
  "{n}只是太習慣自己撐。",
  "{n}值得被一個不會讓{n}失望的人喜歡。",
  "{n}從來不是不夠好 {n}只是太久沒人告訴{n}{n}很好。",
  "{n}可以哭 沒有人會覺得{n}很弱。",
  "{n}不用再證明什麼了 真的。",
  "{n}已經是這個聊天室裡 大家最捨不得的那個。",
  "{n}不需要更努力 {n}需要被認真喜歡一次。",
  "{n}比{n}想像中的還要被在乎。",
  "{n}是不是都假裝沒事？",
  "{n}其實只是很久沒被好好喜歡了。",
  "{n}不是不夠好 是太常把自己放最後。",
  "其實大家都看得出來 {n}真的很努力。",
];

const VAGUE_EMPATHY_POOL: string[] = [
  "{n}感覺最近狀態不太好",
  "{n}是不是最近很多事卡在一起？",
  "感覺{n}最近很累",
  "{n}是不是都習慣自己撐？",
  "{n}最近是不是有點悶？",
  "我感覺{n}最近想說又不知道怎麼說",
  "{n}那種沒事的樣子 其實最讓人擔心",
  "{n}是不是有什麼放在心裡很久了",
  "{n}是不是一個人扛太多了",
  "最近{n}整個人好像悶悶的",
  "{n}是不是又把心事吞下去了",
  "我覺得{n}最近真的需要被好好抱一下",
  "{n}是不是又在裝沒事？",
  "感覺{n}只是想被接住一下",
];

const REACT_OPENERS: string[] = [
  "我就知道{n}最近狀態不好",
  "{n}又這樣了",
  "{n}又把心事丟出來了",
  "靠 {n}又這樣了",
  "心疼{n}欸",
  "{n}就是這樣",
  "{n}又自己撐了",
  "我有預感{n}最近不好",
  "蛤 {n}又這樣了",
  "{n}是不是又在硬撐",
  "唉 {n}真的辛苦",
  "我就知道{n}在憋",
];

// ─────────────────────────────────────────────────────────────
// 情境特化池 — 13 個 scenario keys × {praise, understanding, hearts}
// 內容來自 V1+V2+V3 docx
// ─────────────────────────────────────────────────────────────

type ScenarioContent = {
  praise: string[];
  understanding: string[];
  hearts: string[];
};

const SCENARIO_POOL: Record<ScenarioKey, ScenarioContent> = {
  appearance_face: {
    praise: [
      "{n}的氣質感覺很乾淨",
      "{n}感覺很耐看欸",
      "{n}應該很適合穿白色",
      "{n}是不是有種淡淡的高級感？",
      "我覺得{n}笑起來一定很療癒",
      "{n}感覺很像會香香的人",
      "{n}應該很適合留長頭髮",
      "{n}感覺不像會很兇的人",
      "{n}感覺有種舒服的漂亮",
      "{n}是不是很適合被偷拍側臉？",
      "{n}應該很容易讓人想一直看",
      "{n}有種溫柔的大人感",
      "{n}其實超耐看",
      "{n}感覺很有氣質",
    ],
    understanding: [
      "{n}是不是太在意別人眼光？",
      "{n}是不是都沒發現自己很可愛？",
      "{n}根本沒有自己想的那麼差",
      "{n}是不是常常照鏡子覺得不夠？",
      "{n}應該是那種別人都覺得好看 自己卻一直挑剔的人",
    ],
    hearts: [
      "{n}的長相沒有自己想的那麼糟 真的。",
      "別人看{n}的時候 看到的是整體的{n} 不是放大鏡。",
      "{n}已經很可愛了 真的。",
    ],
  },

  appearance_body: {
    praise: [
      "{n}身上有種很乾淨的能量欸",
      "{n}那種比例其實很耐看",
      "{n}感覺穿什麼都好看",
      "{n}是那種有自己氣場的人",
      "{n}應該很適合穿oversized",
    ],
    understanding: [
      "{n}是不是又在跟別人比身材了？",
      "{n}是不是常常照鏡子覺得不夠？",
      "{n}應該很久沒有對自己滿意了",
      "{n}的審美比自己以為的還嚴格",
      "{n}是不是常常吃完東西就後悔？",
    ],
    hearts: [
      "{n}的身體不需要長成別人喜歡的樣子。",
      "{n}已經夠好了 真的不用再對自己這麼苛刻。",
      "{n}值得用更溫柔的方式對待自己。",
    ],
  },

  love: {
    praise: [
      "{n}感覺一談戀愛就很認真",
      "{n}應該會很寵另一半",
      "{n}感覺談戀愛會很黏",
      "如果有人擁有{n}，應該很幸福",
      "{n}其實很適合長久關係",
      "{n}感覺不像玩玩的人",
      "感覺{n}一旦愛上會很深",
      "{n}應該很容易因為一句話胡思亂想",
      "{n}是不是很多人默默喜歡？",
      "{n}是不是不知道有人偷偷喜歡{n}？",
      "{n}那種感覺很容易讓人暈",
    ],
    understanding: [
      "{n}是不是又在腦補對方在想什麼？",
      "{n}是不是太容易心軟了？",
      "{n}應該很怕主動 又很想被主動",
      "{n}是不是默默為對方做了很多 對方沒發現？",
      "{n}是不是一直在等對方先動？",
    ],
    hearts: [
      "{n}值得一個會主動靠近{n}的人。",
      "{n}不需要再小心翼翼了。",
      "{n}愛人的方式 本來就值得被好好回應。",
    ],
  },

  breakup: {
    praise: [
      "失去{n} 是那個人的損失 不是{n}的",
      "{n}值得比上一段更好的東西",
      "{n}對人那麼好 那個人居然還可以走",
    ],
    understanding: [
      "{n}是不是其實還沒放下？",
      "{n}是不是看到訊息還會難過？",
      "{n}應該很久沒被偏愛了",
      "{n}是不是被傷過很多次？",
      "{n}是不是總遇到不懂珍惜的人？",
      "{n}那種痛 不是因為對方多好 是因為{n}付出太多",
      "{n}那種人會記得每一個細節 所以才痛這麼久",
    ],
    hearts: [
      "{n}沒有被甩 {n}只是離開了不適合{n}的地方。",
      "{n}下一段感情 會被認真喜歡 我相信。",
      "{n}值得一個不會讓{n}懷疑自己的人。",
    ],
  },

  money: {
    praise: [
      "{n}現在窮 不代表{n}以後窮",
      "{n}那種人會起來的 我看得出來",
      "{n}的氣質根本沒有窮過 真的",
      "{n}感覺其實很拼",
      "{n}應該比很多人努力",
      "{n}其實比很多人更認真生活",
      "{n}應該已經很努力在撐生活了",
    ],
    understanding: [
      "{n}是不是壓力大到睡不好？",
      "{n}是不是都默默在算錢？",
      "{n}應該很久沒有好好買自己想買的東西了",
      "{n}是不是最近壓力很大？",
      "感覺{n}一直在想辦法撐生活",
      "{n}是不是很久沒亂花錢了",
      "{n}其實只是想輕鬆一點",
      "{n}應該很累但不敢停",
      "{n}是不是很少跟別人說自己的壓力？",
    ],
    hearts: [
      "{n}現在卡關 不代表{n}沒有未來。",
      "{n}那種人會起來的 而且會起得很漂亮。",
      "{n}其實值得更好的運氣。",
    ],
  },

  work: {
    praise: [
      "{n}主管八成不知道自己有多幸運可以遇到{n}",
      "{n}那種人在哪間公司 都是被低估的那個",
    ],
    understanding: [
      "{n}是不是又在公司受委屈了？",
      "{n}感覺很常被當成理所當然",
      "{n}是不是都不敢反抗？",
      "{n}其實沒有那麼弱",
      "{n}感覺一直在忍耐",
      "{n}是不是很怕衝突？",
      "{n}其實比那些人善良太多",
      "{n}感覺總是先檢討自己",
      "{n}是不是被情緒勒索很久了？",
      "{n}應該很想離開那個環境吧",
      "{n}感覺真的很累",
      "{n}是不是一直逼自己撐下去？",
      "{n}感覺太容易心軟",
      "{n}是不是很久沒有被好好肯定了？",
    ],
    hearts: [
      "{n}其實值得被尊重。",
      "{n}不是不夠強 {n}是被放在錯的位置。",
      "{n}值得一份不用{n}燃燒自己才能完成的工作。",
    ],
  },

  boss: {
    praise: [
      "{n}老闆是不是根本不懂珍惜人？",
      "{n}是那種任何老闆都會偷偷依賴的人",
    ],
    understanding: [
      "{n}是不是又加班了？",
      "{n}感覺很久沒有真正下班",
      "{n}是不是都把疲憊藏起來？",
      "{n}是不是常常累到不想說話？",
      "{n}感覺一直在燃燒自己",
      "{n}應該很想逃離現在的生活吧",
      "{n}是不是連哭都不敢哭？",
      "{n}感覺一直被消耗",
      "{n}是不是很久沒有被稱讚了？",
      "{n}感覺一直在硬撐",
      "{n}應該很久沒真正休息了",
    ],
    hearts: [
      "{n}其實不是不夠好，是環境太爛。",
      "{n}其實值得更好的工作。",
      "{n}值得更溫柔的人生。",
    ],
  },

  family: {
    praise: [
      "{n}應該是家裡最讓人放心的那一個",
      "{n}從小應該就比同齡人成熟",
    ],
    understanding: [
      "{n}是不是很怕讓家人失望？",
      "感覺{n}從小就很懂事",
      "{n}是不是都把壓力吞下去？",
      "{n}應該很少真正做自己",
      "{n}是不是什麼都自己扛？",
      "感覺{n}很久沒被照顧了",
      "{n}是不是連哭都沒時間？",
      "{n}是不是常常被家人理所當然？",
    ],
    hearts: [
      "{n}其實很需要被支持。",
      "{n}其實很值得被愛。",
      "{n}不該再為了不愛{n}的方式委屈自己。",
    ],
  },

  lonely: {
    praise: [
      "{n}應該是那種就算沒人也能自己過得很好的人",
      "{n}應該是會默默幫別人記住小事的那種",
    ],
    understanding: [
      "{n}是不是半夜都睡不太著？",
      "感覺{n}很多話都沒地方說",
      "{n}是不是其實很怕孤單？",
      "{n}感覺很久沒被抱抱了",
      "我覺得{n}只是想有人陪",
      "{n}是不是很久沒被人主動找了",
      "{n}是不是不太敢麻煩別人？",
    ],
    hearts: [
      "{n}不需要更多人 {n}需要一個對的人。",
      "{n}該被一個會記得{n}小細節的人擁有。",
    ],
  },

  confidence: {
    praise: [
      "{n}說自己不夠好 我反而覺得{n}比{n}以為的好太多",
      "{n}那種覺得自己不夠 是因為{n}標準太高",
      "{n}其實比自己想像的更好",
      "{n}根本不知道自己很有魅力",
    ],
    understanding: [
      "{n}從小是不是就一直被要求要更好？",
      "{n}其實很有才華 只是{n}不敢承認",
      "{n}那種自我懷疑 是因為{n}認真到不行",
      "{n}是不是太常否定自己？",
      "{n}感覺很怕自己不被喜歡",
      "{n}是不是很容易內耗？",
    ],
    hearts: [
      "{n}不是不夠 {n}只是被太多人忽略了{n}有多夠。",
      "{n}不需要變成誰 {n}已經是很好的{n}了。",
    ],
  },

  tired: {
    praise: [
      "{n}今天看起來累成這樣 還在硬撐喔？",
      "{n}平常一定都把累藏得很好對吧",
    ],
    understanding: [
      "{n}是不是已經累到不知道自己有多累了",
      "{n}那種累 是長期累積的 不是今天的事",
      "{n}應該很久沒有理直氣壯地說『我不行了』",
      "{n}是不是快撐不住了？",
      "感覺{n}最近一直在壓抑",
      "{n}是不是很久沒真正哭出來？",
      "{n}其實只是太累了",
      "{n}應該很需要有人接住{n}",
      "{n}應該很累但還是沒放棄",
    ],
    hearts: [
      "{n}不是不努力 {n}是太久沒有休息。",
      "{n}可以躺著 什麼都不做 那也是{n}的權利。",
      "{n}值得一個沒有罪惡感的長假。",
    ],
  },

  liked: {
    praise: [
      "如果我認識{n} 我應該會默默喜歡{n}",
      "{n}有種讓人很想靠近的感覺",
      "感覺{n}很適合被好好愛",
      "{n}應該很容易讓人日久生情",
      "{n}不是第一眼超驚艷型 但會越看越喜歡",
      "{n}感覺會讓人想保護",
      "我覺得{n}本人一定比照片更有感覺",
      "{n}有種很真實的吸引力",
      "{n}是不是很常低估自己？",
      "{n}說只是想被喜歡一下 我心軟了",
    ],
    understanding: [
      "{n}是不是已經很久沒有被人主動找了",
      "{n}不是不被喜歡 {n}是太常被當作理所當然",
      "{n}應該很久沒被放第一順位",
      "{n}其實也想被偏心",
    ],
    hearts: [
      "{n}不只是想被喜歡 {n}是想被看見。",
      "{n}值得一個會主動靠近{n}的人。",
      "{n}應該天天被誇 才是正常的。",
    ],
  },

  unknown: {
    praise: [],
    understanding: [],
    hearts: [],
  },
};

// ─────────────────────────────────────────────────────────────
// 每個 phase 的類別 mix
// ─────────────────────────────────────────────────────────────

const PHASE_MIX: Record<Phase, Category[]> = {
  early: [
    "praise",
    "praise",
    "praise",
    "praise",
    "male_flirt",
    "male_flirt",
    "male_flirt",
    "interject",
  ],
  mid: [
    "understanding",
    "understanding",
    "understanding",
    "praise",
    "male_flirt",
    "male_flirt",
    "interject",
    "interject",
    "interject",
  ],
  late: [
    "heart_pierce",
    "heart_pierce",
    "heart_pierce",
    "understanding",
    "praise",
  ],
};

// ─────────────────────────────────────────────────────────────
// 工具
// ─────────────────────────────────────────────────────────────

function pickOne<T>(arr: T[], usedSet: Set<T>): T {
  const available = arr.filter((x) => !usedSet.has(x));
  const src = available.length > 0 ? available : arr;
  const picked = src[Math.floor(Math.random() * src.length)];
  usedSet.add(picked);
  return picked;
}

// 把通用池跟情境池混合 — 情境池內容優先
function poolFor(
  category: Exclude<Category, "interject" | "male_flirt">,
  scenario: ScenarioKey
): string[] {
  const sc = SCENARIO_POOL[scenario] ?? SCENARIO_POOL.unknown;
  if (category === "praise") return [...sc.praise, ...PRAISE_POOL];
  if (category === "understanding")
    return [...sc.understanding, ...UNDERSTANDING_POOL];
  // heart_pierce
  return [...sc.hearts, ...HEART_PIERCE_POOL];
}

// ─────────────────────────────────────────────────────────────
// Cue 互動 — 聊天室「點名你」的特殊時刻
// ─────────────────────────────────────────────────────────────

// 過渡訊息 — Cue 卡出現前一秒先有人說一句，鋪陳「要點名了」
const CUE_TRANSITION_POOL: string[] = [
  "欸等等，{n}是不是還在看聊天室？",
  "我感覺{n}很多事沒講欸",
  "你們覺得{n}現在在想什麼？",
  "我突然好想直接問{n}…",
  "{n}是不是其實很想被多問一句？",
  "可以直接問{n}嗎",
];

// Cue 卡的問句 — 唯一直接對使用者說話的時刻、要戳心
const CUE_QUESTION_POOL: string[] = [
  "{n}，妳今天是不是其實很累？",
  "{n}，妳是不是很少跟別人說真心話？",
  "{n}，如果現在有人抱抱妳，妳會想哭嗎？",
  "{n}，妳是不是其實很久沒被偏愛了？",
  "{n}，妳上一次大哭是什麼時候？",
  "{n}，妳最近最累的是哪件事？",
  "{n}，妳今天最希望聽到誰跟妳說一句話？",
  "{n}，如果現在可以好好休息一下，妳最想逃去哪裡？",
];

export type CueScript = { question: string; transition: string };

export function pickCueScripts(count: number): CueScript[] {
  const usedQ = new Set<string>();
  const usedT = new Set<string>();
  const out: CueScript[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      question: pickOne(CUE_QUESTION_POOL, usedQ),
      transition: pickOne(CUE_TRANSITION_POOL, usedT),
    });
  }
  return out;
}

// 使用者回完 Cue 後 聊天室延伸討論的句子（不引用她字面）
export function buildCueReactions(
  scenario: ScenarioKey,
  count: number = 6
): ScriptLine[] {
  const used = new Set<string>();
  const out: ScriptLine[] = [];
  // mix：開頭呼應 + 短反應 + 1 句有深度的 understanding/praise
  const slots: Array<
    "opener" | "alive" | "understanding" | "praise" | "interject"
  > = [
    "opener",
    "alive",
    "understanding",
    "alive",
    "praise",
    "interject",
    "understanding",
    "alive",
  ];
  for (let i = 0; i < count; i++) {
    const slot = slots[i % slots.length];
    let text: string;
    let category: Category = "interject";
    if (slot === "opener") {
      text = pickOne(REACT_OPENERS, used);
      category = "interject";
    } else if (slot === "alive") {
      text = pickOne(ALIVE_POOL, used);
      category = "interject";
    } else if (slot === "interject") {
      text = pickOne(INTERJECT_POOL, used);
      category = "interject";
    } else if (slot === "praise") {
      text = pickOne(poolFor("praise", scenario), used);
      category = "praise";
    } else {
      text = pickOne(poolFor("understanding", scenario), used);
      category = "understanding";
    }
    out.push({ text, category, phase: "mid" });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────
// 主要 API — 自動 script（聊天室一進去自動跑 180 秒）
// ─────────────────────────────────────────────────────────────

export function buildScript(
  scenario: ScenarioKey,
  phaseCounts: { early: number; mid: number; late: number }
): ScriptLine[] {
  const used = new Set<string>();
  const out: ScriptLine[] = [];

  (["early", "mid", "late"] as Phase[]).forEach((phase) => {
    const mix = PHASE_MIX[phase];
    for (let i = 0; i < phaseCounts[phase]; i++) {
      const category = mix[Math.floor(Math.random() * mix.length)];
      let text: string;
      let requiresGender: "M" | undefined;

      if (category === "interject") {
        text = pickOne(INTERJECT_POOL, used);
      } else if (category === "male_flirt") {
        text = pickOne(MALE_FLIRT_POOL, used);
        requiresGender = "M";
      } else {
        text = pickOne(poolFor(category, scenario), used);
      }
      const line: ScriptLine = { text, category, phase };
      if (requiresGender) line.requiresGender = requiresGender;
      out.push(line);
    }
  });

  return out;
}

// ─────────────────────────────────────────────────────────────
// 反應 burst — 使用者打字後的圍觀
// ─────────────────────────────────────────────────────────────

const REACTION_TEMPLATE_TARGETED: Array<
  "opener" | "praise" | "understanding" | "alive" | "male_flirt"
> = [
  "opener",
  "alive",
  "understanding",
  "alive",
  "praise",
  "male_flirt",
  "understanding",
  "alive",
  "praise",
];

const REACTION_TEMPLATE_FUZZY: Array<"vague" | "alive" | "male_flirt"> = [
  "vague",
  "alive",
  "vague",
  "alive",
  "vague",
  "alive",
  "male_flirt",
  "vague",
  "alive",
];

export function buildReactionBurst(
  userInput: string,
  scenario: ScenarioKey,
  count: number = 6
): ScriptLine[] {
  const used = new Set<string>();
  const out: ScriptLine[] = [];
  const isFuzzy = scenario === "unknown";

  for (let i = 0; i < count; i++) {
    let text: string;
    let category: Category = "interject";
    let requiresGender: "M" | undefined;

    if (isFuzzy) {
      const slot = REACTION_TEMPLATE_FUZZY[i % REACTION_TEMPLATE_FUZZY.length];
      if (slot === "vague") {
        text = pickOne(VAGUE_EMPATHY_POOL, used);
        category = "understanding";
      } else if (slot === "alive") {
        text = pickOne(ALIVE_POOL, used);
        category = "interject";
      } else {
        text = pickOne(MALE_FLIRT_POOL, used);
        category = "male_flirt";
        requiresGender = "M";
      }
    } else {
      const slot =
        REACTION_TEMPLATE_TARGETED[i % REACTION_TEMPLATE_TARGETED.length];
      if (slot === "opener") {
        text = pickOne(REACT_OPENERS, used);
        category = "interject";
      } else if (slot === "alive") {
        text = pickOne(ALIVE_POOL, used);
        category = "interject";
      } else if (slot === "praise") {
        text = pickOne(poolFor("praise", scenario), used);
        category = "praise";
      } else if (slot === "understanding") {
        text = pickOne(poolFor("understanding", scenario), used);
        category = "understanding";
      } else {
        text = pickOne(MALE_FLIRT_POOL, used);
        category = "male_flirt";
        requiresGender = "M";
      }
    }

    const line: ScriptLine = { text, category, phase: "early" };
    if (requiresGender) line.requiresGender = requiresGender;
    out.push(line);
  }

  return out;
}
