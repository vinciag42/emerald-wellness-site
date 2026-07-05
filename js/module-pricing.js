(function(root){
  const MODULE_ADD_ON_PRICE_MONTHLY = 49.99;
  const MODULE_ADD_ON_PRICE_DISPLAY = "$49.99/month";
  const STRIPE_MODULE_ADD_ON_PRICE_ID = "price_1TnCp8LzsA0y5z9VkssgXhRr";
  const PLAN_MODULE_ENTITLEMENTS = {
    free: { includedModules: 0, unlimitedModules: false, canPurchaseAddOns: false, label: "Basic education only. Specialty Modules require an upgrade." },
    silver: { includedModules: 0, unlimitedModules: false, canPurchaseAddOns: false, label: "Basic education only. Specialty Modules require an upgrade." },
    gold: { includedModules: 1, unlimitedModules: false, canPurchaseAddOns: true, label: "1 Specialty Module included" },
    plus: { includedModules: 1, unlimitedModules: false, canPurchaseAddOns: true, label: "1 Specialty Module included" },
    elite: { includedModules: 2, unlimitedModules: false, canPurchaseAddOns: true, label: "2 Specialty Modules included" },
    pro: { includedModules: 2, unlimitedModules: false, canPurchaseAddOns: true, label: "2 Specialty Modules included" },
    platinum: { includedModules: 3, unlimitedModules: false, canPurchaseAddOns: true, label: "3 Specialty Modules included" },
    platinum_plus: { includedModules: 4, unlimitedModules: false, canPurchaseAddOns: true, label: "4 Specialty Modules included" },
    concierge: { includedModules: null, unlimitedModules: true, canPurchaseAddOns: false, label: "Unlimited Specialty Modules included" },
    concierge_regenesis: { includedModules: null, unlimitedModules: true, canPurchaseAddOns: false, label: "Unlimited Specialty Modules included" },
    concierge_premium: { includedModules: null, unlimitedModules: true, canPurchaseAddOns: false, label: "Unlimited Specialty Modules included with premium concierge support" },
    concierge_regenesis_premium: { includedModules: null, unlimitedModules: true, canPurchaseAddOns: false, label: "Unlimited Specialty Modules included with premium concierge support" },
  };
  function normalizePlanKey(planKey) {
    const key = String(planKey || "free").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    return ({
      platinum_regenesis: "platinum",
      emerald_platinum_regenesis: "platinum",
      emerald_platinum_plus: "platinum_plus",
      emerald_concierge_regenesis: "concierge",
      emerald_concierge_regenesis_premium: "concierge_premium",
      concierge_regenesis_premium: "concierge_premium",
    })[key] || key;
  }
  function getModuleEntitlement(planKey) {
    return PLAN_MODULE_ENTITLEMENTS[normalizePlanKey(planKey)] || PLAN_MODULE_ENTITLEMENTS.free;
  }
  function getIncludedModuleDisplay(planKey) {
    const entitlement = getModuleEntitlement(planKey);
    return entitlement.unlimitedModules ? "Unlimited" : String(entitlement.includedModules || 0);
  }
  function getBillableModuleAddOnCount(planKey, selectedModuleCount) {
    const entitlement = getModuleEntitlement(planKey);
    if (entitlement.unlimitedModules || !entitlement.canPurchaseAddOns) return 0;
    return Math.max(0, Number(selectedModuleCount || 0) - (entitlement.includedModules || 0));
  }
  function getModuleAddOnMonthlyTotal(planKey, selectedModuleCount) {
    return getBillableModuleAddOnCount(planKey, selectedModuleCount) * MODULE_ADD_ON_PRICE_MONTHLY;
  }
  function formatModuleAddOnTotal(planKey, selectedModuleCount) {
    return `$${getModuleAddOnMonthlyTotal(planKey, selectedModuleCount).toFixed(2)}/month`;
  }
  function getModuleEntitlementMessage(planKey) {
    const entitlement = getModuleEntitlement(planKey);
    if (entitlement.unlimitedModules) return "Your plan includes unlimited Specialty Modules.";
    if (!entitlement.canPurchaseAddOns) return "Upgrade to unlock Specialty Modules.";
    return `Your plan includes ${entitlement.includedModules} Specialty Module${entitlement.includedModules === 1 ? "" : "s"}. Add additional modules for ${MODULE_ADD_ON_PRICE_DISPLAY} each.`;
  }
  const api = { MODULE_ADD_ON_PRICE_MONTHLY, MODULE_ADD_ON_PRICE_DISPLAY, STRIPE_MODULE_ADD_ON_PRICE_ID, PLAN_MODULE_ENTITLEMENTS, normalizePlanKey, getModuleEntitlement, getIncludedModuleDisplay, getBillableModuleAddOnCount, getModuleAddOnMonthlyTotal, formatModuleAddOnTotal, getModuleEntitlementMessage };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.EW_MODULE_PRICING = api;
})(typeof window !== "undefined" ? window : globalThis);
