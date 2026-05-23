// ── Trie-based word validator ──────────────────────────────────────────────
// Loaded once at server startup. ~200k words, ~15MB RAM, ~200ms load.
// Never hits a database per validation — O(n) where n = word length.

class TrieNode {
  children = new Map<string, TrieNode>();
  isEnd = false;
}

class Trie {
  private root = new TrieNode();

  insert(word: string): void {
    let node = this.root;
    for (const ch of word) {
      if (!node.children.has(ch)) node.children.set(ch, new TrieNode());
      node = node.children.get(ch)!;
    }
    node.isEnd = true;
  }

  has(word: string): boolean {
    let node = this.root;
    for (const ch of word) {
      if (!node.children.has(ch)) return false;
      node = node.children.get(ch)!;
    }
    return node.isEnd;
  }

  size(): number {
    let count = 0;
    const stack = [this.root];
    while (stack.length) {
      const node = stack.pop()!;
      if (node.isEnd) count++;
      for (const child of node.children.values()) stack.push(child);
    }
    return count;
  }
}

// ── Embedded dictionary (MVP — 500 common words) ───────────────────────────
// In production: load from src/dictionary/en.txt (200k words)
const WORD_LIST = [
  "apple","anchor","arrow","arch","angle","asset","able","acid","acre","aged",
  "brave","blade","blast","bloom","bound","burns","back","bail","bake","bald",
  "chain","charm","chase","clear","climb","coral","cafe","cage","cake","calm",
  "dawn","dock","dust","dune","draft","drive","damp","dare","dark","data",
  "eagle","earth","elder","elite","enter","event","each","earn","ease","edge",
  "flame","flash","fleet","float","forge","frost","face","fact","fade","fail",
  "gold","gate","glow","gust","grace","grand","gain","gale","game","gang",
  "horse","heart","hill","haze","honor","heavy","hack","hail","hair","half",
  "image","index","inner","issue","ivory","ideal","icon","idea","idle","inch",
  "judge","juice","joker","jewel","joint","jumps","jack","jade","jail","jolt",
  "king","keen","knot","knife","karma","knock","kale","keen","kelp","kind",
  "light","lance","lore","lake","leaf","level","lace","lack","laid","lake",
  "moon","mist","mind","maze","melt","mode","mace","made","mail","main",
  "noble","nerve","north","nail","night","near","name","nape","navy","neck",
  "ocean","order","outer","orbit","olive","open","oath","obey","odds","omen",
  "pulse","phase","point","power","price","prime","pace","pack","page","paid",
  "quest","quick","quiet","quote","query","quake","quad","quay","quip","quiz",
  "river","rope","rain","reef","rise","road","race","rack","rage","raid",
  "spark","stone","slope","surge","shift","smart","safe","sage","sail","sake",
  "tower","trace","trail","tide","trust","track","tale","tall","tame","tape",
  "under","union","urban","ultra","unit","usage","ugly","ulna","undo","unit",
  "voice","vivid","valve","vapor","visit","vocal","vain","vale","vane","vast",
  "wave","wind","wall","wade","watch","world","wail","wake","walk","wand",
  "xenon","xray","xerox",
  "yield","young","yacht","yearn","youth","yodel","yank","yard","yarn","yawn",
  "zebra","zone","zero","zenith","zesty","zoom","zeal","zest","zinc","zion",
  // Extended common words
  "table","tiger","train","water","earth","cloud","bread","chair","clock","dance",
  "dream","drink","drive","eagle","early","empty","enemy","enjoy","enter","equal",
  "every","exact","exist","extra","faint","faith","false","fancy","fault","feast",
  "field","fight","final","first","fixed","flame","flesh","floor","focus","force",
  "found","frame","frank","fresh","front","fruit","fully","funny","giant","given",
  "glass","globe","gloom","glory","glove","going","grace","grade","grain","grand",
  "grant","grasp","grass","grave","great","green","greet","grief","grill","grind",
  "groan","group","grove","grown","guard","guess","guide","guild","guilt","guise",
  "happy","harsh","haste","haven","heart","heavy","hence","herbs","hinge","honor",
  "house","human","humor","hurry","ideal","image","imply","index","inner","input",
  "inter","intro","issue","ivory","japan","jewel","joint","joker","judge","juice",
  "jumbo","karma","kneel","knife","knock","known","label","lance","large","laser",
  "later","laugh","layer","learn","least","leave","legal","lemon","level","light",
  "limit","linen","liver","local","lodge","logic","loose","lover","lower","lucky",
  "lunar","magic","major","maker","manor","maple","march","match","mayor","media",
  "mercy","merit","metal","might","minor","minus","model","money","month","moral",
  "motor","mount","mouse","mouth","movie","music","naive","nerve","never","night",
  "noise","north","noted","novel","nurse","nymph","occur","offer","often","olive",
  "onset","opera","orbit","order","other","outer","owner","oxide","ozone","paint",
  "panel","paper","party","pasta","patch","pause","peace","pearl","penny","phase",
  "phone","photo","piano","pilot","pixel","pizza","place","plain","plane","plant",
  "plate","plaza","plead","pluck","plumb","plume","plunge","point","polar","pound",
  "power","press","price","pride","prime","print","prior","prize","probe","proof",
  "prose","proud","prove","proxy","psalm","pulse","punch","pupil","queen","queue",
  "quick","quiet","quota","quote","radar","radio","raise","rally","range","rapid",
  "ratio","reach","ready","realm","rebel","refer","reign","relax","relay","repay",
  "reply","rider","ridge","rifle","right","rigid","risky","rival","robin","robot",
  "rocky","rouge","rough","round","route","royal","rugby","ruler","rural","rusty",
  "sadly","saint","salad","sauce","scale","scene","score","scout","seize","sense",
  "serve","seven","shade","shake","shall","shame","shape","share","shark","sharp",
  "sheer","shelf","shell","shift","shine","shirt","shock","shoot","shore","short",
  "shout","sight","sigma","silly","since","sixth","sixty","sized","skill","skull",
  "slate","slave","sleep","slice","slide","slime","slope","small","smart","smell",
  "smile","smoke","snake","solar","solid","solve","sorry","south","space","spare",
  "speak","speed","spend","spice","spill","spine","spite","split","spoke","spoon",
  "sport","spray","squad","stack","staff","stage","stain","stair","stake","stale",
  "stall","stamp","stand","stark","start","state","stays","steam","steel","steep",
  "steer","stern","stick","stiff","still","stock","stomp","stood","store","storm",
  "story","stove","strap","straw","stray","strip","stuck","study","stuff","style",
  "sugar","suite","sunny","super","surge","swamp","swear","sweep","sweet","swift",
  "swing","sword","sworn","syrup","taken","taste","teach","teeth","tempo","tense",
  "tenth","terms","thank","theme","there","thick","thing","think","third","thorn",
  "those","three","threw","throw","thumb","tidal","tiger","tight","timer","tired",
  "title","today","token","tonal","topic","total","touch","tough","toxic","trace",
  "trade","trail","train","trait","tramp","trash","treat","trend","trial","tribe",
  "trick","tried","troop","trout","truck","truly","trump","trunk","trust","truth",
  "tumor","tuner","tunic","tuple","twice","twist","tying","ultra","uncle","under",
  "unify","union","unite","unity","until","upper","upset","urban","usage","usual",
  "utter","valid","value","valve","video","vigor","viral","virus","visit","vista",
  "vital","vivid","vocal","vodka","voice","voter","vague","vault","venom","verse",
  "vicar","villa","viola","viper","viral","virus","visit","vista","vital","vivid",
  "wager","wagon","waist","waste","watch","water","weary","weave","wedge","weigh",
  "weird","whale","wheat","wheel","where","which","while","white","whole","whose",
  "wider","witch","woman","women","woods","wordy","worse","worst","worth","would",
  "wound","wrath","wrist","write","wrong","yacht","yearn","yield","young","youth",
  "zebra","zonal",
];

const dictionary = new Trie();
WORD_LIST.forEach(w => dictionary.insert(w.toLowerCase()));

console.log(`[Dictionary] Loaded ${dictionary.size()} words`);

// ── Validation function ────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateWord(
  word: string,
  lastWord: string,
  usedWords: Set<string>
): ValidationResult {
  const w = word.toLowerCase().trim();

  if (w.length < 2)       return { valid: false, reason: "Too short (min 2 letters)" };
  if (w.length > 45)      return { valid: false, reason: "Too long" };
  if (!/^[a-z]+$/.test(w)) return { valid: false, reason: "Letters only" };
  if (usedWords.has(w))   return { valid: false, reason: "Already used" };

  if (lastWord) {
    const required = lastWord.slice(-1).toLowerCase();
    if (w[0] !== required) {
      return { valid: false, reason: `Must start with "${required.toUpperCase()}"` };
    }
  }

  if (!dictionary.has(w)) return { valid: false, reason: "Not a valid word" };

  return { valid: true };
}

export function isInDictionary(word: string): boolean {
  return dictionary.has(word.toLowerCase().trim());
}
