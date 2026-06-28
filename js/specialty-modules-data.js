window.EW_MODULE_DISCLAIMER = "Emerald Wellness provides educational wellness intelligence and tracking tools. It does not diagnose, treat, cure, or replace medical care. Always consult a qualified healthcare provider.";

window.EW_MODULE_ACCESS = {
  free: { label: "Free", limit: 0, copy: "Preview only", extra: "Start Free Assessment / Upgrade" },
  gold: { label: "Gold", limit: 1, copy: "1 active module included", extra: "Extra modules $49.99/month each" },
  platinum_plus: { label: "Platinum Plus", limit: 3, copy: "3 active modules included", extra: "Extra modules $49.99/month each or 3-module bundle $89/month" },
  concierge: { label: "Concierge Regenesis", limit: 999, copy: "Unlimited modules included", extra: "Concierge support enabled" },
  concierge_premium: { label: "Concierge Regenesis Premium", limit: 999, copy: "Unlimited modules included", extra: "Premium concierge support enabled" }
};

window.EW_MODULE_CATEGORIES = [
  "All",
  "Foundational Health",
  "Hormones & Metabolism",
  "Brain & Mental Performance",
  "Digestive & Immune Health",
  "Cardiovascular & Longevity",
  "Performance & Recovery",
  "Appearance & Vitality",
  "Environmental Health",
  "Specialized Wellness",
  "Advanced Bio-Optimization"
];

const EW_ACTIVE_LAUNCH_MODULES = new Set([
  "hormone-optimization",
  "weight-loss-and-metabolism",
  "sleep-repair",
  "brain-fog-and-focus",
  "gut-reset",
  "menopause-support",
  "men-s-performance",
  "inflammation-reduction",
  "longevity-and-healthy-aging",
  "skin-optimization",
  "allergies-and-seasonal-wellness",
  "autoimmune-wellness-support",
  "environmental-toxin-awareness",
  "mold-exposure-education",
  "heavy-metal-awareness"
]);

const EW_FEATURED_MODULES = new Set([
  "hormone-optimization",
  "weight-loss-metabolism",
  "sleep-repair",
  "brain-fog-focus",
  "gut-reset",
  "allergies-and-seasonal-wellness",
  "autoimmune-wellness-support",
  "environmental-toxin-awareness",
  "mold-exposure-education",
  "heavy-metal-awareness"
]);

