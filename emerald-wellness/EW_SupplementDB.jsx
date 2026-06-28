import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ═══════════════════════════════════════
// SUPABASE CONFIG
// Replace with your real project URL and anon key
// Found in: Supabase Dashboard → Project Settings → API
// ═══════════════════════════════════════
const SUPABASE_URL  = "https://mczpuffmlspmghgneukz.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jenB1ZmZtbHNwbWdoZ25ldWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNjczODAsImV4cCI6MjA5NTc0MzM4MH0.hs0CQOyrcIk5WhRr9OUU1fVs7V1sMcea7RYwWuTAVag";
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

// ═══════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════
const C = {
  bg:"#050d07",bg2:"#080f0a",bg3:"#0c160e",
  em:"#1a6b45",emL:"#2aab6a",emXL:"#40d888",emPale:"rgba(26,107,69,.08)",
  gold:"#c8a828",goldL:"#f0c84a",goldXL:"#ffe47a",goldPale:"rgba(200,168,40,.08)",
  text:"#e8f2ec",textDim:"#8aac96",textMid:"#b8d4c0",
  border:"rgba(255,255,255,.06)",borderEm:"rgba(26,107,69,.35)",borderGold:"rgba(200,168,40,.3)",
  red:"#e05050",redPale:"rgba(224,80,80,.1)",blue:"#5080ff",bluePale:"rgba(80,128,255,.1)",
};
const F = {
  serif:"'Playfair Display',Georgia,serif",
  sans:"'DM Sans',system-ui,sans-serif",
  cinzel:"'Cinzel',serif",
};

// ═══════════════════════════════════════
// DATABASE
// ═══════════════════════════════════════
const DB = {
  peptides:[
    {id:1,name:"BPC-157",type:"Injectable Peptide",category:"Healing",dose:"250–500 mcg",timing:"Morning or post-workout",route:["SubQ","IM"],tags:["healing","gut","inflammation"],interactions:[],mechanism:"Upregulates growth hormone receptors, stimulates angiogenesis, promotes mucosal healing. Activates VEGFR2 and EGF pathways.",notes:"Reconstitute with bacteriostatic water. Rotate injection sites. May be taken orally in some protocols for gut-specific effects."},
    {id:2,name:"CJC-1295 / Ipamorelin",type:"GHRH + GHRP Stack",category:"Performance",dose:"100/100 mcg",timing:"Bedtime on empty stomach",route:["SubQ"],tags:["GH","recovery","performance","longevity"],interactions:[],mechanism:"CJC-1295 is a GHRH analogue; Ipamorelin is a GHRP. Combined, they produce a synergistic GH pulse mimicking natural pulsatile release.",notes:"Take 2–3 hours after last meal. Most effective at bedtime. Avoid carbohydrates for 1 hour post-injection."},
    {id:3,name:"TB-500",type:"Injectable Peptide",category:"Healing",dose:"2–5 mg",timing:"2–3x per week",route:["SubQ","IM"],tags:["healing","inflammation","recovery"],interactions:[],mechanism:"Synthetic fragment of Thymosin Beta-4. Promotes actin-based cell migration, reduces inflammation, accelerates tissue repair.",notes:"Often stacked with BPC-157 for synergistic healing. Loading phase: 2x/week for 4–6 weeks. Maintenance: 1x/week."},
    {id:4,name:"Semaglutide",type:"GLP-1 Agonist",category:"Metabolic",dose:"0.25–2.4 mg",timing:"Once weekly SubQ",route:["SubQ"],tags:["weight loss","metabolic","GLP-1","insulin"],interactions:["insulin","metformin"],mechanism:"Long-acting GLP-1 receptor agonist. Slows gastric emptying, increases satiety, reduces glucagon release, improves insulin sensitivity.",notes:"Titrate slowly to minimize GI side effects. Monitor blood glucose, especially if on other diabetes medications."},
    {id:5,name:"Selank",type:"Nasal / Injectable",category:"Cognitive",dose:"250–500 mcg",timing:"Morning or as needed",route:["Intranasal","SubQ"],tags:["anxiety","cognitive","BDNF","nootropic"],interactions:[],mechanism:"Heptapeptide analogue of tuftsin. Modulates GABAergic system, increases BDNF, serotonin, and dopamine without dependence risk.",notes:"Nasal administration: 1–2 drops per nostril. Do not exceed 3 uses per day. Store refrigerated."},
    {id:6,name:"Semax",type:"Nasal Peptide",category:"Cognitive",dose:"200–600 mcg",timing:"Morning, split doses",route:["Intranasal"],tags:["BDNF","cognitive","neuroprotection","focus"],interactions:[],mechanism:"ACTH 4-7 analogue. Significantly elevates BDNF and NGF. Enhances dopaminergic tone, attention, and working memory.",notes:"Stack with Selank for synergistic anxiolytic + cognitive effect. 3-on / 3-off cycling recommended."},
    {id:7,name:"Epitalon",type:"Bioregulator",category:"Longevity",dose:"5–10 mg",timing:"Daily for 10–20 day cycle",route:["SubQ","IV"],tags:["longevity","telomere","pineal","anti-aging"],interactions:[],mechanism:"Tetrapeptide that activates telomerase and normalizes pineal melatonin production. Demonstrated lifespan extension in multiple animal studies.",notes:"Typical protocol: 5–10 mg/day for 10–20 days, 1–2x per year. Resets circadian rhythm disruption."},
    {id:8,name:"Thymosin Alpha-1",type:"Immune Peptide",category:"Immune",dose:"0.5–1.6 mg",timing:"2–3x per week",route:["SubQ"],tags:["immune","antiviral","inflammation"],interactions:[],mechanism:"Naturally occurring thymic peptide. Activates TLR signaling, augments T-cell function, stimulates NK cell activity, reduces chronic inflammation.",notes:"Used clinically for HBV, HCV, and as immune adjuvant. Low side-effect profile. Well-studied safety record."},
    {id:9,name:"AOD-9604",type:"HGH Fragment",category:"Metabolic",dose:"200–300 mcg",timing:"Fasted, morning or pre-workout",route:["SubQ"],tags:["fat loss","metabolic","lipolysis"],interactions:[],mechanism:"Modified fragment of HGH (176-191). Stimulates lipolysis without affecting blood glucose or IGF-1. No anabolic effects.",notes:"Most effective in fasted state. Can be combined with CJC-1295/Ipamorelin for comprehensive body composition protocol."},
    {id:10,name:"PT-141",type:"Melanocortin",category:"Sexual Health",dose:"0.5–2 mg",timing:"1–2 hours before",route:["SubQ","Intranasal"],tags:["libido","sexual health","melanocortin"],interactions:["cialis","viagra"],mechanism:"Melanocortin receptor agonist (MC3R/MC4R). Acts centrally in the hypothalamus to increase sexual arousal and desire in both men and women.",notes:"Do not combine with PDE5 inhibitors (Cialis, Viagra) — significant hypotension risk. Start at lowest dose."},
    {id:11,name:"DSIP",type:"Sleep Peptide",category:"Sleep",dose:"100–300 mcg",timing:"30 min before bed",route:["SubQ"],tags:["sleep","recovery","delta wave","circadian"],interactions:[],mechanism:"Delta sleep-inducing peptide. Increases slow-wave sleep, reduces cortisol, normalizes circadian rhythm disruption.",notes:"Most effective for jet lag, shift work, or poor sleep architecture. Stack with Epitalon for comprehensive sleep restoration."},
    {id:12,name:"Kisspeptin-10",type:"Neuropeptide",category:"Hormonal",dose:"1–3 mcg/kg",timing:"Pulsed every 90 min or as directed",route:["SubQ","IV"],tags:["LH","testosterone","hormonal","fertility"],interactions:["testosterone","clomid"],mechanism:"Hypothalamic neuropeptide that triggers GnRH release, leading to LH pulsation and downstream testosterone production.",notes:"Complex dosing — typically used clinically under supervision. Can be part of testosterone recovery protocols."},
    {id:13,name:"NMN",type:"NAD+ Precursor",category:"Longevity",dose:"500–1000 mg",timing:"Morning with or without food",route:["Oral"],tags:["NAD+","longevity","mitochondria","energy"],interactions:[],mechanism:"Directly converts to NAD+ via the NMN salvage pathway. Supports sirtuin activity, DNA repair, mitochondrial biogenesis, and cellular energy metabolism.",notes:"Sublingual administration may improve bioavailability. Stack with Resveratrol for enhanced sirtuin activation (pterostilbene preferred)."},
    {id:14,name:"GHRP-6",type:"GHRP",category:"Performance",dose:"100–300 mcg",timing:"3x daily — morning, pre-workout, bedtime",route:["SubQ"],tags:["GH","appetite","performance","recovery"],interactions:["ipamorelin","CJC"],mechanism:"Ghrelin mimetic. Stimulates GH release from pituitary via GHSR-1a. Notable appetite-stimulating effect differentiates it from Ipamorelin.",notes:"Causes significant hunger — best for bulking phases. Often replaced with Ipamorelin for leaner goals."},
    {id:15,name:"LL-37",type:"Antimicrobial Peptide",category:"Immune",dose:"100–200 mcg",timing:"Daily",route:["SubQ"],tags:["immune","antimicrobial","inflammation","wound healing"],interactions:[],mechanism:"Human cathelicidin. Broad-spectrum antimicrobial, immunomodulatory, promotes wound healing, and inhibits inflammatory cytokines.",notes:"Emerging use in chronic infection, Lyme co-infections, and post-viral syndromes. Limited human trial data — use cautiously."},
  ],
  supplements:[
    {id:101,name:"NMN",type:"NAD+ Precursor",category:"Longevity",dose:"500–1000 mg",timing:"Morning",route:["Oral"],tags:["NAD+","longevity","energy"],interactions:[]},
    {id:102,name:"Magnesium Glycinate",type:"Mineral",category:"Sleep & Recovery",dose:"400 mg",timing:"Evening",route:["Oral"],tags:["sleep","muscle","anxiety"],interactions:[]},
    {id:103,name:"Vitamin D3 + K2",type:"Vitamin Complex",category:"Foundation",dose:"5000 IU D3 / 200 mcg K2",timing:"Morning with fat",route:["Oral"],tags:["immune","bone","cardiovascular"],interactions:["calcium","warfarin"]},
    {id:104,name:"Omega-3 (EPA/DHA)",type:"Essential Fatty Acid",category:"Foundation",dose:"2–4 g EPA+DHA",timing:"With meals",route:["Oral"],tags:["inflammation","cardiovascular","brain"],interactions:["warfarin","blood thinners"]},
    {id:105,name:"Berberine",type:"Alkaloid",category:"Metabolic",dose:"500 mg",timing:"Before meals, 3x daily",route:["Oral"],tags:["glucose","metabolic","insulin","microbiome"],interactions:["metformin","diabetes meds"]},
    {id:106,name:"Lion's Mane",type:"Medicinal Mushroom",category:"Cognitive",dose:"1000–3000 mg",timing:"Morning",route:["Oral"],tags:["BDNF","neurogenesis","cognitive","neuroprotection"],interactions:[]},
    {id:107,name:"Glutathione",type:"Antioxidant",category:"Detox",dose:"500 mg (liposomal preferred)",timing:"Fasted morning",route:["Oral","IV"],tags:["antioxidant","detox","immune","mitochondria"],interactions:[]},
    {id:108,name:"Zinc-Carnosine",type:"Mineral Complex",category:"Gut Health",dose:"75 mg",timing:"Before bed",route:["Oral"],tags:["gut","mucosal healing","H. pylori","gastric"],interactions:[]},
    {id:109,name:"Resveratrol / Pterostilbene",type:"Polyphenol",category:"Longevity",dose:"250–500 mg",timing:"With NMN and fat",route:["Oral"],tags:["sirtuin","NAD+","longevity","antioxidant"],interactions:["warfarin"]},
    {id:110,name:"Ashwagandha (KSM-66)",type:"Adaptogen",category:"Stress",dose:"300–600 mg",timing:"Evening",route:["Oral"],tags:["cortisol","stress","testosterone","sleep"],interactions:["sedatives","thyroid meds"]},
  ],
};

