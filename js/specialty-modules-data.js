window.EW_MODULE_DISCLAIMER = "Emerald Wellness provides educational wellness intelligence and tracking tools. It does not diagnose, treat, cure, or replace medical care. Always consult a qualified healthcare provider.";

window.EW_MODULE_ACCESS = {
  free: { label: "Free", limit: 0, copy: "Preview only", extra: "Start Free Assessment / Upgrade" },
  gold: { label: "Gold", limit: 1, copy: "1 active module included", extra: "Extra modules $35/month each" },
  platinum_plus: { label: "Platinum Plus", limit: 3, copy: "3 active modules included", extra: "Extra modules $35/month each or 3-module bundle $89/month" },
  concierge: { label: "Concierge Regenesis", limit: 999, copy: "Unlimited modules included", extra: "Concierge support enabled" },
  concierge_premium: { label: "Concierge Regenesis Premium", limit: 999, copy: "Unlimited modules included", extra: "Premium concierge support enabled" }
};

window.EW_MODULE_CATEGORIES = [
  "All",
  "Hormones",
  "Weight Loss",
  "Brain Performance",
  "Gut Health",
  "Sleep",
  "Longevity",
  "Pain & Inflammation",
  "Skin & Hair",
  "Men's Health",
  "Women's Health",
  "Athletic Performance",
  "Sexual Wellness",
  "Metabolic Health",
  "Stress & Cortisol",
  "Immune Health"
];

