// PriceLocalStorage/pricinglocalstorage.js
// Shared localStorage cache for pricing data. Two separate things live
// here:
//   1. The full plans list (from GET /api/payment/plans) — used to show
//      prices without re-fetching, and as a fallback source of plan data.
//   2. The ONE plan the user actually picked on the Pricing page — used
//      to carry that exact selection over to PaymentPage.js even when
//      there's no React Router navigation `state` (e.g. direct link,
//      refresh, or the "please log in" redirect in Pricing.js).

const PLANS_KEY = 'aleyo_pricing_plans';
const SELECTED_PLAN_KEY = 'aleyo_selected_plan';

// ---- Full plans list ----

export const savePricingPlans = (plans) => {
  try {
    localStorage.setItem(PLANS_KEY, JSON.stringify({ plans, cachedAt: Date.now() }));
  } catch (error) {
    console.error('Failed to cache pricing plans:', error);
  }
};

export const getPricingPlans = () => {
  try {
    const raw = localStorage.getItem(PLANS_KEY);
    if (!raw) return null;
    const { plans } = JSON.parse(raw);
    return plans;
  } catch (error) {
    console.error('Failed to read cached pricing plans:', error);
    return null;
  }
};

// e.g. getPlanPrice('pro', 'yearly') -> 790
export const getPlanPrice = (planId, interval = 'monthly') => {
  const plans = getPricingPlans();
  if (!plans) return null;
  const plan = plans.find((p) => p.id === planId);
  if (!plan) return null;
  return interval === 'yearly' ? plan.price_yearly : plan.price_monthly;
};

export const clearPricingPlans = () => {
  localStorage.removeItem(PLANS_KEY);
};

// ---- The specific plan the user selected ----

/**
 * @param {{id:string,name:string,price_monthly:number,price_yearly:number,credits:number}} plan
 * @param {{isYearly?: boolean, addons?: Array}} options
 */
export const saveSelectedPlan = (plan, { isYearly = false, addons = [] } = {}) => {
  try {
    localStorage.setItem(
      SELECTED_PLAN_KEY,
      JSON.stringify({ plan, isYearly, addons, selectedAt: Date.now() })
    );
  } catch (error) {
    console.error('Failed to save selected plan:', error);
  }
};

// Returns { plan, isYearly, addons, selectedAt } or null
export const getSelectedPlan = () => {
  try {
    const raw = localStorage.getItem(SELECTED_PLAN_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.error('Failed to read selected plan:', error);
    return null;
  }
};

export const clearSelectedPlan = () => {
  localStorage.removeItem(SELECTED_PLAN_KEY);
};