const ALL_COMPOUNDS = [...DB.peptides,...DB.supplements];

const PLANS = [
  {
    id:"silver",name:"SILVER",price:74.99,annualPrice:59.99,color:C.textMid,borderColor:"rgba(184,212,192,.3)",
    features:["Supplement & peptide database (500+)","Basic interaction checker (up to 8 compounds)","Smart dosing scheduler","Injection site guide","10 AI Health Advisor queries/month"],
    locked:["Lab tracker & trend analysis","Full protocol library","Unlimited AI queries","Biological age calculator"],
    btnStyle:{background:"transparent",border:`1px solid ${C.borderEm}`,color:C.emXL},btnLabel:"Start Free Trial",
  },
  {
    id:"gold",name:"GOLD",price:149.99,annualPrice:119.99,color:C.goldL,borderColor:C.borderGold,popular:true,
    features:["Everything in Silver","Unlimited interaction checker","Lab tracker & biomarker trending","Full protocol library (200+)","50 AI Health Advisor queries/month","Sound therapy & recovery library","Wearable integrations (Oura, WHOOP, Apple Health)"],
    locked:["Unlimited AI queries","Biological age calculator"],
    btnStyle:{background:`linear-gradient(135deg,${C.em},${C.emL})`,color:"#fff"},btnLabel:"Start Free Trial",
  },
  {
    id:"elite",name:"EMERALD ELITE",price:199.99,annualPrice:159.99,color:C.emXL,borderColor:C.borderEm,complete:true,
    features:["Everything in Gold","Unlimited AI Health Advisor queries","Biological age calculator & tracking","Custom protocol builder","Glandular & bioregulator database","Priority support & enrollment","Exportable health reports (PDF)","Personalized AI optimization cycles"],
    locked:[],
    btnStyle:{background:`linear-gradient(135deg,${C.emL},${C.emXL})`,color:"#050d07",fontWeight:"700"},btnLabel:"Start Free Trial",
  },
  {
    id:"pro",name:"PRO PRACTITIONER",price:299.99,annualPrice:239.99,color:C.goldXL,borderColor:C.borderGold,pro:true,
    features:["Everything in Emerald Elite","Patient profiles & management","Per-patient stack & medication log","SOAP progress notes","White-label branded exports","Bulk interaction checker","Appointment scheduling","Practitioner AI mode","HIPAA BAA available"],
    locked:[],
    btnStyle:{background:`linear-gradient(135deg,${C.gold},${C.goldL})`,color:"#050d07",fontWeight:"700"},btnLabel:"Start Pro Trial",
  },
];

