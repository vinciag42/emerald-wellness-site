window.EMERALD_FUNNEL_LIBRARY = {
  decisions: {
    senderName: "Emerald Wellness",
    senderEmailRecommended: "info@emeraldwellness.health",
    smsTone: "Luxury concierge-style, brief, TCPA compliant",
    pricingRule: "Keep exact pricing on checkout/pricing pages, not nurture emails.",
    labAudience: "Send lab reminders to everyone who has labs, a lab-tracking path, or quarterly lab reminders enabled.",
    providerAudience: "Send post-consultation messages only to members who completed a provider/doctor review."
  },
  flows: {
    welcome: {
      name: "Signup Welcome",
      trigger: "Signup event or paid member signup",
      timing: "Immediate",
      audience: "New signup / new paid member",
      cta: "Open My Member Command Center™",
      emails: [{
        day: "Immediate",
        subject: "Welcome to Emerald Wellness — Where Transformation Begins",
        preview: "Your personal health intelligence journey starts here.",
        body: `Hi {{ first_name|default:'there' }},

Welcome to Emerald Wellness — your personal health intelligence platform for organizing labs, supplements, peptides, vitamins, medications, symptoms, biometrics, and wellness goals in one connected place.

Emerald Wellness was created from nearly 30 years in the medical field and a belief that people deserve to understand what they are putting into their bodies, what they are tracking, and what questions to ask their provider.

Here is where to begin:

1. Complete your intake.
2. Add your current medications, supplements, vitamins, peptides, and wellness products.
3. Upload or enter recent labs if you have them.
4. Open your Member Command Center™ to review your next steps.

Your first 7 days are active for $1. After the trial, your selected plan renews automatically unless canceled.

CTA: Open My Member Command Center™

Emerald Wellness provides educational wellness intelligence and tracking tools. It does not diagnose, treat, cure, or replace medical care. Always consult a qualified healthcare provider.`
      }],
      sms: [{
        timing: "Immediate if SMS consented and Klaviyo SMS is approved",
        body: "Emerald Wellness: Welcome, {{ first_name|default:'there' }}. Your first 7 days are active for $1. Begin in your private Command Center: https://emeraldwellness.health/dashboard Reply STOP to opt out."
      }]
    },
    "trial-1": {
      name: "Trial Conversion",
      trigger: "$1 trial start",
      timing: "Day 1, Day 3, Day 5, Day 6",
      audience: "Members in $1 trial",
      cta: "Build My Stack / Finish My Setup / Manage My Plan",
      emails: [
        {
          day: "Day 1",
          subject: "Your first quick win inside Emerald Wellness",
          preview: "Start by adding what you already take.",
          body: `Hi {{ first_name|default:'there' }},

Your first quick win is simple: add your current medications, supplements, vitamins, peptides, and wellness products into your stack.

Once your stack is organized, Emerald Wellness can help you review timing, usage notes, possible interaction questions, and provider-review prompts in one place.

This is the foundation of personal health intelligence: less guessing, more organization, better questions.

CTA: Build My Stack`
        },
        {
          day: "Day 3",
          subject: "Your labs tell a story over time",
          preview: "Track patterns, not one-time guesses.",
          body: `Hi {{ first_name|default:'there' }},

Your labs are most powerful when you can see them over time. Emerald Wellness helps you organize biomarkers, symptoms, supplements, peptides, and daily habits so patterns are easier to understand.

If you have recent labs, upload them today. If not, use the recommended labs section to prepare questions for your provider.

CTA: Review My Labs`
        },
        {
          day: "Day 5",
          subject: "Before your trial ends, check these 3 things",
          preview: "Make sure your command center is ready.",
          body: `Hi {{ first_name|default:'there' }},

Before your trial ends, take five minutes to check:

1. Did you add your current stack?
2. Did you complete your intake?
3. Did you choose your specialty module focus?

Those three steps help Emerald Wellness feel personal instead of generic.

CTA: Finish My Setup`
        },
        {
          day: "Day 6",
          subject: "Your $1 trial ends soon",
          preview: "Keep your command center active.",
          body: `Hi {{ first_name|default:'there' }},

Your $1 first 7 days are almost complete. If Emerald Wellness is helping you feel more organized, your membership will continue automatically on your selected plan unless canceled.

You can manage your plan, update your card, view invoices, or cancel from the customer portal.

CTA: Manage My Plan`
        }
      ],
      sms: [
        { timing: "Day 1", body: "Emerald Wellness: Your first concierge step is simple — add your current medications, supplements, vitamins, and peptides so your Command Center can organize clearer provider-review questions. STOP to opt out." },
        { timing: "Day 6", body: "Emerald Wellness: Your $1 trial is nearing completion. Keep your Command Center active or manage your plan here: https://emeraldwellness.health/dashboard Reply STOP to opt out." }
      ]
    },
    abandoned: {
      name: "Abandoned Signup",
      trigger: "Signup form started but not completed",
      timing: "1 hour, 24 hours, 72 hours",
      audience: "Prospect with consent / started signup",
      cta: "Finish Signup",
      emails: [
        { day: "1 hour", subject: "You were almost inside Emerald Wellness", preview: "Finish your setup when you are ready.", body: `Hi {{ first_name|default:'there' }},

You started your Emerald Wellness signup but did not finish. Your account setup helps us organize your membership, plan access, and command center experience.

If you still want to begin, you can return below.

CTA: Finish Signup` },
        { day: "24 hours", subject: "A calmer way to organize your health picture", preview: "Labs, stacks, symptoms, and questions in one place.", body: `Hi {{ first_name|default:'there' }},

Emerald Wellness is built for people who are tired of scattered health information. It helps organize your labs, stack, symptoms, biometrics, and provider-review questions in one secure place.

CTA: Continue My Setup` },
        { day: "72 hours", subject: "Still thinking about Emerald Wellness?", preview: "Start with your $1 first 7 days.", body: `Hi {{ first_name|default:'there' }},

If Emerald Wellness still feels like the right next step, your first 7 days are available for $1. Start with your intake, build your stack, and explore your command center.

CTA: Start My First 7 Days` }
      ],
      sms: [{ timing: "2 hours if consented", body: "Emerald Wellness: You were almost inside your private wellness Command Center. Finish your signup when ready: https://emeraldwellness.health/signup Reply STOP to opt out." }]
    },
    "post-call": {
      name: "Post-Consultation Follow-Up",
      trigger: "Completed provider/doctor review",
      timing: "48 hours, 7 days",
      audience: "Only members who completed provider/doctor review",
      cta: "Open My Command Center",
      emails: [
        { day: "48 hours", subject: "Your next step after your Emerald Wellness review", preview: "Organize your notes and next questions.", body: `Hi {{ first_name|default:'there' }},

Thank you for taking the time to review your wellness goals. Your next step is to keep your notes, labs, stack, and provider questions organized inside your Member Command Center™.

This helps you stay clear on what was discussed, what to track, and what to ask next.

CTA: Open My Command Center` },
        { day: "7 days", subject: "One week later — what has changed?", preview: "Track symptoms, labs, and next questions.", body: `Hi {{ first_name|default:'there' }},

One week after your review, take a moment to log what feels different, what questions came up, and what you want to monitor next.

Small tracking habits create clearer conversations over time.

CTA: Log My Check-In` }
      ],
      sms: [{ timing: "48 hours if consented", body: "Emerald Wellness: Thank you for completing your provider review. Your next concierge step is organizing notes, labs, and questions in your Command Center. STOP to opt out." }]
    },
    "upgrade-30": {
      name: "Upgrade Nudge",
      trigger: "Member milestone / module need",
      timing: "Day 30, Day 60, Day 90",
      audience: "Members who may need more modules/support",
      cta: "Compare Plans",
      emails: [
        { day: "Day 30", subject: "You may be ready for deeper tracking", preview: "More modules, more organization, more support.", body: `Hi {{ first_name|default:'there' }},

If you are actively tracking labs, symptoms, stacks, and specialty goals, you may benefit from a plan with more module access and deeper support.

Emerald Wellness is designed to grow with your health journey — from simple organization to more advanced lab-informed planning.

CTA: Compare Plans` },
        { day: "Day 60", subject: "Are your modules matching your goals?", preview: "Your plan should fit how you use Emerald.", body: `Hi {{ first_name|default:'there' }},

As your goals become clearer, your plan should match the way you use Emerald Wellness. If you need additional specialty modules, lab tracking, or concierge support, review your options.

CTA: Review My Plan` },
        { day: "Day 90", subject: "Your next 90 days inside Emerald Wellness", preview: "Build a stronger rhythm for tracking and support.", body: `Hi {{ first_name|default:'there' }},

A 90-day rhythm is ideal for reviewing progress, patterns, labs, and provider questions. If you are ready for a more structured experience, explore your upgrade options.

CTA: Plan My Next 90 Days` }
      ],
      sms: [{ timing: "Day 30 if consented", body: "Emerald Wellness: If your goals now need deeper module access or support, your plan options are ready to review here: https://emeraldwellness.health/#pricing STOP to opt out." }]
    },
    reengagement: {
      name: "Re-Engagement",
      trigger: "No activity / no opens",
      timing: "30, 45, 60 days inactive",
      audience: "Inactive members/leads",
      cta: "Return to My Dashboard / Manage Preferences",
      emails: [
        { day: "30 days inactive", subject: "Your Command Center is waiting", preview: "Come back to your stack, labs, and next steps.", body: `Hi {{ first_name|default:'there' }},

It has been a little while since you opened Emerald Wellness. Your Command Center is still here when you are ready to review your stack, labs, symptoms, and next steps.

CTA: Return to My Dashboard` },
        { day: "45 days inactive", subject: "A fresh start is still a start", preview: "Rebuild your health picture one step at a time.", body: `Hi {{ first_name|default:'there' }},

You do not need to do everything at once. Start by updating one thing: a medication, a supplement, a symptom, or a lab result.

That is enough to begin again.

CTA: Update One Thing` },
        { day: "60 days inactive", subject: "Should we pause these reminders?", preview: "You are always in control.", body: `Hi {{ first_name|default:'there' }},

We only want to send messages that feel helpful. If Emerald Wellness is still part of your wellness journey, come back when ready. If not, you can manage your preferences below.

CTA: Manage Preferences` }
      ],
      sms: [{ timing: "45 days inactive if consented", body: "Emerald Wellness: A fresh start can be one refined update — a supplement, medication, symptom, or lab. Return here: https://emeraldwellness.health/dashboard STOP to opt out." }]
    },
    newsletter: {
      name: "Monthly Newsletter",
      trigger: "Monthly campaign",
      timing: "Monthly",
      audience: "Consented subscribers/members",
      cta: "Open This Month’s Focus",
      emails: [{
        day: "Monthly",
        subject: "Emerald Wellness Monthly — clearer tracking, smarter questions",
        preview: "Your monthly wellness intelligence roundup.",
        body: `Hi {{ first_name|default:'there' }},

This month inside Emerald Wellness:

- Featured focus: building a cleaner supplement and peptide stack
- Lab insight: why quarterly tracking helps reveal patterns
- Member action: update one symptom trend this week
- Shop note: review product details and provider requirements before purchasing

Emerald Wellness exists to help you feel informed, organized, and confident as you support your health journey.

CTA: Open This Month’s Focus`
      }],
      sms: [{ timing: "Optional monthly highlight", body: "Emerald Wellness Monthly: This week, refine one symptom, review one lab marker, and clarify one stack question in your Command Center: https://emeraldwellness.health/dashboard STOP to opt out." }]
    },
    labs: {
      name: "Quarterly Lab Reminders",
      trigger: "Lab tracking enabled / quarterly lab window",
      timing: "14 days before, due day, 7 days after",
      audience: "Everyone who has labs, lab tracking, or quarterly reminders enabled",
      cta: "Prepare My Lab Questions / Open Biology Labs",
      emails: [
        { day: "14 days before", subject: "Your quarterly lab review window is coming up", preview: "Prepare your questions before your provider visit.", body: `Hi {{ first_name|default:'there' }},

Your quarterly lab review window is coming up. Labs can help you and your provider review whether your wellness plan, supplements, vitamins, peptides, and lifestyle habits are aligning with your goals.

Use Emerald Wellness to organize:

- Current stack
- Symptoms and changes
- Questions for your provider
- Biomarkers you want to understand

CTA: Prepare My Lab Questions` },
        { day: "Due day", subject: "Lab check-in day", preview: "Organize today, review with your provider.", body: `Hi {{ first_name|default:'there' }},

Today is your lab check-in reminder. If you already completed labs, upload or enter the results. If you have not, use this as a prompt to schedule with your qualified healthcare provider.

CTA: Open Biology Labs` },
        { day: "7 days after", subject: "Add your lab results when ready", preview: "Your trends become clearer over time.", body: `Hi {{ first_name|default:'there' }},

If your lab results are back, add them to Emerald Wellness so your trends are easier to review over time.

CTA: Add Lab Results` }
      ],
      sms: [{ timing: "Due day only if consented", body: "Emerald Wellness: Your quarterly lab reminder is here. Review with your qualified provider and upload results when ready. STOP to opt out." }]
    },
    shop: {
      name: "Shop Cart + Post-Purchase",
      trigger: "External shop cart/order events",
      timing: "Cart: 1h, 24h, 72h. Post-purchase: immediate, day 7, day 21",
      audience: "Shop customers with consent",
      cta: "Return to Cart / Add to My Stack",
      emails: [
        { day: "Cart 1 hour", subject: "Still reviewing your Emerald Wellness Shop order?", preview: "Finish when you are ready.", body: `Hi {{ first_name|default:'there' }},

You left items in your Emerald Wellness Shop cart. Take your time reviewing product details, provider requirements, and ingredient information.

CTA: Return to Cart` },
        { day: "Cart 24 hours", subject: "Questions before you order?", preview: "Review product details and provider requirements.", body: `Hi {{ first_name|default:'there' }},

Before ordering, review product details, provider requirements, and whether the item is appropriate for your goals. If a provider review is required, complete that step before purchase.

CTA: Review My Cart` },
        { day: "Cart 72 hours", subject: "Your cart will not wait forever", preview: "Return if this still supports your plan.", body: `Hi {{ first_name|default:'there' }},

If the products in your cart still support your wellness plan, you can return and complete your order. If not, your Emerald Wellness dashboard can help you clarify your next step.

CTA: Return to Cart` },
        { day: "Post-purchase immediate", subject: "Your Emerald Wellness Shop order is confirmed", preview: "What to expect next.", body: `Hi {{ first_name|default:'there' }},

Your Emerald Wellness Shop order is confirmed. Watch for shipping, provider-review, or pharmacy-specific updates depending on the items ordered.

If you purchased supplements, vitamins, peptides, or other wellness products, add them to your Emerald Wellness stack so your timing, usage notes, and provider-review questions stay organized.

CTA: Add to My Stack` },
        { day: "Post-purchase Day 7", subject: "Add your purchase to your stack", preview: "Keep your product timing and notes organized.", body: `Hi {{ first_name|default:'there' }},

Now that your order is underway, take one minute to add your purchase to your Emerald Wellness stack. This helps you track timing, questions, and changes over time.

CTA: Update My Stack` },
        { day: "Post-purchase Day 21", subject: "How is your routine going?", preview: "Track what changed and what questions came up.", body: `Hi {{ first_name|default:'there' }},

Three weeks is a helpful time to check in. Log what you are taking consistently, what changed, and what questions you want to ask your provider.

CTA: Log My Product Check-In` }
      ],
      sms: [
        { timing: "Cart 2 hours if consented", body: "Emerald Wellness: Your shop cart is waiting. Review product details and provider requirements, then complete when ready: https://shop.emeraldwellness.health/cart Reply STOP to opt out." },
        { timing: "Post-purchase Day 7 if consented", body: "Emerald Wellness: Add your recent shop purchase to your stack so timing, notes, and provider-review questions stay organized. STOP to opt out." }
      ]
    }
  }
};
