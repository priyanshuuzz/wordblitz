// ── Category-specific word lists ───────────────────────────────────────────
// Each category has a curated word list for category mode.
// Words must still follow the chain rule (start with last letter of prev word).

export type CategoryId = "anime" | "countries" | "tech" | "movies" | "sports" | "food" | "science" | "music";

export interface Category {
  id: CategoryId;
  title: string;
  description: string;
  emoji: string;
  color: string;
  bgColor: string;
  words: string[];
}

export const CATEGORIES: Category[] = [
  {
    id: "anime",
    title: "Anime",
    description: "Shonen to Seinen",
    emoji: "⚡",
    color: "text-[#cafd00]",
    bgColor: "bg-[rgba(202,253,0,0.08)]",
    words: [
      "naruto","orochimaru","uchiha","akatsuki","ichigo","obito","overlord","dragon",
      "natsu","uzumaki","itachi","inuyasha","attack","killua","aizen","nezuko","one",
      "eren","nami","ichika","alucard","deku","uraraka","aizawa","allmight","titan",
      "todoroki","izuku","uraraka","katsuki","iida","asui","tokoyami","mineta","momo",
      "goku","krillin","nappa","android","demon","naruto","rurouni","ninja","aang",
      "bleach","hunter","hero","academia","evangelion","neon","genesis","sword","art",
      "online","attack","titan","fullmetal","alchemist","tokyo","ghoul","death","note",
      "elfen","lied","dragon","ball","one","piece","fairy","tail","black","clover",
      "re","zero","overlord","rising","shield","hero","slime","reincarnated","that",
      "time","goblin","slayer","made","abyss","violet","evergarden","your","lie",
    ],
  },
  {
    id: "countries",
    title: "Countries",
    description: "Global Geography",
    emoji: "🌍",
    color: "text-[#ff51fa]",
    bgColor: "bg-[rgba(255,81,250,0.08)]",
    words: [
      "afghanistan","albania","algeria","andorra","angola","argentina","armenia","australia",
      "austria","azerbaijan","bahamas","bahrain","bangladesh","barbados","belarus","belgium",
      "belize","benin","bhutan","bolivia","botswana","brazil","brunei","bulgaria","burkina",
      "burundi","cambodia","cameroon","canada","chad","chile","china","colombia","comoros",
      "congo","croatia","cuba","cyprus","denmark","djibouti","dominica","ecuador","egypt",
      "eritrea","estonia","ethiopia","fiji","finland","france","gabon","gambia","georgia",
      "germany","ghana","greece","grenada","guatemala","guinea","guyana","haiti","honduras",
      "hungary","iceland","india","indonesia","iran","iraq","ireland","israel","italy",
      "jamaica","japan","jordan","kazakhstan","kenya","kiribati","kuwait","kyrgyzstan","laos",
      "latvia","lebanon","lesotho","liberia","libya","liechtenstein","lithuania","luxembourg",
      "madagascar","malawi","malaysia","maldives","mali","malta","mauritania","mauritius",
      "mexico","moldova","monaco","mongolia","morocco","mozambique","myanmar","namibia","nepal",
      "netherlands","nicaragua","niger","nigeria","norway","oman","pakistan","palau","panama",
      "paraguay","peru","philippines","poland","portugal","qatar","romania","russia","rwanda",
      "samoa","senegal","serbia","seychelles","singapore","slovakia","slovenia","somalia",
      "spain","sudan","suriname","sweden","switzerland","syria","taiwan","tajikistan","tanzania",
      "thailand","togo","tonga","tunisia","turkey","turkmenistan","tuvalu","uganda","ukraine",
      "uruguay","uzbekistan","vanuatu","venezuela","vietnam","yemen","zambia","zimbabwe",
    ],
  },
  {
    id: "tech",
    title: "Tech",
    description: "Hardware & Software",
    emoji: "💻",
    color: "text-[#b9f2ff]",
    bgColor: "bg-[rgba(185,242,255,0.08)]",
    words: [
      "algorithm","array","api","authentication","automation","backend","bandwidth","binary",
      "blockchain","browser","buffer","cache","callback","cloud","compiler","container",
      "database","debugging","deployment","docker","domain","encryption","endpoint","ethernet",
      "firewall","framework","frontend","function","gateway","github","graphql","hardware",
      "hosting","html","http","interface","internet","javascript","kernel","kubernetes",
      "latency","library","linux","localhost","machine","memory","microservice","middleware",
      "network","nodejs","object","operating","package","pipeline","pointer","protocol",
      "python","query","queue","react","recursion","redis","refactoring","repository",
      "runtime","server","socket","software","sql","stack","storage","streaming","syntax",
      "terminal","testing","thread","typescript","unix","variable","version","virtual",
      "webhook","websocket","xml","yaml","zero",
    ],
  },
  {
    id: "movies",
    title: "Movies",
    description: "Cinema & Hollywood",
    emoji: "🎬",
    color: "text-[#ffd166]",
    bgColor: "bg-[rgba(255,209,102,0.08)]",
    words: [
      "avatar","avengers","alien","amadeus","arrival","batman","blade","braveheart",
      "casablanca","chicago","cinderella","clueless","dune","dunkirk","drive","deadpool",
      "elf","eternal","everything","everywhere","fargo","frozen","gladiator","gravity",
      "halloween","heat","hereditary","inception","interstellar","jaws","joker","jumanji",
      "knives","kill","lalaland","logan","matrix","memento","moonlight","mulan","network",
      "nope","oldboy","oppenheimer","parasite","psycho","pulpfiction","ratatouille","rocky",
      "scarface","shining","silence","singin","spotlight","superman","tenet","titanic",
      "toy","story","uncut","gems","vertigo","wall","whiplash","xmen","yesterday","zootopia",
    ],
  },
  {
    id: "sports",
    title: "Sports",
    description: "Athletics & Games",
    emoji: "⚽",
    color: "text-[#06d6a0]",
    bgColor: "bg-[rgba(6,214,160,0.08)]",
    words: [
      "archery","athletics","badminton","baseball","basketball","biathlon","bobsled",
      "bowling","boxing","canoeing","cricket","curling","cycling","decathlon","diving",
      "equestrian","fencing","football","golf","gymnastics","handball","hockey","hurdles",
      "judo","kayaking","lacrosse","marathon","motocross","netball","pentathlon","polo",
      "rowing","rugby","sailing","shooting","skateboarding","skiing","snowboard","soccer",
      "softball","squash","surfing","swimming","taekwondo","tennis","triathlon","volleyball",
      "weightlifting","wrestling","yachting",
    ],
  },
  {
    id: "food",
    title: "Food",
    description: "Cuisine & Flavors",
    emoji: "🍜",
    color: "text-[#ff5c3a]",
    bgColor: "bg-[rgba(255,92,58,0.08)]",
    words: [
      "avocado","almond","apple","artichoke","asparagus","bacon","banana","basil",
      "beef","beet","blueberry","broccoli","butter","cabbage","carrot","cashew",
      "cauliflower","celery","cheese","cherry","chicken","chocolate","cinnamon","coconut",
      "coffee","corn","cream","cucumber","curry","dates","eggplant","fennel","fig",
      "garlic","ginger","grape","guava","honey","kale","kiwi","lemon","lettuce",
      "lime","mango","maple","melon","mint","mushroom","noodle","nutmeg","oat",
      "olive","onion","orange","papaya","pasta","peach","peanut","pear","pepper",
      "pineapple","pistachio","plum","pomegranate","potato","pumpkin","quinoa","radish",
      "raspberry","rice","rosemary","salmon","salt","sesame","shrimp","spinach","strawberry",
      "sugar","sushi","sweet","tamarind","thyme","tofu","tomato","turmeric","vanilla",
      "walnut","watermelon","wheat","yogurt","zucchini",
    ],
  },
  {
    id: "science",
    title: "Science",
    description: "Physics & Beyond",
    emoji: "🔬",
    color: "text-[#cafd00]",
    bgColor: "bg-[rgba(202,253,0,0.08)]",
    words: [
      "atom","antimatter","astronomy","biology","carbon","catalyst","chemistry","chromosome",
      "compound","conductor","cosmology","crystal","darwin","density","dna","electron",
      "element","energy","entropy","enzyme","evolution","experiment","fission","force",
      "fossil","frequency","fusion","galaxy","gene","genome","gravity","helium","hydrogen",
      "hypothesis","inertia","ion","isotope","kinetic","laser","light","magnetism","mass",
      "matter","membrane","metabolism","molecule","momentum","mutation","neutron","nitrogen",
      "nucleus","orbit","osmosis","oxygen","particle","photon","physics","plasma","polymer",
      "proton","quantum","radiation","reaction","relativity","resonance","spectrum","string",
      "supernova","temperature","theory","thermodynamics","universe","vacuum","velocity",
      "vibration","wavelength","xenon","yield","zero",
    ],
  },
  {
    id: "music",
    title: "Music",
    description: "Genres & Legends",
    emoji: "🎵",
    color: "text-[#ff51fa]",
    bgColor: "bg-[rgba(255,81,250,0.08)]",
    words: [
      "acoustic","album","alto","amplifier","anthem","arpeggio","ballad","bass","beat",
      "blues","bridge","cadence","chord","chorus","classical","clef","concert","country",
      "crescendo","disco","drum","dubstep","dynamics","electronic","ensemble","flute",
      "folk","forte","funk","guitar","harmony","hiphop","indie","instrument","jazz",
      "keyboard","lyrics","melody","metal","minor","modal","note","octave","opera",
      "orchestra","percussion","piano","pitch","pop","punk","quartet","rap","reggae",
      "rhythm","rock","saxophone","scale","score","solo","sonata","soul","string",
      "symphony","tempo","tenor","timbre","treble","trumpet","tune","ukulele","verse",
      "violin","vocal","waltz","xylophone","yodel",
    ],
  },
];

export function getCategoryWords(categoryId: CategoryId): Set<string> {
  const cat = CATEGORIES.find(c => c.id === categoryId);
  return new Set(cat?.words ?? []);
}

export function validateCategoryWord(
  word: string,
  lastWord: string,
  usedWords: string[],
  categoryId: CategoryId
): { valid: boolean; reason?: string } {
  const w = word.toLowerCase().trim();
  const words = getCategoryWords(categoryId);

  if (w.length < 2) return { valid: false, reason: "Too short" };
  if (!/^[a-z]+$/.test(w)) return { valid: false, reason: "Letters only" };
  if (usedWords.includes(w)) return { valid: false, reason: "Already used" };

  if (lastWord) {
    const required = lastWord.slice(-1).toLowerCase();
    if (w[0] !== required) {
      return { valid: false, reason: `Must start with "${required.toUpperCase()}"` };
    }
  }

  if (!words.has(w)) {
    return { valid: false, reason: `Not a ${categoryId} word` };
  }

  return { valid: true };
}