const TABS = [
  {id:"onboarding",icon:"✦",label:"Get Started"},
  {id:"dashboard",icon:"◈",label:"Dashboard"},
  {id:"stack",icon:"⬡",label:"My Stack"},
  {id:"database",icon:"◬",label:"Database"},
  {id:"interactions",icon:"⚡",label:"Interactions"},
  {id:"schedule",icon:"◷",label:"Schedule"},
  {id:"labs",icon:"🧪",label:"Labs"},
  {id:"protocols",icon:"⟡",label:"Protocols"},
  {id:"ai",icon:"✦",label:"AI Advisor"},
  {id:"plans",icon:"💎",label:"Plans"},
];

const CATEGORY_COLORS = {
  Healing:{bg:"rgba(64,216,136,.1)",color:C.emXL,border:"rgba(64,216,136,.25)"},
  Performance:{bg:"rgba(200,168,40,.1)",color:C.goldL,border:"rgba(200,168,40,.25)"},
  Cognitive:{bg:"rgba(100,120,255,.1)",color:"#a0b0ff",border:"rgba(100,120,255,.25)"},
  Longevity:{bg:"rgba(200,80,200,.1)",color:"#e080e0",border:"rgba(200,80,200,.25)"},
  Metabolic:{bg:"rgba(255,160,60,.1)",color:"#ffb060",border:"rgba(255,160,60,.25)"},
  Immune:{bg:"rgba(60,200,200,.1)",color:"#60d8d8",border:"rgba(60,200,200,.25)"},
  Sleep:{bg:"rgba(80,80,255,.1)",color:"#9090ff",border:"rgba(80,80,255,.25)"},
  "Sleep & Recovery":{bg:"rgba(80,80,255,.1)",color:"#9090ff",border:"rgba(80,80,255,.25)"},
  Hormonal:{bg:"rgba(255,100,100,.1)",color:"#ff9090",border:"rgba(255,100,100,.25)"},
  "Sexual Health":{bg:"rgba(255,80,160,.1)",color:"#ff80c0",border:"rgba(255,80,160,.25)"},
  Foundation:{bg:C.emPale,color:C.emXL,border:C.borderEm},
  Stress:{bg:"rgba(180,140,80,.1)",color:"#d4a060",border:"rgba(180,140,80,.25)"},
  Detox:{bg:"rgba(80,200,120,.1)",color:"#60d880",border:"rgba(80,200,120,.25)"},
  "Gut Health":{bg:"rgba(120,200,80,.1)",color:"#90d060",border:"rgba(120,200,80,.25)"},
};
const catColor=(cat)=>CATEGORY_COLORS[cat]||{bg:C.emPale,color:C.emXL,border:C.borderEm};

