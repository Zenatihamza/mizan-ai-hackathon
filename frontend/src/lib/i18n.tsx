import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Lang = "fr" | "ar";

type Dict = Record<string, { fr: string; ar: string }>;

const DICT: Dict = {
  // Brand
  "brand.tagline": { fr: "la justice accessible", ar: "العدالة في متناول الجميع" },

  // Nav
  "nav.home": { fr: "Accueil", ar: "الرئيسية" },
  "nav.assistant": { fr: "Assistant", ar: "المساعد" },
  "nav.scanner": { fr: "Scanner", ar: "الماسح" },
  "nav.gps": { fr: "Démarches", ar: "الإجراءات" },
  "nav.rpg": { fr: "Apprendre", ar: "تعلّم" },

  // Common
  "common.logout": { fr: "Déconnexion", ar: "تسجيل الخروج" },
  "common.listen": { fr: "Écouter en arabe", ar: "استمع بالعربية" },
  "common.loading": { fr: "Chargement…", ar: "جارٍ التحميل…" },
  "common.next": { fr: "Suivant", ar: "التالي" },
  "common.restart": { fr: "Recommencer", ar: "إعادة البدء" },
  "common.disclaimer": {
    fr: "Information juridique — ne remplace pas la consultation d'un avocat.",
    ar: "معلومة قانونية — لا تغني عن استشارة محامٍ.",
  },

  // Login
  "login.subtitle": { fr: "le droit algérien, accessible", ar: "القانون الجزائري، في متناولك" },
  "login.tabLogin": { fr: "Connexion", ar: "تسجيل الدخول" },
  "login.tabRegister": { fr: "Créer un compte", ar: "إنشاء حساب" },
  "login.name": { fr: "Nom complet", ar: "الاسم الكامل" },
  "login.email": { fr: "Email", ar: "البريد الإلكتروني" },
  "login.password": { fr: "Mot de passe", ar: "كلمة المرور" },
  "login.doLogin": { fr: "Se connecter", ar: "دخول" },
  "login.doRegister": { fr: "Créer mon compte", ar: "إنشاء حسابي" },

  // Home
  "home.badge": { fr: "Expliqué en arabe — à voix haute", ar: "مشروح بالعربية — صوتياً" },
  "home.hello": { fr: "Bonjour", ar: "مرحباً" },
  "home.question": { fr: "que dit la loi ?", ar: "ماذا يقول القانون؟" },
  "home.intro": {
    fr: "JusticIA répond à tes questions juridiques, lit tes contrats, te guide vers la bonne démarche et t'apprend tes droits — en français et en arabe.",
    ar: "تجيب جستيسيا عن أسئلتك القانونية، تقرأ عقودك، ترشدك إلى الإجراء الصحيح وتعلّمك حقوقك — بالفرنسية والعربية.",
  },
  "home.ctaAsk": { fr: "Poser une question", ar: "اطرح سؤالاً" },
  "home.ctaScan": { fr: "Scanner un contrat", ar: "امسح عقداً" },
  "home.assistant.title": { fr: "Assistant juridique", ar: "المساعد القانوني" },
  "home.assistant.sub": {
    fr: "Pose ta question en français ou en arabe, reçois tes droits et les démarches — avec l'historique de tes échanges.",
    ar: "اطرح سؤالك بالفرنسية أو العربية، واحصل على حقوقك والإجراءات — مع سجلّ محادثاتك.",
  },
  "home.assistant.cta": { fr: "Poser une question", ar: "اطرح سؤالاً" },
  "home.scanner.title": { fr: "Scanner de contrats", ar: "ماسح العقود" },
  "home.scanner.sub": {
    fr: "Détecte les clauses abusives, illégales, et propose une réécriture équitable avec l'article de loi.",
    ar: "يكشف البنود التعسفية وغير القانونية، ويقترح صياغة عادلة مع المادة القانونية.",
  },
  "home.scanner.cta": { fr: "Scanner un document", ar: "امسح وثيقة" },
  "home.gps.title": { fr: "Mes démarches", ar: "إجراءاتي" },
  "home.gps.sub": {
    fr: "Décris ton problème, reçois la procédure exacte : bureau, documents, délais et coût.",
    ar: "صف مشكلتك، واحصل على الإجراء الدقيق: المكتب، الوثائق، الآجال والتكلفة.",
  },
  "home.gps.cta": { fr: "Trouver mon chemin", ar: "جد طريقي" },
  "home.rpg.title": { fr: "Apprendre mes droits", ar: "تعلّم حقوقي" },
  "home.rpg.sub": {
    fr: "Vis des situations réelles et apprends le droit algérien, expliqué à voix haute en arabe.",
    ar: "عش مواقف حقيقية وتعلّم القانون الجزائري، مشروحاً صوتياً بالعربية.",
  },
  "home.rpg.cta": { fr: "Commencer", ar: "ابدأ" },
  "home.sourced.title": { fr: "Chaque réponse est sourcée", ar: "كل إجابة موثّقة" },
  "home.sourced.text": {
    fr: "JusticIA cite l'article de loi qui justifie chaque réponse, et t'oriente vers l'aide juridictionnelle en cas de doute.",
    ar: "تستشهد جستيسيا بالمادة القانونية التي تبرّر كل إجابة، وتوجّهك إلى المساعدة القضائية عند الشك.",
  },

  // Scanner
  "scanner.title": { fr: "Scanner de contrats", ar: "ماسح العقود" },
  "scanner.subtitle": {
    fr: "Prends en photo un contrat. JusticIA détecte les clauses abusives et cite l'article de loi qui les rend illégales.",
    ar: "صوّر عقداً. تكشف جستيسيا البنود التعسفية وتستشهد بالمادة التي تجعلها غير قانونية.",
  },
  "scanner.runDemo": { fr: "Lancer la démo", ar: "تشغيل العرض" },

  // GPS
  "gps.title": { fr: "Mes démarches", ar: "إجراءاتي" },
  "gps.subtitle": {
    fr: "Décris ton problème. JusticIA te dit où aller, quels documents emporter et combien de temps ça prend.",
    ar: "صف مشكلتك. تخبرك جستيسيا أين تذهب، أي وثائق تأخذ، وكم يستغرق الأمر.",
  },

  // RPG
  "rpg.title": { fr: "Apprendre mes droits", ar: "تعلّم حقوقي" },
  "rpg.subtitle": {
    fr: "Vis des situations réelles. Chaque décision t'apprend une règle du droit algérien, expliquée à voix haute en arabe.",
    ar: "عش مواقف حقيقية. كل قرار يعلّمك قاعدة من القانون الجزائري، مشروحة صوتياً بالعربية.",
  },

  // Chat
  "chat.thinking": { fr: "JusticIA réfléchit…", ar: "جستيسيا تفكّر…" },
  "chat.newQuestion": { fr: "Nouvelle question", ar: "سؤال جديد" },
  "chat.history": { fr: "Historique", ar: "السجلّ" },
  "chat.emptyTitle": { fr: "Pose ta question juridique", ar: "اطرح سؤالك القانوني" },
  "chat.emptySub": {
    fr: "Décris ta situation en français ou en arabe. Tu reçois tes droits, les articles de loi et les démarches à suivre.",
    ar: "صف وضعك بالفرنسية أو العربية. تحصل على حقوقك، المواد القانونية والإجراءات المتّبعة.",
  },
  "chat.placeholder": { fr: "Écris ta question…", ar: "اكتب سؤالك…" },
};

interface I18nState {
  lang: Lang;
  dir: "ltr" | "rtl";
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nState>(null as any);
const STORAGE_KEY = "justicia_lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(
    () => (localStorage.getItem(STORAGE_KEY) as Lang) || "fr"
  );
  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  function setLang(l: Lang) {
    setLangState(l);
  }
  function toggle() {
    setLangState((l) => (l === "fr" ? "ar" : "fr"));
  }
  function t(key: string) {
    const entry = DICT[key];
    if (!entry) return key;
    return entry[lang] || entry.fr;
  }

  return (
    <I18nContext.Provider value={{ lang, dir, setLang, toggle, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