const EW_LIBRARY = {
  "Foundational Health": [
    "Health Optimization Fundamentals",
    "Healthy Habits & Lifestyle",
    "Nutrition Foundations",
    "Hydration Optimization",
    "Exercise & Movement",
    "Recovery & Resilience",
    "Sleep Repair",
    "Stress Management",
    "Mindfulness & Meditation",
    "Healthy Aging"
  ],
  "Hormones & Metabolism": [
    "Hormone Optimization",
    "Menopause Support",
    "Perimenopause Support",
    "Women's Health",
    "Men's Performance",
    "Testosterone Optimization",
    "Thyroid Optimization",
    "Adrenal Health",
    "Cortisol & Stress",
    "Blood Sugar Optimization",
    "Weight Loss & Metabolism",
    "GLP-1 Companion Program",
    "Metabolic Flexibility"
  ],
  "Brain & Mental Performance": [
    "Brain Fog & Focus",
    "Memory Optimization",
    "Mood & Emotional Wellness",
    "Executive Performance",
    "Cognitive Longevity",
    "ADHD Support",
    "Burnout Recovery",
    "Mental Resilience"
  ],
  "Digestive & Immune Health": [
    "Gut Reset",
    "Digestive Health",
    "Food Sensitivity & Elimination",
    "Microbiome Health",
    "Immune Health",
    "Allergies & Seasonal Wellness",
    "Histamine & Mast Cell Support",
    "Autoimmune Wellness Support",
    "Long COVID Recovery Support",
    "Chronic Fatigue Support",
    "Fibromyalgia Wellness Support"
  ],
  "Cardiovascular & Longevity": [
    "Longevity & Healthy Aging",
    "Heart Health",
    "Cholesterol Optimization",
    "Blood Pressure Support",
    "Inflammation Reduction",
    "Mitochondrial Health",
    "Cellular Longevity",
    "Healthy Aging for Women",
    "Healthy Aging for Men"
  ],
  "Performance & Recovery": [
    "Athletic Performance",
    "Muscle Building",
    "Recovery Optimization",
    "Mobility & Flexibility",
    "Joint Health",
    "Bone Health",
    "Injury Recovery"
  ],
  "Appearance & Vitality": [
    "Skin Optimization",
    "Hair Growth",
    "Healthy Nails",
    "Collagen & Connective Tissue",
    "Healthy Weight Maintenance",
    "Healthy Body Composition"
  ],
  "Environmental Health": [
    "Environmental Toxin Awareness",
    "Mold Exposure Education",
    "Heavy Metal Awareness",
    "Air Quality & Respiratory Wellness",
    "Water Quality Awareness",
    "Household Chemical Exposure",
    "Endocrine Disruptor Education",
    "Plastic & Microplastic Exposure"
  ],
  "Specialized Wellness": [
    "Sexual Wellness",
    "Fertility Support",
    "Healthy Pregnancy Education",
    "Postpartum Recovery",
    "Healthy Family Wellness",
    "Healthy Travel & Jet Lag",
    "Shift Worker Wellness",
    "Migraine & Headache Wellness",
    "Healthy Vision",
    "Hearing Wellness",
    "Oral Health",
    "Kidney Wellness",
    "Liver Health",
    "Respiratory Wellness"
  ],
  "Advanced Bio-Optimization": [
    "Biomarker Mastery",
    "Advanced Lab Interpretation",
    "Peptide Education",
    "Supplement Optimization",
    "Protocol Builder",
    "Recovery Technologies",
    "Red Light Therapy",
    "Sauna Optimization",
    "Cold Exposure",
    "Wearable Device Integration"
  ]
};