window.EW_SPECIALTY_MODULES = [
  ["hormone-optimization", "Hormone Optimization", "Hormones", "⚖️", "Organize hormone-support education, labs, symptoms, lifestyle patterns, and provider discussion points.", "Adults tracking energy, sleep, libido, mood, cycle changes, or hormone lab conversations.", ["Module score", "Hormone lab checklist", "Cycle and symptom tracker", "Protocol Vault links"]],
  ["weight-loss-metabolism", "Weight Loss & Metabolism", "Weight Loss", "⚡", "Track metabolic education, appetite patterns, body composition goals, GLP-1 discussion points, and nutrition consistency.", "Members focused on body composition, appetite awareness, glucose education, or metabolic habits.", ["Appetite tracker", "BodyScan progress", "Protein and hydration checklist", "Metabolic lab prompts"]],
  ["brain-fog-focus", "Brain Fog & Focus", "Brain Performance", "🧠", "Support focus education through sleep, stress, nutrient, wearable, and daily cognitive pattern tracking.", "Members tracking focus, clarity, memory, workload strain, or recovery routines.", ["Focus score", "Sleep/stress questions", "Learning center", "Daily clarity checklist"]],
  ["gut-reset", "Gut Reset", "Gut Health", "🌿", "Organize digestive education, symptom patterns, food timing, microbiome support, and provider-review questions.", "Members tracking bloating, digestion, bowel patterns, food response, or gut-support routines.", ["Gut symptom tracker", "Food response notes", "Protocol Vault links", "Digestive lab prompts"]],
  ["womens-health", "Women's Health", "Women's Health", "🌸", "Track cycle-aware education, energy patterns, mood, recovery, nutrients, and provider discussion points.", "Women organizing monthly patterns, cycle changes, wellness goals, and lab-review notes.", ["Cycle-aware tracker", "Hormone lab prompts", "Monthly report", "Concierge questions"]],
  ["menopause-support", "Menopause Support", "Women's Health", "🌙", "Organize menopause-transition education, sleep, temperature shifts, mood, strength, and provider-review planning.", "Women tracking perimenopause or menopause patterns and quarterly wellness reviews.", ["Sleep and hot-flash tracking", "Strength checklist", "Provider questions", "Learning center"]],
  ["mens-performance", "Men's Performance", "Men's Health", "🏋️", "Track men's wellness education around strength, recovery, cardiovascular habits, hormones, and performance goals.", "Men focused on energy, training, recovery, libido, or metabolic markers.", ["Performance score", "Training recovery tracker", "Lab prompts", "Daily action checklist"]],
  ["testosterone-optimization", "Testosterone Optimization", "Men's Health", "🔥", "Organize testosterone-support education, sleep, resistance training, nutrition, and provider lab-review questions.", "Men tracking testosterone conversations, strength, libido, mood, or recovery habits.", ["Hormone lab checklist", "Strength rhythm", "Sleep tracker", "Provider review notes"]],
  ["longevity-healthy-aging", "Longevity & Healthy Aging", "Longevity", "🧬", "Track healthy-aging education, biomarkers, inflammation, mitochondrial support, and quarterly progress reviews.", "Members focused on long-range healthspan, recovery, biomarkers, and sustainable routines.", ["Longevity score", "Quarterly lab prompts", "Biology Intelligence insights", "Milestone report"]],
  ["sleep-repair", "Sleep Repair", "Sleep", "🌙", "Track sleep education, evening routines, wearable trends, recovery patterns, and sleep-support consistency.", "Members tracking sleep quality, nighttime waking, morning fatigue, HRV, or recovery.", ["Sleep checklist", "Wearable notes", "Recovery graph", "Learning center"]],
  ["pain-inflammation", "Pain & Inflammation", "Pain & Inflammation", "🔥", "Organize inflammation education, discomfort patterns, mobility, recovery habits, and provider-review questions.", "Members tracking soreness, stiffness, recovery patterns, or inflammation-related labs.", ["Pain scale tracker", "Mobility checklist", "Inflammation labs", "Protocol Vault links"]],
  ["skin-optimization", "Skin Optimization", "Skin & Hair", "✨", "Track skin-support education, hydration, collagen routines, nutrients, hormones, and lifestyle patterns.", "Members focused on skin quality, texture, recovery, glow, or aesthetic wellness tracking.", ["Skin tracker", "Nutrient prompts", "GHK-Cu education link", "Monthly progress report"]],
  ["hair-growth", "Hair Growth", "Skin & Hair", "🌱", "Organize hair-wellness education, nutrient status, stress, hormones, thyroid markers, and progress notes.", "Members tracking shedding, growth cycles, nutrient questions, or thyroid/hormone review notes.", ["Hair photo notes", "Ferritin and thyroid prompts", "Stress checklist", "Learning center"]],
  ["athletic-recovery", "Athletic Recovery", "Athletic Performance", "🏃", "Track training readiness, soreness, HRV, mobility, protein habits, and performance recovery education.", "Athletes and active members focused on recovery, adaptation, consistency, and injury-prevention questions.", ["Recovery score", "Training log", "Mobility checklist", "BodyScan progress"]],
  ["stress-cortisol", "Stress & Cortisol", "Stress & Cortisol", "🫧", "Track stress education, nervous-system routines, sleep, caffeine timing, symptoms, and cortisol discussion points.", "Members managing heavy workload, poor recovery, sleep disruption, cravings, or resilience goals.", ["Stress score", "Breathwork checklist", "Sleep/stimulant tracker", "Cortisol lab prompts"]],
  ["sexual-wellness", "Sexual Wellness", "Sexual Wellness", "❤️", "Organize sexual-wellness education around hormones, circulation, stress, sleep, and provider-safe questions.", "Members tracking libido, confidence, stress impact, medication-review questions, or relationship context.", ["Wellness tracker", "Hormone/circulation prompts", "Concierge notes", "Learning center"]],
  ["thyroid-optimization", "Thyroid Optimization", "Hormones", "🦋", "Track thyroid education, energy, temperature, hair, digestion, labs, and provider-review notes.", "Members organizing thyroid lab conversations, energy patterns, metabolism, and symptom trends.", ["Thyroid lab checklist", "Temperature/energy notes", "Nutrition prompts", "Progress analytics"]],
  ["glp1-support", "GLP-1 Support", "Weight Loss", "💧", "Support GLP-1 education with hydration, protein, digestion, muscle preservation, and provider-review tracking.", "Members using or discussing GLP-1 medication plans with qualified providers.", ["Protein checklist", "Digestive tracker", "Muscle-preservation prompts", "BodyScan progress"]],
  ["heart-metabolic-health", "Heart & Metabolic Health", "Metabolic Health", "🫀", "Organize cardiovascular and metabolic education around lipids, glucose, movement, sleep, and inflammation.", "Members tracking cholesterol, glucose, blood pressure notes, body composition, or prevention goals.", ["Lipid/glucose prompts", "Movement checklist", "Quarterly review", "Progress report"]],
  ["immune-health", "Immune Health", "Immune Health", "🛡️", "Track immune-support education, sleep, stress, nutrients, recovery patterns, and provider discussion points.", "Members focused on resilience, nutrient status, recovery, and immune-support routines.", ["Immune score", "Vitamin D/zinc prompts", "Recovery checklist", "Learning center"]],
  ["detox-liver-support", "Detox & Liver Support", "Metabolic Health", "🍃", "Organize liver-support education, hydration, digestion, nutrients, medication/supplement spacing, and lab-review notes.", "Members tracking liver enzymes, environmental exposure questions, digestion, or supplement stacks.", ["CMP prompts", "Hydration/fiber checklist", "Stack spacing notes", "Provider questions"]],
  ["muscle-building", "Muscle Building", "Athletic Performance", "💪", "Track muscle-building education, protein, strength training, recovery, creatine habits, and body-composition progress.", "Members focused on strength, lean mass, training consistency, and recovery.", ["Training checklist", "Protein tracker", "BodyScan lean-mass notes", "Milestone report"]],
  ["mood-emotional-balance", "Mood & Emotional Balance", "Brain Performance", "🌤️", "Organize mood-support education through sleep, stress, nutrients, routines, and provider-safe discussion points.", "Members tracking mood patterns, stress, sleep disruption, focus, or lifestyle consistency.", ["Mood tracker", "Sleep/stress prompts", "Daily support checklist", "Learning center"]],
  ["fertility-support", "Fertility Support", "Women's Health", "🌷", "Track fertility-support education, cycle timing, nutrients, lifestyle factors, and provider-review questions.", "Members organizing preconception wellness, cycle tracking, lab questions, and partner-support routines.", ["Cycle tracker", "Nutrient prompts", "Provider questions", "Monthly report"]],
  ["peptide-education", "Peptide Education", "Longevity", "💉", "Organize peptide education, vocabulary, safety questions, protocol references, and provider discussion notes.", "Members who want safer, organized peptide education before speaking with qualified professionals.", ["Peptide learning center", "Protocol Vault links", "Question builder", "Safety checklist"]]
].map(([id, name, category, icon, desc, bestFor, features], index) => ({
  id,
  slug: id,
  name,
  category,
  icon,
  desc,
  description: desc,
  bestFor,
  features,
  priceTeaser: "Included by tier. Extra modules $35/mo; 3-module bundle $89/mo.",
  questions: [
    `What is your main ${name.toLowerCase()} goal this month?`,
    "Which symptoms or patterns do you want to track?",
    "Which labs, wearables, or BodyScan updates should be reviewed?",
    "What questions should be discussed with a qualified healthcare provider?"
  ],
  symptoms: ["Energy", "Sleep", "Mood", "Recovery", "Digestive or body changes"],
  labs: category === "Hormones" ? ["TSH", "Free T3", "Free T4", "Sex hormones as appropriate", "AM cortisol when appropriate"] :
    category === "Weight Loss" ? ["A1c", "Fasting insulin", "Lipids", "CMP", "Vitamin D"] :
    category === "Metabolic Health" ? ["A1c", "Fasting insulin", "Lipids", "hs-CRP", "CMP"] :
    category === "Skin & Hair" ? ["Ferritin", "Vitamin D", "B12", "Zinc/Copper when appropriate", "Thyroid panel"] :
    ["CBC", "CMP", "Vitamin D", "hs-CRP", "Provider-selected specialty labs"],
  protocols: [`${name} education guide`, "Quarterly review checklist", "Medication and stack check prompts"],
  tasks: ["Track symptoms", "Complete daily habit", "Review learning resource", "Log lab or BodyScan update"],
  resources: [`${name} foundations`, "How module scoring works", "Questions for your provider"],
  featured: index < 6,
  comingSoon: false,
  published: true,
  sort: index + 1
}));