// ═══════════════════════════════════════
// STYLES
// ═══════════════════════════════════════
const S = {
  app:{fontFamily:F.sans,background:C.bg,color:C.text,minHeight:"100vh",display:"flex",flexDirection:"column",maxWidth:960,margin:"0 auto",position:"relative"},
  header:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",background:C.bg2,borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:50},
  logo:{display:"flex",alignItems:"center",gap:10,fontFamily:F.cinzel,fontSize:13,letterSpacing:2,color:C.emXL},
  diamond:{width:24,height:24,background:`linear-gradient(135deg,${C.em},${C.emXL})`,transform:"rotate(45deg)",borderRadius:3,flexShrink:0},
  timeChip:{fontFamily:F.cinzel,fontSize:11,letterSpacing:1,color:C.textDim,background:C.bg3,border:`1px solid ${C.border}`,borderRadius:6,padding:"4px 10px"},
  tabBar:{display:"flex",gap:2,overflowX:"auto",padding:"10px 16px",background:C.bg2,borderBottom:`1px solid ${C.border}`,scrollbarWidth:"none"},
  tab:(active)=>({display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"8px 14px",borderRadius:10,border:"none",background:active?C.emPale:"transparent",cursor:"pointer",transition:"all .2s",flexShrink:0,borderBottom:active?`1px solid ${C.borderEm}`:"1px solid transparent"}),
  tabIcon:(active)=>({fontSize:16,color:active?C.emXL:C.textDim}),
  tabLabel:(active)=>({fontSize:9,letterSpacing:1,fontFamily:F.cinzel,color:active?C.emXL:C.textDim,textTransform:"uppercase",whiteSpace:"nowrap"}),
  content:{flex:1,padding:"20px 16px",overflowY:"auto"},
  card:(extra={})=>({background:C.bg2,border:`1px solid ${C.border}`,borderRadius:14,padding:20,...extra}),
  cardEm:(extra={})=>({background:`linear-gradient(135deg,${C.emPale},transparent)`,border:`1px solid ${C.borderEm}`,borderRadius:14,padding:20,...extra}),
  cardGold:(extra={})=>({background:`linear-gradient(135deg,${C.goldPale},transparent)`,border:`1px solid ${C.borderGold}`,borderRadius:14,padding:20,...extra}),
  pill:(color=C.emXL,bg=C.emPale,border=C.borderEm)=>({display:"inline-flex",alignItems:"center",background:bg,color,border:`1px solid ${border}`,borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:700,letterSpacing:.8,textTransform:"uppercase",whiteSpace:"nowrap"}),
  sectionTitle:{fontFamily:F.serif,fontSize:22,fontWeight:700,marginBottom:16},
  label:{fontFamily:F.cinzel,fontSize:9,letterSpacing:3,color:C.textDim,textTransform:"uppercase",marginBottom:8},
  btn:(extra={})=>({padding:"10px 18px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:F.sans,fontSize:13,fontWeight:500,letterSpacing:.5,transition:"all .2s",...extra}),
  input:{background:C.bg3,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 12px",color:C.text,fontFamily:F.sans,fontSize:13,outline:"none",width:"100%"},
};

// ═══════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════
export default function EmeraldWellnessApp() {
  const [tab, setTab] = useState("onboarding");
  const [onboardStep, setOnboardStep] = useState(0);
  const [notifGranted, setNotifGranted] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistDone, setWaitlistDone] = useState(false);

  // ── SUPABASE SESSION ──
  const [sbUser, setSbUser] = useState(null);
  const [sbLoading, setSbLoading] = useState(true);

  useEffect(()=>{
    // Check for existing Supabase session
    sb.auth.getSession().then(({ data:{ session }})=>{
      setSbUser(session?.user ?? null);
      setSbLoading(false);
      // If logged in, skip onboarding
      if(session?.user) setTab("dashboard");
    });
    // Listen for auth changes
    const { data:{ subscription }} = sb.auth.onAuthStateChange((_event, session)=>{
      setSbUser(session?.user ?? null);
    });
    return ()=> subscription.unsubscribe();
  },[]);

  // ── SAVE STACK TO SUPABASE ──
  const saveStack = useCallback(async(stack)=>{
    if(!sbUser) return;
    try {
      await sb.from('profiles').update({
        goals: stack.map(c=>c.name)
      }).eq('id', sbUser.id);
    } catch(e){ console.warn('Stack save error:', e); }
  },[sbUser]);

  // ── LOAD PROFILE DATA ──
  useEffect(()=>{
    if(!sbUser) return;
    sb.from('profiles')
      .select('goals, plan, first_name')
      .eq('id', sbUser.id)
      .single()
      .then(({ data })=>{
        if(data?.plan) {
          // Could set active plan indicator here
        }
      });
  },[sbUser]);
  const [myStack, setMyStack] = useState([DB.peptides[0], DB.peptides[1], DB.supplements[1], DB.supplements[2]]);
  const [searchQ, setSearchQ] = useState("");
  const [aiMessages, setAiMessages] = useState([{role:"assistant",text:"Welcome to your Health Intelligence Advisor. I can answer questions about your stack, dosing, interactions, protocols, and optimization strategies. What would you like to know?"}]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedCompound, setSelectedCompound] = useState(null);
  const [annualBilling, setAnnualBilling] = useState(false);
  const [time, setTime] = useState(new Date());
  const aiEndRef = useRef(null);

  useEffect(()=>{const t=setInterval(()=>setTime(new Date()),60000);return()=>clearInterval(t);},[]);
  useEffect(()=>{aiEndRef.current?.scrollIntoView({behavior:"smooth"});},[aiMessages]);

  const addToStack = useCallback((compound)=>{
    if(!myStack.find(c=>c.id===compound.id)){
      const newStack = [...myStack, compound];
      setMyStack(newStack);
      saveStack(newStack);
    }
  },[myStack, saveStack]);

  const removeFromStack = useCallback((id)=>{
    const newStack = myStack.filter(c=>c.id!==id);
    setMyStack(newStack);
    saveStack(newStack);
  },[myStack, saveStack]);

  const filteredDB = useMemo(()=>{
    if(!searchQ)return ALL_COMPOUNDS;
    const q=searchQ.toLowerCase();
    return ALL_COMPOUNDS.filter(c=>c.name.toLowerCase().includes(q)||c.category.toLowerCase().includes(q)||c.tags.some(t=>t.includes(q)));
  },[searchQ]);

  const interactions = useMemo(()=>{
    const issues=[];
    myStack.forEach((a,i)=>{myStack.slice(i+1).forEach(b=>{if(a.interactions?.includes(b.name.toLowerCase())||b.interactions?.includes(a.name.toLowerCase())){issues.push({a:a.name,b:b.name,severity:"caution"});}});});
    return issues;
  },[myStack]);

  const sendAI = useCallback(async()=>{
    if(!aiInput.trim()||aiLoading)return;
    const userMsg=aiInput.trim();
    setAiMessages(m=>[...m,{role:"user",text:userMsg}]);
    setAiInput("");
    setAiLoading(true);
    try{
      const stackSummary=myStack.map(c=>`${c.name} (${c.dose}, ${c.timing})`).join("; ");
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:`You are the Emerald Wellness Health Intelligence Advisor — an expert in supplements, peptides, glandulars, bioregulators, longevity protocols, and human performance optimization. The user's current stack: ${stackSummary||"none yet"}. Provide accurate, evidence-based, concise answers. Always recommend consulting a healthcare provider for medical decisions. Never diagnose or treat conditions. Be direct and clinically precise.`,messages:[...aiMessages.filter(m=>m.role!=="assistant"||aiMessages.indexOf(m)>0).map(m=>({role:m.role==="assistant"?"assistant":"user",content:m.text})),{role:"user",content:userMsg}]})});
      const data=await res.json();
      const reply=data.content?.map(b=>b.text||"").join("")||"I couldn't process that request. Please try again.";
      setAiMessages(m=>[...m,{role:"assistant",text:reply}]);
    }catch(e){setAiMessages(m=>[...m,{role:"assistant",text:"Connection error. Please check your network and try again."}]);}
    setAiLoading(false);
  },[aiInput,aiLoading,aiMessages,myStack]);

  const timeStr=time.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:false});

  // ── RENDER TABS ──
  // ── ONBOARDING ──
  const ONBOARD_STEPS = [
    {
      icon:"✦",title:"Welcome to Emerald Wellness",
      sub:"The world's most advanced biohacking platform. Let's get you set up in 60 seconds.",
      cta:"Get Started →",
    },
    {
      icon:"⬡",title:"What's your primary goal?",
      sub:"We'll personalize your protocol recommendations.",
      options:["Longevity & Anti-Aging","Performance & Recovery","Cognitive Enhancement","Metabolic Optimization","Gut Health","Immune Optimization"],
    },
    {
      icon:"◬",title:"What are you currently taking?",
      sub:"Select all that apply — we'll check interactions immediately.",
      options:["Peptides","Supplements","Prescription medications","Nothing yet"],
    },
    {
      icon:"◷",title:"Enable smart reminders",
      sub:"Never miss a dose. We'll remind you at the perfect time for each compound.",
      isNotif:true,
    },
    {
      icon:"💎",title:"Your Emerald Wellness enrollment is ready",
      sub:"Start with $1 for the first 7 days, then continue with your selected plan.",
      isWaitlist:true,
    },
  ];

  function Onboarding(){
    const step=ONBOARD_STEPS[onboardStep];
    const [selectedGoal,setSelectedGoal]=useState([]);
    const progress=Math.round(((onboardStep)/(ONBOARD_STEPS.length-1))*100);
    return(
      <div style={{display:"flex",flexDirection:"column",minHeight:"calc(100vh - 160px)",justifyContent:"space-between"}}>
        <div>
          {/* Progress bar */}
          <div style={{background:C.bg3,borderRadius:4,height:4,marginBottom:32,overflow:"hidden"}}>
            <div style={{height:"100%",background:`linear-gradient(90deg,${C.em},${C.emXL})`,width:`${progress}%`,transition:"width .4s ease",borderRadius:4}}/>
          </div>
          <div style={{textAlign:"center",marginBottom:32}}>
            <div style={{fontSize:48,marginBottom:16}}>{step.icon}</div>
            <h2 style={{fontFamily:F.serif,fontSize:24,fontWeight:700,marginBottom:10,lineHeight:1.2}}>{step.title}</h2>
            <p style={{fontSize:14,color:C.textMid,lineHeight:1.65,maxWidth:340,margin:"0 auto"}}>{step.sub}</p>
          </div>
          {/* Options grid */}
          {step.options&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>
              {step.options.map(opt=>{
                const sel=selectedGoal.includes(opt);
                return(
                  <button key={opt} onClick={()=>setSelectedGoal(s=>sel?s.filter(x=>x!==opt):[...s,opt])} style={{...S.btn({background:sel?C.emPale:"transparent",border:`1px solid ${sel?C.borderEm:C.border}`,color:sel?C.emXL:C.textMid,textAlign:"left",padding:"12px 14px",fontSize:13,lineHeight:1.4})}}>
                    {sel&&<span style={{marginRight:6,color:C.emXL}}>✓</span>}{opt}
                  </button>
                );
              })}
            </div>
          )}
          {/* Notification step */}
          {step.isNotif&&(
            <div style={{...S.cardEm(),textAlign:"center",marginBottom:24}}>
              <div style={{fontSize:32,marginBottom:12}}>🔔</div>
              <p style={{fontSize:14,color:C.textMid,marginBottom:16,lineHeight:1.65}}>Emerald Wellness sends smart, time-specific reminders based on each compound's half-life and your schedule — not generic alerts.</p>
              {notifGranted?(
                <div style={{color:C.emXL,fontSize:14,fontWeight:500}}>✓ Smart reminders enabled</div>
              ):(
                <button onClick={()=>setNotifGranted(true)} style={S.btn({background:`linear-gradient(135deg,${C.em},${C.emL})`,color:"#fff",width:"100%"})}>Enable Smart Reminders</button>
              )}
              <p style={{fontSize:11,color:C.textDim,marginTop:10}}>You can change this in Settings at any time.</p>
            </div>
          )}
          {/* Waitlist step */}
          {step.isWaitlist&&!waitlistDone&&(
            <div style={{...S.cardGold(),marginBottom:24}}>
              <p style={{fontFamily:F.cinzel,fontSize:10,letterSpacing:2,color:C.goldL,marginBottom:12}}>FOUNDING MEMBER OFFER</p>
              <div style={{...S.cardEm({padding:12,marginBottom:14}),background:C.emPale}}>
                <p style={{fontSize:13,color:C.textMid,lineHeight:1.6}}>✦ <strong style={{color:C.emXL}}>$1 for the first 7 days</strong><br/>✦ Continue with your selected plan<br/>✦ Membership access after enrollment</p>
              </div>
              <input value={waitlistEmail} onChange={e=>setWaitlistEmail(e.target.value)} placeholder="Enter your email" style={{...S.input,marginBottom:10}}/>
              <button onClick={async()=>{
                if(!waitlistEmail.includes('@')){alert('Enter a valid email');return;}
                try{
                  await sb.from('waitlist').upsert({
                    email: waitlistEmail,
                    source: 'app-onboarding',
                    referral_link: 'emeraldwellness.health/ref/EW'+Math.random().toString(36).substr(2,6).toUpperCase()
                  },{onConflict:'email'});
                }catch(e){console.warn('Supabase waitlist:',e);}
                setWaitlistDone(true);
              }} style={S.btn({background:`linear-gradient(135deg,${C.gold},${C.goldL})`,color:"#050d07",fontWeight:700,width:"100%"})}>Start Enrollment →</button>
            </div>
          )}
          {step.isWaitlist&&waitlistDone&&(
            <div style={{...S.cardEm(),textAlign:"center",marginBottom:24}}>
              <div style={{fontSize:32,marginBottom:8}}>✦</div>
              <div style={{color:C.emXL,fontSize:15,fontWeight:600,marginBottom:6}}>You're on the list.</div>
              <p style={{fontSize:13,color:C.textMid,lineHeight:1.65}}>Your $1 first 7 days and selected plan are ready.</p>
              <div style={{marginTop:14,padding:12,background:C.bg3,borderRadius:8}}>
                <p style={{fontSize:11,color:C.textDim,marginBottom:6}}>Share to move up the waitlist:</p>
                <div style={{display:"flex",gap:8}}>
                  <input readOnly value="emeraldwellness.health/ref/YOUR123" style={{...S.input,fontSize:11,flex:1}}/>
                  <button style={S.btn({background:C.em,color:"#fff",padding:"8px 12px",fontSize:11})}>Copy</button>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Navigation */}
        <div style={{display:"flex",gap:12,marginTop:16}}>
          {onboardStep>0&&(
            <button onClick={()=>setOnboardStep(s=>s-1)} style={S.btn({background:"transparent",color:C.textDim,border:`1px solid ${C.border}`,flex:1})}>← Back</button>
          )}
          <button onClick={()=>{if(onboardStep<ONBOARD_STEPS.length-1){setOnboardStep(s=>s+1);}else{setTab("dashboard");}}} style={S.btn({background:`linear-gradient(135deg,${C.em},${C.emL})`,color:"#fff",flex:2})}>
            {onboardStep<ONBOARD_STEPS.length-1?"Continue →":"Launch My Dashboard ✦"}
          </button>
        </div>
        <p style={{textAlign:"center",fontSize:11,color:C.textDim,marginTop:12}}>Step {onboardStep+1} of {ONBOARD_STEPS.length}</p>
      </div>
    );
  }

  // ── DASHBOARD ──
    <div>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:16,marginBottom:24}}>
        <div>
          <p style={S.label}>Health Intelligence Dashboard</p>
          <h2 style={{fontFamily:F.serif,fontSize:26,fontWeight:700}}>Good Morning, Optimizer</h2>
        </div>
        <div style={S.timeChip}>{timeStr}</div>
      </div>
      {/* Stats row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:12,marginBottom:24}}>
        {[
          {label:"Stack Size",val:myStack.length,unit:"compounds",color:C.emXL},
          {label:"Interactions",val:interactions.length,unit:"flags",color:interactions.length>0?C.red:C.emXL},
          {label:"Today's Doses",val:myStack.length,unit:"scheduled",color:C.goldL},
          {label:"Protocols",val:3,unit:"active",color:"#a0b0ff"},
        ].map(s=>(
          <div key={s.label} style={S.card()}>
            <p style={{...S.label,marginBottom:4}}>{s.label}</p>
            <div style={{fontFamily:F.serif,fontSize:28,fontWeight:700,color:s.color}}>{s.val}</div>
            <div style={{fontSize:11,color:C.textDim}}>{s.unit}</div>
          </div>
        ))}
      </div>
      {/* Today's schedule preview */}
      <div style={{...S.cardEm(),marginBottom:16}}>
        <p style={S.label}>Today's Schedule</p>
        {myStack.slice(0,4).map(c=>(
          <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
            <div>
              <div style={{fontSize:14,fontWeight:500}}>{c.name}</div>
              <div style={{fontSize:11,color:C.textDim}}>{c.dose} · {c.timing}</div>
            </div>
            <span style={S.pill(catColor(c.category).color,catColor(c.category).bg,catColor(c.category).border)}>{c.category}</span>
          </div>
        ))}
      </div>
      {interactions.length>0&&(
        <div style={{...S.card({background:C.redPale,border:`1px solid rgba(224,80,80,.3)`}),marginBottom:16}}>
          <p style={{...S.label,color:C.red}}>⚠ Interaction Flags</p>
          {interactions.map((ix,i)=>(
            <div key={i} style={{fontSize:13,color:"#ffb0b0",marginBottom:4}}>⚡ {ix.a} + {ix.b} — review timing carefully</div>
          ))}
        </div>
      )}
      <div style={S.card()}>
        <p style={S.label}>Quick Actions</p>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          {[["⬡","Add Compound","stack"],["✦","Ask AI","ai"],["◬","Run Interaction Check","interactions"],["⟡","Browse Protocols","protocols"]].map(([icon,label,target])=>(
            <button key={target} onClick={()=>setTab(target)} style={S.btn({background:C.emPale,color:C.emXL,border:`1px solid ${C.borderEm}`,display:"flex",alignItems:"center",gap:6})}>
              <span>{icon}</span>{label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );}

  function Stack(){return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <p style={S.label}>Active Stack</p>
          <h2 style={S.sectionTitle}>My Protocol</h2>
        </div>
        <button onClick={()=>setTab("database")} style={S.btn({background:`linear-gradient(135deg,${C.em},${C.emL})`,color:"#fff"})}>+ Add Compound</button>
      </div>
      {myStack.length===0?(
        <div style={{...S.card(),textAlign:"center",padding:48}}>
          <div style={{fontSize:36,marginBottom:12}}>⬡</div>
          <p style={{color:C.textMid,marginBottom:16}}>Your stack is empty. Start building your protocol.</p>
          <button onClick={()=>setTab("database")} style={S.btn({background:`linear-gradient(135deg,${C.em},${C.emL})`,color:"#fff"})}>Browse Database</button>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {myStack.map(c=>(
            <div key={c.id} style={S.card({cursor:"pointer"})} onClick={()=>setSelectedCompound(c)}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
                    <span style={{fontFamily:F.serif,fontSize:17,fontWeight:600}}>{c.name}</span>
                    <span style={S.pill(catColor(c.category).color,catColor(c.category).bg,catColor(c.category).border)}>{c.category}</span>
                  </div>
                  <div style={{fontSize:12,color:C.textDim}}>{c.dose} · {c.timing} · {c.route?.join(" / ")}</div>
                  {c.notes&&<div style={{fontSize:12,color:C.textMid,marginTop:6,lineHeight:1.5}}>{c.notes.substring(0,90)}…</div>}
                </div>
                <button onClick={(e)=>{e.stopPropagation();removeFromStack(c.id);}} style={S.btn({background:C.redPale,color:C.red,padding:"6px 12px",fontSize:12})}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {selectedCompound&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setSelectedCompound(null)}>
          <div style={{...S.card({borderRadius:"20px 20px 0 0",padding:28,width:"100%",maxWidth:960,maxHeight:"80vh",overflowY:"auto"}),background:C.bg2}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
              <div>
                <span style={S.pill(catColor(selectedCompound.category).color,catColor(selectedCompound.category).bg,catColor(selectedCompound.category).border)}>{selectedCompound.category}</span>
                <h3 style={{fontFamily:F.serif,fontSize:24,fontWeight:700,marginTop:8}}>{selectedCompound.name}</h3>
                <p style={{fontSize:12,color:C.textDim}}>{selectedCompound.type}</p>
              </div>
              <button onClick={()=>setSelectedCompound(null)} style={S.btn({background:C.bg3,color:C.textDim})}>✕</button>
            </div>
            {[["Dose",selectedCompound.dose],["Timing",selectedCompound.timing],["Route",selectedCompound.route?.join(", ")],["Mechanism",selectedCompound.mechanism],["Notes",selectedCompound.notes]].filter(([,v])=>v).map(([k,v])=>(
              <div key={k} style={{marginBottom:14}}>
                <p style={{...S.label,marginBottom:4}}>{k}</p>
                <p style={{fontSize:13,color:C.textMid,lineHeight:1.65}}>{v}</p>
              </div>
            ))}
            {selectedCompound.tags?.length>0&&(
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:8}}>
                {selectedCompound.tags.map(t=><span key={t} style={S.pill()}>{t}</span>)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );}

  function Database(){return(
    <div>
      <p style={S.label}>Compound Database</p>
      <h2 style={S.sectionTitle}>500+ Compounds</h2>
      <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search peptides, supplements, categories, tags…" style={{...S.input,marginBottom:20}}/>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {filteredDB.map(c=>{
          const inStack=myStack.find(s=>s.id===c.id);
          const cc=catColor(c.category);
          return(
            <div key={c.id} style={S.card()}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                    <span style={{fontFamily:F.serif,fontSize:16,fontWeight:600}}>{c.name}</span>
                    <span style={S.pill(cc.color,cc.bg,cc.border)}>{c.category}</span>
                  </div>
                  <div style={{fontSize:12,color:C.textDim,marginBottom:4}}>{c.type} · {c.dose} · {c.timing}</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                    {c.tags?.slice(0,4).map(t=><span key={t} style={{...S.pill(C.textDim,"transparent",C.border),fontSize:9}}>{t}</span>)}
                  </div>
                </div>
                <button onClick={()=>inStack?removeFromStack(c.id):addToStack(c)} style={S.btn(inStack?{background:C.redPale,color:C.red}:{background:`linear-gradient(135deg,${C.em},${C.emL})`,color:"#fff"})}>
                  {inStack?"Remove":"+ Add"}
                </button>
              </div>
            </div>
          );
        })}
        {filteredDB.length===0&&<div style={{textAlign:"center",color:C.textDim,padding:40}}>No compounds match your search.</div>}
      </div>
    </div>
  );}

  function Interactions(){return(
    <div>
      <p style={S.label}>Interaction Checker</p>
      <h2 style={S.sectionTitle}>Stack Safety Analysis</h2>
      {myStack.length<2?(
        <div style={{...S.card(),textAlign:"center",padding:40}}>
          <p style={{color:C.textMid}}>Add at least 2 compounds to your stack to run interaction analysis.</p>
        </div>
      ):(
        <>
          <div style={{...S.cardEm(),marginBottom:16}}>
            <p style={S.label}>Analyzing {myStack.length} compounds</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {myStack.map(c=><span key={c.id} style={S.pill(catColor(c.category).color,catColor(c.category).bg,catColor(c.category).border)}>{c.name}</span>)}
            </div>
          </div>
          {interactions.length>0?(
            <div style={{...S.card({background:C.redPale,border:`1px solid rgba(224,80,80,.3)`}),marginBottom:16}}>
              <p style={{...S.label,color:C.red,marginBottom:12}}>⚠ {interactions.length} Interaction Flag{interactions.length>1?"s":""}</p>
              {interactions.map((ix,i)=>(
                <div key={i} style={{padding:"12px 0",borderBottom:`1px solid rgba(224,80,80,.15)`}}>
                  <div style={{fontWeight:600,color:"#ffb0b0",marginBottom:4}}>⚡ {ix.a} + {ix.b}</div>
                  <div style={{fontSize:12,color:"rgba(255,176,176,.7)"}}>Review timing and dosing carefully. Consult your healthcare provider before combining.</div>
                </div>
              ))}
            </div>
          ):(
            <div style={{...S.cardEm(),textAlign:"center",padding:32,marginBottom:16}}>
              <div style={{fontSize:32,marginBottom:8}}>✓</div>
              <div style={{color:C.emXL,fontWeight:600,marginBottom:4}}>No Known Interactions Detected</div>
              <div style={{fontSize:12,color:C.textDim}}>Your current stack has no flagged interactions in our database. Always consult a healthcare provider for clinical guidance.</div>
            </div>
          )}
          <div style={S.card()}>
            <p style={{...S.label,marginBottom:12}}>Timing Matrix</p>
            {myStack.map(c=>(
              <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
                <span style={{fontSize:13,fontWeight:500}}>{c.name}</span>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{fontSize:11,color:C.textDim}}>{c.timing}</span>
                  <span style={S.pill(catColor(c.category).color,catColor(c.category).bg,catColor(c.category).border)}>{c.route?.[0]||"Oral"}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );}

  function Schedule(){return(
    <div>
      <p style={S.label}>Smart Dosing Schedule</p>
      <h2 style={S.sectionTitle}>Today's Protocol</h2>
      {["Morning","Pre-Workout","Afternoon","Evening","Bedtime"].map(slot=>{
        const items=myStack.filter(c=>c.timing?.toLowerCase().includes(slot.toLowerCase().replace("-","").split(" ")[0])||
          (slot==="Morning"&&!["evening","bedtime","pre","afternoon"].some(k=>c.timing?.toLowerCase().includes(k))));
        return items.length>0?(
          <div key={slot} style={{...S.card(),marginBottom:12}}>
            <p style={{...S.label,color:C.goldL,marginBottom:12}}>{slot}</p>
            {items.map(c=>(
              <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                <div>
                  <div style={{fontSize:13,fontWeight:500}}>{c.name}</div>
                  <div style={{fontSize:11,color:C.textDim}}>{c.dose}</div>
                </div>
                <span style={S.pill(catColor(c.category).color,catColor(c.category).bg,catColor(c.category).border)}>{c.route?.[0]||"Oral"}</span>
              </div>
            ))}
          </div>
        ):null;
      })}
    </div>
  );}

  function Labs(){return(
    <div>
      <p style={S.label}>Lab Tracker</p>
      <h2 style={S.sectionTitle}>Biomarker Trending</h2>
      <div style={{...S.cardEm(),marginBottom:20,textAlign:"center",padding:40}}>
        <div style={{fontSize:36,marginBottom:12}}>🧪</div>
        <div style={{fontFamily:F.serif,fontSize:20,fontWeight:600,marginBottom:8}}>Connect Your Bloodwork</div>
        <p style={{fontSize:13,color:C.textMid,marginBottom:20,lineHeight:1.65}}>Import lab results from Quest, LabCorp, or any standard format. Track HbA1c, CRP, testosterone, IGF-1, Vitamin D, ferritin, and 60+ biomarkers over time.</p>
        <button style={S.btn({background:`linear-gradient(135deg,${C.em},${C.emL})`,color:"#fff"})}>Import Lab Results</button>
      </div>
      {[{name:"Vitamin D",val:62,unit:"ng/mL",opt:"50–80",status:"optimal"},{name:"HbA1c",val:5.3,unit:"%",opt:"<5.4",status:"optimal"},{name:"hs-CRP",val:0.4,unit:"mg/L",opt:"<0.5",status:"optimal"},{name:"Testosterone (Total)",val:742,unit:"ng/dL",opt:"700–1100",status:"optimal"},{name:"Ferritin",val:45,unit:"ng/mL",opt:"50–150",status:"low"}].map(b=>(
        <div key={b.name} style={{...S.card(),marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}>
          <div>
            <div style={{fontSize:14,fontWeight:500}}>{b.name}</div>
            <div style={{fontSize:11,color:C.textDim}}>Optimal: {b.opt}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:F.serif,fontSize:20,fontWeight:700,color:b.status==="optimal"?C.emXL:C.red}}>{b.val}</div>
            <div style={{fontSize:11,color:C.textDim}}>{b.unit}</div>
          </div>
        </div>
      ))}
    </div>
  );}

  function Protocols(){return(
    <div>
      <p style={S.label}>Clinical Protocols</p>
      <h2 style={S.sectionTitle}>Evidence-Based Stacks</h2>
      {[
        {icon:"🧬",name:"Longevity & Anti-Aging",desc:"Telomere maintenance, NAD+ restoration, senolytic support, and mitochondrial optimization.",compounds:["NMN","Epitalon","Resveratrol","Rapamycin"]},
        {icon:"🏋️",name:"Performance & Recovery",desc:"Tissue repair, GH optimization, and accelerated recovery between training sessions.",compounds:["BPC-157","TB-500","CJC-1295","Ipamorelin"]},
        {icon:"🧠",name:"Cognitive Enhancement",desc:"BDNF upregulation, working memory, anxiety reduction, and neuroplasticity.",compounds:["Semax","Selank","Lion's Mane","Bacopa"]},
        {icon:"🌿",name:"Gut Healing",desc:"Mucosal integrity, microbiome restoration, and intestinal inflammation reduction.",compounds:["BPC-157","L-Glutamine","Zinc-Carnosine","Tributyrin"]},
        {icon:"⚡",name:"Metabolic Optimization",desc:"Insulin sensitivity, visceral fat reduction, and metabolic syndrome reversal.",compounds:["Semaglutide","AOD-9604","Berberine","MOTS-c"]},
        {icon:"🛡️",name:"Immune Optimization",desc:"Innate and adaptive immunity enhancement, chronic inflammation reduction.",compounds:["Thymosin-α1","LL-37","Glutathione","Zinc"]},
      ].map(p=>(
        <div key={p.name} style={{...S.card(),marginBottom:12}}>
          <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
            <span style={{fontSize:24,flexShrink:0}}>{p.icon}</span>
            <div style={{flex:1}}>
              <div style={{fontFamily:F.serif,fontSize:16,fontWeight:600,marginBottom:6}}>{p.name}</div>
              <div style={{fontSize:12,color:C.textMid,marginBottom:10,lineHeight:1.6}}>{p.desc}</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {p.compounds.map(c=><span key={c} style={S.pill()}>{c}</span>)}
              </div>
            </div>
            <button onClick={()=>setTab("ai")} style={S.btn({background:C.emPale,color:C.emXL,fontSize:12,padding:"6px 12px"})}>Customize ✦</button>
          </div>
        </div>
      ))}
    </div>
  );}

  function AI(){return(
    <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 200px)"}}>
      <div>
        <p style={S.label}>Health Intelligence Advisor</p>
        <h2 style={{...S.sectionTitle,marginBottom:4}}>Ask Anything About Your Stack</h2>
        <p style={{fontSize:12,color:C.textDim,marginBottom:16}}>Powered by Claude. Not medical advice — always consult your provider.</p>
      </div>
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:12,marginBottom:16,paddingRight:4}}>
        {aiMessages.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
            <div style={{maxWidth:"85%",padding:"12px 16px",borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",background:m.role==="user"?`linear-gradient(135deg,${C.em},${C.emL})`:`${C.bg2}`,border:m.role==="assistant"?`1px solid ${C.border}`:"none",fontSize:13,lineHeight:1.65,color:m.role==="user"?"#fff":C.textMid}}>
              {m.text}
            </div>
          </div>
        ))}
        {aiLoading&&(
          <div style={{display:"flex",justifyContent:"flex-start"}}>
            <div style={{padding:"12px 16px",background:C.bg2,border:`1px solid ${C.border}`,borderRadius:"16px 16px 16px 4px",fontSize:13,color:C.textDim}}>
              <span style={{animation:"pulse 1s infinite"}}>✦ Analyzing…</span>
            </div>
          </div>
        )}
        <div ref={aiEndRef}/>
      </div>
      <div style={{display:"flex",gap:10}}>
        <input value={aiInput} onChange={e=>setAiInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendAI()} placeholder="Ask about your stack, dosing, interactions, protocols…" style={{...S.input,flex:1}}/>
        <button onClick={sendAI} disabled={aiLoading||!aiInput.trim()} style={S.btn({background:aiLoading||!aiInput.trim()?C.bg3:`linear-gradient(135deg,${C.em},${C.emL})`,color:aiLoading||!aiInput.trim()?C.textDim:"#fff",flexShrink:0})}>
          {aiLoading?"…":"Send"}
        </button>
      </div>
    </div>
  );}

  function Plans(){return(
    <div>
      <div style={{textAlign:"center",marginBottom:28}}>
        <p style={S.label}>Membership Plans</p>
        <h2 style={S.sectionTitle}>Choose Your Tier</h2>
        <div style={{display:"flex",alignItems:"center",gap:14,justifyContent:"center",marginTop:16}}>
          <span style={{fontSize:13,color:annualBilling?C.textDim:C.text}}>Monthly</span>
          <div onClick={()=>setAnnualBilling(!annualBilling)} style={{width:48,height:26,background:annualBilling?C.em:C.bg3,border:`1px solid ${annualBilling?C.borderEm:C.border}`,borderRadius:13,position:"relative",cursor:"pointer",transition:"all .2s"}}>
            <div style={{position:"absolute",top:3,left:annualBilling?23:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left .2s"}}/>
          </div>
          <span style={{fontSize:13,color:annualBilling?C.text:C.textDim}}>Annual</span>
          <span style={{...S.pill(C.goldL,C.goldPale,C.borderGold)}}>Save 20%</span>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        {PLANS.map(plan=>{
          const price=annualBilling?plan.annualPrice:plan.price;
          const isGold=plan.id==="gold",isElite=plan.id==="elite",isPro=plan.id==="pro";
          return(
            <div key={plan.id} style={{background:C.bg2,border:`1px solid ${plan.borderColor}`,borderRadius:18,padding:28,position:"relative",
              ...(plan.complete||plan.popular?{background:`linear-gradient(135deg,${C.emPale},transparent)`}:{}),
              ...(plan.pro?{background:`linear-gradient(135deg,${C.goldPale},transparent)`}:{})}}>
              {plan.popular&&<div style={{position:"absolute",top:-12,left:24,padding:"4px 14px",background:`linear-gradient(135deg,${C.em},${C.emL})`,borderRadius:20,fontSize:10,fontWeight:700,letterSpacing:1,color:"#fff",textTransform:"uppercase"}}>Most Popular</div>}
              {plan.complete&&<div style={{position:"absolute",top:-12,left:24,padding:"4px 14px",background:`linear-gradient(135deg,${C.emL},${C.emXL})`,borderRadius:20,fontSize:10,fontWeight:700,letterSpacing:1,color:"#050d07",textTransform:"uppercase"}}>Complete</div>}
              {plan.pro&&<div style={{position:"absolute",top:-12,left:24,padding:"4px 14px",background:`linear-gradient(135deg,${C.gold},${C.goldL})`,borderRadius:20,fontSize:10,fontWeight:700,letterSpacing:1,color:"#050d07",textTransform:"uppercase"}}>Pro Practitioners</div>}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12,marginBottom:16}}>
                <div>
                  <p style={{fontFamily:F.cinzel,fontSize:12,letterSpacing:2,color:plan.color,marginBottom:6}}>{plan.name}</p>
                  <div style={{display:"flex",alignItems:"flex-end",gap:4}}>
                    <span style={{fontFamily:F.serif,fontSize:38,fontWeight:900,color:C.text}}>${Math.floor(price)}</span>
                    <span style={{fontFamily:F.serif,fontSize:18,fontWeight:700,color:C.text,marginBottom:6}}>.{(price%1).toFixed(2).slice(2)}</span>
                    <span style={{fontSize:13,color:C.textDim,marginBottom:8}}>/mo</span>
                  </div>
                  {annualBilling&&<div style={{fontSize:11,color:C.textDim}}>Billed annually · Save ${Math.round((plan.price-plan.annualPrice)*12)}/yr</div>}
                </div>
                <button style={S.btn({...plan.btnStyle,alignSelf:"flex-start",whiteSpace:"nowrap"})}>{plan.btnLabel}</button>
              </div>
              <div style={{borderTop:`1px solid ${C.border}`,paddingTop:16}}>
                {plan.features.map(f=>(
                  <div key={f} style={{display:"flex",gap:8,marginBottom:8,fontSize:13,color:C.textMid,alignItems:"flex-start"}}>
                    <span style={{color:C.emXL,flexShrink:0,marginTop:1}}>✓</span>{f}
                  </div>
                ))}
                {plan.locked.map(f=>(
                  <div key={f} style={{display:"flex",gap:8,marginBottom:8,fontSize:13,color:"rgba(138,172,150,.35)",alignItems:"flex-start"}}>
                    <span style={{flexShrink:0,marginTop:1}}>✕</span>{f}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {/* Enterprise */}
      <div style={{...S.cardGold(),marginTop:24,display:"flex",flexWrap:"wrap",gap:16,alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <p style={{fontFamily:F.serif,fontSize:18,fontWeight:700,marginBottom:6}}>Enterprise &amp; Multi-Provider Clinics</p>
          <p style={{fontSize:13,color:C.textMid,lineHeight:1.6}}>Custom pricing, SSO, shared patient databases, white-label branding, and HIPAA BAA.</p>
        </div>
        <a href="mailto:enterprise@emeraldwellness.health" style={S.btn({background:`linear-gradient(135deg,${C.gold},${C.goldL})`,color:"#050d07",fontWeight:700,textDecoration:"none"})}>Contact Enterprise →</a>
      </div>
    </div>
  );}

  const TAB_CONTENT = {onboarding:<Onboarding/>,dashboard:<Dashboard/>,stack:<Stack/>,database:<Database/>,interactions:<Interactions/>,schedule:<Schedule/>,labs:<Labs/>,protocols:<Protocols/>,ai:<AI/>,plans:<Plans/>};

  return(
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=DM+Sans:wght@300;400;500&family=Cinzel:wght@400;600&display=swap" rel="stylesheet"/>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;}body{background:#050d07;}::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-track{background:#050d07;}::-webkit-scrollbar-thumb{background:#1a6b45;border-radius:2px;}@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}`}</style>
      <div style={S.app}>
        {/* HEADER */}
        <div style={S.header}>
          <div style={S.logo}>
            <div style={S.diamond}/>
            EMERALD WELLNESS
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {sbUser && (
              <div style={{fontSize:10,color:C.emXL,fontFamily:F.cinzel,letterSpacing:1,display:"flex",alignItems:"center",gap:5}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:C.emXL,display:"inline-block"}}></span>
                CONNECTED
              </div>
            )}
            <div style={S.timeChip}>{timeStr}</div>
          </div>
        </div>
        {/* TAB BAR */}
        <div style={S.tabBar}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={S.tab(tab===t.id)}>
              <span style={S.tabIcon(tab===t.id)}>{t.icon}</span>
              <span style={S.tabLabel(tab===t.id)}>{t.label}</span>
            </button>
          ))}
        </div>
        {/* CONTENT */}
        <div style={S.content}>
          {TAB_CONTENT[tab]}
        </div>
      </div>
    </>
  );
}