function ewSlug(name) {
  return name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function ewCategoryIcon(category) {
  return {
    "Foundational Health": "◇",
    "Hormones & Metabolism": "⚖",
    "Brain & Mental Performance": "◉",
    "Digestive & Immune Health": "✦",
    "Cardiovascular & Longevity": "◆",
    "Performance & Recovery": "△",
    "Appearance & Vitality": "✧",
    "Environmental Health": "◎",
    "Specialized Wellness": "◈",
    "Advanced Bio-Optimization": "✺"
  }[category] || "◇";
}

function ewDescription(name, category) {
  const lower = name.toLowerCase();
  if (lower.includes("allerg")) return "Track seasonal wellness patterns, histamine-aware education, immune-support habits, and questions to discuss with a qualified healthcare provider.";
  if (lower.includes("autoimmune")) return "Organize autoimmune wellness education, symptom tracking, inflammation patterns, recovery habits, and provider-review questions.";
  if (lower.includes("mold")) return "Build mold exposure awareness with environment notes, respiratory wellness tracking, symptom patterns, and safe next-discussion prompts.";
  if (lower.includes("heavy metal")) return "Track heavy metal awareness education, exposure history, lab-discussion prompts, and environmental wellness questions.";
  if (lower.includes("toxin") || lower.includes("chemical") || lower.includes("plastic") || lower.includes("microplastic") || lower.includes("endocrine disruptor")) return "Organize environmental toxin awareness, exposure reduction education, household review notes, and provider-safe wellness insights.";
  if (lower.includes("sleep")) return "Track sleep education, evening routines, wearable trends, recovery patterns, and sleep-support consistency.";
  if (lower.includes("weight") || lower.includes("glp") || lower.includes("blood sugar")) return "Track metabolic education, appetite patterns, body composition goals, glucose-support habits, and provider-review prompts.";
  if (lower.includes("hormone") || lower.includes("thyroid") || lower.includes("testosterone") || lower.includes("menopause")) return "Organize hormone and metabolism education, labs, symptoms, lifestyle patterns, and provider discussion points.";
  if (lower.includes("brain") || lower.includes("mood") || lower.includes("memory") || lower.includes("burnout") || lower.includes("adhd")) return "Support cognitive and emotional wellness education through sleep, stress, nutrients, routines, and tracking.";
  if (lower.includes("gut") || lower.includes("digestive") || lower.includes("microbiome")) return "Organize digestive education, symptom patterns, food timing, microbiome support, and provider-review questions.";
  if (lower.includes("heart") || lower.includes("cholesterol") || lower.includes("pressure") || lower.includes("inflammation") || lower.includes("longevity")) return "Track cardiovascular and longevity education, biomarkers, inflammation patterns, movement, sleep, and quarterly reviews.";
  return `A focused ${category.toLowerCase()} education module with module score, assessment, symptoms, labs, Protocol Vault links, BodyScan notes, daily tasks, reports, and learning resources.`;
}

function ewBestFor(name, category) {
  const lower = name.toLowerCase();
  if (lower.includes("allerg")) return "Members tracking seasonal symptoms, histamine patterns, immune routines, and environmental triggers.";
  if (lower.includes("autoimmune")) return "Members organizing inflammation patterns, fatigue, joint discomfort, recovery habits, and provider-review questions.";
  if (lower.includes("mold")) return "Members with mold exposure concerns who want organized awareness, respiratory tracking, and discussion prompts.";
  if (lower.includes("heavy metal")) return "Members tracking exposure questions, lab-review planning, and safer environmental wellness education.";
  if (lower.includes("toxin") || lower.includes("chemical") || lower.includes("plastic")) return "Members reviewing toxin exposure, household products, plastics, air, water, and sensitivity patterns.";
  return `Members focused on ${name.toLowerCase()} education, tracking, and personalized wellness insights.`;
}

function ewLabs(category) {
  if (category === "Hormones & Metabolism") return ["A1c", "Fasting insulin", "Lipids", "Thyroid panel", "Hormone labs as appropriate"];
  if (category === "Digestive & Immune Health") return ["CBC", "CMP", "Vitamin D", "hs-CRP", "Provider-selected immune or digestive labs"];
  if (category === "Environmental Health") return ["CBC", "CMP", "hs-CRP", "Exposure-history review", "Provider-selected specialty labs"];
  if (category === "Cardiovascular & Longevity") return ["A1c", "Lipids", "hs-CRP", "CMP", "Vitamin D"];
  if (category === "Appearance & Vitality") return ["Ferritin", "Vitamin D", "B12", "Thyroid panel", "Provider-selected nutrient labs"];
  return ["CBC", "CMP", "Vitamin D", "hs-CRP", "Provider-selected specialty labs"];
}

let ewSort = 1;
window.EW_SPECIALTY_MODULES = Object.entries(EW_LIBRARY).flatMap(([category, names]) =>
  names.map((name) => {
    const slug = ewSlug(name);
    const active = EW_ACTIVE_LAUNCH_MODULES.has(slug);
    return {
      id: slug,
      slug,
      name,
      category,
      icon: ewCategoryIcon(category),
      desc: ewDescription(name, category),
      shortDescription: ewDescription(name, category),
      description: ewDescription(name, category),
      longDescription: `${ewDescription(name, category)} The module keeps language educational and helps members organize patterns, questions, and wellness tracking for discussion with qualified professionals.`,
      bestFor: ewBestFor(name, category),
      features: ["Module score", "Assessment", "Symptom tracker", "Recommended labs", "Daily check-ins", "Learning center"],
      priceMonthly: 49.99,
      priceTeaser: active ? "Active launch module. Included by tier; extra modules $49.99/mo." : "Coming soon. Join to be notified when this module opens.",
      includedPlanLevel: "Gold+",
      status: active ? "active" : "coming_soon",
      active,
      comingSoon: !active,
      featured: EW_FEATURED_MODULES.has(slug),
      recommended: EW_FEATURED_MODULES.has(slug),
      publicPreview: true,
      published: true,
      safetyDisclaimer: window.EW_MODULE_DISCLAIMER,
      recommendationKeywords: [name, category, ...name.toLowerCase().split(/\s+/)].join(" ").toLowerCase(),
      questions: [
        `What is your main ${name.toLowerCase()} goal this month?`,
        "Which symptoms, patterns, or environment factors do you want to track?",
        "Which labs, wearables, BodyScan updates, or progress notes should be reviewed?",
        "What questions should be discussed with a qualified healthcare provider?"
      ],
      symptoms: ["Energy", "Sleep", "Mood", "Recovery", "Body or environment pattern notes"],
      labs: ewLabs(category),
      protocols: [`${name} education guide`, "Quarterly review checklist", "Medication and stack check prompts"],
      tasks: ["Track symptoms", "Complete daily habit", "Review learning resource", "Log lab, BodyScan, or exposure update"],
      resources: [`${name} foundations`, "How module scoring works", "Questions for your provider"],
      sort: ewSort++
    };
  })
);

window.EW_CATEGORY_COUNTS = window.EW_SPECIALTY_MODULES.reduce((counts, module) => {
  counts[module.category] = (counts[module.category] || 0) + 1;
  return counts;
}, {});

window.EW_RECOMMENDATION_RULES = [
  { id: "fatigue-brain-sleep", terms: ["fatigue", "brain fog", "poor sleep", "tired", "focus"], modules: ["sleep-repair", "brain-fog-and-focus", "hormone-optimization"] },
  { id: "joint-inflammation-fatigue", terms: ["joint", "inflammation", "fatigue", "stiff", "pain"], modules: ["inflammation-reduction", "autoimmune-wellness-support", "joint-health"] },
  { id: "seasonal-allergies", terms: ["seasonal", "allergy", "allergies", "sneezing", "histamine"], modules: ["allergies-and-seasonal-wellness", "histamine-and-mast-cell-support", "immune-health"] },
  { id: "mold-exposure", terms: ["mold", "musty", "water damage", "respiratory"], modules: ["mold-exposure-education", "environmental-toxin-awareness", "respiratory-wellness"] },
  { id: "toxin-exposure", terms: ["toxin", "heavy metal", "plastic", "microplastic", "chemical", "sensitivity"], modules: ["environmental-toxin-awareness", "heavy-metal-awareness", "endocrine-disruptor-education", "household-chemical-exposure"] },
  { id: "menopause", terms: ["menopause", "hot flash", "night sweat", "perimenopause"], modules: ["menopause-support", "sleep-repair", "bone-health", "heart-health"] },
  { id: "weight-blood-sugar", terms: ["weight gain", "blood sugar", "glucose", "insulin", "craving"], modules: ["weight-loss-and-metabolism", "blood-sugar-optimization", "glp-1-companion-program"] },
  { id: "stress-burnout", terms: ["stress", "burnout", "overwhelmed", "cortisol", "resilience"], modules: ["cortisol-and-stress", "burnout-recovery", "mental-resilience", "sleep-repair"] }
];

window.EW_RECOMMEND_MODULES = function ewRecommendModules(input, activeIds = []) {
  const text = String(input || "").toLowerCase();
  const active = new Set(activeIds || []);
  const hits = new Set();
  window.EW_RECOMMENDATION_RULES.forEach((rule) => {
    if (rule.terms.some((term) => text.includes(term))) {
      rule.modules.forEach((slug) => {
        if (!active.has(slug)) hits.add(slug);
      });
    }
  });
  if (!hits.size) {
    ["hormone-optimization", "sleep-repair", "gut-reset"].forEach((slug) => {
      if (!active.has(slug)) hits.add(slug);
    });
  }
  return window.EW_SPECIALTY_MODULES.filter((module) => hits.has(module.slug));
};
