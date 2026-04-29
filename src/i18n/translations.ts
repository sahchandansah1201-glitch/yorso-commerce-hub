export type Language = "en" | "ru" | "es";

export const languageNames: Record<Language, string> = {
  en: "English",
  ru: "Русский",
  es: "Español",
};

export const languageFlags: Record<Language, string> = {
  en: "🇬🇧",
  ru: "🇷🇺",
  es: "🇪🇸",
};

type TranslationKeys = {
  // Header
  nav_liveOffers: string;
  nav_categories: string;
  nav_howItWorks: string;
  nav_faq: string;
  nav_signIn: string;
  nav_registerFree: string;

  // Hero
  hero_title1: string;
  hero_title2: string;
  hero_subtitle: string;
  hero_searchPlaceholder: string;
  hero_searchBtn: string;
  hero_popular: string;
  hero_registerFree: string;
  hero_registerHint: string;
  hero_exploreLiveOffers: string;
  hero_liveOffers: string;
  hero_verifiedSuppliers: string;
  hero_countries: string;
  hero_activeBuyers: string;

  // Live Offers
  offers_liveMarketplace: string;
  offers_title: string;
  offers_subtitle: string;
  offers_viewAll: string;
  offers_viewAllMobile: string;
  offers_showMore: string;
  offers_showLess: string;
  offers_listLabel: string;
  offers_cardLabel: string;
  offers_priceUnit_perKg: string;
  offers_qtyUnit_kg: string;
  offers_moqLabel: string;
  /** Tooltip explaining how the per-unit price is calculated. */
  priceUnit_tooltip: string;

  // Offer Card
  card_verified: string;
  card_viewOffer: string;
  card_perKg: string;
  card_frozen: string;
  card_fresh: string;
  card_chilled: string;
  card_updatedAgo: string;
  card_listedToday: string;

  // Certifications modal
  cert_issuer: string;
  cert_officialWebsite: string;

  // Trust Strip
  trust_liveOffers: string;
  trust_verifiedSuppliers: string;
  trust_countries: string;
  trust_activeBuyers: string;
  trust_liveOffersDetail: string;
  trust_verifiedSuppliersDetail: string;
  trust_countriesDetail: string;
  trust_activeBuyersDetail: string;
  trust_unlikeOthers: string;
  trust_zeroCommission: string;
  trust_directContacts: string;
  trust_verificationEarned: string;

  // Value Split
  value_title: string;
  value_subtitle: string;
  value_forBuyers: string;
  value_forSuppliers: string;
  value_buyerHeadline: string;
  value_supplierHeadline: string;
  value_registerBuyer: string;
  value_registerSupplier: string;
  value_buyerBenefits: { title: string; desc: string }[];
  value_supplierBenefits: { title: string; desc: string }[];

  // Category
  cat_title: string;
  cat_subtitle: string;
  cat_offers: string;
  cat_names: Record<string, string>;
  species_names: Record<string, string>;
  species_descriptors: Record<string, string>;

  // Supplier Verification
  verify_title: string;
  verify_subtitle: string;
  verify_steps: { title: string; desc: string; unlike: string }[];
  verify_failTitle: string;
  verify_failDesc: string;
  verify_ctaHint: string;
  verify_ctaBtn: string;

  // Marketplace Activity
  activity_live: string;
  activity_title: string;
  activity_subtitle: string;
  activity_footer: string;
  activity_feed: { text: string; time: string }[];

  // Social Proof
  social_title: string;
  social_subtitle: string;
  social_testimonials: {
    quote: string;
    name: string;
    role: string;
    company: string;
    country: string;
    painTag: string;
  }[];

  // FAQ
  faq_title: string;
  faq_subtitle: string;
  faq_items: { question: string; answer: string }[];

  // Final CTA
  cta_title1: string;
  cta_title2: string;
  cta_subtitle: string;
  cta_registerFree: string;
  cta_freeNote: string;
  cta_verifiedSuppliers: string;
  cta_zeroCommission: string;
  cta_directContacts: string;

  // Footer
  footer_desc: string;
  footer_worldwide: string;
  footer_copyright: string;
  footer_registered: string;
  footer_platform: string;
  footer_company: string;
  footer_legal: string;
  footer_links: {
    platform: { label: string; href: string }[];
    company: { label: string; href: string }[];
    legal: { label: string; href: string }[];
  };

  // ─── Registration ──────────────────────────────────────────────
  reg_joinYorso: string;
  reg_chooseSubtitle: string;
  reg_imBuyer: string;
  reg_imSupplier: string;
  reg_buyerSubtitle: string;
  reg_supplierSubtitle: string;
  reg_buyerFeatures: string[];
  reg_supplierFeatures: string[];
  reg_enterEmail: string;
  reg_emailSubtitle: string;
  reg_emailPlaceholder: string;
  reg_emailInvalid: string;
  reg_continue: string;
  reg_checking: string;
  reg_couldNotContinue: string;
  reg_couldNotSave: string;
  signin_signInFailed: string;
  signin_couldNotSendLink: string;
  cert_viewDetails: string;
  aria_toggleMenu: string;
  aria_goBack: string;
  aria_breadcrumb: string;
  aria_catalogResults: string;
  aria_imgPrev: string;
  aria_imgNext: string;
  aria_close: string;
  aria_removeFilter: string;
  reg_phone_placeholder: string;
  reg_step_role: string;
  reg_step_email: string;
  reg_step_verify: string;
  reg_step_details: string;
  reg_step_profile: string;
  reg_step_markets: string;
  reg_step_done: string;
  country_searchPlaceholder: string;
  country_noResults: string;
  signin_emailPlaceholder: string;
  reg_fullNamePlaceholder: string;
  reg_companyPlaceholder: string;
  reg_byContAgreeTo: string;
  reg_terms: string;
  reg_and: string;
  reg_privacyPolicy: string;
  reg_checkInbox: string;
  reg_codeSentTo: string;
  reg_enterFullCode: string;
  reg_verifyAndContinue: string;
  reg_verifying: string;
  reg_verificationFailed: string;
  reg_didntReceive: string;
  reg_codeResent: string;
  reg_codeResentDesc: string;
  reg_tellAboutYourself: string;
  reg_detailsSubtitleBuyer: string;
  reg_detailsSubtitleSupplier: string;
  reg_fullName: string;
  reg_companyName: string;
  reg_country: string;
  reg_autoDetected: string;
  reg_selectCountry: string;
  reg_vatTin: string;
  reg_vatPlaceholder: string;
  reg_vatDescBuyer: string;
  reg_vatDescSupplier: string;
  reg_phoneNumber: string;
  reg_phoneDesc: string;
  reg_sendCode: string;
  reg_codeSentEnter: string;
  reg_smsCode: string;
  reg_verify: string;
  reg_invalidCodeRetry: string;
  reg_resendCode: string;
  reg_verified: string;
  reg_or: string;
  reg_verifyViaWhatsApp: string;
  reg_whatsAppCodeDesc: string;
  reg_codeSentToast: string;
  reg_codeSentToastDesc: string;
  reg_phoneVerifiedWhatsApp: string;
  reg_phoneVerifiedWhatsAppDesc: string;
  reg_phoneVerified: string;
  reg_phoneVerifiedDesc: string;
  reg_invalidCode: string;
  reg_invalidCodeDesc: string;
  reg_password: string;
  reg_passwordPlaceholder: string;
  reg_saving: string;
  reg_enterFullName: string;
  reg_enterCompanyName: string;
  reg_minChars: string;
  reg_selectCountryErr: string;
  reg_enterValidVat: string;
  reg_enterPhoneNumber: string;
  reg_verifyPhoneNumber: string;
  reg_enterValidPhone: string;
  reg_enterCodeFromSms: string;
  // Onboarding
  reg_whatDoYouSource: string;
  reg_whatDoYouOffer: string;
  reg_onboardingSubtitleBuyer: string;
  reg_onboardingSubtitleSupplier: string;
  reg_productCategories: string;
  reg_businessType: string;
  reg_selectAllApply: string;
  reg_certifications: string;
  reg_monthlyVolumeBuyer: string;
  reg_monthlyVolumeSupplier: string;
  reg_skipForNow: string;
  // Countries
  reg_whereSourceFrom: string;
  reg_whereExportTo: string;
  reg_countriesSubtitleBuyer: string;
  reg_countriesSubtitleSupplier: string;
  reg_showAllCountries: string;
  reg_countriesSelected: string;
  reg_countrySelected: string;
  reg_completeSetup: string;
  // Ready
  reg_welcome: string;
  reg_profileComplete: string;
  reg_yourProfile: string;
  reg_buyer: string;
  reg_supplier: string;
  reg_category: string;
  reg_categories: string;
  reg_market: string;
  reg_markets: string;
  reg_certification: string;
  reg_certificationsLabel: string;
  reg_matchingOffers: string;
  reg_whatsNext: string;
  reg_exploreOffers: string;
  reg_createFirstOffer: string;
  reg_buyerAutoRedirect: string;
  // Registration layout
  reg_alreadyHaveAccount: string;
  reg_signIn: string;
  reg_help: string;

  // ─── Sign In ───────────────────────────────────────────────────
  signin_title: string;
  signin_subtitle: string;
  signin_email: string;
  signin_phone: string;
  signin_emailLabel: string;
  signin_passwordLabel: string;
  signin_forgotPassword: string;
  signin_passwordPlaceholder: string;
  signin_signInBtn: string;
  signin_phoneLabel: string;
  signin_or: string;
  signin_viaWhatsApp: string;
  signin_getCodeWhatsApp: string;
  signin_noAccount: string;
  signin_register: string;
  signin_back: string;
  signin_resetPassword: string;
  signin_resetSubtitle: string;
  signin_resetDemoHint: string;
  signin_sendResetLink: string;
  signin_emailSent: string;
  signin_checkEmailInstructions: string;
  signin_backToSignIn: string;
  signin_fillAll: string;
  signin_enterPhonePassword: string;
  signin_enterValidPhone: string;
  signin_signedIn: string;
  signin_welcomeBack: string;
  signin_codeSentWhatsApp: string;
  signin_checkWhatsApp: string;
  signin_enterEmail: string;
  signin_emailSentToast: string;
  signin_emailSentToastDesc: string;

  // ─── Offers Listing ────────────────────────────────────────────
  offersPage_title: string;
  offersPage_subtitle: string;
  offersPage_searchPlaceholder: string;
  offersPage_backToHome: string;
  offersPage_showingAll: string;
  offersPage_registerToSee: string;

  // ─── Offer Detail ──────────────────────────────────────────────
  offerDetail_notFound: string;
  offerDetail_browseAll: string;
  offerDetail_home: string;
  offerDetail_offers: string;
  offerDetail_registerToContact: string;
  offerDetail_freeRegistration: string;
  offerDetail_backToCatalog: string;
  offerDetail_backToCatalogShort: string;

  // ─── 404 / Not Found ───────────────────────────────────────────
  notFound_title: string;
  notFound_subtitle: string;
  notFound_returnHome: string;
  notFound_attemptedPath: string;
  notFound_suggestionsHeading: string;
  notFound_suggestion_offers_title: string;
  notFound_suggestion_offers_desc: string;
  notFound_suggestion_register_title: string;
  notFound_suggestion_register_desc: string;
  notFound_suggestion_signin_title: string;
  notFound_suggestion_signin_desc: string;
  notFound_suggestion_home_title: string;
  notFound_suggestion_home_desc: string;
  notFound_referrerLabel: string;
  notFound_referrerDirect: string;
  notFound_reportHint: string;

  // ─── Document metadata ─────────────────────────────────────────
  meta_siteTitle: string;
  meta_siteDescription: string;

  // ─── Shared: TrustMicroText ────────────────────────────────────
  trustMicro_users: string;
  trustMicro_security: string;
  trustMicro_verified: string;
  trustMicro_global: string;
  trustMicro_growth: string;
  trustMicro_privacy: string;

  // ─── Shared: SocialProofBanner ─────────────────────────────────
  socialBanner_professionals: string;
  socialBanner_suppliers: string;
  socialBanner_zeroCom: string;
  socialBanner_trustedBy: string;
  socialBanner_detail: string;

  // ─── Buyer Workspace ───────────────────────────────────────────
  workspace_brand: string;
  workspace_signOut: string;
  workspace_greeting: string;
  workspace_tab_dashboard: string;
  workspace_tab_saved: string;
  workspace_tab_priceRequests: string;
  workspace_tab_messages: string;

  workspace_dashboard_title: string;
  workspace_dashboard_subtitle: string;
  workspace_kpi_saved: string;
  workspace_kpi_priceRequests: string;
  workspace_kpi_unread: string;
  workspace_kpi_suppliers: string;
  workspace_recentActivity: string;
  workspace_quickActions: string;
  workspace_action_browseOffers: string;
  workspace_action_viewSaved: string;
  workspace_action_openMessages: string;

  workspace_saved_title: string;
  workspace_saved_subtitle: string;
  workspace_saved_empty: string;
  workspace_saved_open: string;
  workspace_saved_remove: string;
  workspace_saved_savedAt: string;

  workspace_priceReq_title: string;
  workspace_priceReq_subtitle: string;
  workspace_priceReq_empty: string;
  workspace_priceReq_status_pending: string;
  workspace_priceReq_status_approved: string;
  workspace_priceReq_status_rejected: string;
  workspace_priceReq_requestedAt: string;
  workspace_priceReq_respondedAt: string;
  workspace_priceReq_open: string;

  workspace_msg_title: string;
  workspace_msg_subtitle: string;
  workspace_msg_empty: string;
  workspace_msg_unread: string;
  workspace_msg_open: string;

  workspace_activity_offer_view: string;
  workspace_activity_price_request: string;
  workspace_activity_message: string;

  // Info / legal pages — shared
  info_backToHome: string;
  info_lastUpdated: string;
  info_updated_january2026: string;
  info_footer_rights: string;

  // About
  info_about_title: string;
  info_about_intro: string;
  info_about_mission: string;
  info_about_missionBody: string;
  info_about_whatWeDo: string;
  info_about_whatWeDoBody: string;
  info_about_keyFacts: string;
  info_about_facts: string[];

  // Contact
  info_contact_title: string;
  info_contact_intro: string;
  info_contact_general: string;
  info_contact_buyer: string;
  info_contact_supplier: string;
  info_contact_office: string;
  info_contact_emailLabel: string;
  info_contact_officeAddress: string;
  info_contact_kvk: string;

  // Cookies
  info_cookies_title: string;
  info_cookies_intro: string;
  info_cookies_essential: string;
  info_cookies_essentialBody: string;
  info_cookies_analytics: string;
  info_cookies_analyticsBody: string;
  info_cookies_managing: string;
  info_cookies_managingBody: string;
  info_cookies_contact: string;
  info_cookies_contactBody1: string;
  info_cookies_contactBody2: string;

  // GDPR
  info_gdpr_title: string;
  info_gdpr_intro: string;
  info_gdpr_commitment: string;
  info_gdpr_commitmentList: string[];
  info_gdpr_rights: string;
  info_gdpr_rightsList: { term: string; desc: string }[];
  info_gdpr_dpo: string;
  info_gdpr_dpoBody: string;
  info_gdpr_authority: string;
  info_gdpr_authorityBody: string;

  // Anti-fraud
  info_antifraud_title: string;
  info_antifraud_intro: string;
  info_antifraud_supplierVerification: string;
  info_antifraud_supplierVerificationBody: string;
  info_antifraud_ongoingMonitoring: string;
  info_antifraud_ongoingMonitoringBody: string;
  info_antifraud_reportingConcerns: string;
  info_antifraud_reportingConcernsBody1: string;
  info_antifraud_reportingConcernsBody2: string;
  info_antifraud_sanctions: string;
  info_antifraud_sanctionsBody: string;

  // Careers
  info_careers_title: string;
  info_careers_intro: string;
  info_careers_why: string;
  info_careers_whyList: string[];
  info_careers_openPositions: string;
  info_careers_openPositionsBody1: string;
  info_careers_openPositionsBody2: string;

  // Press
  info_press_title: string;
  info_press_intro: string;
  info_press_contact: string;
  info_press_emailLabel: string;
  info_press_about: string;
  info_press_aboutBody: string;
  info_press_brand: string;
  info_press_brandBody1: string;
  info_press_brandBody2: string;

  // Partners
  info_partners_title: string;
  info_partners_intro: string;
  info_partners_types: string;
  info_partners_typesList: { term: string; desc: string }[];
  info_partners_contact: string;
  info_partners_contactBody1: string;
  info_partners_contactBody2: string;

  // Terms
  info_terms_title: string;
  info_terms_intro: string;
  info_terms_h1: string;
  info_terms_p1: string;
  info_terms_h2: string;
  info_terms_p2: string;
  info_terms_h3: string;
  info_terms_p3: string;
  info_terms_h4: string;
  info_terms_p4: string;
  info_terms_h5: string;
  info_terms_p5: string;
  info_terms_h6: string;
  info_terms_p6: string;
  info_terms_h7: string;
  info_terms_p7: string;

  // Privacy
  info_privacy_title: string;
  info_privacy_intro: string;
  info_privacy_dataCollect: string;
  info_privacy_dataCollectList: string[];
  info_privacy_use: string;
  info_privacy_useBody: string;
  info_privacy_storage: string;
  info_privacy_storageBody: string;
  info_privacy_rights: string;
  info_privacy_rightsBody1: string;
  info_privacy_rightsBody2: string;
  info_privacy_contact: string;
  info_privacy_contactBody: string;

  // ─── Catalog (Phase 1 Marketplace Core) ─────────────────────────
  catalog_pageTitle: string;
  catalog_breadcrumbHome: string;
  catalog_breadcrumbCatalog: string;
  catalog_marketStatus_live: string;
  catalog_freshOffers_24h: string;
  catalog_resultCount: string;
  catalog_quickRequest_title: string;
  catalog_quickRequest_subtitle: string;
  catalog_quickRequest_cta: string;
  catalog_filters_title: string;
  catalog_filters_clearAll: string;
  catalog_filters_search: string;
  catalog_filters_searchPlaceholder: string;
  catalog_filters_species: string;
  catalog_filters_origin: string;
  catalog_filters_supplierCountry: string;
  catalog_filters_supplier: string;
  catalog_filters_logisticsBasis: string;
  catalog_filters_currency: string;
  catalog_filters_certification: string;
  catalog_filters_paymentTerms: string;
  catalog_filters_state: string;
  catalog_filters_cutType: string;
  catalog_filters_latinName: string;
  catalog_filters_advanced: string;
  catalog_filters_any: string;
  catalog_filters_all: string;
  catalog_filters_state_frozen: string;
  catalog_filters_state_fresh: string;
  catalog_filters_state_chilled: string;
  catalog_results_none: string;
  catalog_results_resetFilters: string;

  // Access banners
  catalog_access_anon_title: string;
  catalog_access_anon_body: string;
  catalog_access_anon_cta: string;
  catalog_access_reg_title: string;
  catalog_access_reg_body: string;
  catalog_access_reg_cta: string;
  catalog_access_qual_title: string;
  catalog_access_qual_body: string;
  catalog_access_granted_toast_title: string;
  catalog_access_granted_toast_body: string;
  catalog_access_granted_toast_body_fallback: string;
  catalog_access_devSwitcher_label: string;
  catalog_access_devSwitcher_anon: string;
  catalog_access_devSwitcher_reg: string;
  catalog_access_devSwitcher_qual: string;
  catalog_access_devSwitcher_note: string;

  // Value strip (capability-led, replaces user-facing access labels)
  catalog_value_cap_prices: string;
  catalog_value_cap_suppliers: string;
  catalog_value_cap_intelligence: string;
  catalog_value_ctaSignup: string;
  catalog_value_ctaQualify: string;
  // Trust proof strip (above catalog workspace)
  catalog_trust_title: string;
  catalog_trust_subtitle: string;
  catalog_trust_verification_label: string;
  catalog_trust_verification_hint: string;
  catalog_trust_activity_label: string;
  catalog_trust_activity_hint: string;
  catalog_trust_access_label: string;
  catalog_trust_access_hint: string;
  catalog_trust_signals_label: string;
  catalog_trust_signals_hint: string;
  catalog_trust_documents_label: string;
  catalog_trust_documents_hint: string;
  catalog_trust_recovery_label: string;
  catalog_trust_recovery_hint: string;
  // Access request (registered user, frontend mock)
  catalog_access_request_title: string;
  catalog_access_request_subtitle: string;
  catalog_access_request_scope_label: string;
  catalog_access_request_scope_prices: string;
  catalog_access_request_scope_suppliers: string;
  catalog_access_request_scope_intelligence: string;
  catalog_access_request_note_label: string;
  catalog_access_request_note_placeholder: string;
  catalog_access_request_submit: string;
  catalog_access_request_cancel: string;
  catalog_access_request_pending_title: string;
  catalog_access_request_pending_body: string;
  catalog_access_request_toast: string;
  catalog_access_request_pending_scopes: string;
  catalog_access_request_cancel_pending: string;
  catalog_access_request_canceled_toast: string;
  catalog_access_request_success_title: string;
  catalog_access_request_success_body: string;
  catalog_access_request_success_cta: string;
  catalog_reqForm_submitted_title: string;
  catalog_reqForm_submitted_subtitle: string;
  catalog_reqForm_submitted_at: string;
  // Empty-state product request form
  catalog_reqForm_title: string;
  catalog_reqForm_subtitle: string;
  catalog_reqForm_product: string;
  catalog_reqForm_productPh: string;
  catalog_reqForm_latin: string;
  catalog_reqForm_latinPh: string;
  catalog_reqForm_format: string;
  catalog_reqForm_formatPh: string;
  catalog_reqForm_origin: string;
  catalog_reqForm_originPh: string;
  catalog_reqForm_supplierCountry: string;
  catalog_reqForm_supplierCountryPh: string;
  catalog_reqForm_volume: string;
  catalog_reqForm_volumePh: string;
  catalog_reqForm_destination: string;
  catalog_reqForm_destinationPh: string;
  catalog_reqForm_timing: string;
  catalog_reqForm_timingPh: string;
  catalog_reqForm_notes: string;
  catalog_reqForm_notesPh: string;
  catalog_reqForm_photo: string;
  catalog_reqForm_photoHint: string;
  catalog_reqForm_photoAdd: string;
  catalog_reqForm_photoRemove: string;
  catalog_reqForm_photoTooLarge: string;
  catalog_reqForm_submit: string;
  catalog_reqForm_optional: string;
  catalog_reqForm_success_title: string;
  catalog_reqForm_success_body: string;
  catalog_reqForm_success_new: string;

  // Card / gating
  catalog_card_priceRange: string;
  catalog_card_priceLocked: string;
  catalog_card_priceLockedHint: string;
  catalog_card_supplierStub: string;
  catalog_card_supplierLocked: string;
  catalog_card_supplierPartial: string;
  catalog_card_volumeBreaks: string;
  catalog_card_paymentTerms: string;
  catalog_card_logistics: string;
  catalog_card_interest: string;
  catalog_card_action_signupForPrice: string;
  catalog_card_action_requestSupplier: string;
  catalog_card_action_sendRequest: string;
  catalog_card_action_save: string;
  catalog_card_action_compare: string;
  catalog_card_action_watch: string;
  catalog_card_action_followSupplier: string;
  catalog_card_action_notifyPrice: string;
  catalog_card_action_contactSupplier: string;
  catalog_card_action_addToCart: string;
  catalog_card_action_view: string;

  // Intelligence rail
  catalog_intel_title: string;
  catalog_intel_lockedTitle: string;
  catalog_intel_lockedBody: string;
  catalog_intel_partialTitle: string;
  catalog_intel_partialBody: string;
  catalog_intel_priceTrend_title: string;
  catalog_intel_priceTrend_index: string;
  catalog_intel_priceTrend_d7: string;
  catalog_intel_priceTrend_d30: string;
  catalog_intel_priceTrend_d90: string;
  catalog_intel_priceTrend_volatility: string;
  catalog_intel_priceTrend_vol_low: string;
  catalog_intel_priceTrend_vol_medium: string;
  catalog_intel_priceTrend_vol_high: string;
  catalog_intel_news_title: string;
  catalog_intel_news_more: string;
  catalog_intel_impact_title: string;
  catalog_intel_impact_role_supplier_country: string;
  catalog_intel_impact_role_origin_country: string;
  catalog_intel_impact_role_export_port: string;
  catalog_intel_impact_role_competing_producer: string;
  catalog_intel_impact_role_demand_driver: string;
  catalog_intel_impact_share: string;
  catalog_intel_signals_title: string;
  catalog_intel_signal_supply: string;
  catalog_intel_signal_demand: string;
  catalog_intel_signal_logistics: string;
  catalog_intel_signal_regulation: string;
  catalog_intel_signal_severity_info: string;
  catalog_intel_signal_severity_watch: string;
  catalog_intel_signal_severity_alert: string;
  catalog_intel_signal_severity_info_tooltip: string;
  catalog_intel_signal_severity_watch_tooltip: string;
  catalog_intel_signal_severity_alert_tooltip: string;
  catalog_intel_signal_drawer_context: string;
  catalog_intel_signal_drawer_meaning: string;
  catalog_intel_signal_drawer_actions: string;
  catalog_intel_signal_drawer_published: string;
  catalog_intel_signal_drawer_close: string;
  catalog_intel_signal_drawer_openHint: string;
  catalog_intel_signal_topLabel: string;
  catalog_intel_signal_showAll: string;
  catalog_intel_signal_showLess: string;
  catalog_intel_signal_watch_action_follow: string;
  catalog_intel_signal_watch_action_unfollow: string;
  catalog_intel_signal_watch_aria_follow: string;
  catalog_intel_signal_watch_aria_unfollow: string;
  catalog_intel_signal_watch_following: string;
  alerts_bell_aria: string;
  alerts_panel_title: string;
  alerts_panel_subtitle: string;
  alerts_panel_empty_title: string;
  alerts_panel_empty_body: string;
  alerts_panel_markAllRead: string;
  alerts_panel_viewSignal: string;
  alerts_panel_unreadBadge: string;

  // Related requests
  catalog_relatedReq_title: string;
  catalog_relatedReq_subtitle: string;
  catalog_relatedReq_volume: string;
  catalog_relatedReq_buyer: string;
  catalog_relatedReq_respond: string;

  // Recovery footer
  catalog_recovery_title: string;
  catalog_recovery_body: string;
  catalog_recovery_signup: string;
  catalog_recovery_signin: string;

  // Procurement workspace — row signals
  catalog_row_signal_news: string;
  catalog_row_signal_docsReady: string;
  catalog_row_signal_docsPending: string;

  // Procurement workspace — selected-offer panel
  catalog_panel_aria: string;
  catalog_panel_dock_aria: string;
  catalog_panel_dock_show: string;
  catalog_panel_dock_hide: string;
  catalog_panel_neutral_title: string;
  catalog_panel_neutral_body: string;
  catalog_panel_summary_title: string;
  catalog_panel_summary_origin: string;
  catalog_panel_summary_supplier: string;
  catalog_panel_summary_basis: string;
  catalog_panel_news_title: string;
  catalog_panel_news_subtitle: string;
  catalog_panel_news_primary: string;
  catalog_panel_docs_title: string;
  catalog_panel_docs_disclaimer: string;
  catalog_panel_doc_health: string;
  catalog_panel_doc_haccp: string;
  catalog_panel_doc_catch: string;
  catalog_panel_doc_cert: string;
  catalog_panel_doc_packing: string;
  catalog_panel_doc_traceability: string;
  catalog_panel_supplier_title: string;
  catalog_panel_supplier_verification: string;
  catalog_panel_supplier_verified: string;
  catalog_panel_supplier_unverified: string;
  catalog_panel_supplier_response: string;
  catalog_panel_supplier_since: string;

  // Procurement workspace — relative time
  catalog_time_today: string;
  catalog_time_dayAgo: string;
  catalog_time_daysAgo: string;
  catalog_time_weekAgo: string;
  catalog_time_weeksAgo: string;

  // Procurement workspace — news relevance reasons
  catalog_news_reason_price: string;
  catalog_news_reason_availability: string;
  catalog_news_reason_logistics: string;
  catalog_news_reason_compliance: string;
  catalog_news_reason_supplier_risk: string;

  // Procurement workspace — compare tray
  catalog_compare_addLabel: string;
  catalog_compare_removeLabel: string;
  // Row v2 — supplier visibility & access CTAs
  catalog_row_supplierLocked_anon: string;
  catalog_row_supplierLocked_reg: string;
  catalog_row_priceCta_anon: string;
  catalog_row_priceCta_reg: string;
  catalog_row_priceCta_reg_sent: string;
  catalog_row_priceAccess_anon: string;
  catalog_row_priceAccess_reg: string;
  catalog_row_priceSupplierLocked_anon: string;
  catalog_row_priceSupplierLocked_reg: string;
  catalog_row_basisLabel: string;
  catalog_row_basisAltSuffix: string;
  catalog_row_paymentLabel: string;
  catalog_row_volumePricingLabel: string;
  catalog_panel_compare_add: string;
  catalog_panel_compare_remove: string;
  catalog_row_viewDetails: string;
  catalog_compare_trayTitle: string;
  catalog_compare_trayHint: string;
  catalog_compare_open: string;
  catalog_compare_clear: string;
  catalog_compare_max: string;
  catalog_compare_emptyHint: string;
  catalog_compare_dialogTitle: string;
  catalog_compare_col_offer: string;
  catalog_compare_col_price: string;
  catalog_compare_col_origin: string;
  catalog_compare_col_supplierCountry: string;
  catalog_compare_col_basis: string;
  catalog_compare_col_moq: string;
  catalog_compare_col_certifications: string;

  // Filters bar above workspace
  catalog_filtersBar_title: string;
  catalog_filtersBar_collapse: string;
  catalog_filtersBar_expand: string;
  catalog_filterPill_close: string;
  catalog_filterPill_clear: string;
  catalog_filterPill_apply: string;
  catalog_filterPill_searchPlaceholder: string;

  // OfferDetail access gating
  offerDetail_accessLocked_title: string;
  offerDetail_accessLocked_body: string;
  offerDetail_accessLimited_title: string;
  offerDetail_accessLimited_body: string;
  offerDetail_requestAccessCta: string;
  offerDetail_priceLocked_label: string;
  offerDetail_priceLocked_anonCta: string;
  offerDetail_priceLocked_regCta: string;
  offerDetail_termsLocked_label: string;
  offerDetail_termsLocked_hint: string;
  offerDetail_volumeLocked_label: string;
  offerDetail_supplierMasked_name: string;
  offerDetail_supplierMasked_hint: string;
  offerDetail_supplierContactLocked: string;
  offerDetail_supplierProfileLocked: string;
  offerDetail_basisCountAvailable: string;
  offerDetail_indicativePrice: string;
};

// ─── ENGLISH ─────────────────────────────────────────────────────

const en: TranslationKeys = {
  // Header
  nav_liveOffers: "Catalog",
  nav_categories: "Categories",
  nav_howItWorks: "How It Works",
  nav_faq: "FAQ",
  nav_signIn: "Sign In",
  nav_registerFree: "Register Free",

  // Hero
  hero_title1: "Verified Suppliers. Transparent Prices.",
  hero_title2: "Full Control Over Your Sourcing.",
  hero_subtitle: `Compare offers, check supplier documents, and request price access in one workspace. No commission on the deal.`,
  hero_searchPlaceholder: "Search products: salmon fillet, vannamei shrimp, cod loin...",
  hero_searchBtn: "Search",
  hero_popular: "Popular: Atlantic Salmon · Vannamei Shrimp · Cod Loin · King Crab",
  hero_registerFree: "Create buyer account",
  hero_registerHint: "needed to see exact prices and supplier contacts. Free, no card.",
  hero_exploreLiveOffers: "Explore Live Offers",
  hero_liveOffers: "live offers",
  hero_verifiedSuppliers: "verified suppliers",
  hero_countries: "countries",
  hero_activeBuyers: "active buyers",

  // Live Offers
  offers_liveMarketplace: "Live Marketplace",
  offers_title: "Live wholesale offers buyers can compare today.",
  offers_subtitle: "Real listings with origin, format, price range and MOQ. Open any card to inspect documents and request supplier access.",
  offers_viewAll: "View all offers",
  offers_viewAllMobile: "View All Offers",
  offers_showMore: "Show more offers",
  offers_showLess: "Show less",
  offers_listLabel: "Live wholesale offers from verified suppliers",
  offers_cardLabel: "{product} from {origin}, {price} per kg. View offer.",
  offers_priceUnit_perKg: "per kg",
  offers_qtyUnit_kg: "kg",
  offers_moqLabel: "MOQ",
  priceUnit_tooltip: "Price per kilogram of net product weight, excluding glaze and packaging. Final invoice may vary based on incoterms and selected volume tier.",

  // Offer Card
  card_verified: "Verified",
  card_viewOffer: "View Offer",
  card_perKg: "per kg",
  card_frozen: "Frozen",
  card_fresh: "Fresh",
  card_chilled: "Chilled",
  card_updatedAgo: "Updated {time} ago",
  card_listedToday: "Listed today",
  cert_issuer: "Issuer",
  cert_officialWebsite: "Official website",

  // Trust Strip
  trust_liveOffers: "Live Offers",
  trust_verifiedSuppliers: "Verified Suppliers",
  trust_countries: "Countries",
  trust_activeBuyers: "Active Buyers",
  trust_liveOffersDetail: "updated daily from verified sources",
  trust_verifiedSuppliersDetail: "each passed 3-step due diligence",
  trust_countriesDetail: "from Norway to Vietnam",
  trust_activeBuyersDetail: "sourcing right now",
  trust_unlikeOthers: "Unlike other platforms:",
  trust_zeroCommission: "0% commission — your margins stay yours",
  trust_directContacts: "Direct contacts — always open, never gated",
  trust_verificationEarned: "Verification earned, not bought",

  // Value Split
  value_title: "Built for Both Sides of the Trade",
  value_subtitle: "Whether you're sourcing seafood or selling it, YORSO gives you the tools to trade with confidence.",
  value_forBuyers: "For Buyers",
  value_forSuppliers: "For Suppliers",
  value_buyerHeadline: "Source with confidence, not guesswork",
  value_supplierHeadline: "Sell directly, without the middleman tax",
  value_registerBuyer: "Register as Buyer",
  value_registerSupplier: "Register as Supplier",
  value_buyerBenefits: [
    { title: "Reduce Supply Risk", desc: "Pre-qualify backup suppliers before your main source fails. Compare verified alternatives across 48 countries." },
    { title: "Price Visibility", desc: "See real prices from multiple origins. Walk into negotiations with benchmark data, not guesswork." },
    { title: "Verified Suppliers Only", desc: "Every supplier passes document review, facility checks, and trade reference verification. No pay-to-play badges." },
    { title: "Faster Sourcing Decisions", desc: "Search, compare, and contact suppliers in hours — not weeks of emails and trade show follow-ups." },
  ],
  value_supplierBenefits: [
    { title: "Zero Commission", desc: "Keep 100% of your margins. No hidden fees, no percentage from deals. Direct buyer relationships." },
    { title: "Qualified Demand", desc: "Connect with verified procurement professionals actively sourcing your products right now." },
    { title: "Year-Round Visibility", desc: "Your offers are live 24/7 to buyers from 48+ countries. Not just during a 3-day trade show." },
    { title: "Build Trust Through Verification", desc: "Showcase your certifications and track record. Buyers contact verified suppliers first." },
  ],

  // Category
  cat_title: "Source by Species",
  cat_subtitle: "Real commercial species, real wholesale offers — recognise what you buy at a glance.",
  cat_offers: "offers",
  cat_names: { Salmon: "Salmon", Shrimp: "Shrimp", Whitefish: "Whitefish", Tuna: "Tuna", Crab: "Crab", "Squid & Octopus": "Squid & Octopus", Shellfish: "Shellfish", Surimi: "Surimi" },
  species_names: {
    atlanticSalmon: "Atlantic Salmon",
    cod: "Atlantic Cod",
    haddock: "Haddock",
    hake: "European Hake",
    seaBass: "Sea Bass",
    seaBream: "Sea Bream",
    yellowfinTuna: "Yellowfin Tuna",
    mackerel: "Atlantic Mackerel",
  },
  species_descriptors: {
    atlanticSalmon: "Farmed · Norway, Faroe",
    cod: "Wild-caught · Atlantic",
    haddock: "Wild-caught · North Sea",
    hake: "Wild-caught · Iberian",
    seaBass: "Farmed · Mediterranean",
    seaBream: "Farmed · Mediterranean",
    yellowfinTuna: "Loins · Sashimi grade",
    mackerel: "Wild-caught · Pelagic",
  },

  // Supplier Verification
  verify_title: "How Suppliers Are Verified",
  verify_subtitle: "Our verification is earned, not bought. Here's exactly what we check — and how it differs from what you've seen before.",
  verify_steps: [
    { title: "Application Review", desc: "Suppliers submit business registration, export licenses, and facility certifications (HACCP, BRC, MSC). Self-certification is not accepted.", unlike: "Unlike Alibaba's \"Gold Supplier\" that anyone can buy for $5K/year." },
    { title: "Due Diligence", desc: "Our team verifies company registration, checks trade references with real buyers, and confirms production capabilities and export history.", unlike: "Unlike directories where suppliers list themselves without any checks." },
    { title: "Verification Badge", desc: "Approved suppliers earn a verified badge visible on all offers. The badge is re-validated annually — it can be revoked if standards slip.", unlike: "Unlike pay-to-play badges that never expire regardless of performance." },
  ],
  verify_failTitle: "What happens if a supplier fails?",
  verify_failDesc: "Verified badges can be suspended or revoked. If a supplier receives quality complaints, fails annual re-verification, or breaches platform rules, their badge is removed and buyers are notified. We've rejected thousands of applications and suspended dozens of previously-verified suppliers.",
  verify_ctaHint: "Register to see full supplier profiles, certifications, and verification status.",
  verify_ctaBtn: "Register to Unlock Supplier Details",

  // Marketplace Activity
  activity_live: "Live",
  activity_title: "Marketplace Activity",
  activity_subtitle: "Real-time updates — new listings, price changes, and supplier activity happening now.",
  activity_footer: "Updates refresh automatically · Showing latest activity across all categories",
  activity_feed: [
    { text: "New listing: Frozen Pollock Fillet from Russia", time: "3 min ago" },
    { text: "New verified supplier: Thai Union Seafood (Thailand)", time: "12 min ago" },
    { text: "Price updated: Atlantic Mackerel HG — Norway", time: "18 min ago" },
    { text: "New listing: Black Tiger Shrimp HLSO from Bangladesh", time: "25 min ago" },
    { text: "New supplier joined: Hokkaido Fisheries (Japan)", time: "34 min ago" },
    { text: "Price updated: Vannamei Shrimp PD — India", time: "41 min ago" },
    { text: "New listing: Frozen Hake Fillet from Chile", time: "52 min ago" },
    { text: "New verified supplier: Austral Fisheries (Australia)", time: "1h ago" },
  ],

  // Social Proof
  social_title: "From Skeptics to Power Users",
  social_subtitle: "Real stories from procurement pros who've been burned before — and found something better.",
  social_testimonials: [
    { quote: "After losing $40K on Alibaba to a supplier who swapped product in the container, I swore off marketplaces. YORSO was different — I verified the factory before ordering, and they never hid the supplier's direct phone number. That changed everything.", name: "Marcus Hendriksen", role: "Procurement Director", company: "Nordic Fish Import AB", country: "Sweden", painTag: "Bait-and-switch survivor" },
    { quote: "My CFO asked why we pay 12% above market on shrimp. I had no answer — we'd been using the same broker for years. Now I walk into board meetings with YORSO's benchmark data and negotiate from strength. Last quarter we saved $180K.", name: "Sofia Chen", role: "Supply Chain Manager", company: "Pacific Seafood Trading", country: "Singapore", painTag: "Price blindness → savings" },
    { quote: "When our Chilean salmon supplier had a force majeure mid-season, we needed 20 tonnes in 48 hours. Previously that meant panicking at trade shows. On YORSO, we found three verified alternatives overnight and shipped on time.", name: "Jean-Pierre Moreau", role: "Import Manager", company: "Marée Fraîche SARL", country: "France", painTag: "Emergency sourcing" },
  ],

  // FAQ
  faq_title: "Frequently Asked Questions",
  faq_subtitle: "Common questions from buyers evaluating YORSO for their sourcing needs.",
  faq_items: [
    { question: "What's the catch? Will you charge commission later or sell my data?", answer: "No catch. YORSO charges 0% commission on your deals — today and always. We monetize through optional premium tools (analytics, priority placement for suppliers), never from your margin. Your data is yours: we're GDPR-compliant and will never sell or share it with third parties." },
    { question: "I already have trusted suppliers. Why would I need a platform?", answer: "Your current suppliers aren't going anywhere. YORSO gives you leverage: compare prices across 48 countries, discover backup suppliers before your single-source fails you at 2 AM, and negotiate from a position of knowledge — not dependency. Most buyers start using YORSO alongside existing relationships, not instead of them." },
    { question: "How do I know suppliers are real and not just another Alibaba scam?", answer: "Every verified supplier passes a multi-step review: business licenses, export documentation, facility certifications (HACCP, BRC, MSC), and trade references. We've rejected thousands of applications. Unlike Alibaba's \"Gold Supplier\" pay-to-play badges, our verification is earned, not bought." },
    { question: "We're in peak season — we don't have time to learn a new system.", answer: "Registration takes 5 minutes. No training, no IT department, no integrations required. Average time from signup to first supplier contact is under 1 hour. If you can use email, you can use YORSO." },
    { question: "Software can't smell fish. I need physical quality control.", answer: "Agreed — and we'd never tell you otherwise. YORSO doesn't replace your QC process. It replaces the weeks of emails, Excel spreadsheets, and trade show trips you spend finding and comparing suppliers. You still inspect, negotiate, and decide. We just get you to the right shortlist 10x faster." },
    { question: "Will my competitors see what I'm buying or who I'm talking to?", answer: "Never. Your activity, inquiries, and supplier conversations are 100% private. Suppliers see your company profile only when you choose to contact them. No public purchase history, no competitor intelligence leaks." },
    { question: "How does YORSO handle security and compliance?", answer: "YORSO is fully GDPR-compliant with data stored in EU-based infrastructure. All communications are encrypted in transit and at rest. We conduct regular security audits, and supplier verification includes compliance checks for export regulations, food safety standards (HACCP, BRC, IFS), and trade sanctions screening. Your data is never shared or sold to third parties." },
  ],

  // Final CTA
  cta_title1: "Start Sourcing with",
  cta_title2: "Confidence",
  cta_subtitle: "Join thousands of procurement professionals who source seafood through verified suppliers, transparent pricing, and direct contacts — with zero commissions and no lock-in.",
  cta_registerFree: "Register Free",
  cta_freeNote: "Free for buyers · No credit card required · Setup in 5 minutes",
  cta_verifiedSuppliers: "380 verified suppliers",
  cta_zeroCommission: "0% commission",
  cta_directContacts: "Direct contacts always",

  // Footer
  footer_desc: "The global B2B seafood marketplace. Connecting professional buyers with verified suppliers across 48 countries — with transparent pricing, direct contacts, and zero commissions.",
  footer_worldwide: "Available worldwide · EN, ES, RU",
  footer_copyright: `© ${new Date().getFullYear()} YORSO B.V. All rights reserved.`,
  footer_registered: "Registered in the Netherlands · KVK 12345678",
  footer_platform: "Platform",
  footer_company: "Company",
  footer_legal: "Legal",
  footer_links: {
    platform: [
      { label: "Live Offers", href: "/#offers" },
      { label: "Categories", href: "/#categories" },
      { label: "Verified Suppliers", href: "/how-it-works" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "FAQ", href: "/#faq" },
    ],
    company: [
      { label: "About YORSO", href: "/about" },
      { label: "Contact Us", href: "/contact" },
      { label: "Careers", href: "/careers" },
      { label: "Press & Media", href: "/press" },
      { label: "Partner Program", href: "/partners" },
    ],
    legal: [
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "GDPR Compliance", href: "/gdpr" },
      { label: "Anti-Fraud Policy", href: "/anti-fraud" },
    ],
  },

  // Registration
  reg_joinYorso: "Join YORSO",
  reg_chooseSubtitle: "Choose how you'll use the platform. It takes under 3 minutes.",
  reg_imBuyer: "I'm a Buyer",
  reg_imSupplier: "I'm a Supplier",
  reg_buyerSubtitle: "Source seafood from verified suppliers",
  reg_supplierSubtitle: "Reach qualified buyers worldwide",
  reg_buyerFeatures: ["Access 2,000+ verified offers", "Compare prices across 48 countries", "Contact suppliers directly — zero commission"],
  reg_supplierFeatures: ["Year-round visibility for your products", "Direct contact with verified buyers", "Zero commission on all deals"],
  reg_enterEmail: "Enter your business email",
  reg_emailSubtitle: "We'll send a verification code to confirm your identity.",
  reg_emailPlaceholder: "you@company.com",
  reg_emailInvalid: "Please enter a valid business email",
  reg_continue: "Continue",
  reg_checking: "Checking…",
  reg_couldNotContinue: "Could not continue",
  reg_couldNotSave: "Could not save",
  signin_signInFailed: "Sign in failed",
  signin_couldNotSendLink: "Could not send link",
  cert_viewDetails: "View details for {cert} certification",
  aria_toggleMenu: "Toggle menu",
  aria_goBack: "Go back",
  aria_breadcrumb: "Breadcrumb",
  aria_catalogResults: "Catalog results",
  aria_imgPrev: "Previous image",
  aria_imgNext: "Next image",
  aria_close: "Close",
  aria_removeFilter: "Remove filter",
  reg_phone_placeholder: "Phone number",
  reg_step_role: "Role",
  reg_step_email: "Email",
  reg_step_verify: "Verify",
  reg_step_details: "Details",
  reg_step_profile: "Profile",
  reg_step_markets: "Markets",
  reg_step_done: "Done",
  country_searchPlaceholder: "Country or code",
  country_noResults: "No results found",
  signin_emailPlaceholder: "you@company.com",
  reg_fullNamePlaceholder: "John Smith",
  reg_companyPlaceholder: "Acme Seafood Ltd.",
  reg_byContAgreeTo: "By continuing, you agree to our",
  reg_terms: "Terms",
  reg_and: "and",
  reg_privacyPolicy: "Privacy Policy",
  reg_checkInbox: "Check your inbox",
  reg_codeSentTo: "We sent a 6-digit code to",
  reg_enterFullCode: "Please enter the full 6-digit code",
  reg_verifyAndContinue: "Verify & Continue",
  reg_verifying: "Verifying…",
  reg_verificationFailed: "Verification failed",
  reg_didntReceive: "Didn't receive the code? Resend",
  reg_codeResent: "Code resent",
  reg_codeResentDesc: "Check your inbox for a new code.",
  reg_tellAboutYourself: "Tell us about yourself",
  reg_detailsSubtitleBuyer: "We use your business details to set up your buyer profile and improve trust between marketplace participants.",
  reg_detailsSubtitleSupplier: "We use your business details to set up your supplier profile and improve trust between marketplace participants.",
  reg_fullName: "Full name",
  reg_companyName: "Company name",
  reg_country: "Country",
  reg_autoDetected: "(auto-detected)",
  reg_selectCountry: "Select country...",
  reg_vatTin: "VAT / TIN number",
  reg_vatPlaceholder: "e.g. DE123456789",
  reg_vatDescBuyer: "Needed for B2B invoicing and trade documentation.",
  reg_vatDescSupplier: "Required for supplier verification and marketplace credibility.",
  reg_phoneNumber: "Phone number",
  reg_phoneDesc: "Used for deal communication and to help prevent fake registrations.",
  reg_sendCode: "Send verification code",
  reg_codeSentEnter: "Code sent. Enter it below:",
  reg_smsCode: "SMS code",
  reg_verify: "Verify",
  reg_invalidCodeRetry: "Invalid code. Please try again.",
  reg_resendCode: "Resend code",
  reg_verified: "Verified",
  reg_or: "or",
  reg_verifyViaWhatsApp: "Verify via WhatsApp",
  reg_whatsAppCodeDesc: "We'll send a verification code to this number via WhatsApp",
  reg_codeSentToast: "Code sent",
  reg_codeSentToastDesc: "An SMS with a verification code has been sent to your number",
  reg_phoneVerifiedWhatsApp: "Phone verified via WhatsApp",
  reg_phoneVerifiedWhatsAppDesc: "Your number has been successfully verified",
  reg_phoneVerified: "Phone verified",
  reg_phoneVerifiedDesc: "Your number has been successfully verified",
  reg_invalidCode: "Invalid code",
  reg_invalidCodeDesc: "Please check the code from the SMS and try again",
  reg_password: "Password",
  reg_passwordPlaceholder: "Minimum 8 characters",
  reg_saving: "Saving…",
  reg_enterFullName: "Please enter your full name",
  reg_enterCompanyName: "Please enter your company name",
  reg_minChars: "Minimum 8 characters",
  reg_selectCountryErr: "Please select a country",
  reg_enterValidVat: "Please enter a valid VAT/TIN number",
  reg_enterPhoneNumber: "Please enter your phone number",
  reg_verifyPhoneNumber: "Please verify your phone number",
  reg_enterValidPhone: "Please enter a valid phone number",
  reg_enterCodeFromSms: "Please enter the code from the SMS",
  reg_whatDoYouSource: "What do you source?",
  reg_whatDoYouOffer: "What do you offer?",
  reg_onboardingSubtitleBuyer: "Select categories you're interested in. We'll show you relevant offers.",
  reg_onboardingSubtitleSupplier: "Tell us about your business so buyers can find you.",
  reg_productCategories: "Product categories",
  reg_businessType: "Business type",
  reg_selectAllApply: "(select all that apply)",
  reg_certifications: "Certifications",
  reg_monthlyVolumeBuyer: "Monthly sourcing volume",
  reg_monthlyVolumeSupplier: "Monthly production capacity",
  reg_skipForNow: "Skip for now — I'll set this up later",
  reg_whereSourceFrom: "Where do you source from?",
  reg_whereExportTo: "Where do you export to?",
  reg_countriesSubtitleBuyer: "Select origin countries you're interested in. We'll prioritize matching offers.",
  reg_countriesSubtitleSupplier: "Select your target markets. Buyers from these countries will see your offers first.",
  reg_showAllCountries: "Show all {count} countries →",
  reg_countriesSelected: "countries selected",
  reg_countrySelected: "country selected",
  reg_completeSetup: "Complete Setup",
  reg_welcome: "Welcome, {name}!",
  reg_profileComplete: "Your {role} profile setup{company} is complete.",
  reg_yourProfile: "Your profile",
  reg_buyer: "Buyer",
  reg_supplier: "Supplier",
  reg_category: "category",
  reg_categories: "categories",
  reg_market: "market",
  reg_markets: "markets",
  reg_certification: "certification",
  reg_certificationsLabel: "certifications",
  reg_matchingOffers: "matching offers",
  reg_whatsNext: "What's next for you",
  reg_exploreOffers: "Explore Offers",
  reg_buyerAutoRedirect: "Signed in as a buyer. Opening the catalog in {seconds} sec…",
  reg_createFirstOffer: "Create Your First Offer",
  reg_alreadyHaveAccount: "Already have an account?",
  reg_signIn: "Sign in",
  reg_help: "Help",

  // Sign In
  signin_title: "Sign in to YORSO",
  signin_subtitle: "Use the email or phone number you registered with.",
  signin_email: "Email",
  signin_phone: "Phone",
  signin_emailLabel: "Email",
  signin_passwordLabel: "Password",
  signin_forgotPassword: "Forgot password?",
  signin_passwordPlaceholder: "Enter your password",
  signin_signInBtn: "Sign In",
  signin_phoneLabel: "Phone number",
  signin_or: "or",
  signin_viaWhatsApp: "Sign in via WhatsApp",
  signin_getCodeWhatsApp: "Get code via WhatsApp",
  signin_noAccount: "Don't have an account?",
  signin_register: "Register",
  signin_back: "Back",
  signin_resetPassword: "Reset password",
  signin_resetSubtitle: "Enter the email you used to register. We'll send a link to reset your password.",
  signin_resetDemoHint: "Demo mode: password reset only works for the test account dm@yorso.com.",
  signin_sendResetLink: "Send reset link",
  signin_emailSent: "Email sent",
  signin_checkEmailInstructions: "and follow the instructions in the email.",
  signin_backToSignIn: "Back to sign in",
  signin_fillAll: "Please fill in all fields",
  signin_enterPhonePassword: "Please enter your phone number and password",
  signin_enterValidPhone: "Please enter a valid phone number",
  signin_signedIn: "Signed in",
  signin_welcomeBack: "Welcome back!",
  signin_codeSentWhatsApp: "Code sent via WhatsApp",
  signin_checkWhatsApp: "Check your WhatsApp messages",
  signin_enterEmail: "Please enter your email",
  signin_emailSentToast: "Email sent",
  signin_emailSentToastDesc: "Check your inbox for password reset instructions",

  // Offers page
  offersPage_title: "All Wholesale Offers",
  offersPage_subtitle: "Browse {count}+ live offers from verified suppliers worldwide.",
  offersPage_searchPlaceholder: "Search products...",
  offersPage_backToHome: "Back to homepage",
  offersPage_showingAll: "Showing all available offers. Register to see full supplier details and pricing.",
  offersPage_registerToSee: "Register to see full supplier details and pricing.",

  // Offer Detail
  offerDetail_notFound: "Offer not found",
  offerDetail_browseAll: "Browse all offers",
  offerDetail_home: "Home",
  offerDetail_offers: "Offers",
  offerDetail_registerToContact: "Register to Contact Supplier",
  offerDetail_freeRegistration: "Free registration · Direct supplier access · No commission",
  offerDetail_backToCatalog: "Back to procurement workspace",
  offerDetail_backToCatalogShort: "Back to workspace",

  // 404 / Not Found
  notFound_title: "404",
  notFound_subtitle: "We couldn't find that page",
  notFound_returnHome: "Return to homepage",
  notFound_attemptedPath: "You tried to open",
  notFound_suggestionsHeading: "Try one of these instead",
  notFound_suggestion_offers_title: "Browse the catalog",
  notFound_suggestion_offers_desc: "Open active seafood offers from verified suppliers.",
  notFound_suggestion_register_title: "Create a buyer account",
  notFound_suggestion_register_desc: "Unlock prices, supplier names and price requests.",
  notFound_suggestion_signin_title: "Sign in",
  notFound_suggestion_signin_desc: "Already registered? Continue to your account.",
  notFound_suggestion_home_title: "Go to homepage",
  notFound_suggestion_home_desc: "Start over from the YORSO homepage.",
  notFound_referrerLabel: "Came from",
  notFound_referrerDirect: "direct or unknown",
  notFound_reportHint: "If you reached this page from a YORSO link, please report it — the path above is logged for debugging.",

  // Document metadata
  meta_siteTitle: "YORSO — B2B Seafood Marketplace",
  meta_siteDescription: "Wholesale seafood from verified suppliers worldwide.",

  // TrustMicroText
  trustMicro_users: "12,000+ seafood professionals already on YORSO",
  trustMicro_security: "Your data is handled according to our Privacy Policy",
  trustMicro_verified: "2,400+ suppliers verified through document and reference checks",
  trustMicro_global: "Active deals in 48 countries — zero commission",
  trustMicro_growth: "300+ new members joined this week",
  trustMicro_privacy: "We follow industry-standard privacy practices · GDPR-aligned",

  // SocialProofBanner
  socialBanner_professionals: "12,000+ seafood professionals onboard",
  socialBanner_suppliers: "2,400+ verified suppliers across 48 countries",
  socialBanner_zeroCom: "Zero commission — direct deals, always",
  socialBanner_trustedBy: "Trusted by 12,000+ professionals",
  socialBanner_detail: "2,400+ verified suppliers · 48 countries · Zero commission",

  // Buyer Workspace
  workspace_brand: "Buyer Workspace",
  workspace_signOut: "Sign out",
  workspace_greeting: "Welcome back, {name}",
  workspace_tab_dashboard: "Overview",
  workspace_tab_saved: "Saved offers",
  workspace_tab_priceRequests: "Price requests",
  workspace_tab_messages: "Messages",

  workspace_dashboard_title: "Your procurement workspace",
  workspace_dashboard_subtitle: "Track saved offers, price access requests, and supplier conversations in one place.",
  workspace_kpi_saved: "Saved offers",
  workspace_kpi_priceRequests: "Pending price requests",
  workspace_kpi_unread: "Unread messages",
  workspace_kpi_suppliers: "Active suppliers",
  workspace_recentActivity: "Recent activity",
  workspace_quickActions: "Quick actions",
  workspace_action_browseOffers: "Browse marketplace",
  workspace_action_viewSaved: "View saved offers",
  workspace_action_openMessages: "Open messages",

  workspace_saved_title: "Saved offers",
  workspace_saved_subtitle: "Offers you bookmarked for closer review or comparison.",
  workspace_saved_empty: "No saved offers yet. Browse the marketplace and bookmark what fits your sourcing brief.",
  workspace_saved_open: "Open offer",
  workspace_saved_remove: "Remove",
  workspace_saved_savedAt: "Saved {date}",

  workspace_priceReq_title: "Price requests",
  workspace_priceReq_subtitle: "Track requests for price access you sent to suppliers.",
  workspace_priceReq_empty: "You haven't requested price access yet.",
  workspace_priceReq_status_pending: "Pending",
  workspace_priceReq_status_approved: "Approved",
  workspace_priceReq_status_rejected: "Declined",
  workspace_priceReq_requestedAt: "Requested {date}",
  workspace_priceReq_respondedAt: "Responded {date}",
  workspace_priceReq_open: "Open offer",

  workspace_msg_title: "Messages",
  workspace_msg_subtitle: "Conversations with verified suppliers.",
  workspace_msg_empty: "No conversations yet.",
  workspace_msg_unread: "{count} unread",
  workspace_msg_open: "Open thread",

  workspace_activity_offer_view: "Viewed offer",
  workspace_activity_price_request: "Requested price for",
  workspace_activity_message: "New reply from",

  info_backToHome: "Back to homepage",
  info_lastUpdated: "Last updated",
  info_updated_january2026: "January 2026",
  info_footer_rights: "All rights reserved",

  info_about_title: "About YORSO",
  info_about_intro: "YORSO is the global B2B seafood marketplace, headquartered in Amsterdam, Netherlands. We connect professional buyers with verified suppliers across 48 countries — with transparent pricing, direct contacts, and zero commissions.",
  info_about_mission: "Our Mission",
  info_about_missionBody: "To make international seafood trade transparent, efficient, and trustworthy. We believe that every buyer deserves access to verified suppliers, real prices, and direct contacts — without paying middleman fees or relying on outdated sourcing methods.",
  info_about_whatWeDo: "What We Do",
  info_about_whatWeDoBody: "YORSO provides a curated marketplace where seafood suppliers are verified through a rigorous multi-step process. Buyers can search, compare, and contact suppliers directly — with full transparency on pricing, certifications, and company credentials.",
  info_about_keyFacts: "Key Facts",
  info_about_facts: [
    "380+ verified suppliers from 48 countries",
    "2,100+ active professional buyers",
    "0% commission on all transactions",
    "GDPR-compliant, EU-based infrastructure",
    "Multi-language platform (EN, RU, ES)",
  ],

  info_contact_title: "Contact Us",
  info_contact_intro: "We'd love to hear from you. Whether you're a buyer looking for sourcing support, a supplier interested in joining, or a partner exploring collaboration — reach out and we'll respond within one business day.",
  info_contact_general: "General Inquiries",
  info_contact_buyer: "Buyer Support",
  info_contact_supplier: "Supplier Onboarding",
  info_contact_office: "Office",
  info_contact_emailLabel: "Email",
  info_contact_officeAddress: "YORSO B.V., Amsterdam, Netherlands",
  info_contact_kvk: "KVK: 12345678",

  info_cookies_title: "Cookie Policy",
  info_cookies_intro: "YORSO uses cookies and similar technologies to provide, protect, and improve the platform experience.",
  info_cookies_essential: "Essential Cookies",
  info_cookies_essentialBody: "Required for the platform to function. These include session management, authentication tokens, and language preferences. Cannot be disabled.",
  info_cookies_analytics: "Analytics Cookies",
  info_cookies_analyticsBody: "Help us understand how users interact with YORSO. We use this data to improve features and user experience. Data is anonymized and never sold.",
  info_cookies_managing: "Managing Cookies",
  info_cookies_managingBody: "You can control cookies through your browser settings. Disabling essential cookies may affect platform functionality.",
  info_cookies_contact: "Contact",
  info_cookies_contactBody1: "Questions about our cookie practices? Contact ",
  info_cookies_contactBody2: ".",

  info_gdpr_title: "GDPR Compliance",
  info_gdpr_intro: "YORSO B.V. is fully committed to compliance with the General Data Protection Regulation (EU) 2016/679.",
  info_gdpr_commitment: "Our Commitment",
  info_gdpr_commitmentList: [
    "Data minimization: we collect only what's necessary to provide our services",
    "Purpose limitation: data is used only for stated purposes",
    "Storage limitation: data is retained only as long as necessary",
    "EU-based infrastructure: all data stored within the European Union",
    "Encryption: all data encrypted in transit and at rest",
    "Regular audits: independent security assessments conducted annually",
  ],
  info_gdpr_rights: "Your Rights Under GDPR",
  info_gdpr_rightsList: [
    { term: "Right to Access", desc: "request a copy of your personal data" },
    { term: "Right to Rectification", desc: "correct inaccurate data" },
    { term: "Right to Erasure", desc: "request deletion of your data" },
    { term: "Right to Portability", desc: "receive your data in a structured format" },
    { term: "Right to Object", desc: "object to processing of your data" },
    { term: "Right to Restrict", desc: "limit how we process your data" },
  ],
  info_gdpr_dpo: "Data Protection Officer",
  info_gdpr_dpoBody: "Contact: ",
  info_gdpr_authority: "Supervisory Authority",
  info_gdpr_authorityBody: "You have the right to lodge a complaint with the Dutch Data Protection Authority (Autoriteit Persoonsgegevens).",

  info_antifraud_title: "Anti-Fraud Policy",
  info_antifraud_intro: "YORSO takes fraud prevention seriously. Our platform is designed to protect both buyers and suppliers from fraudulent activity.",
  info_antifraud_supplierVerification: "Supplier Verification",
  info_antifraud_supplierVerificationBody: "Every supplier undergoes multi-step verification before receiving a verified badge. This includes business registration checks, export license verification, facility certification review (HACCP, BRC, MSC), and trade reference validation.",
  info_antifraud_ongoingMonitoring: "Ongoing Monitoring",
  info_antifraud_ongoingMonitoringBody: "Verified suppliers are re-assessed annually. Badges can be suspended or revoked based on quality complaints, failed re-verification, or platform rule violations.",
  info_antifraud_reportingConcerns: "Reporting Concerns",
  info_antifraud_reportingConcernsBody1: "If you suspect fraudulent activity on the platform, contact us immediately at ",
  info_antifraud_reportingConcernsBody2: ". All reports are investigated within 48 hours.",
  info_antifraud_sanctions: "Sanctions Screening",
  info_antifraud_sanctionsBody: "YORSO conducts trade sanctions screening as part of the supplier verification process, in compliance with EU and international trade regulations.",

  info_careers_title: "Careers at YORSO",
  info_careers_intro: "We're building the future of B2B seafood trade. YORSO is a growing team based in Amsterdam, working to make international seafood sourcing transparent, efficient, and trustworthy.",
  info_careers_why: "Why YORSO?",
  info_careers_whyList: [
    "Meaningful impact: transforming a $150B+ industry",
    "International team with deep industry expertise",
    "Remote-friendly culture with Amsterdam HQ",
    "Competitive compensation and equity participation",
  ],
  info_careers_openPositions: "Open Positions",
  info_careers_openPositionsBody1: "We're always looking for talented people in product, engineering, sales, and operations. Send your CV and a brief intro to ",
  info_careers_openPositionsBody2: ".",

  info_press_title: "Press & Media",
  info_press_intro: "For media inquiries, interview requests, or press materials, please contact our communications team.",
  info_press_contact: "Press Contact",
  info_press_emailLabel: "Email",
  info_press_about: "About YORSO",
  info_press_aboutBody: "YORSO is a B2B seafood marketplace connecting professional buyers with 380+ verified suppliers across 48 countries. Headquartered in Amsterdam, the platform offers transparent pricing, direct supplier contacts, and zero commission — serving over 2,100 active buyers worldwide.",
  info_press_brand: "Brand Assets",
  info_press_brandBody1: "Logo files, brand guidelines, and product screenshots are available upon request. Contact ",
  info_press_brandBody2: ".",

  info_partners_title: "Partner Program",
  info_partners_intro: "YORSO partners with industry organizations, trade associations, logistics providers, and technology companies to strengthen the global seafood supply chain.",
  info_partners_types: "Partnership Types",
  info_partners_typesList: [
    { term: "Trade Associations", desc: "co-promotion, member benefits, industry data sharing" },
    { term: "Logistics Partners", desc: "integrated shipping and cold chain solutions" },
    { term: "Technology Partners", desc: "API integrations, traceability solutions" },
    { term: "Certification Bodies", desc: "streamlined verification for certified suppliers" },
  ],
  info_partners_contact: "Get in Touch",
  info_partners_contactBody1: "Interested in partnering with YORSO? Contact ",
  info_partners_contactBody2: ".",

  info_terms_title: "Terms of Service",
  info_terms_intro: "These Terms of Service (\"Terms\") govern your access to and use of the YORSO platform operated by YORSO B.V., a company registered in the Netherlands (KVK 12345678).",
  info_terms_h1: "Acceptance of Terms",
  info_terms_p1: "By accessing or using YORSO, you agree to be bound by these Terms. If you do not agree, you may not use the platform.",
  info_terms_h2: "Platform Description",
  info_terms_p2: "YORSO is a B2B marketplace that connects seafood buyers with verified suppliers. The platform facilitates discovery, comparison, and direct communication between parties. YORSO does not take ownership of goods, handle payments between buyers and suppliers, or guarantee transaction outcomes.",
  info_terms_h3: "User Accounts",
  info_terms_p3: "You must provide accurate and complete registration information. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.",
  info_terms_h4: "Commission Policy",
  info_terms_p4: "YORSO charges 0% commission on deals between buyers and suppliers. Revenue is generated through optional premium services available to suppliers.",
  info_terms_h5: "Supplier Verification",
  info_terms_p5: "YORSO conducts due diligence on suppliers seeking verified status. Verification does not constitute a warranty or guarantee of supplier performance, product quality, or transaction outcomes.",
  info_terms_h6: "Limitation of Liability",
  info_terms_p6: "YORSO is not liable for disputes between buyers and suppliers, product quality issues, shipping delays, or financial losses arising from transactions arranged through the platform.",
  info_terms_h7: "Governing Law",
  info_terms_p7: "These Terms are governed by the laws of the Netherlands. Any disputes shall be submitted to the competent courts of Amsterdam.",

  info_privacy_title: "Privacy Policy",
  info_privacy_intro: "YORSO B.V. (\"YORSO\", \"we\", \"us\") respects your privacy and is committed to protecting your personal data in accordance with the General Data Protection Regulation (GDPR) and applicable Dutch privacy laws.",
  info_privacy_dataCollect: "Data We Collect",
  info_privacy_dataCollectList: [
    "Account information: name, email, company name, role",
    "Usage data: pages visited, features used, search queries",
    "Communication data: messages sent through the platform",
    "Technical data: IP address, browser type, device information",
  ],
  info_privacy_use: "How We Use Your Data",
  info_privacy_useBody: "We use your data to provide and improve our services, facilitate buyer-supplier connections, ensure platform security, and communicate relevant updates. We do not sell your data to third parties.",
  info_privacy_storage: "Data Storage & Security",
  info_privacy_storageBody: "All data is stored in EU-based infrastructure. We use encryption in transit (TLS) and at rest. Regular security audits are conducted to maintain data integrity.",
  info_privacy_rights: "Your Rights",
  info_privacy_rightsBody1: "Under GDPR, you have the right to access, rectify, delete, or export your personal data. Contact ",
  info_privacy_rightsBody2: " to exercise your rights.",
  info_privacy_contact: "Contact",
  info_privacy_contactBody: "Data Protection Officer: ",

  // Catalog
  catalog_pageTitle: "Seafood Catalog",
  catalog_breadcrumbHome: "Home",
  catalog_breadcrumbCatalog: "Catalog",
  catalog_marketStatus_live: "Marketplace live",
  catalog_freshOffers_24h: "{count} new offers in 24h",
  catalog_resultCount: "{count} active offers",
  catalog_quickRequest_title: "Don't see exactly what you need?",
  catalog_quickRequest_subtitle: "Post a structured request and verified suppliers will respond directly.",
  catalog_quickRequest_cta: "Send a request",
  catalog_filters_title: "Procurement filters",
  catalog_filters_clearAll: "Clear all",
  catalog_filters_search: "Search",
  catalog_filters_searchPlaceholder: "Species, latin name, supplier, origin…",
  catalog_filters_species: "Species / category",
  catalog_filters_origin: "Origin country",
  catalog_filters_supplierCountry: "Supplier country",
  catalog_filters_supplier: "Supplier",
  catalog_filters_logisticsBasis: "Logistics basis",
  catalog_filters_currency: "Currency",
  catalog_filters_certification: "Certification",
  catalog_filters_paymentTerms: "Payment terms",
  catalog_filters_state: "Product state",
  catalog_filters_cutType: "Cut type",
  catalog_filters_latinName: "Latin name",
  catalog_filters_advanced: "Advanced filters",
  catalog_filters_any: "Any",
  catalog_filters_all: "All",
  catalog_filters_state_frozen: "Frozen",
  catalog_filters_state_fresh: "Fresh",
  catalog_filters_state_chilled: "Chilled",
  catalog_results_none: "No offers match the current filters.",
  catalog_results_resetFilters: "Reset filters",

  catalog_access_anon_title: "You're browsing as a guest",
  catalog_access_anon_body: "You can explore live offers, filters and market signals. Exact prices and direct supplier contacts are protected to prevent low-intent scraping and to keep supplier data safe.",
  catalog_access_anon_cta: "Sign up to access exact prices",
  catalog_access_reg_title: "You're signed in — full access requires qualification",
  catalog_access_reg_body: "You can save offers, compare suppliers, request price access and follow suppliers. Exact prices and direct supplier contacts are unlocked once your buyer account is qualified.",
  catalog_access_reg_cta: "Request qualification",
  catalog_access_qual_title: "Full procurement access",
  catalog_access_qual_body: "You can see exact prices, supplier contacts and the full intelligence layer. Use it for live procurement decisions.",
  catalog_access_granted_toast_title: "Price access granted",
  catalog_access_granted_toast_body: "Supplier {company} has approved your request. Exact prices and contacts are now visible.",
  catalog_access_granted_toast_body_fallback: "The supplier has approved your request. Exact prices and contacts are now visible.",
  catalog_access_devSwitcher_label: "Demo access level",
  catalog_access_devSwitcher_anon: "Anonymous",
  catalog_access_devSwitcher_reg: "Registered",
  catalog_access_devSwitcher_qual: "Qualified",
  catalog_access_devSwitcher_note: "Demo control — not part of real authorization",

  catalog_value_cap_prices: "Unlock exact prices",
  catalog_value_cap_suppliers: "Access supplier details",
  catalog_value_cap_intelligence: "Track price signals & country news",
  catalog_value_ctaSignup: "Create buyer account",
  catalog_value_ctaQualify: "Request full access",
  catalog_trust_title: "Trust",
  catalog_trust_subtitle: "How YORSO protects every procurement step",
  catalog_trust_verification_label: "Supplier verification",
  catalog_trust_verification_hint: "Documents, audit & references reviewed before listing",
  catalog_trust_activity_label: "Live market activity",
  catalog_trust_activity_hint: "Real-time alerts on price moves and supply events",
  catalog_trust_access_label: "Controlled access",
  catalog_trust_access_hint: "Prices and supplier names unlock after review",
  catalog_trust_signals_label: "Procurement intelligence",
  catalog_trust_signals_hint: "Origin news and price signals tied to each offer",
  catalog_trust_documents_label: "Document readiness",
  catalog_trust_documents_hint: "Health, origin and traceability docs flagged per offer",
  catalog_trust_recovery_label: "Buyer support",
  catalog_trust_recovery_hint: "Help when an offer doesn't match your specification",
  catalog_access_request_title: "Request full procurement access",
  catalog_access_request_subtitle: "Tell us what you need to evaluate. Our verification team reviews requests before granting full supplier and price access.",
  catalog_access_request_scope_label: "What do you need access to?",
  catalog_access_request_scope_prices: "Exact prices and volume breaks",
  catalog_access_request_scope_suppliers: "Full supplier identity and contacts",
  catalog_access_request_scope_intelligence: "Price signals and country news",
  catalog_access_request_note_label: "Brief context (optional)",
  catalog_access_request_note_placeholder: "Company, sourcing focus, target markets, expected volume…",
  catalog_access_request_submit: "Submit access request",
  catalog_access_request_cancel: "Cancel",
  catalog_access_request_pending_title: "Access request submitted",
  catalog_access_request_pending_body: "Verified suppliers and our review team will respond after review. You'll be notified once access is granted.",
  catalog_access_request_toast: "Access request submitted for review.",
  catalog_access_request_pending_scopes: "Requested:",
  catalog_access_request_cancel_pending: "Cancel request",
  catalog_access_request_canceled_toast: "Access request canceled.",
  catalog_access_request_success_title: "Request sent to supplier 🎉",
  catalog_access_request_success_body: "The supplier will get back to you within 24 hours.",
  catalog_access_request_success_cta: "Back to product",
  catalog_reqForm_submitted_title: "Your submitted requests",
  catalog_reqForm_submitted_subtitle: "Review your latest sourcing requests while suppliers respond.",
  catalog_reqForm_submitted_at: "Submitted",
  catalog_reqForm_title: "Didn't find the exact product?",
  catalog_reqForm_subtitle: "Submit a structured procurement request — verified suppliers can respond after review.",
  catalog_reqForm_product: "Product / species",
  catalog_reqForm_productPh: "e.g. Atlantic salmon",
  catalog_reqForm_latin: "Latin name",
  catalog_reqForm_latinPh: "e.g. Salmo salar",
  catalog_reqForm_format: "Format / cut",
  catalog_reqForm_formatPh: "e.g. HOG, fillet, portions",
  catalog_reqForm_origin: "Preferred origin",
  catalog_reqForm_originPh: "e.g. Norway, Chile",
  catalog_reqForm_supplierCountry: "Supplier country",
  catalog_reqForm_supplierCountryPh: "Any verified supplier country",
  catalog_reqForm_volume: "Required volume",
  catalog_reqForm_volumePh: "e.g. 20 t / month",
  catalog_reqForm_destination: "Delivery market",
  catalog_reqForm_destinationPh: "e.g. EU, UAE, Singapore",
  catalog_reqForm_timing: "Target timing",
  catalog_reqForm_timingPh: "e.g. Q2 2026, ASAP",
  catalog_reqForm_notes: "Additional notes",
  catalog_reqForm_notesPh: "Specs, certifications, packaging, payment terms…",
  catalog_reqForm_photo: "Product photo",
  catalog_reqForm_photoHint: "Drag and drop a photo here, or click to choose a file. Up to 5 MB.",
  catalog_reqForm_photoAdd: "Drop photo here or click to upload",
  catalog_reqForm_photoRemove: "Remove photo",
  catalog_reqForm_photoTooLarge: "Image is too large. Max 5 MB.",
  catalog_reqForm_submit: "Submit request",
  catalog_reqForm_optional: "Optional",
  catalog_reqForm_success_title: "Your request has been recorded",
  catalog_reqForm_success_body: "Verified suppliers can respond after review. We'll notify you when matching offers arrive.",
  catalog_reqForm_success_new: "Submit another request",

  catalog_card_priceRange: "Price range",
  catalog_card_priceLocked: "Exact price locked",
  catalog_card_priceLockedHint: "Sign up to see exact pricing",
  catalog_card_supplierStub: "Verified supplier",
  catalog_card_supplierLocked: "Supplier identity locked",
  catalog_card_supplierPartial: "Partial supplier profile",
  catalog_card_volumeBreaks: "Volume breaks",
  catalog_card_paymentTerms: "Payment",
  catalog_card_logistics: "Logistics",
  catalog_card_interest: "Active interest",
  catalog_card_action_signupForPrice: "Sign up for exact price",
  catalog_card_action_requestSupplier: "Register to unlock supplier",
  catalog_card_action_sendRequest: "Send request",
  catalog_card_action_save: "Save",
  catalog_card_action_compare: "Compare",
  catalog_card_action_watch: "Watch",
  catalog_card_action_followSupplier: "Follow supplier",
  catalog_card_action_notifyPrice: "Notify on price change",
  catalog_card_action_contactSupplier: "Contact supplier",
  catalog_card_action_addToCart: "Add to procurement cart",
  catalog_card_action_view: "View offer",

  catalog_intel_title: "Procurement intelligence",
  catalog_intel_lockedTitle: "Intelligence preview",
  catalog_intel_lockedBody: "Sign up to preview market signals. Full intelligence is available after qualification.",
  catalog_intel_partialTitle: "Limited intelligence",
  catalog_intel_partialBody: "You see headlines and direction. Full statistics and country-level analysis are unlocked after qualification.",
  catalog_intel_priceTrend_title: "Price trend",
  catalog_intel_priceTrend_index: "Price index",
  catalog_intel_priceTrend_d7: "7 days",
  catalog_intel_priceTrend_d30: "30 days",
  catalog_intel_priceTrend_d90: "90 days",
  catalog_intel_priceTrend_volatility: "Volatility",
  catalog_intel_priceTrend_vol_low: "Low",
  catalog_intel_priceTrend_vol_medium: "Medium",
  catalog_intel_priceTrend_vol_high: "High",
  catalog_intel_news_title: "Country news affecting this category",
  catalog_intel_news_more: "Read source",
  catalog_intel_impact_title: "Countries affecting price",
  catalog_intel_impact_role_supplier_country: "Supplier country",
  catalog_intel_impact_role_origin_country: "Origin country",
  catalog_intel_impact_role_export_port: "Export hub",
  catalog_intel_impact_role_competing_producer: "Competing producer",
  catalog_intel_impact_role_demand_driver: "Demand driver",
  catalog_intel_impact_share: "Price impact",
  catalog_intel_signals_title: "Market signals",
  catalog_intel_signal_supply: "Supply",
  catalog_intel_signal_demand: "Demand",
  catalog_intel_signal_logistics: "Logistics",
  catalog_intel_signal_regulation: "Regulation",
  catalog_intel_signal_severity_info: "Info",
  catalog_intel_signal_severity_watch: "Watch",
  catalog_intel_signal_severity_alert: "Alert",
  catalog_intel_signal_severity_info_tooltip: "Info — context only, no action expected.",
  catalog_intel_signal_severity_watch_tooltip: "Watch — emerging trend that may move price or supply. Consider following.",
  catalog_intel_signal_severity_alert_tooltip: "Alert — material event likely affecting this offer. Review now.",
  catalog_intel_signal_drawer_context: "Context",
  catalog_intel_signal_drawer_meaning: "What it means for this offer",
  catalog_intel_signal_drawer_actions: "Suggested procurement actions",
  catalog_intel_signal_drawer_published: "Published",
  catalog_intel_signal_drawer_close: "Close",
  catalog_intel_signal_drawer_openHint: "Tap for full context",
  catalog_intel_signal_topLabel: "Top signal",
  catalog_intel_signal_showAll: "Show all signals",
  catalog_intel_signal_showLess: "Show less",
  catalog_intel_signal_watch_action_follow: "Follow",
  catalog_intel_signal_watch_action_unfollow: "Unfollow",
  catalog_intel_signal_watch_aria_follow: "Follow this signal — receive updates in your alerts",
  catalog_intel_signal_watch_aria_unfollow: "Stop following this signal",
  catalog_intel_signal_watch_following: "Following — updates appear in your alerts",
  alerts_bell_aria: "Open alerts",
  alerts_panel_title: "Your alerts",
  alerts_panel_subtitle: "Updates on signals you follow",
  alerts_panel_empty_title: "No alerts yet",
  alerts_panel_empty_body: "Follow a market signal to receive procurement-relevant updates here.",
  alerts_panel_markAllRead: "Mark all as read",
  alerts_panel_viewSignal: "View signal",
  alerts_panel_unreadBadge: "New",

  catalog_relatedReq_title: "Related buyer requests",
  catalog_relatedReq_subtitle: "Open requests from verified buyers — relevant to this category.",
  catalog_relatedReq_volume: "Volume",
  catalog_relatedReq_buyer: "Buyer",
  catalog_relatedReq_respond: "Respond",

  catalog_recovery_title: "Unlock prices and supplier names",
  catalog_recovery_body: "Create a buyer account to see exact prices, contact verified suppliers, save offers and compare deals. Takes under a minute · no credit card.",
  catalog_recovery_signup: "Open buyer account",
  catalog_recovery_signin: "Sign in to continue",

  catalog_row_signal_news: "news",
  catalog_row_signal_docsReady: "Docs ready",
  catalog_row_signal_docsPending: "Docs pending",

  catalog_panel_aria: "Selected offer intelligence",
  catalog_panel_dock_aria: "Selected offer analytics",
  catalog_panel_dock_show: "Show analytics",
  catalog_panel_dock_hide: "Hide analytics",
  catalog_panel_neutral_title: "Select an offer to view procurement intelligence",
  catalog_panel_neutral_body: "Pick any offer on the left to track price movement, country news, document readiness and supplier trust for that exact product.",
  catalog_panel_summary_title: "Selected offer",
  catalog_panel_summary_origin: "Origin",
  catalog_panel_summary_supplier: "Supplier country",
  catalog_panel_summary_basis: "Logistics",
  catalog_panel_news_title: "Country news affecting this offer",
  catalog_panel_news_subtitle: "Prioritised for {origin} (origin) and {supplier} (supplier).",
  catalog_panel_news_primary: "Direct",
  catalog_panel_docs_title: "Document readiness",
  catalog_panel_docs_disclaimer: "Preview based on supplier-provided data — confirm with supplier before contract.",
  catalog_panel_doc_health: "Health certificate",
  catalog_panel_doc_haccp: "HACCP",
  catalog_panel_doc_catch: "Catch / IUU certificate",
  catalog_panel_doc_cert: "Sustainability cert.",
  catalog_panel_doc_packing: "Packing list / invoice",
  catalog_panel_doc_traceability: "Traceability data",
  catalog_panel_supplier_title: "Supplier trust summary",
  catalog_panel_supplier_verification: "Verification",
  catalog_panel_supplier_verified: "Verified",
  catalog_panel_supplier_unverified: "Pending",
  catalog_panel_supplier_response: "Response time",
  catalog_panel_supplier_since: "In business since",

  catalog_time_today: "today",
  catalog_time_dayAgo: "{n} day ago",
  catalog_time_daysAgo: "{n} days ago",
  catalog_time_weekAgo: "{n} week ago",
  catalog_time_weeksAgo: "{n} weeks ago",

  catalog_news_reason_price: "Affects price",
  catalog_news_reason_availability: "Affects availability",
  catalog_news_reason_logistics: "Affects logistics",
  catalog_news_reason_compliance: "Affects compliance",
  catalog_news_reason_supplier_risk: "Affects supplier risk",

  catalog_compare_addLabel: "Add to compare",
  catalog_compare_removeLabel: "Remove from compare",
  catalog_row_supplierLocked_anon: "Supplier details available after price access",
  catalog_row_supplierLocked_reg: "Unlock price access to view supplier",
  catalog_row_priceCta_anon: "Create buyer account",
  catalog_row_priceCta_reg: "Request price access",
  catalog_row_priceCta_reg_sent: "Request sent",
  catalog_row_priceAccess_anon: "Exact price available after buyer account",
  catalog_row_priceAccess_reg: "Request access to exact price",
  catalog_row_priceSupplierLocked_anon: "Price and supplier — after sign-up",
  catalog_row_priceSupplierLocked_reg: "Price and supplier — on access request",
  catalog_row_basisLabel: "Delivery basis",
  catalog_row_basisAltSuffix: "more",
  catalog_row_paymentLabel: "Payment",
  catalog_row_volumePricingLabel: "Volume pricing",
  catalog_panel_compare_add: "Add to compare",
  catalog_panel_compare_remove: "Remove from compare",
  catalog_row_viewDetails: "View offer details",
  catalog_compare_trayTitle: "Compare offers",
  catalog_compare_trayHint: "Select 2–5 offers to compare side by side.",
  catalog_compare_open: "Open comparison",
  catalog_compare_clear: "Clear",
  catalog_compare_max: "Maximum 5 offers selected",
  catalog_compare_emptyHint: "No offers selected yet",
  catalog_compare_dialogTitle: "Side-by-side comparison",
  catalog_compare_col_offer: "Offer",
  catalog_compare_col_price: "Price",
  catalog_compare_col_origin: "Origin",
  catalog_compare_col_supplierCountry: "Supplier country",
  catalog_compare_col_basis: "Logistics basis",
  catalog_compare_col_moq: "MOQ",
  catalog_compare_col_certifications: "Certifications",

  catalog_filtersBar_title: "Procurement filters",
  catalog_filtersBar_collapse: "Hide filters",
  catalog_filtersBar_expand: "Show filters",
  catalog_filterPill_close: "Close",
  catalog_filterPill_clear: "Clear",
  catalog_filterPill_apply: "Apply",
  catalog_filterPill_searchPlaceholder: "Search…",

  offerDetail_accessLocked_title: "Sign up to view supplier and price details",
  offerDetail_accessLocked_body: "Free registration unlocks indicative pricing, supplier identity preview and direct messaging requests.",
  offerDetail_accessLimited_title: "Request access to unlock full details",
  offerDetail_accessLimited_body: "Your account sees the offer summary and indicative pricing. Request access to see exact pricing, supplier contact and full commercial terms.",
  offerDetail_requestAccessCta: "Request access",
  offerDetail_priceLocked_label: "Pricing available after sign up",
  offerDetail_priceLocked_anonCta: "Sign up to view exact prices",
  offerDetail_priceLocked_regCta: "Request price access",
  offerDetail_termsLocked_label: "Commercial terms",
  offerDetail_termsLocked_hint: "MOQ, payment terms, lead time and shipment port unlock with access.",
  offerDetail_volumeLocked_label: "Volume pricing available after access is granted.",
  offerDetail_supplierMasked_name: "Verified supplier",
  offerDetail_supplierMasked_hint: "Supplier identity is revealed after your buyer profile is approved.",
  offerDetail_supplierContactLocked: "Unlock supplier contact",
  offerDetail_supplierProfileLocked: "Unlock supplier profile",
  offerDetail_basisCountAvailable: "{n} delivery bases available",
  offerDetail_indicativePrice: "Indicative range",
};

// ─── RUSSIAN ─────────────────────────────────────────────────────

const ru: TranslationKeys = {
  nav_liveOffers: "Каталог",
  nav_categories: "Категории",
  nav_howItWorks: "Как это работает",
  nav_faq: "FAQ",
  nav_signIn: "Войти",
  nav_registerFree: "Регистрация",

  hero_title1: "Проверенные поставщики. Прозрачные цены.",
  hero_title2: "Полный контроль закупок.",
  hero_subtitle: "Сравнивайте предложения, проверяйте документы поставщиков и запрашивайте доступ к ценам в одном рабочем окне. Без комиссий со сделки.",
  hero_searchPlaceholder: "Поиск продукции: филе лосося, креветка ваннамей, филе трески...",
  hero_searchBtn: "Найти",
  hero_popular: "Популярное: Атлантический лосось · Креветка ваннамей · Филе трески · Королевский краб",
  hero_registerFree: "Создать аккаунт покупателя",
  hero_registerHint: "нужен, чтобы видеть точные цены и контакты поставщика. Бесплатно, без карты.",
  hero_exploreLiveOffers: "Изучить живые предложения",
  hero_liveOffers: "предложений",
  hero_verifiedSuppliers: "проверенных поставщиков",
  hero_countries: "стран",
  hero_activeBuyers: "активных покупателей",

  offers_liveMarketplace: "Маркетплейс онлайн",
  offers_title: "Живые оптовые предложения, которые можно сравнить сегодня.",
  offers_subtitle: "Реальные оферты с происхождением, форматом, диапазоном цены и MOQ. Откройте карточку, чтобы посмотреть документы и запросить доступ к поставщику.",
  offers_viewAll: "Все предложения",
  offers_viewAllMobile: "Все предложения",
  offers_showMore: "Показать ещё",
  offers_showLess: "Свернуть",
  offers_listLabel: "Актуальные оптовые предложения от проверенных поставщиков",
  offers_cardLabel: "{product}, происхождение: {origin}, цена: {price} за кг. Открыть предложение.",
  offers_priceUnit_perKg: "за кг",
  offers_qtyUnit_kg: "кг",
  offers_moqLabel: "Мин. партия",
  priceUnit_tooltip: "Цена за килограмм нетто без глазури и упаковки. Итоговая сумма зависит от условий поставки (incoterms) и выбранного объёмного тира.",

  card_verified: "Проверен",
  card_viewOffer: "Смотреть",
  card_perKg: "за кг",
  card_frozen: "Заморож.",
  card_fresh: "Свежий",
  card_chilled: "Охлажд.",
  card_updatedAgo: "Обновлено {time} назад",
  card_listedToday: "Добавлено сегодня",
  cert_issuer: "Кем выдан",
  cert_officialWebsite: "Официальный сайт",

  trust_liveOffers: "Предложений",
  trust_verifiedSuppliers: "Проверенных поставщиков",
  trust_countries: "Стран",
  trust_activeBuyers: "Активных покупателей",
  trust_liveOffersDetail: "обновляются ежедневно из проверенных источников",
  trust_verifiedSuppliersDetail: "каждый прошёл 3-этапную проверку",
  trust_countriesDetail: "от Норвегии до Вьетнама",
  trust_activeBuyersDetail: "закупают прямо сейчас",
  trust_unlikeOthers: "В отличие от других платформ:",
  trust_zeroCommission: "0% комиссии — ваша маржа остаётся вашей",
  trust_directContacts: "Прямые контакты — всегда открыты, без ограничений",
  trust_verificationEarned: "Верификация заслужена, а не куплена",

  value_title: "Создано для обеих сторон торговли",
  value_subtitle: "Закупаете ли вы морепродукты или продаёте — YORSO даёт инструменты для уверенной торговли.",
  value_forBuyers: "Для покупателей",
  value_forSuppliers: "Для поставщиков",
  value_buyerHeadline: "Закупайте уверенно, а не наугад",
  value_supplierHeadline: "Продавайте напрямую, без посреднических комиссий",
  value_registerBuyer: "Регистрация покупателя",
  value_registerSupplier: "Регистрация поставщика",
  value_buyerBenefits: [
    { title: "Снижение рисков поставок", desc: "Заранее подбирайте резервных поставщиков. Сравнивайте проверенные альтернативы из 48 стран." },
    { title: "Прозрачность цен", desc: "Видите реальные цены из разных регионов. Входите в переговоры с данными, а не догадками." },
    { title: "Только проверенные поставщики", desc: "Каждый поставщик проходит проверку документов, инспекцию производства и проверку торговых рекомендаций." },
    { title: "Быстрые решения по закупкам", desc: "Ищите, сравнивайте и связывайтесь с поставщиками за часы — не за недели переписки." },
  ],
  value_supplierBenefits: [
    { title: "Нулевая комиссия", desc: "Сохраняйте 100% маржи. Без скрытых платежей, без процента от сделок. Прямые отношения с покупателями." },
    { title: "Квалифицированный спрос", desc: "Связывайтесь с проверенными специалистами по закупкам, которые ищут вашу продукцию прямо сейчас." },
    { title: "Круглогодичная видимость", desc: "Ваши предложения доступны 24/7 покупателям из 48+ стран. Не только на 3-дневной выставке." },
    { title: "Доверие через верификацию", desc: "Демонстрируйте сертификаты и репутацию. Покупатели в первую очередь обращаются к проверенным поставщикам." },
  ],

  cat_title: "Поиск по видам рыбы",
  cat_subtitle: "Реальные коммерческие виды и реальные оптовые предложения — узнавайте товар с первого взгляда.",
  cat_offers: "предложений",
  cat_names: { Salmon: "Лосось", Shrimp: "Креветки", Whitefish: "Белая рыба", Tuna: "Тунец", Crab: "Краб", "Squid & Octopus": "Кальмар и осьминог", Shellfish: "Моллюски", Surimi: "Сурими" },
  species_names: {
    atlanticSalmon: "Атлантический лосось",
    cod: "Атлантическая треска",
    haddock: "Пикша",
    hake: "Европейская хек",
    seaBass: "Сибас",
    seaBream: "Дорада",
    yellowfinTuna: "Желтопёрый тунец",
    mackerel: "Атлантическая скумбрия",
  },
  species_descriptors: {
    atlanticSalmon: "Аквакультура · Норвегия, Фареры",
    cod: "Дикий вылов · Атлантика",
    haddock: "Дикий вылов · Северное море",
    hake: "Дикий вылов · Иберия",
    seaBass: "Аквакультура · Средиземноморье",
    seaBream: "Аквакультура · Средиземноморье",
    yellowfinTuna: "Лоины · Сашими-класс",
    mackerel: "Дикий вылов · Пелагический",
  },

  verify_title: "Как проверяются поставщики",
  verify_subtitle: "Наша верификация заслужена, а не куплена. Вот что именно мы проверяем — и чем это отличается от того, что вы видели раньше.",
  verify_steps: [
    { title: "Проверка заявки", desc: "Поставщики предоставляют регистрацию, экспортные лицензии и сертификаты производства (HACCP, BRC, MSC). Самосертификация не принимается.", unlike: "В отличие от «Gold Supplier» Alibaba, который можно купить за $5K/год." },
    { title: "Должная проверка", desc: "Наша команда проверяет регистрацию компании, торговые рекомендации от реальных покупателей и подтверждает производственные возможности.", unlike: "В отличие от каталогов, где поставщики регистрируются без какой-либо проверки." },
    { title: "Значок верификации", desc: "Одобренные поставщики получают значок, видимый на всех предложениях. Значок перепроверяется ежегодно — он может быть отозван.", unlike: "В отличие от платных значков, которые никогда не истекают вне зависимости от качества." },
  ],
  verify_failTitle: "Что происходит, если поставщик не прошёл проверку?",
  verify_failDesc: "Значки верификации могут быть приостановлены или отозваны. Если поставщик получает жалобы на качество, не проходит ежегодную перепроверку или нарушает правила платформы — значок удаляется, а покупатели уведомляются.",
  verify_ctaHint: "Зарегистрируйтесь, чтобы увидеть полные профили поставщиков, сертификаты и статус верификации.",
  verify_ctaBtn: "Разблокировать данные поставщиков",

  activity_live: "Онлайн",
  activity_title: "Активность маркетплейса",
  activity_subtitle: "Обновления в реальном времени — новые предложения, изменения цен и активность поставщиков.",
  activity_footer: "Обновляется автоматически · Показана последняя активность по всем категориям",
  activity_feed: [
    { text: "Новое предложение: Замороженное филе минтая из России", time: "3 мин назад" },
    { text: "Новый верифицированный поставщик: Thai Union Seafood (Таиланд)", time: "12 мин назад" },
    { text: "Обновление цены: Атлантическая скумбрия HG — Норвегия", time: "18 мин назад" },
    { text: "Новое предложение: Тигровая креветка HLSO из Бангладеш", time: "25 мин назад" },
    { text: "Новый поставщик: Hokkaido Fisheries (Япония)", time: "34 мин назад" },
    { text: "Обновление цены: Креветка ваннамей PD — Индия", time: "41 мин назад" },
    { text: "Новое предложение: Замороженное филе хека из Чили", time: "52 мин назад" },
    { text: "Новый верифицированный поставщик: Austral Fisheries (Австралия)", time: "1ч назад" },
  ],

  social_title: "От скептиков к постоянным пользователям",
  social_subtitle: "Реальные истории закупщиков, которые обожглись раньше — и нашли кое-что лучше.",
  social_testimonials: [
    { quote: "Потеряв $40K на Alibaba из-за поставщика, который подменил товар в контейнере, я зарёкся от маркетплейсов. YORSO оказался другим — я проверил фабрику до заказа, и мне никогда не скрывали прямой телефон поставщика.", name: "Маркус Хендриксен", role: "Директор по закупкам", company: "Nordic Fish Import AB", country: "Швеция", painTag: "Выжил после подмены" },
    { quote: "CFO спросил, почему мы платим на 12% выше рынка за креветку. У меня не было ответа. Теперь я прихожу на совет директоров с данными YORSO и веду переговоры с позиции силы. В прошлом квартале сэкономили $180K.", name: "София Чень", role: "Менеджер по цепям поставок", company: "Pacific Seafood Trading", country: "Сингапур", painTag: "Ценовая слепота → экономия" },
    { quote: "Когда у чилийского поставщика лосося случился форс-мажор, нам нужно было 20 тонн за 48 часов. На YORSO мы нашли три проверенные альтернативы за ночь и отгрузили вовремя.", name: "Жан-Пьер Моро", role: "Менеджер по импорту", company: "Marée Fraîche SARL", country: "Франция", painTag: "Экстренные закупки" },
  ],

  faq_title: "Часто задаваемые вопросы",
  faq_subtitle: "Частые вопросы от покупателей, оценивающих YORSO для своих закупок.",
  faq_items: [
    { question: "В чём подвох? Будете брать комиссию позже или продавать мои данные?", answer: "Никакого подвоха. YORSO берёт 0% комиссии с ваших сделок — сегодня и всегда. Мы монетизируемся через премиум-инструменты, никогда за счёт вашей маржи. Ваши данные — ваши: мы соответствуем GDPR и никогда не продаём их третьим лицам." },
    { question: "У меня уже есть проверенные поставщики. Зачем мне платформа?", answer: "Ваши текущие поставщики никуда не денутся. YORSO даёт вам рычаг: сравнивайте цены из 48 стран, находите резервных поставщиков и ведите переговоры с позиции знания." },
    { question: "Как узнать, что поставщики реальные?", answer: "Каждый верифицированный поставщик проходит многоэтапную проверку: бизнес-лицензии, экспортная документация, сертификаты (HACCP, BRC, MSC) и торговые рекомендации. Мы отклонили тысячи заявок." },
    { question: "У нас пик сезона — нет времени осваивать новую систему.", answer: "Регистрация занимает 5 минут. Без обучения, без IT-отдела. Среднее время от регистрации до первого контакта — менее 1 часа." },
    { question: "Программа не может понюхать рыбу.", answer: "Согласны. YORSO не заменяет контроль качества. Он заменяет недели переписок и поездок на выставки. Вы по-прежнему решаете. Мы помогаем составить шорт-лист в 10 раз быстрее." },
    { question: "Мои конкуренты увидят, что я покупаю?", answer: "Никогда. Ваша активность и переписка на 100% конфиденциальны. Поставщики видят ваш профиль только когда вы решите с ними связаться." },
    { question: "Как YORSO обеспечивает безопасность?", answer: "YORSO соответствует GDPR, данные хранятся в ЕС. Коммуникации защищены при передаче и хранении. Мы проводим регулярные аудиты безопасности." },
  ],

  cta_title1: "Начните закупки с",
  cta_title2: "уверенностью",
  cta_subtitle: "Присоединяйтесь к тысячам специалистов по закупкам, которые находят морепродукты через проверенных поставщиков, прозрачные цены и прямые контакты — без комиссий.",
  cta_registerFree: "Регистрация",
  cta_freeNote: "Бесплатно для покупателей · Без карты · Настройка за 5 минут",
  cta_verifiedSuppliers: "380 проверенных поставщиков",
  cta_zeroCommission: "0% комиссии",
  cta_directContacts: "Прямые контакты всегда",

  footer_desc: "Глобальный B2B маркетплейс морепродуктов. Связываем покупателей с проверенными поставщиками из 48 стран.",
  footer_worldwide: "Доступен по всему миру · EN, ES, RU",
  footer_copyright: `© ${new Date().getFullYear()} YORSO B.V. Все права защищены.`,
  footer_registered: "Зарегистрирована в Нидерландах · KVK 12345678",
  footer_platform: "Платформа",
  footer_company: "Компания",
  footer_legal: "Правовая информация",
  footer_links: {
    platform: [
      { label: "Предложения", href: "/#offers" },
      { label: "Категории", href: "/#categories" },
      { label: "Проверенные поставщики", href: "/how-it-works" },
      { label: "Как это работает", href: "/how-it-works" },
      { label: "FAQ", href: "/#faq" },
    ],
    company: [
      { label: "О YORSO", href: "/about" },
      { label: "Контакты", href: "/contact" },
      { label: "Карьера", href: "/careers" },
      { label: "Пресса", href: "/press" },
      { label: "Партнёрская программа", href: "/partners" },
    ],
    legal: [
      { label: "Условия использования", href: "/terms" },
      { label: "Политика конфиденциальности", href: "/privacy" },
      { label: "Политика cookies", href: "/cookies" },
      { label: "Соответствие GDPR", href: "/gdpr" },
      { label: "Антифрод политика", href: "/anti-fraud" },
    ],
  },

  // Registration
  reg_joinYorso: "Присоединиться к YORSO",
  reg_chooseSubtitle: "Выберите, как вы будете использовать платформу. Это займёт менее 3 минут.",
  reg_imBuyer: "Я покупатель",
  reg_imSupplier: "Я поставщик",
  reg_buyerSubtitle: "Закупайте морепродукты у проверенных поставщиков",
  reg_supplierSubtitle: "Выходите на квалифицированных покупателей по всему миру",
  reg_buyerFeatures: ["Доступ к 2,000+ проверенных предложений", "Сравнение цен из 48 стран", "Прямые контакты — без комиссии"],
  reg_supplierFeatures: ["Круглогодичная видимость вашей продукции", "Прямой контакт с проверенными покупателями", "Нулевая комиссия на все сделки"],
  reg_enterEmail: "Введите рабочий email",
  reg_emailSubtitle: "Мы отправим код подтверждения для проверки вашей личности.",
  reg_emailPlaceholder: "you@company.com",
  reg_emailInvalid: "Пожалуйста, введите корректный рабочий email",
  reg_continue: "Продолжить",
  reg_checking: "Проверяем…",
  reg_couldNotContinue: "Не удалось продолжить",
  reg_couldNotSave: "Не удалось сохранить",
  signin_signInFailed: "Не удалось войти",
  signin_couldNotSendLink: "Не удалось отправить ссылку",
  cert_viewDetails: "Подробнее о сертификации {cert}",
  aria_toggleMenu: "Открыть меню",
  aria_goBack: "Назад",
  aria_breadcrumb: "Хлебные крошки",
  aria_catalogResults: "Результаты каталога",
  aria_imgPrev: "Предыдущее изображение",
  aria_imgNext: "Следующее изображение",
  aria_close: "Закрыть",
  aria_removeFilter: "Убрать фильтр",
  reg_phone_placeholder: "Номер телефона",
  reg_step_role: "Роль",
  reg_step_email: "Email",
  reg_step_verify: "Подтверждение",
  reg_step_details: "Данные",
  reg_step_profile: "Профиль",
  reg_step_markets: "Рынки",
  reg_step_done: "Готово",
  country_searchPlaceholder: "Страна или код",
  country_noResults: "Ничего не найдено",
  signin_emailPlaceholder: "name@company.com",
  reg_fullNamePlaceholder: "Иван Иванов",
  reg_companyPlaceholder: "ООО «Дары Моря»",
  reg_byContAgreeTo: "Продолжая, вы соглашаетесь с",
  reg_terms: "Условиями",
  reg_and: "и",
  reg_privacyPolicy: "Политикой конфиденциальности",
  reg_checkInbox: "Проверьте почту",
  reg_codeSentTo: "Мы отправили 6-значный код на",
  reg_enterFullCode: "Пожалуйста, введите полный 6-значный код",
  reg_verifyAndContinue: "Подтвердить и продолжить",
  reg_verifying: "Проверяем…",
  reg_verificationFailed: "Проверка не пройдена",
  reg_didntReceive: "Не получили код? Отправить повторно",
  reg_codeResent: "Код отправлен повторно",
  reg_codeResentDesc: "Проверьте вашу почту.",
  reg_tellAboutYourself: "Расскажите о себе",
  reg_detailsSubtitleBuyer: "Мы используем ваши данные для настройки профиля покупателя и повышения доверия между участниками маркетплейса.",
  reg_detailsSubtitleSupplier: "Мы используем ваши данные для настройки профиля поставщика и повышения доверия между участниками маркетплейса.",
  reg_fullName: "Полное имя",
  reg_companyName: "Название компании",
  reg_country: "Страна",
  reg_autoDetected: "(определена автоматически)",
  reg_selectCountry: "Выберите страну...",
  reg_vatTin: "ИНН / VAT",
  reg_vatPlaceholder: "напр. 7707083893",
  reg_vatDescBuyer: "Необходим для B2B документации и выставления счетов.",
  reg_vatDescSupplier: "Необходим для верификации поставщика и доверия на маркетплейсе.",
  reg_phoneNumber: "Номер телефона",
  reg_phoneDesc: "Используется для коммуникации по сделкам и предотвращения фейковых регистраций.",
  reg_sendCode: "Отправить код подтверждения",
  reg_codeSentEnter: "Код отправлен. Введите его ниже:",
  reg_smsCode: "Код из SMS",
  reg_verify: "Проверить",
  reg_invalidCodeRetry: "Неверный код. Попробуйте снова.",
  reg_resendCode: "Отправить повторно",
  reg_verified: "Подтверждён",
  reg_or: "или",
  reg_verifyViaWhatsApp: "Подтвердить через WhatsApp",
  reg_whatsAppCodeDesc: "Мы отправим код подтверждения на этот номер через WhatsApp",
  reg_codeSentToast: "Код отправлен",
  reg_codeSentToastDesc: "SMS с кодом подтверждения отправлено на ваш номер",
  reg_phoneVerifiedWhatsApp: "Телефон подтверждён через WhatsApp",
  reg_phoneVerifiedWhatsAppDesc: "Ваш номер успешно подтверждён",
  reg_phoneVerified: "Телефон подтверждён",
  reg_phoneVerifiedDesc: "Ваш номер успешно подтверждён",
  reg_invalidCode: "Неверный код",
  reg_invalidCodeDesc: "Проверьте код из SMS и попробуйте снова",
  reg_password: "Пароль",
  reg_passwordPlaceholder: "Минимум 8 символов",
  reg_saving: "Сохраняем…",
  reg_enterFullName: "Пожалуйста, введите полное имя",
  reg_enterCompanyName: "Пожалуйста, введите название компании",
  reg_minChars: "Минимум 8 символов",
  reg_selectCountryErr: "Пожалуйста, выберите страну",
  reg_enterValidVat: "Пожалуйста, введите корректный ИНН/VAT",
  reg_enterPhoneNumber: "Пожалуйста, введите номер телефона",
  reg_verifyPhoneNumber: "Пожалуйста, подтвердите номер телефона",
  reg_enterValidPhone: "Пожалуйста, введите корректный номер телефона",
  reg_enterCodeFromSms: "Пожалуйста, введите код из SMS",
  reg_whatDoYouSource: "Что вы закупаете?",
  reg_whatDoYouOffer: "Что вы предлагаете?",
  reg_onboardingSubtitleBuyer: "Выберите интересующие категории. Мы покажем релевантные предложения.",
  reg_onboardingSubtitleSupplier: "Расскажите о вашем бизнесе, чтобы покупатели могли вас найти.",
  reg_productCategories: "Категории продукции",
  reg_businessType: "Тип бизнеса",
  reg_selectAllApply: "(выберите все подходящие)",
  reg_certifications: "Сертификаты",
  reg_monthlyVolumeBuyer: "Ежемесячный объём закупок",
  reg_monthlyVolumeSupplier: "Ежемесячная производственная мощность",
  reg_skipForNow: "Пропустить — настрою позже",
  reg_whereSourceFrom: "Откуда вы закупаете?",
  reg_whereExportTo: "Куда вы экспортируете?",
  reg_countriesSubtitleBuyer: "Выберите страны-источники. Мы приоритизируем подходящие предложения.",
  reg_countriesSubtitleSupplier: "Выберите целевые рынки. Покупатели из этих стран увидят ваши предложения первыми.",
  reg_showAllCountries: "Показать все {count} стран →",
  reg_countriesSelected: "стран выбрано",
  reg_countrySelected: "страна выбрана",
  reg_completeSetup: "Завершить настройку",
  reg_welcome: "Добро пожаловать, {name}!",
  reg_profileComplete: "Настройка вашего профиля {role}{company} завершена.",
  reg_yourProfile: "Ваш профиль",
  reg_buyer: "Покупатель",
  reg_supplier: "Поставщик",
  reg_category: "категория",
  reg_categories: "категорий",
  reg_market: "рынок",
  reg_markets: "рынков",
  reg_certification: "сертификат",
  reg_certificationsLabel: "сертификатов",
  reg_matchingOffers: "подходящих предложений",
  reg_whatsNext: "Что дальше",
  reg_exploreOffers: "Смотреть предложения",
  reg_buyerAutoRedirect: "Вход выполнен как покупатель. Открываем каталог через {seconds} сек…",
  reg_createFirstOffer: "Создать первое предложение",
  reg_alreadyHaveAccount: "Уже есть аккаунт?",
  reg_signIn: "Войти",
  reg_help: "Помощь",

  // Sign In
  signin_title: "Вход в YORSO",
  signin_subtitle: "Используйте email или номер телефона, с которым регистрировались.",
  signin_email: "Email",
  signin_phone: "Телефон",
  signin_emailLabel: "Email",
  signin_passwordLabel: "Пароль",
  signin_forgotPassword: "Забыли пароль?",
  signin_passwordPlaceholder: "Введите пароль",
  signin_signInBtn: "Войти",
  signin_phoneLabel: "Номер телефона",
  signin_or: "или",
  signin_viaWhatsApp: "Войти через WhatsApp",
  signin_getCodeWhatsApp: "Получить код через WhatsApp",
  signin_noAccount: "Нет аккаунта?",
  signin_register: "Регистрация",
  signin_back: "Назад",
  signin_resetPassword: "Сброс пароля",
  signin_resetSubtitle: "Введите email, с которым регистрировались. Мы отправим ссылку для сброса пароля.",
  signin_resetDemoHint: "Демо-режим: сброс пароля работает только для тестового аккаунта dm@yorso.com.",
  signin_sendResetLink: "Отправить ссылку",
  signin_emailSent: "Письмо отправлено",
  signin_checkEmailInstructions: "и следуйте инструкциям в письме.",
  signin_backToSignIn: "Вернуться к входу",
  signin_fillAll: "Пожалуйста, заполните все поля",
  signin_enterPhonePassword: "Пожалуйста, введите номер и пароль",
  signin_enterValidPhone: "Пожалуйста, введите корректный номер телефона",
  signin_signedIn: "Вы вошли",
  signin_welcomeBack: "С возвращением!",
  signin_codeSentWhatsApp: "Код отправлен через WhatsApp",
  signin_checkWhatsApp: "Проверьте сообщения в WhatsApp",
  signin_enterEmail: "Пожалуйста, введите email",
  signin_emailSentToast: "Письмо отправлено",
  signin_emailSentToastDesc: "Проверьте почту для инструкций по сбросу пароля",

  // Offers page
  offersPage_title: "Все оптовые предложения",
  offersPage_subtitle: "Просматривайте {count}+ актуальных предложений от проверенных поставщиков.",
  offersPage_searchPlaceholder: "Поиск продукции...",
  offersPage_backToHome: "На главную",
  offersPage_showingAll: "Показаны все доступные предложения. Зарегистрируйтесь для доступа к полным данным поставщиков и ценам.",
  offersPage_registerToSee: "Зарегистрируйтесь для полного доступа.",

  // Offer Detail
  offerDetail_notFound: "Предложение не найдено",
  offerDetail_browseAll: "Смотреть все предложения",
  offerDetail_home: "Главная",
  offerDetail_offers: "Предложения",
  offerDetail_registerToContact: "Зарегистрируйтесь для связи с поставщиком",
  offerDetail_freeRegistration: "Бесплатная регистрация · Прямой доступ к поставщику · Без комиссии",
  offerDetail_backToCatalog: "Назад в панель закупок",
  offerDetail_backToCatalogShort: "В панель закупок",

  // 404 / Not Found
  notFound_title: "404",
  notFound_subtitle: "Не нашли такую страницу",
  notFound_returnHome: "Вернуться на главную",
  notFound_attemptedPath: "Вы пытались открыть",
  notFound_suggestionsHeading: "Попробуйте одно из этого",
  notFound_suggestion_offers_title: "Открыть каталог",
  notFound_suggestion_offers_desc: "Активные предложения морепродуктов от проверенных поставщиков.",
  notFound_suggestion_register_title: "Создать аккаунт покупателя",
  notFound_suggestion_register_desc: "Откройте цены, названия поставщиков и запросы цены.",
  notFound_suggestion_signin_title: "Войти",
  notFound_suggestion_signin_desc: "Уже зарегистрированы? Перейдите в свой аккаунт.",
  notFound_suggestion_home_title: "На главную",
  notFound_suggestion_home_desc: "Начните с главной страницы YORSO.",
  notFound_referrerLabel: "Откуда переход",
  notFound_referrerDirect: "прямой или неизвестен",
  notFound_reportHint: "Если вы попали сюда по ссылке с YORSO — сообщите нам. Путь выше залогирован для отладки.",

  // Document metadata
  meta_siteTitle: "YORSO — B2B маркетплейс морепродуктов",
  meta_siteDescription: "Оптовые морепродукты от проверенных поставщиков по всему миру.",

  // TrustMicroText
  trustMicro_users: "12,000+ специалистов по морепродуктам уже на YORSO",
  trustMicro_security: "Ваши данные обрабатываются согласно нашей Политике конфиденциальности",
  trustMicro_verified: "2,400+ поставщиков проверены через документы и рекомендации",
  trustMicro_global: "Сделки в 48 странах — без комиссии",
  trustMicro_growth: "300+ новых участников на этой неделе",
  trustMicro_privacy: "Мы следуем стандартным практикам конфиденциальности · Соответствие GDPR",

  // SocialProofBanner
  socialBanner_professionals: "12,000+ специалистов по морепродуктам",
  socialBanner_suppliers: "2,400+ проверенных поставщиков из 48 стран",
  socialBanner_zeroCom: "Без комиссии — прямые сделки, всегда",
  socialBanner_trustedBy: "Доверяют 12,000+ профессионалов",
  socialBanner_detail: "2,400+ проверенных поставщиков · 48 стран · Без комиссии",

  // Buyer Workspace
  workspace_brand: "Кабинет покупателя",
  workspace_signOut: "Выйти",
  workspace_greeting: "С возвращением, {name}",
  workspace_tab_dashboard: "Обзор",
  workspace_tab_saved: "Сохранённые офферы",
  workspace_tab_priceRequests: "Запросы цены",
  workspace_tab_messages: "Сообщения",

  workspace_dashboard_title: "Ваш закупочный кабинет",
  workspace_dashboard_subtitle: "Отслеживайте сохранённые офферы, запросы цен и переписку с поставщиками в одном месте.",
  workspace_kpi_saved: "Сохранённые офферы",
  workspace_kpi_priceRequests: "Активные запросы цены",
  workspace_kpi_unread: "Непрочитанные сообщения",
  workspace_kpi_suppliers: "Активные поставщики",
  workspace_recentActivity: "Недавняя активность",
  workspace_quickActions: "Быстрые действия",
  workspace_action_browseOffers: "Перейти к офферам",
  workspace_action_viewSaved: "Открыть сохранённые",
  workspace_action_openMessages: "Открыть сообщения",

  workspace_saved_title: "Сохранённые офферы",
  workspace_saved_subtitle: "Офферы, которые вы добавили для сравнения и дальнейшей работы.",
  workspace_saved_empty: "Пока нет сохранённых офферов. Просмотрите витрину и сохраните подходящие.",
  workspace_saved_open: "Открыть оффер",
  workspace_saved_remove: "Удалить",
  workspace_saved_savedAt: "Сохранено {date}",

  workspace_priceReq_title: "Запросы цены",
  workspace_priceReq_subtitle: "Отслеживайте отправленные поставщикам запросы на доступ к цене.",
  workspace_priceReq_empty: "Пока нет запросов на доступ к цене.",
  workspace_priceReq_status_pending: "На рассмотрении",
  workspace_priceReq_status_approved: "Одобрено",
  workspace_priceReq_status_rejected: "Отклонено",
  workspace_priceReq_requestedAt: "Отправлено {date}",
  workspace_priceReq_respondedAt: "Ответ {date}",
  workspace_priceReq_open: "Открыть оффер",

  workspace_msg_title: "Сообщения",
  workspace_msg_subtitle: "Переписка с проверенными поставщиками.",
  workspace_msg_empty: "Переписок пока нет.",
  workspace_msg_unread: "{count} непрочитанных",
  workspace_msg_open: "Открыть переписку",

  workspace_activity_offer_view: "Просмотр оффера",
  workspace_activity_price_request: "Запрос цены по",
  workspace_activity_message: "Новый ответ от",

  info_backToHome: "На главную",
  info_lastUpdated: "Последнее обновление",
  info_updated_january2026: "Январь 2026",
  info_footer_rights: "Все права защищены",

  info_about_title: "О компании YORSO",
  info_about_intro: "YORSO — глобальный B2B-маркетплейс морепродуктов со штаб-квартирой в Амстердаме (Нидерланды). Мы соединяем профессиональных покупателей с проверенными поставщиками из 48 стран — с прозрачными ценами, прямыми контактами и нулевой комиссией.",
  info_about_mission: "Наша миссия",
  info_about_missionBody: "Сделать международную торговлю морепродуктами прозрачной, эффективной и заслуживающей доверия. Мы убеждены, что каждый покупатель заслуживает доступа к проверенным поставщикам, реальным ценам и прямым контактам — без посреднических комиссий и устаревших методов закупок.",
  info_about_whatWeDo: "Что мы делаем",
  info_about_whatWeDoBody: "YORSO — кураторский маркетплейс, где поставщики морепродуктов проходят строгую многоступенчатую проверку. Покупатели могут искать, сравнивать и связываться с поставщиками напрямую — с полной прозрачностью по ценам, сертификатам и реквизитам компании.",
  info_about_keyFacts: "Ключевые факты",
  info_about_facts: [
    "380+ проверенных поставщиков из 48 стран",
    "2 100+ активных профессиональных покупателей",
    "0% комиссии на всех сделках",
    "Соответствие GDPR, инфраструктура в ЕС",
    "Многоязычная платформа (EN, RU, ES)",
  ],

  info_contact_title: "Связаться с нами",
  info_contact_intro: "Будем рады услышать вас. Покупаете ли вы морепродукты, хотите стать поставщиком или рассматриваете партнёрство — напишите нам, и мы ответим в течение одного рабочего дня.",
  info_contact_general: "Общие вопросы",
  info_contact_buyer: "Поддержка покупателей",
  info_contact_supplier: "Подключение поставщиков",
  info_contact_office: "Офис",
  info_contact_emailLabel: "Email",
  info_contact_officeAddress: "YORSO B.V., Амстердам, Нидерланды",
  info_contact_kvk: "KVK: 12345678",

  info_cookies_title: "Политика использования файлов cookie",
  info_cookies_intro: "YORSO использует файлы cookie и аналогичные технологии для предоставления, защиты и улучшения работы платформы.",
  info_cookies_essential: "Обязательные cookie",
  info_cookies_essentialBody: "Необходимы для работы платформы. Включают управление сессиями, токены аутентификации и языковые настройки. Не могут быть отключены.",
  info_cookies_analytics: "Аналитические cookie",
  info_cookies_analyticsBody: "Помогают понять, как пользователи взаимодействуют с YORSO. Мы используем эти данные для улучшения функций и удобства. Данные обезличены и никогда не продаются.",
  info_cookies_managing: "Управление cookie",
  info_cookies_managingBody: "Вы можете управлять cookie через настройки браузера. Отключение обязательных cookie может повлиять на работу платформы.",
  info_cookies_contact: "Контакты",
  info_cookies_contactBody1: "Вопросы о нашей работе с cookie? Напишите на ",
  info_cookies_contactBody2: ".",

  info_gdpr_title: "Соответствие GDPR",
  info_gdpr_intro: "YORSO B.V. полностью соблюдает Общий регламент по защите данных (ЕС) 2016/679.",
  info_gdpr_commitment: "Наши обязательства",
  info_gdpr_commitmentList: [
    "Минимизация данных: собираем только то, что необходимо для оказания услуг",
    "Ограничение цели: данные используются только в заявленных целях",
    "Ограничение хранения: данные хранятся только столько, сколько необходимо",
    "Инфраструктура в ЕС: все данные хранятся в Европейском союзе",
    "Шифрование: все данные шифруются при передаче и хранении",
    "Регулярные аудиты: независимые проверки безопасности проводятся ежегодно",
  ],
  info_gdpr_rights: "Ваши права по GDPR",
  info_gdpr_rightsList: [
    { term: "Право на доступ", desc: "запросить копию ваших персональных данных" },
    { term: "Право на исправление", desc: "исправить неточные данные" },
    { term: "Право на удаление", desc: "запросить удаление ваших данных" },
    { term: "Право на переносимость", desc: "получить ваши данные в структурированном формате" },
    { term: "Право на возражение", desc: "возразить против обработки ваших данных" },
    { term: "Право на ограничение", desc: "ограничить способ обработки ваших данных" },
  ],
  info_gdpr_dpo: "Сотрудник по защите данных",
  info_gdpr_dpoBody: "Контакт: ",
  info_gdpr_authority: "Надзорный орган",
  info_gdpr_authorityBody: "Вы вправе подать жалобу в Управление по защите данных Нидерландов (Autoriteit Persoonsgegevens).",

  info_antifraud_title: "Политика противодействия мошенничеству",
  info_antifraud_intro: "YORSO серьёзно относится к предотвращению мошенничества. Платформа спроектирована для защиты как покупателей, так и поставщиков от недобросовестных действий.",
  info_antifraud_supplierVerification: "Проверка поставщиков",
  info_antifraud_supplierVerificationBody: "Каждый поставщик проходит многоступенчатую проверку перед получением статуса «проверенный». Сюда входит проверка регистрации бизнеса, экспортных лицензий, сертификатов производства (HACCP, BRC, MSC) и торговых рекомендаций.",
  info_antifraud_ongoingMonitoring: "Постоянный мониторинг",
  info_antifraud_ongoingMonitoringBody: "Проверенные поставщики проходят повторную оценку ежегодно. Бейдж может быть приостановлен или отозван по жалобам на качество, провалу повторной проверки или нарушению правил платформы.",
  info_antifraud_reportingConcerns: "Сообщить о нарушении",
  info_antifraud_reportingConcernsBody1: "Если вы подозреваете мошенничество на платформе, незамедлительно напишите нам на ",
  info_antifraud_reportingConcernsBody2: ". Все обращения рассматриваются в течение 48 часов.",
  info_antifraud_sanctions: "Проверка санкционных списков",
  info_antifraud_sanctionsBody: "YORSO проводит проверку торговых санкций в рамках верификации поставщиков в соответствии с требованиями ЕС и международного торгового регулирования.",

  info_careers_title: "Карьера в YORSO",
  info_careers_intro: "Мы строим будущее B2B-торговли морепродуктами. YORSO — растущая команда в Амстердаме, делающая международные закупки морепродуктов прозрачными, эффективными и заслуживающими доверия.",
  info_careers_why: "Почему YORSO?",
  info_careers_whyList: [
    "Значимое влияние: трансформация индустрии объёмом более $150 млрд",
    "Международная команда с глубокой отраслевой экспертизой",
    "Удалённая работа с офисом в Амстердаме",
    "Конкурентная компенсация и опцион",
  ],
  info_careers_openPositions: "Открытые вакансии",
  info_careers_openPositionsBody1: "Мы всегда ищем талантливых людей в продукт, инжиниринг, продажи и операции. Присылайте резюме и краткое представление на ",
  info_careers_openPositionsBody2: ".",

  info_press_title: "Пресса и СМИ",
  info_press_intro: "По вопросам прессы, интервью или пресс-материалов, пожалуйста, свяжитесь с нашей командой коммуникаций.",
  info_press_contact: "Контакты для прессы",
  info_press_emailLabel: "Email",
  info_press_about: "О компании YORSO",
  info_press_aboutBody: "YORSO — B2B-маркетплейс морепродуктов, соединяющий профессиональных покупателей с 380+ проверенными поставщиками из 48 стран. Платформа со штаб-квартирой в Амстердаме предлагает прозрачные цены, прямые контакты с поставщиками и нулевую комиссию — обслуживая более 2 100 активных покупателей по всему миру.",
  info_press_brand: "Бренд-материалы",
  info_press_brandBody1: "Файлы логотипа, бренд-гайдлайны и скриншоты продукта доступны по запросу. Напишите на ",
  info_press_brandBody2: ".",

  info_partners_title: "Партнёрская программа",
  info_partners_intro: "YORSO сотрудничает с отраслевыми организациями, торговыми ассоциациями, логистическими и технологическими компаниями для укрепления глобальной цепочки поставок морепродуктов.",
  info_partners_types: "Типы партнёрства",
  info_partners_typesList: [
    { term: "Торговые ассоциации", desc: "совместное продвижение, бенефиты для участников, обмен отраслевыми данными" },
    { term: "Логистические партнёры", desc: "интегрированные решения по доставке и холодовой цепи" },
    { term: "Технологические партнёры", desc: "API-интеграции, решения по прослеживаемости" },
    { term: "Сертифицирующие органы", desc: "упрощённая верификация для сертифицированных поставщиков" },
  ],
  info_partners_contact: "Связаться с нами",
  info_partners_contactBody1: "Заинтересованы в партнёрстве с YORSO? Напишите на ",
  info_partners_contactBody2: ".",

  info_terms_title: "Условия использования",
  info_terms_intro: "Настоящие Условия использования («Условия») регулируют ваш доступ к платформе YORSO и её использование. Платформа управляется компанией YORSO B.V., зарегистрированной в Нидерландах (KVK 12345678).",
  info_terms_h1: "Принятие условий",
  info_terms_p1: "Используя YORSO, вы соглашаетесь соблюдать настоящие Условия. Если вы не согласны, вы не вправе пользоваться платформой.",
  info_terms_h2: "Описание платформы",
  info_terms_p2: "YORSO — это B2B-маркетплейс, соединяющий покупателей морепродуктов с проверенными поставщиками. Платформа обеспечивает поиск, сравнение и прямую коммуникацию между сторонами. YORSO не становится владельцем товаров, не обрабатывает платежи между покупателями и поставщиками и не гарантирует исход сделок.",
  info_terms_h3: "Учётные записи пользователей",
  info_terms_p3: "Вы обязаны предоставлять точную и полную информацию при регистрации. Вы несёте ответственность за конфиденциальность учётных данных и за все действия, совершаемые в вашей учётной записи.",
  info_terms_h4: "Политика комиссий",
  info_terms_p4: "YORSO взимает 0% комиссии со сделок между покупателями и поставщиками. Доход формируется за счёт опциональных премиум-сервисов для поставщиков.",
  info_terms_h5: "Проверка поставщиков",
  info_terms_p5: "YORSO проводит проверку поставщиков, претендующих на статус «проверенный». Верификация не является гарантией исполнения обязательств, качества продукции или результата сделки.",
  info_terms_h6: "Ограничение ответственности",
  info_terms_p6: "YORSO не несёт ответственности за споры между покупателями и поставщиками, проблемы качества продукции, задержки доставки или финансовые потери, возникающие в связи со сделками, организованными через платформу.",
  info_terms_h7: "Применимое право",
  info_terms_p7: "Настоящие Условия регулируются законодательством Нидерландов. Любые споры подлежат рассмотрению в компетентных судах Амстердама.",

  info_privacy_title: "Политика конфиденциальности",
  info_privacy_intro: "YORSO B.V. («YORSO», «мы», «нас») уважает вашу конфиденциальность и обязуется защищать ваши персональные данные в соответствии с Общим регламентом по защите данных (GDPR) и применимым законодательством Нидерландов.",
  info_privacy_dataCollect: "Какие данные мы собираем",
  info_privacy_dataCollectList: [
    "Информация об аккаунте: имя, email, название компании, роль",
    "Данные использования: посещённые страницы, использованные функции, поисковые запросы",
    "Данные коммуникаций: сообщения, отправленные через платформу",
    "Технические данные: IP-адрес, тип браузера, информация об устройстве",
  ],
  info_privacy_use: "Как мы используем ваши данные",
  info_privacy_useBody: "Мы используем ваши данные для предоставления и улучшения сервиса, упрощения связи между покупателями и поставщиками, обеспечения безопасности и информирования об актуальных обновлениях. Мы не продаём ваши данные третьим лицам.",
  info_privacy_storage: "Хранение и безопасность данных",
  info_privacy_storageBody: "Все данные хранятся в инфраструктуре на территории ЕС. Мы используем шифрование при передаче (TLS) и хранении. Регулярные аудиты безопасности обеспечивают целостность данных.",
  info_privacy_rights: "Ваши права",
  info_privacy_rightsBody1: "Согласно GDPR, вы имеете право на доступ, исправление, удаление или экспорт ваших персональных данных. Чтобы воспользоваться правами, напишите на ",
  info_privacy_rightsBody2: ".",
  info_privacy_contact: "Контакты",
  info_privacy_contactBody: "Сотрудник по защите данных: ",

  // Catalog
  catalog_pageTitle: "Каталог морепродуктов",
  catalog_breadcrumbHome: "Главная",
  catalog_breadcrumbCatalog: "Каталог",
  catalog_marketStatus_live: "Рынок активен",
  catalog_freshOffers_24h: "{count} новых офферов за 24ч",
  catalog_resultCount: "{count} активных предложений",
  catalog_quickRequest_title: "Не нашли точно нужный товар?",
  catalog_quickRequest_subtitle: "Опубликуйте структурированный запрос — проверенные поставщики ответят напрямую.",
  catalog_quickRequest_cta: "Отправить запрос",
  catalog_filters_title: "Закупочные фильтры",
  catalog_filters_clearAll: "Сбросить",
  catalog_filters_search: "Поиск",
  catalog_filters_searchPlaceholder: "Вид, латинское название, поставщик, страна…",
  catalog_filters_species: "Вид / категория",
  catalog_filters_origin: "Страна происхождения",
  catalog_filters_supplierCountry: "Страна поставщика",
  catalog_filters_supplier: "Поставщик",
  catalog_filters_logisticsBasis: "Условия поставки",
  catalog_filters_currency: "Валюта",
  catalog_filters_certification: "Сертификация",
  catalog_filters_paymentTerms: "Условия оплаты",
  catalog_filters_state: "Состояние продукта",
  catalog_filters_cutType: "Тип разделки",
  catalog_filters_latinName: "Латинское название",
  catalog_filters_advanced: "Расширенные фильтры",
  catalog_filters_any: "Любой",
  catalog_filters_all: "Все",
  catalog_filters_state_frozen: "Замороженный",
  catalog_filters_state_fresh: "Охлаждённый (свежий)",
  catalog_filters_state_chilled: "Подмороженный",
  catalog_results_none: "Ни одно предложение не соответствует выбранным фильтрам.",
  catalog_results_resetFilters: "Сбросить фильтры",

  catalog_access_anon_title: "Вы просматриваете каталог как гость",
  catalog_access_anon_body: "Доступны предложения, фильтры и рыночные сигналы. Точные цены и прямые контакты поставщиков скрыты — это защищает данные поставщиков и снижает нецелевой парсинг.",
  catalog_access_anon_cta: "Зарегистрируйтесь, чтобы видеть точные цены",
  catalog_access_reg_title: "Вы вошли — полный доступ требует квалификации",
  catalog_access_reg_body: "Вы можете сохранять предложения, сравнивать поставщиков, запрашивать доступ к цене и следить за поставщиками. Точные цены и прямые контакты открываются после квалификации аккаунта покупателя.",
  catalog_access_reg_cta: "Запросить квалификацию",
  catalog_access_qual_title: "Полный закупочный доступ",
  catalog_access_qual_body: "Доступны точные цены, контакты поставщиков и полный аналитический слой. Используйте для рабочих закупочных решений.",
  catalog_access_granted_toast_title: "Предоставлен доступ к ценам",
  catalog_access_granted_toast_body: "Поставщик {company} одобрил ваш запрос. Точные цены и контакты теперь доступны.",
  catalog_access_granted_toast_body_fallback: "Поставщик одобрил ваш запрос. Точные цены и контакты теперь доступны.",
  catalog_access_devSwitcher_label: "Демо-уровень доступа",
  catalog_access_devSwitcher_anon: "Аноним",
  catalog_access_devSwitcher_reg: "Зарегистрирован",
  catalog_access_devSwitcher_qual: "Квалифицирован",
  catalog_access_devSwitcher_note: "Демо-контрол, не часть реальной авторизации",

  catalog_value_cap_prices: "Открыть точные цены",
  catalog_value_cap_suppliers: "Доступ к данным поставщиков",
  catalog_value_cap_intelligence: "Динамика цен и новости стран",
  catalog_value_ctaSignup: "Создать аккаунт покупателя",
  catalog_value_ctaQualify: "Запросить полный доступ",
  catalog_trust_title: "Доверие",
  catalog_trust_subtitle: "Как YORSO защищает каждый шаг закупки",
  catalog_trust_verification_label: "Верификация поставщиков",
  catalog_trust_verification_hint: "Документы, аудит и рекомендации проверены до публикации",
  catalog_trust_activity_label: "Активность рынка",
  catalog_trust_activity_hint: "Оповещения о движении цен и событиях предложения в реальном времени",
  catalog_trust_access_label: "Контролируемый доступ",
  catalog_trust_access_hint: "Цены и имена поставщиков открываются после проверки",
  catalog_trust_signals_label: "Закупочная аналитика",
  catalog_trust_signals_hint: "Новости стран и сигналы цен по каждому предложению",
  catalog_trust_documents_label: "Готовность документов",
  catalog_trust_documents_hint: "Сертификаты, документы происхождения и прослеживаемости отмечены в каждой карточке",
  catalog_trust_recovery_label: "Поддержка покупателя",
  catalog_trust_recovery_hint: "Помощь, если ни одно предложение не соответствует ТЗ",
  catalog_access_request_title: "Запросить полный закупочный доступ",
  catalog_access_request_subtitle: "Опишите, что вам нужно оценить. Наша команда верификации рассматривает запросы перед открытием полного доступа к поставщикам и ценам.",
  catalog_access_request_scope_label: "К чему нужен доступ?",
  catalog_access_request_scope_prices: "Точные цены и объёмные градации",
  catalog_access_request_scope_suppliers: "Полные данные и контакты поставщиков",
  catalog_access_request_scope_intelligence: "Ценовые сигналы и новости стран",
  catalog_access_request_note_label: "Краткий контекст (опционально)",
  catalog_access_request_note_placeholder: "Компания, направление закупок, целевые рынки, ожидаемый объём…",
  catalog_access_request_submit: "Отправить запрос на доступ",
  catalog_access_request_cancel: "Отмена",
  catalog_access_request_pending_title: "Запрос на доступ отправлен",
  catalog_access_request_pending_body: "Проверенные поставщики и наша команда рассмотрят запрос. Вы получите уведомление после открытия доступа.",
  catalog_access_request_toast: "Запрос на доступ отправлен на рассмотрение.",
  catalog_access_request_pending_scopes: "Запрошено:",
  catalog_access_request_cancel_pending: "Отменить запрос",
  catalog_access_request_canceled_toast: "Запрос на доступ отменён.",
  catalog_access_request_success_title: "Запрос отправлен поставщику 🎉",
  catalog_access_request_success_body: "Поставщик свяжется с вами в течение 24 часов.",
  catalog_access_request_success_cta: "Вернуться к товару",
  catalog_reqForm_submitted_title: "Ваши отправленные запросы",
  catalog_reqForm_submitted_subtitle: "Отслеживайте недавние закупочные запросы, пока поставщики готовят ответ.",
  catalog_reqForm_submitted_at: "Отправлено",
  catalog_reqForm_title: "Не нашли точно нужный товар?",
  catalog_reqForm_subtitle: "Отправьте структурированный закупочный запрос — проверенные поставщики смогут ответить после рассмотрения.",
  catalog_reqForm_product: "Продукт / вид",
  catalog_reqForm_productPh: "напр. Атлантический лосось",
  catalog_reqForm_latin: "Латинское название",
  catalog_reqForm_latinPh: "напр. Salmo salar",
  catalog_reqForm_format: "Формат / разделка",
  catalog_reqForm_formatPh: "напр. HOG, филе, порции",
  catalog_reqForm_origin: "Страна производства",
  catalog_reqForm_originPh: "напр. Норвегия, Чили",
  catalog_reqForm_supplierCountry: "Страна поставщика",
  catalog_reqForm_supplierCountryPh: "Любая проверенная страна",
  catalog_reqForm_volume: "Требуемый объём",
  catalog_reqForm_volumePh: "напр. 20 т / месяц",
  catalog_reqForm_destination: "Страна поставки",
  catalog_reqForm_destinationPh: "напр. ЕС, ОАЭ, Сингапур",
  catalog_reqForm_timing: "Целевые сроки",
  catalog_reqForm_timingPh: "напр. Q2 2026, как можно скорее",
  catalog_reqForm_notes: "Дополнительные комментарии",
  catalog_reqForm_notesPh: "Спецификации, сертификаты, упаковка, условия оплаты…",
  catalog_reqForm_photo: "Фото продукции",
  catalog_reqForm_photoHint: "Перетащите фото сюда или нажмите, чтобы выбрать файл. До 5 МБ.",
  catalog_reqForm_photoAdd: "Перетащите фото или нажмите, чтобы загрузить",
  catalog_reqForm_photoRemove: "Удалить фото",
  catalog_reqForm_photoTooLarge: "Файл слишком большой. Макс. 5 МБ.",
  catalog_reqForm_submit: "Отправить запрос",
  catalog_reqForm_optional: "Опционально",
  catalog_reqForm_success_title: "Ваш запрос принят",
  catalog_reqForm_success_body: "Проверенные поставщики смогут ответить после рассмотрения. Мы уведомим вас, когда появятся подходящие предложения.",
  catalog_reqForm_success_new: "Отправить ещё один запрос",

  catalog_card_priceRange: "Диапазон цены",
  catalog_card_priceLocked: "Точная цена скрыта",
  catalog_card_priceLockedHint: "Зарегистрируйтесь, чтобы видеть точную цену",
  catalog_card_supplierStub: "Проверенный поставщик",
  catalog_card_supplierLocked: "Поставщик скрыт",
  catalog_card_supplierPartial: "Профиль поставщика частично",
  catalog_card_volumeBreaks: "Объёмные скидки",
  catalog_card_paymentTerms: "Оплата",
  catalog_card_logistics: "Логистика",
  catalog_card_interest: "Активный интерес",
  catalog_card_action_signupForPrice: "Регистрация для точной цены",
  catalog_card_action_requestSupplier: "Регистрация для доступа к поставщику",
  catalog_card_action_sendRequest: "Отправить запрос",
  catalog_card_action_save: "Сохранить",
  catalog_card_action_compare: "Сравнить",
  catalog_card_action_watch: "Следить",
  catalog_card_action_followSupplier: "Подписаться на поставщика",
  catalog_card_action_notifyPrice: "Уведомлять об изменении цены",
  catalog_card_action_contactSupplier: "Связаться с поставщиком",
  catalog_card_action_addToCart: "В закупочную корзину",
  catalog_card_action_view: "Открыть предложение",

  catalog_intel_title: "Закупочная аналитика",
  catalog_intel_lockedTitle: "Превью аналитики",
  catalog_intel_lockedBody: "Зарегистрируйтесь, чтобы видеть превью рыночных сигналов. Полная аналитика доступна после квалификации.",
  catalog_intel_partialTitle: "Ограниченная аналитика",
  catalog_intel_partialBody: "Видны заголовки и направление движения. Полная статистика и страновой анализ открываются после квалификации.",
  catalog_intel_priceTrend_title: "Динамика цены",
  catalog_intel_priceTrend_index: "Индекс цены",
  catalog_intel_priceTrend_d7: "7 дней",
  catalog_intel_priceTrend_d30: "30 дней",
  catalog_intel_priceTrend_d90: "90 дней",
  catalog_intel_priceTrend_volatility: "Волатильность",
  catalog_intel_priceTrend_vol_low: "Низкая",
  catalog_intel_priceTrend_vol_medium: "Средняя",
  catalog_intel_priceTrend_vol_high: "Высокая",
  catalog_intel_news_title: "Новости стран по этой категории",
  catalog_intel_news_more: "Источник",
  catalog_intel_impact_title: "Страны, влияющие на цену",
  catalog_intel_impact_role_supplier_country: "Страна поставщика",
  catalog_intel_impact_role_origin_country: "Страна происхождения",
  catalog_intel_impact_role_export_port: "Экспортный хаб",
  catalog_intel_impact_role_competing_producer: "Конкурирующий производитель",
  catalog_intel_impact_role_demand_driver: "Драйвер спроса",
  catalog_intel_impact_share: "Влияние на цену",
  catalog_intel_signals_title: "Рыночные сигналы",
  catalog_intel_signal_supply: "Предложение",
  catalog_intel_signal_demand: "Спрос",
  catalog_intel_signal_logistics: "Логистика",
  catalog_intel_signal_regulation: "Регулирование",
  catalog_intel_signal_severity_info: "Инфо",
  catalog_intel_signal_severity_watch: "Внимание",
  catalog_intel_signal_severity_alert: "Сигнал",
  catalog_intel_signal_severity_info_tooltip: "Инфо — справочный контекст, действий не требуется.",
  catalog_intel_signal_severity_watch_tooltip: "Внимание — формирующийся тренд, способный повлиять на цену или поставку. Стоит подписаться.",
  catalog_intel_signal_severity_alert_tooltip: "Сигнал — значимое событие, вероятно влияющее на это предложение. Изучите сейчас.",
  catalog_intel_signal_drawer_context: "Контекст",
  catalog_intel_signal_drawer_meaning: "Что это значит для этого предложения",
  catalog_intel_signal_drawer_actions: "Рекомендуемые действия закупщика",
  catalog_intel_signal_drawer_published: "Опубликовано",
  catalog_intel_signal_drawer_close: "Закрыть",
  catalog_intel_signal_drawer_openHint: "Нажмите для полного контекста",
  catalog_intel_signal_topLabel: "Главный сигнал",
  catalog_intel_signal_showAll: "Показать все сигналы",
  catalog_intel_signal_showLess: "Свернуть",
  catalog_intel_signal_watch_action_follow: "Следить",
  catalog_intel_signal_watch_action_unfollow: "Не следить",
  catalog_intel_signal_watch_aria_follow: "Следить за сигналом — обновления появятся в ваших уведомлениях",
  catalog_intel_signal_watch_aria_unfollow: "Перестать следить за сигналом",
  catalog_intel_signal_watch_following: "Вы следите — обновления появятся в уведомлениях",
  alerts_bell_aria: "Открыть уведомления",
  alerts_panel_title: "Ваши уведомления",
  alerts_panel_subtitle: "Обновления по сигналам, за которыми вы следите",
  alerts_panel_empty_title: "Пока нет уведомлений",
  alerts_panel_empty_body: "Подпишитесь на рыночный сигнал, чтобы получать здесь релевантные для закупок обновления.",
  alerts_panel_markAllRead: "Отметить все как прочитанные",
  alerts_panel_viewSignal: "Открыть сигнал",
  alerts_panel_unreadBadge: "Новое",

  catalog_relatedReq_title: "Связанные запросы покупателей",
  catalog_relatedReq_subtitle: "Открытые запросы от проверенных покупателей по этой категории.",
  catalog_relatedReq_volume: "Объём",
  catalog_relatedReq_buyer: "Покупатель",
  catalog_relatedReq_respond: "Ответить",

  catalog_recovery_title: "Откройте цены и имена поставщиков",
  catalog_recovery_body: "Создайте кабинет покупателя, чтобы видеть точные цены, связываться с проверенными поставщиками, сохранять офферы и сравнивать сделки. Меньше минуты · без карты.",
  catalog_recovery_signup: "Открыть кабинет покупателя",
  catalog_recovery_signin: "Войти, чтобы продолжить",

  catalog_row_signal_news: "новости",
  catalog_row_signal_docsReady: "Документы готовы",
  catalog_row_signal_docsPending: "Документы уточняются",

  catalog_panel_aria: "Аналитика выбранного предложения",
  catalog_panel_dock_aria: "Аналитика по выбранному предложению",
  catalog_panel_dock_show: "Показать аналитику",
  catalog_panel_dock_hide: "Скрыть аналитику",
  catalog_panel_neutral_title: "Выберите предложение, чтобы открыть закупочную аналитику",
  catalog_panel_neutral_body: "Кликните по любому предложению слева, чтобы видеть динамику цен, страновые новости, готовность документов и доверие к поставщику для этого продукта.",
  catalog_panel_summary_title: "Выбранное предложение",
  catalog_panel_summary_origin: "Происхождение",
  catalog_panel_summary_supplier: "Страна поставщика",
  catalog_panel_summary_basis: "Логистика",
  catalog_panel_news_title: "Новости стран, влияющие на это предложение",
  catalog_panel_news_subtitle: "Приоритет: {origin} (происхождение) и {supplier} (поставщик).",
  catalog_panel_news_primary: "Прямое",
  catalog_panel_docs_title: "Готовность документов",
  catalog_panel_docs_disclaimer: "Превью по данным поставщика — подтвердите у поставщика перед контрактом.",
  catalog_panel_doc_health: "Ветеринарный сертификат",
  catalog_panel_doc_haccp: "HACCP",
  catalog_panel_doc_catch: "Сертификат вылова / IUU",
  catalog_panel_doc_cert: "Сертификат устойчивости",
  catalog_panel_doc_packing: "Упаковочный лист / инвойс",
  catalog_panel_doc_traceability: "Данные прослеживаемости",
  catalog_panel_supplier_title: "Доверие к поставщику",
  catalog_panel_supplier_verification: "Верификация",
  catalog_panel_supplier_verified: "Подтверждён",
  catalog_panel_supplier_unverified: "В процессе",
  catalog_panel_supplier_response: "Время ответа",
  catalog_panel_supplier_since: "В бизнесе с",

  catalog_time_today: "сегодня",
  catalog_time_dayAgo: "{n} день назад",
  catalog_time_daysAgo: "{n} дн. назад",
  catalog_time_weekAgo: "{n} нед. назад",
  catalog_time_weeksAgo: "{n} нед. назад",

  catalog_news_reason_price: "Влияет на цену",
  catalog_news_reason_availability: "Влияет на доступность",
  catalog_news_reason_logistics: "Влияет на логистику",
  catalog_news_reason_compliance: "Влияет на соответствие",
  catalog_news_reason_supplier_risk: "Влияет на риск поставщика",

  catalog_compare_addLabel: "В сравнение",
  catalog_compare_removeLabel: "Убрать из сравнения",
  catalog_row_supplierLocked_anon: "Данные поставщика — после доступа к цене",
  catalog_row_supplierLocked_reg: "Откройте доступ к цене, чтобы увидеть поставщика",
  catalog_row_priceCta_anon: "Создать аккаунт покупателя",
  catalog_row_priceCta_reg: "Запросить доступ к цене",
  catalog_row_priceCta_reg_sent: "Запрос отправлен",
  catalog_row_priceAccess_anon: "Точная цена доступна после создания аккаунта покупателя",
  catalog_row_priceAccess_reg: "Запросите доступ к точной цене",
  catalog_row_priceSupplierLocked_anon: "Цена и поставщик — после регистрации",
  catalog_row_priceSupplierLocked_reg: "Цена и поставщик — по запросу доступа",
  catalog_row_basisLabel: "Базис поставки",
  catalog_row_basisAltSuffix: "ещё",
  catalog_row_paymentLabel: "Оплата",
  catalog_row_volumePricingLabel: "Цены по объёму",
  catalog_panel_compare_add: "В сравнение",
  catalog_panel_compare_remove: "Убрать",
  catalog_row_viewDetails: "Открыть детали предложения",
  catalog_compare_trayTitle: "Сравнение предложений",
  catalog_compare_trayHint: "Выберите 2–5 предложений, чтобы сравнить их рядом.",
  catalog_compare_open: "Открыть сравнение",
  catalog_compare_clear: "Очистить",
  catalog_compare_max: "Можно выбрать максимум 5 предложений",
  catalog_compare_emptyHint: "Пока ни одно предложение не выбрано",
  catalog_compare_dialogTitle: "Сравнение предложений",
  catalog_compare_col_offer: "Предложение",
  catalog_compare_col_price: "Цена",
  catalog_compare_col_origin: "Происхождение",
  catalog_compare_col_supplierCountry: "Страна поставщика",
  catalog_compare_col_basis: "Базис поставки",
  catalog_compare_col_moq: "MOQ",
  catalog_compare_col_certifications: "Сертификации",

  catalog_filtersBar_title: "Закупочные фильтры",
  catalog_filtersBar_collapse: "Скрыть фильтры",
  catalog_filtersBar_expand: "Показать фильтры",
  catalog_filterPill_close: "Закрыть",
  catalog_filterPill_clear: "Очистить",
  catalog_filterPill_apply: "Применить",
  catalog_filterPill_searchPlaceholder: "Поиск…",

  offerDetail_accessLocked_title: "Зарегистрируйтесь, чтобы увидеть детали поставщика и цены",
  offerDetail_accessLocked_body: "Бесплатная регистрация открывает ориентировочную цену, превью идентичности поставщика и запрос прямой связи.",
  offerDetail_accessLimited_title: "Запросите доступ, чтобы увидеть полные детали",
  offerDetail_accessLimited_body: "Ваш аккаунт видит сводку предложения и ориентировочную цену. Запросите доступ, чтобы увидеть точную цену, контакты поставщика и полные коммерческие условия.",
  offerDetail_requestAccessCta: "Запросить доступ",
  offerDetail_priceLocked_label: "Цена доступна после регистрации",
  offerDetail_priceLocked_anonCta: "Зарегистрироваться, чтобы увидеть цены",
  offerDetail_priceLocked_regCta: "Запросить доступ к цене",
  offerDetail_termsLocked_label: "Коммерческие условия",
  offerDetail_termsLocked_hint: "MOQ, условия оплаты, срок поставки и порт отгрузки открываются после получения доступа.",
  offerDetail_volumeLocked_label: "Объёмное ценообразование станет доступно после получения доступа.",
  offerDetail_supplierMasked_name: "Проверенный поставщик",
  offerDetail_supplierMasked_hint: "Идентичность поставщика раскрывается после одобрения вашего профиля покупателя.",
  offerDetail_supplierContactLocked: "Открыть контакты поставщика",
  offerDetail_supplierProfileLocked: "Открыть профиль поставщика",
  offerDetail_basisCountAvailable: "Доступно базисов поставки: {n}",
  offerDetail_indicativePrice: "Ориентировочный диапазон",
};

// ─── SPANISH ─────────────────────────────────────────────────────

const es: TranslationKeys = {
  nav_liveOffers: "Catálogo",
  nav_categories: "Categorías",
  nav_howItWorks: "Cómo funciona",
  nav_faq: "FAQ",
  nav_signIn: "Iniciar sesión",
  nav_registerFree: "Registro gratis",

  hero_title1: "Proveedores verificados. Precios transparentes.",
  hero_title2: "Control total de sus compras.",
  hero_subtitle: "Compare ofertas, revise documentos del proveedor y solicite acceso a precios en un solo espacio de trabajo. Sin comisiones por operación.",
  hero_searchPlaceholder: "Buscar productos: filete de salmón, camarón vannamei, lomo de bacalao...",
  hero_searchBtn: "Buscar",
  hero_popular: "Popular: Salmón Atlántico · Camarón Vannamei · Lomo de Bacalao · Cangrejo Rey",
  hero_registerFree: "Crear cuenta de comprador",
  hero_registerHint: "necesaria para ver precios exactos y contactos del proveedor. Gratis, sin tarjeta.",
  hero_exploreLiveOffers: "Ver ofertas",
  hero_liveOffers: "ofertas activas",
  hero_verifiedSuppliers: "proveedores verificados",
  hero_countries: "países",
  hero_activeBuyers: "compradores activos",

  offers_liveMarketplace: "Mercado en vivo",
  offers_title: "Ofertas mayoristas reales que el comprador puede comparar hoy.",
  offers_subtitle: "Listados reales con origen, formato, rango de precio y MOQ. Abre cualquier ficha para revisar documentos y solicitar acceso al proveedor.",
  offers_viewAll: "Ver todas las ofertas",
  offers_viewAllMobile: "Ver todas las ofertas",
  offers_showMore: "Mostrar más ofertas",
  offers_showLess: "Mostrar menos",
  offers_listLabel: "Ofertas mayoristas en vivo de proveedores verificados",
  offers_cardLabel: "{product} de {origin}, {price} por kg. Ver oferta.",
  offers_priceUnit_perKg: "por kg",
  offers_qtyUnit_kg: "kg",
  offers_moqLabel: "Pedido mínimo",
  priceUnit_tooltip: "Precio por kilogramo de peso neto, sin glaseado ni embalaje. El total final depende de los incoterms y del tramo de volumen elegido.",

  card_verified: "Verificado",
  card_viewOffer: "Ver oferta",
  card_perKg: "por kg",
  card_frozen: "Congelado",
  card_fresh: "Fresco",
  card_chilled: "Refrigerado",
  card_updatedAgo: "Actualizado hace {time}",
  card_listedToday: "Publicado hoy",
  cert_issuer: "Emisor",
  cert_officialWebsite: "Sitio web oficial",

  trust_liveOffers: "Ofertas activas",
  trust_verifiedSuppliers: "Proveedores verificados",
  trust_countries: "Países",
  trust_activeBuyers: "Compradores activos",
  trust_liveOffersDetail: "actualizadas diariamente de fuentes verificadas",
  trust_verifiedSuppliersDetail: "cada uno pasó verificación de 3 pasos",
  trust_countriesDetail: "desde Noruega hasta Vietnam",
  trust_activeBuyersDetail: "comprando ahora mismo",
  trust_unlikeOthers: "A diferencia de otras plataformas:",
  trust_zeroCommission: "0% comisión — sus márgenes son suyos",
  trust_directContacts: "Contactos directos — siempre abiertos, sin restricciones",
  trust_verificationEarned: "Verificación ganada, no comprada",

  value_title: "Diseñado para ambos lados del comercio",
  value_subtitle: "Ya sea que compre o venda mariscos, YORSO le da las herramientas para comerciar con confianza.",
  value_forBuyers: "Para compradores",
  value_forSuppliers: "Para proveedores",
  value_buyerHeadline: "Compre con confianza, no a ciegas",
  value_supplierHeadline: "Venda directamente, sin impuestos de intermediarios",
  value_registerBuyer: "Registrarse como comprador",
  value_registerSupplier: "Registrarse como proveedor",
  value_buyerBenefits: [
    { title: "Reducir riesgo de suministro", desc: "Precalifique proveedores de respaldo. Compare alternativas verificadas de 48 países." },
    { title: "Visibilidad de precios", desc: "Vea precios reales de múltiples orígenes. Negocie con datos, no con suposiciones." },
    { title: "Solo proveedores verificados", desc: "Cada proveedor pasa revisión documental, inspección y verificación de referencias." },
    { title: "Decisiones más rápidas", desc: "Busque, compare y contacte proveedores en horas — no en semanas." },
  ],
  value_supplierBenefits: [
    { title: "Cero comisión", desc: "Conserve el 100% de sus márgenes. Sin tarifas ocultas. Relaciones directas." },
    { title: "Demanda calificada", desc: "Conéctese con profesionales verificados que buscan sus productos." },
    { title: "Visibilidad todo el año", desc: "Sus ofertas están activas 24/7 para compradores de 48+ países." },
    { title: "Confianza por verificación", desc: "Muestre certificaciones y trayectoria. Los compradores contactan primero a verificados." },
  ],

  cat_title: "Comprar por especie",
  cat_subtitle: "Especies comerciales reales y ofertas mayoristas reales — reconozca el producto a primera vista.",
  cat_offers: "ofertas",
  cat_names: { Salmon: "Salmón", Shrimp: "Camarón", Whitefish: "Pescado blanco", Tuna: "Atún", Crab: "Cangrejo", "Squid & Octopus": "Calamar y pulpo", Shellfish: "Mariscos", Surimi: "Surimi" },
  species_names: {
    atlanticSalmon: "Salmón atlántico",
    cod: "Bacalao del Atlántico",
    haddock: "Eglefino",
    hake: "Merluza europea",
    seaBass: "Lubina",
    seaBream: "Dorada",
    yellowfinTuna: "Atún de aleta amarilla",
    mackerel: "Caballa atlántica",
  },
  species_descriptors: {
    atlanticSalmon: "Acuicultura · Noruega, Feroe",
    cod: "Captura salvaje · Atlántico",
    haddock: "Captura salvaje · Mar del Norte",
    hake: "Captura salvaje · Ibérico",
    seaBass: "Acuicultura · Mediterráneo",
    seaBream: "Acuicultura · Mediterráneo",
    yellowfinTuna: "Lomos · Calidad sashimi",
    mackerel: "Captura salvaje · Pelágico",
  },

  verify_title: "Cómo se verifican los proveedores",
  verify_subtitle: "Nuestra verificación se gana, no se compra. Esto es lo que revisamos — y en qué se diferencia.",
  verify_steps: [
    { title: "Revisión de solicitud", desc: "Los proveedores presentan registro, licencias y certificaciones (HACCP, BRC, MSC). No se acepta autocertificación.", unlike: "A diferencia del \"Gold Supplier\" de Alibaba que se compra por $5K/año." },
    { title: "Diligencia debida", desc: "Verificamos registro, referencias comerciales y capacidades de producción.", unlike: "A diferencia de directorios sin verificación." },
    { title: "Insignia de verificación", desc: "Los aprobados obtienen insignia visible. Se revalida anualmente — puede ser revocada.", unlike: "A diferencia de insignias de pago que nunca caducan." },
  ],
  verify_failTitle: "¿Qué pasa si un proveedor no cumple?",
  verify_failDesc: "Las insignias pueden ser suspendidas o revocadas. Si hay quejas, falla la reverificación o incumple reglas, se elimina y se notifica a compradores.",
  verify_ctaHint: "Regístrese para ver perfiles completos, certificaciones y estado de verificación.",
  verify_ctaBtn: "Desbloquear datos de proveedores",

  activity_live: "En vivo",
  activity_title: "Actividad del mercado",
  activity_subtitle: "Actualizaciones en tiempo real — nuevos listados, cambios de precio y actividad.",
  activity_footer: "Se actualiza automáticamente · Última actividad de todas las categorías",
  activity_feed: [
    { text: "Nuevo: Filete de abadejo congelado de Rusia", time: "3 min" },
    { text: "Proveedor verificado: Thai Union Seafood (Tailandia)", time: "12 min" },
    { text: "Precio actualizado: Caballa atlántica HG — Noruega", time: "18 min" },
    { text: "Nuevo: Camarón tigre negro HLSO de Bangladesh", time: "25 min" },
    { text: "Nuevo proveedor: Hokkaido Fisheries (Japón)", time: "34 min" },
    { text: "Precio actualizado: Camarón vannamei PD — India", time: "41 min" },
    { text: "Nuevo: Filete de merluza congelado de Chile", time: "52 min" },
    { text: "Proveedor verificado: Austral Fisheries (Australia)", time: "1h" },
  ],

  social_title: "De escépticos a usuarios habituales",
  social_subtitle: "Historias reales de profesionales que se quemaron antes — y encontraron algo mejor.",
  social_testimonials: [
    { quote: "Después de perder $40K en Alibaba, juré no usar más marketplaces. YORSO fue diferente — verifiqué la fábrica antes de ordenar y nunca ocultaron el teléfono del proveedor.", name: "Marcus Hendriksen", role: "Director de Compras", company: "Nordic Fish Import AB", country: "Suecia", painTag: "Sobreviviente de fraude" },
    { quote: "Mi CFO preguntó por qué pagamos 12% más por camarón. Ahora llego con datos de YORSO y negocio con fuerza. Ahorramos $180K el último trimestre.", name: "Sofia Chen", role: "Gerente de Cadena de Suministro", company: "Pacific Seafood Trading", country: "Singapur", painTag: "Ceguera de precios → ahorro" },
    { quote: "Cuando nuestro proveedor chileno tuvo fuerza mayor, necesitábamos 20 toneladas en 48 horas. En YORSO encontramos tres alternativas verificadas en una noche.", name: "Jean-Pierre Moreau", role: "Gerente de Importación", company: "Marée Fraîche SARL", country: "Francia", painTag: "Compras de emergencia" },
  ],

  faq_title: "Preguntas frecuentes",
  faq_subtitle: "Preguntas comunes de compradores que evalúan YORSO.",
  faq_items: [
    { question: "¿Cuál es la trampa? ¿Cobrarán comisión después?", answer: "Sin trampas. YORSO cobra 0% de comisión — hoy y siempre. Monetizamos con herramientas premium opcionales, nunca de su margen. Cumplimos con GDPR." },
    { question: "Ya tengo proveedores de confianza. ¿Para qué necesito una plataforma?", answer: "Sus proveedores no van a ninguna parte. YORSO le da ventaja: compare precios de 48 países y negocie desde una posición de conocimiento." },
    { question: "¿Cómo sé que los proveedores son reales?", answer: "Cada proveedor pasa revisión de licencias, documentación, certificaciones (HACCP, BRC, MSC) y referencias. Hemos rechazado miles de solicitudes." },
    { question: "Estamos en temporada alta — no tenemos tiempo.", answer: "El registro toma 5 minutos. Sin capacitación ni integraciones. Tiempo promedio hasta el primer contacto: menos de 1 hora." },
    { question: "El software no puede oler el pescado.", answer: "De acuerdo. YORSO no reemplaza su control de calidad. Reemplaza semanas de correos y ferias. Usted decide. Nosotros aceleramos 10x." },
    { question: "¿Mis competidores verán lo que compro?", answer: "Nunca. Su actividad es 100% privada. Los proveedores ven su perfil solo cuando usted los contacta." },
    { question: "¿Cómo maneja la seguridad YORSO?", answer: "Cumplimiento GDPR, datos en la UE, comunicaciones cifradas, auditorías regulares, verificación de regulaciones de exportación y sanciones." },
  ],

  cta_title1: "Comience a comprar con",
  cta_title2: "confianza",
  cta_subtitle: "Únase a miles de profesionales que abastecen mariscos con proveedores verificados, precios transparentes y contactos directos — sin comisiones.",
  cta_registerFree: "Registro gratis",
  cta_freeNote: "Gratis para compradores · Sin tarjeta · Configuración en 5 minutos",
  cta_verifiedSuppliers: "380 proveedores verificados",
  cta_zeroCommission: "0% comisión",
  cta_directContacts: "Contactos directos siempre",

  footer_desc: "El marketplace B2B global de mariscos. Conectando compradores con proveedores verificados en 48 países.",
  footer_worldwide: "Disponible en todo el mundo · EN, ES, RU",
  footer_copyright: `© ${new Date().getFullYear()} YORSO B.V. Todos los derechos reservados.`,
  footer_registered: "Registrada en los Países Bajos · KVK 12345678",
  footer_platform: "Plataforma",
  footer_company: "Empresa",
  footer_legal: "Legal",
  footer_links: {
    platform: [
      { label: "Ofertas activas", href: "/#offers" },
      { label: "Categorías", href: "/#categories" },
      { label: "Proveedores verificados", href: "/how-it-works" },
      { label: "Cómo funciona", href: "/how-it-works" },
      { label: "FAQ", href: "/#faq" },
    ],
    company: [
      { label: "Sobre YORSO", href: "/about" },
      { label: "Contáctenos", href: "/contact" },
      { label: "Carreras", href: "/careers" },
      { label: "Prensa", href: "/press" },
      { label: "Programa de socios", href: "/partners" },
    ],
    legal: [
      { label: "Términos de servicio", href: "/terms" },
      { label: "Política de privacidad", href: "/privacy" },
      { label: "Política de cookies", href: "/cookies" },
      { label: "Cumplimiento GDPR", href: "/gdpr" },
      { label: "Política antifraude", href: "/anti-fraud" },
    ],
  },

  // Registration
  reg_joinYorso: "Únase a YORSO",
  reg_chooseSubtitle: "Elija cómo usará la plataforma. Toma menos de 3 minutos.",
  reg_imBuyer: "Soy comprador",
  reg_imSupplier: "Soy proveedor",
  reg_buyerSubtitle: "Compre mariscos de proveedores verificados",
  reg_supplierSubtitle: "Llegue a compradores calificados en todo el mundo",
  reg_buyerFeatures: ["Acceso a 2,000+ ofertas verificadas", "Compare precios de 48 países", "Contacto directo — sin comisión"],
  reg_supplierFeatures: ["Visibilidad todo el año para sus productos", "Contacto directo con compradores verificados", "Cero comisión en todas las operaciones"],
  reg_enterEmail: "Ingrese su email de negocios",
  reg_emailSubtitle: "Enviaremos un código de verificación para confirmar su identidad.",
  reg_emailPlaceholder: "you@company.com",
  reg_emailInvalid: "Por favor ingrese un email de negocios válido",
  reg_continue: "Continuar",
  reg_checking: "Verificando…",
  reg_couldNotContinue: "No se pudo continuar",
  reg_couldNotSave: "No se pudo guardar",
  signin_signInFailed: "Error al iniciar sesión",
  signin_couldNotSendLink: "No se pudo enviar el enlace",
  cert_viewDetails: "Ver detalles de la certificación {cert}",
  aria_toggleMenu: "Abrir menú",
  aria_goBack: "Atrás",
  aria_breadcrumb: "Ruta de navegación",
  aria_catalogResults: "Resultados del catálogo",
  aria_imgPrev: "Imagen anterior",
  aria_imgNext: "Imagen siguiente",
  aria_close: "Cerrar",
  aria_removeFilter: "Quitar filtro",
  reg_phone_placeholder: "Número de teléfono",
  reg_step_role: "Rol",
  reg_step_email: "Email",
  reg_step_verify: "Verificar",
  reg_step_details: "Datos",
  reg_step_profile: "Perfil",
  reg_step_markets: "Mercados",
  reg_step_done: "Listo",
  country_searchPlaceholder: "País o código",
  country_noResults: "No se encontraron resultados",
  signin_emailPlaceholder: "nombre@empresa.com",
  reg_fullNamePlaceholder: "Juan Pérez",
  reg_companyPlaceholder: "Mariscos del Mar S.L.",
  reg_byContAgreeTo: "Al continuar, acepta nuestros",
  reg_terms: "Términos",
  reg_and: "y",
  reg_privacyPolicy: "Política de privacidad",
  reg_checkInbox: "Revise su bandeja",
  reg_codeSentTo: "Enviamos un código de 6 dígitos a",
  reg_enterFullCode: "Por favor ingrese el código completo de 6 dígitos",
  reg_verifyAndContinue: "Verificar y continuar",
  reg_verifying: "Verificando…",
  reg_verificationFailed: "Verificación fallida",
  reg_didntReceive: "¿No recibió el código? Reenviar",
  reg_codeResent: "Código reenviado",
  reg_codeResentDesc: "Revise su bandeja de entrada.",
  reg_tellAboutYourself: "Cuéntenos sobre usted",
  reg_detailsSubtitleBuyer: "Usamos sus datos para configurar su perfil de comprador y mejorar la confianza entre participantes.",
  reg_detailsSubtitleSupplier: "Usamos sus datos para configurar su perfil de proveedor y mejorar la confianza entre participantes.",
  reg_fullName: "Nombre completo",
  reg_companyName: "Nombre de la empresa",
  reg_country: "País",
  reg_autoDetected: "(detectado automáticamente)",
  reg_selectCountry: "Seleccione país...",
  reg_vatTin: "NIF / VAT",
  reg_vatPlaceholder: "ej. ES12345678A",
  reg_vatDescBuyer: "Necesario para facturación B2B y documentación comercial.",
  reg_vatDescSupplier: "Necesario para verificación del proveedor y credibilidad.",
  reg_phoneNumber: "Número de teléfono",
  reg_phoneDesc: "Usado para comunicación comercial y prevención de registros falsos.",
  reg_sendCode: "Enviar código de verificación",
  reg_codeSentEnter: "Código enviado. Ingréselo abajo:",
  reg_smsCode: "Código SMS",
  reg_verify: "Verificar",
  reg_invalidCodeRetry: "Código inválido. Intente de nuevo.",
  reg_resendCode: "Reenviar código",
  reg_verified: "Verificado",
  reg_or: "o",
  reg_verifyViaWhatsApp: "Verificar por WhatsApp",
  reg_whatsAppCodeDesc: "Enviaremos un código de verificación a este número por WhatsApp",
  reg_codeSentToast: "Código enviado",
  reg_codeSentToastDesc: "Se ha enviado un SMS con el código de verificación",
  reg_phoneVerifiedWhatsApp: "Teléfono verificado por WhatsApp",
  reg_phoneVerifiedWhatsAppDesc: "Su número ha sido verificado exitosamente",
  reg_phoneVerified: "Teléfono verificado",
  reg_phoneVerifiedDesc: "Su número ha sido verificado exitosamente",
  reg_invalidCode: "Código inválido",
  reg_invalidCodeDesc: "Revise el código del SMS e intente de nuevo",
  reg_password: "Contraseña",
  reg_passwordPlaceholder: "Mínimo 8 caracteres",
  reg_saving: "Guardando…",
  reg_enterFullName: "Por favor ingrese su nombre completo",
  reg_enterCompanyName: "Por favor ingrese el nombre de la empresa",
  reg_minChars: "Mínimo 8 caracteres",
  reg_selectCountryErr: "Por favor seleccione un país",
  reg_enterValidVat: "Por favor ingrese un NIF/VAT válido",
  reg_enterPhoneNumber: "Por favor ingrese su número de teléfono",
  reg_verifyPhoneNumber: "Por favor verifique su número de teléfono",
  reg_enterValidPhone: "Por favor ingrese un número válido",
  reg_enterCodeFromSms: "Por favor ingrese el código del SMS",
  reg_whatDoYouSource: "¿Qué compra?",
  reg_whatDoYouOffer: "¿Qué ofrece?",
  reg_onboardingSubtitleBuyer: "Seleccione categorías de interés. Le mostraremos ofertas relevantes.",
  reg_onboardingSubtitleSupplier: "Cuéntenos sobre su negocio para que los compradores lo encuentren.",
  reg_productCategories: "Categorías de producto",
  reg_businessType: "Tipo de negocio",
  reg_selectAllApply: "(seleccione todas las que apliquen)",
  reg_certifications: "Certificaciones",
  reg_monthlyVolumeBuyer: "Volumen mensual de compra",
  reg_monthlyVolumeSupplier: "Capacidad de producción mensual",
  reg_skipForNow: "Omitir por ahora — lo configuro después",
  reg_whereSourceFrom: "¿De dónde compra?",
  reg_whereExportTo: "¿A dónde exporta?",
  reg_countriesSubtitleBuyer: "Seleccione países de origen. Priorizaremos ofertas coincidentes.",
  reg_countriesSubtitleSupplier: "Seleccione sus mercados objetivo. Compradores de estos países verán sus ofertas primero.",
  reg_showAllCountries: "Mostrar los {count} países →",
  reg_countriesSelected: "países seleccionados",
  reg_countrySelected: "país seleccionado",
  reg_completeSetup: "Completar configuración",
  reg_welcome: "¡Bienvenido, {name}!",
  reg_profileComplete: "La configuración de su perfil de {role}{company} está completa.",
  reg_yourProfile: "Su perfil",
  reg_buyer: "Comprador",
  reg_supplier: "Proveedor",
  reg_category: "categoría",
  reg_categories: "categorías",
  reg_market: "mercado",
  reg_markets: "mercados",
  reg_certification: "certificación",
  reg_certificationsLabel: "certificaciones",
  reg_matchingOffers: "ofertas coincidentes",
  reg_whatsNext: "Qué sigue para usted",
  reg_exploreOffers: "Explorar ofertas",
  reg_buyerAutoRedirect: "Sesión iniciada como comprador. Abrimos el catálogo en {seconds} s…",
  reg_createFirstOffer: "Crear su primera oferta",
  reg_alreadyHaveAccount: "¿Ya tiene cuenta?",
  reg_signIn: "Iniciar sesión",
  reg_help: "Ayuda",

  // Sign In
  signin_title: "Iniciar sesión en YORSO",
  signin_subtitle: "Use el email o teléfono con el que se registró.",
  signin_email: "Email",
  signin_phone: "Teléfono",
  signin_emailLabel: "Email",
  signin_passwordLabel: "Contraseña",
  signin_forgotPassword: "¿Olvidó su contraseña?",
  signin_passwordPlaceholder: "Ingrese su contraseña",
  signin_signInBtn: "Iniciar sesión",
  signin_phoneLabel: "Número de teléfono",
  signin_or: "o",
  signin_viaWhatsApp: "Iniciar sesión vía WhatsApp",
  signin_getCodeWhatsApp: "Obtener código por WhatsApp",
  signin_noAccount: "¿No tiene cuenta?",
  signin_register: "Registrarse",
  signin_back: "Atrás",
  signin_resetPassword: "Restablecer contraseña",
  signin_resetSubtitle: "Ingrese el email con el que se registró. Enviaremos un enlace para restablecer su contraseña.",
  signin_resetDemoHint: "Modo demo: el restablecimiento de contraseña solo funciona para la cuenta de prueba dm@yorso.com.",
  signin_sendResetLink: "Enviar enlace",
  signin_emailSent: "Email enviado",
  signin_checkEmailInstructions: "y siga las instrucciones del email.",
  signin_backToSignIn: "Volver a iniciar sesión",
  signin_fillAll: "Por favor complete todos los campos",
  signin_enterPhonePassword: "Ingrese su teléfono y contraseña",
  signin_enterValidPhone: "Ingrese un número de teléfono válido",
  signin_signedIn: "Sesión iniciada",
  signin_welcomeBack: "¡Bienvenido de vuelta!",
  signin_codeSentWhatsApp: "Código enviado por WhatsApp",
  signin_checkWhatsApp: "Revise sus mensajes de WhatsApp",
  signin_enterEmail: "Por favor ingrese su email",
  signin_emailSentToast: "Email enviado",
  signin_emailSentToastDesc: "Revise su bandeja para instrucciones de restablecimiento",

  // Offers page
  offersPage_title: "Todas las ofertas mayoristas",
  offersPage_subtitle: "Explore {count}+ ofertas activas de proveedores verificados.",
  offersPage_searchPlaceholder: "Buscar productos...",
  offersPage_backToHome: "Volver al inicio",
  offersPage_showingAll: "Mostrando todas las ofertas. Regístrese para ver detalles completos y precios.",
  offersPage_registerToSee: "Regístrese para ver detalles completos.",

  // Offer Detail
  offerDetail_notFound: "Oferta no encontrada",
  offerDetail_browseAll: "Ver todas las ofertas",
  offerDetail_home: "Inicio",
  offerDetail_offers: "Ofertas",
  offerDetail_registerToContact: "Regístrese para contactar al proveedor",
  offerDetail_freeRegistration: "Registro gratuito · Acceso directo · Sin comisión",
  offerDetail_backToCatalog: "Volver al panel de compras",
  offerDetail_backToCatalogShort: "Volver al panel",

  // 404 / Not Found
  notFound_title: "404",
  notFound_subtitle: "No encontramos esa página",
  notFound_returnHome: "Volver al inicio",
  notFound_attemptedPath: "Intentaste abrir",
  notFound_suggestionsHeading: "Prueba una de estas opciones",
  notFound_suggestion_offers_title: "Explorar el catálogo",
  notFound_suggestion_offers_desc: "Ofertas activas de mariscos de proveedores verificados.",
  notFound_suggestion_register_title: "Crear cuenta de comprador",
  notFound_suggestion_register_desc: "Desbloquea precios, nombres de proveedores y solicitudes.",
  notFound_suggestion_signin_title: "Iniciar sesión",
  notFound_suggestion_signin_desc: "¿Ya tienes cuenta? Accede a tu panel.",
  notFound_suggestion_home_title: "Ir al inicio",
  notFound_suggestion_home_desc: "Empieza desde la página principal de YORSO.",
  notFound_referrerLabel: "Procedente de",
  notFound_referrerDirect: "directo o desconocido",
  notFound_reportHint: "Si llegaste aquí desde un enlace de YORSO, repórtalo — la ruta de arriba queda registrada para depuración.",

  // Document metadata
  meta_siteTitle: "YORSO — Mercado B2B de mariscos",
  meta_siteDescription: "Mariscos al por mayor de proveedores verificados en todo el mundo.",

  // TrustMicroText
  trustMicro_users: "12,000+ profesionales de mariscos en YORSO",
  trustMicro_security: "Sus datos se manejan según nuestra Política de privacidad",
  trustMicro_verified: "2,400+ proveedores verificados por documentos y referencias",
  trustMicro_global: "Operaciones en 48 países — sin comisión",
  trustMicro_growth: "300+ nuevos miembros esta semana",
  trustMicro_privacy: "Seguimos prácticas estándar de privacidad · Alineados con GDPR",

  // SocialProofBanner
  socialBanner_professionals: "12,000+ profesionales de mariscos a bordo",
  socialBanner_suppliers: "2,400+ proveedores verificados en 48 países",
  socialBanner_zeroCom: "Sin comisión — operaciones directas, siempre",
  socialBanner_trustedBy: "Confianza de 12,000+ profesionales",
  socialBanner_detail: "2,400+ proveedores verificados · 48 países · Sin comisión",

  // Buyer Workspace
  workspace_brand: "Panel del comprador",
  workspace_signOut: "Cerrar sesión",
  workspace_greeting: "Bienvenido de nuevo, {name}",
  workspace_tab_dashboard: "Resumen",
  workspace_tab_saved: "Ofertas guardadas",
  workspace_tab_priceRequests: "Solicitudes de precio",
  workspace_tab_messages: "Mensajes",

  workspace_dashboard_title: "Tu espacio de compras",
  workspace_dashboard_subtitle: "Sigue ofertas guardadas, solicitudes de precio y conversaciones con proveedores en un solo lugar.",
  workspace_kpi_saved: "Ofertas guardadas",
  workspace_kpi_priceRequests: "Solicitudes pendientes",
  workspace_kpi_unread: "Mensajes sin leer",
  workspace_kpi_suppliers: "Proveedores activos",
  workspace_recentActivity: "Actividad reciente",
  workspace_quickActions: "Acciones rápidas",
  workspace_action_browseOffers: "Ver mercado",
  workspace_action_viewSaved: "Ver guardadas",
  workspace_action_openMessages: "Abrir mensajes",

  workspace_saved_title: "Ofertas guardadas",
  workspace_saved_subtitle: "Ofertas marcadas para revisar o comparar.",
  workspace_saved_empty: "Aún no tienes ofertas guardadas.",
  workspace_saved_open: "Abrir oferta",
  workspace_saved_remove: "Quitar",
  workspace_saved_savedAt: "Guardado el {date}",

  workspace_priceReq_title: "Solicitudes de precio",
  workspace_priceReq_subtitle: "Sigue tus solicitudes de acceso a precio enviadas a proveedores.",
  workspace_priceReq_empty: "Aún no has solicitado acceso a precio.",
  workspace_priceReq_status_pending: "Pendiente",
  workspace_priceReq_status_approved: "Aprobada",
  workspace_priceReq_status_rejected: "Rechazada",
  workspace_priceReq_requestedAt: "Enviada el {date}",
  workspace_priceReq_respondedAt: "Respondida el {date}",
  workspace_priceReq_open: "Abrir oferta",

  workspace_msg_title: "Mensajes",
  workspace_msg_subtitle: "Conversaciones con proveedores verificados.",
  workspace_msg_empty: "Aún no tienes conversaciones.",
  workspace_msg_unread: "{count} sin leer",
  workspace_msg_open: "Abrir conversación",

  workspace_activity_offer_view: "Vista de oferta",
  workspace_activity_price_request: "Solicitud de precio para",
  workspace_activity_message: "Nueva respuesta de",

  info_backToHome: "Volver al inicio",
  info_lastUpdated: "Última actualización",
  info_updated_january2026: "Enero de 2026",
  info_footer_rights: "Todos los derechos reservados",

  info_about_title: "Acerca de YORSO",
  info_about_intro: "YORSO es el marketplace global B2B de productos del mar, con sede en Ámsterdam, Países Bajos. Conectamos a compradores profesionales con proveedores verificados en 48 países — con precios transparentes, contactos directos y cero comisiones.",
  info_about_mission: "Nuestra Misión",
  info_about_missionBody: "Hacer que el comercio internacional de productos del mar sea transparente, eficiente y confiable. Creemos que cada comprador merece acceso a proveedores verificados, precios reales y contactos directos — sin pagar comisiones de intermediarios ni depender de métodos de compra obsoletos.",
  info_about_whatWeDo: "Qué Hacemos",
  info_about_whatWeDoBody: "YORSO ofrece un marketplace curado donde los proveedores de productos del mar son verificados mediante un riguroso proceso multifásico. Los compradores pueden buscar, comparar y contactar proveedores directamente — con total transparencia en precios, certificaciones y credenciales de la empresa.",
  info_about_keyFacts: "Datos Clave",
  info_about_facts: [
    "380+ proveedores verificados de 48 países",
    "2.100+ compradores profesionales activos",
    "0% de comisión en todas las transacciones",
    "Cumplimiento del GDPR, infraestructura en la UE",
    "Plataforma multilingüe (EN, RU, ES)",
  ],

  info_contact_title: "Contáctanos",
  info_contact_intro: "Nos encantaría saber de ti. Tanto si eres un comprador buscando soporte de aprovisionamiento, un proveedor interesado en unirse, o un socio explorando una colaboración — escríbenos y responderemos en un día hábil.",
  info_contact_general: "Consultas Generales",
  info_contact_buyer: "Soporte para Compradores",
  info_contact_supplier: "Alta de Proveedores",
  info_contact_office: "Oficina",
  info_contact_emailLabel: "Email",
  info_contact_officeAddress: "YORSO B.V., Ámsterdam, Países Bajos",
  info_contact_kvk: "KVK: 12345678",

  info_cookies_title: "Política de Cookies",
  info_cookies_intro: "YORSO utiliza cookies y tecnologías similares para proporcionar, proteger y mejorar la experiencia en la plataforma.",
  info_cookies_essential: "Cookies Esenciales",
  info_cookies_essentialBody: "Necesarias para el funcionamiento de la plataforma. Incluyen gestión de sesiones, tokens de autenticación y preferencias de idioma. No se pueden desactivar.",
  info_cookies_analytics: "Cookies de Analítica",
  info_cookies_analyticsBody: "Nos ayudan a entender cómo los usuarios interactúan con YORSO. Usamos estos datos para mejorar funciones y experiencia. Los datos son anónimos y nunca se venden.",
  info_cookies_managing: "Gestión de Cookies",
  info_cookies_managingBody: "Puedes controlar las cookies a través de la configuración de tu navegador. Desactivar las cookies esenciales puede afectar el funcionamiento de la plataforma.",
  info_cookies_contact: "Contacto",
  info_cookies_contactBody1: "¿Preguntas sobre nuestras prácticas con cookies? Contacta ",
  info_cookies_contactBody2: ".",

  info_gdpr_title: "Cumplimiento del GDPR",
  info_gdpr_intro: "YORSO B.V. está plenamente comprometida con el cumplimiento del Reglamento General de Protección de Datos (UE) 2016/679.",
  info_gdpr_commitment: "Nuestro Compromiso",
  info_gdpr_commitmentList: [
    "Minimización de datos: solo recopilamos lo necesario para prestar nuestros servicios",
    "Limitación de finalidad: los datos se usan solo para los fines declarados",
    "Limitación de almacenamiento: los datos se conservan solo el tiempo necesario",
    "Infraestructura en la UE: todos los datos se almacenan dentro de la Unión Europea",
    "Cifrado: todos los datos se cifran en tránsito y en reposo",
    "Auditorías regulares: evaluaciones de seguridad independientes anuales",
  ],
  info_gdpr_rights: "Tus Derechos Bajo el GDPR",
  info_gdpr_rightsList: [
    { term: "Derecho de Acceso", desc: "solicitar una copia de tus datos personales" },
    { term: "Derecho de Rectificación", desc: "corregir datos inexactos" },
    { term: "Derecho de Supresión", desc: "solicitar la eliminación de tus datos" },
    { term: "Derecho de Portabilidad", desc: "recibir tus datos en un formato estructurado" },
    { term: "Derecho de Oposición", desc: "oponerte al tratamiento de tus datos" },
    { term: "Derecho de Limitación", desc: "limitar cómo procesamos tus datos" },
  ],
  info_gdpr_dpo: "Delegado de Protección de Datos",
  info_gdpr_dpoBody: "Contacto: ",
  info_gdpr_authority: "Autoridad de Control",
  info_gdpr_authorityBody: "Tienes derecho a presentar una reclamación ante la Autoridad Holandesa de Protección de Datos (Autoriteit Persoonsgegevens).",

  info_antifraud_title: "Política Antifraude",
  info_antifraud_intro: "YORSO se toma en serio la prevención del fraude. Nuestra plataforma está diseñada para proteger tanto a compradores como a proveedores de actividades fraudulentas.",
  info_antifraud_supplierVerification: "Verificación de Proveedores",
  info_antifraud_supplierVerificationBody: "Cada proveedor pasa por una verificación multifásica antes de recibir el distintivo de verificado. Esto incluye verificación de registro mercantil, licencias de exportación, certificaciones de instalaciones (HACCP, BRC, MSC) y validación de referencias comerciales.",
  info_antifraud_ongoingMonitoring: "Monitoreo Continuo",
  info_antifraud_ongoingMonitoringBody: "Los proveedores verificados son reevaluados anualmente. Los distintivos pueden suspenderse o revocarse por reclamaciones de calidad, fallos en la reverificación o violaciones de las reglas de la plataforma.",
  info_antifraud_reportingConcerns: "Reportar Inquietudes",
  info_antifraud_reportingConcernsBody1: "Si sospechas actividad fraudulenta en la plataforma, contáctanos de inmediato en ",
  info_antifraud_reportingConcernsBody2: ". Todos los reportes se investigan en 48 horas.",
  info_antifraud_sanctions: "Revisión de Sanciones",
  info_antifraud_sanctionsBody: "YORSO realiza una revisión de sanciones comerciales como parte del proceso de verificación de proveedores, en cumplimiento de las regulaciones comerciales de la UE e internacionales.",

  info_careers_title: "Carreras en YORSO",
  info_careers_intro: "Estamos construyendo el futuro del comercio B2B de productos del mar. YORSO es un equipo en crecimiento con sede en Ámsterdam, trabajando para hacer el aprovisionamiento internacional transparente, eficiente y confiable.",
  info_careers_why: "¿Por qué YORSO?",
  info_careers_whyList: [
    "Impacto significativo: transformando una industria de más de $150B",
    "Equipo internacional con profunda experiencia sectorial",
    "Cultura remote-friendly con sede en Ámsterdam",
    "Compensación competitiva y participación en equity",
  ],
  info_careers_openPositions: "Vacantes Abiertas",
  info_careers_openPositionsBody1: "Siempre buscamos personas talentosas en producto, ingeniería, ventas y operaciones. Envía tu CV y una breve presentación a ",
  info_careers_openPositionsBody2: ".",

  info_press_title: "Prensa y Medios",
  info_press_intro: "Para consultas de prensa, solicitudes de entrevistas o materiales de prensa, contacta a nuestro equipo de comunicaciones.",
  info_press_contact: "Contacto de Prensa",
  info_press_emailLabel: "Email",
  info_press_about: "Acerca de YORSO",
  info_press_aboutBody: "YORSO es un marketplace B2B de productos del mar que conecta a compradores profesionales con más de 380 proveedores verificados en 48 países. Con sede en Ámsterdam, la plataforma ofrece precios transparentes, contactos directos con proveedores y cero comisiones — atendiendo a más de 2.100 compradores activos en todo el mundo.",
  info_press_brand: "Recursos de Marca",
  info_press_brandBody1: "Archivos de logo, guías de marca y capturas del producto disponibles bajo solicitud. Contacta ",
  info_press_brandBody2: ".",

  info_partners_title: "Programa de Socios",
  info_partners_intro: "YORSO se asocia con organizaciones del sector, asociaciones comerciales, proveedores logísticos y empresas tecnológicas para fortalecer la cadena global de suministro de productos del mar.",
  info_partners_types: "Tipos de Asociación",
  info_partners_typesList: [
    { term: "Asociaciones Comerciales", desc: "co-promoción, beneficios para miembros, intercambio de datos sectoriales" },
    { term: "Socios Logísticos", desc: "soluciones integradas de envío y cadena de frío" },
    { term: "Socios Tecnológicos", desc: "integraciones API, soluciones de trazabilidad" },
    { term: "Organismos Certificadores", desc: "verificación simplificada para proveedores certificados" },
  ],
  info_partners_contact: "Ponte en Contacto",
  info_partners_contactBody1: "¿Interesado en asociarte con YORSO? Contacta ",
  info_partners_contactBody2: ".",

  info_terms_title: "Términos de Servicio",
  info_terms_intro: "Estos Términos de Servicio (\"Términos\") rigen tu acceso y uso de la plataforma YORSO operada por YORSO B.V., una sociedad registrada en los Países Bajos (KVK 12345678).",
  info_terms_h1: "Aceptación de los Términos",
  info_terms_p1: "Al acceder o usar YORSO, aceptas quedar vinculado por estos Términos. Si no estás de acuerdo, no puedes usar la plataforma.",
  info_terms_h2: "Descripción de la Plataforma",
  info_terms_p2: "YORSO es un marketplace B2B que conecta a compradores de productos del mar con proveedores verificados. La plataforma facilita el descubrimiento, la comparación y la comunicación directa entre las partes. YORSO no toma propiedad de las mercancías, no gestiona pagos entre compradores y proveedores, ni garantiza los resultados de las transacciones.",
  info_terms_h3: "Cuentas de Usuario",
  info_terms_p3: "Debes proporcionar información precisa y completa al registrarte. Eres responsable de mantener la confidencialidad de tus credenciales y de todas las actividades realizadas con tu cuenta.",
  info_terms_h4: "Política de Comisiones",
  info_terms_p4: "YORSO cobra 0% de comisión en las operaciones entre compradores y proveedores. Los ingresos provienen de servicios premium opcionales para proveedores.",
  info_terms_h5: "Verificación de Proveedores",
  info_terms_p5: "YORSO realiza la debida diligencia sobre los proveedores que solicitan el estado verificado. La verificación no constituye una garantía sobre el desempeño del proveedor, la calidad del producto o el resultado de las transacciones.",
  info_terms_h6: "Limitación de Responsabilidad",
  info_terms_p6: "YORSO no es responsable de disputas entre compradores y proveedores, problemas de calidad de productos, retrasos de envío o pérdidas financieras derivadas de transacciones organizadas a través de la plataforma.",
  info_terms_h7: "Ley Aplicable",
  info_terms_p7: "Estos Términos se rigen por las leyes de los Países Bajos. Cualquier disputa será sometida a los tribunales competentes de Ámsterdam.",

  info_privacy_title: "Política de Privacidad",
  info_privacy_intro: "YORSO B.V. (\"YORSO\", \"nosotros\") respeta tu privacidad y se compromete a proteger tus datos personales conforme al Reglamento General de Protección de Datos (GDPR) y la legislación holandesa aplicable.",
  info_privacy_dataCollect: "Datos Que Recopilamos",
  info_privacy_dataCollectList: [
    "Información de cuenta: nombre, email, nombre de la empresa, rol",
    "Datos de uso: páginas visitadas, funciones utilizadas, búsquedas",
    "Datos de comunicación: mensajes enviados a través de la plataforma",
    "Datos técnicos: dirección IP, tipo de navegador, información del dispositivo",
  ],
  info_privacy_use: "Cómo Usamos tus Datos",
  info_privacy_useBody: "Usamos tus datos para prestar y mejorar nuestros servicios, facilitar conexiones comprador-proveedor, garantizar la seguridad de la plataforma y comunicar actualizaciones relevantes. No vendemos tus datos a terceros.",
  info_privacy_storage: "Almacenamiento y Seguridad",
  info_privacy_storageBody: "Todos los datos se almacenan en infraestructura ubicada en la UE. Usamos cifrado en tránsito (TLS) y en reposo. Se realizan auditorías de seguridad regulares para mantener la integridad de los datos.",
  info_privacy_rights: "Tus Derechos",
  info_privacy_rightsBody1: "Bajo el GDPR, tienes derecho a acceder, rectificar, eliminar o exportar tus datos personales. Contacta ",
  info_privacy_rightsBody2: " para ejercer tus derechos.",
  info_privacy_contact: "Contacto",
  info_privacy_contactBody: "Delegado de Protección de Datos: ",

  // Catalog
  catalog_pageTitle: "Catálogo de mariscos",
  catalog_breadcrumbHome: "Inicio",
  catalog_breadcrumbCatalog: "Catálogo",
  catalog_marketStatus_live: "Mercado activo",
  catalog_freshOffers_24h: "{count} ofertas nuevas en 24h",
  catalog_resultCount: "{count} ofertas activas",
  catalog_quickRequest_title: "¿No ves exactamente lo que necesitas?",
  catalog_quickRequest_subtitle: "Publica una solicitud estructurada y los proveedores verificados responderán directamente.",
  catalog_quickRequest_cta: "Enviar una solicitud",
  catalog_filters_title: "Filtros de aprovisionamiento",
  catalog_filters_clearAll: "Limpiar todo",
  catalog_filters_search: "Buscar",
  catalog_filters_searchPlaceholder: "Especie, nombre latino, proveedor, origen…",
  catalog_filters_species: "Especie / categoría",
  catalog_filters_origin: "País de origen",
  catalog_filters_supplierCountry: "País del proveedor",
  catalog_filters_supplier: "Proveedor",
  catalog_filters_logisticsBasis: "Base logística",
  catalog_filters_currency: "Moneda",
  catalog_filters_certification: "Certificación",
  catalog_filters_paymentTerms: "Condiciones de pago",
  catalog_filters_state: "Estado del producto",
  catalog_filters_cutType: "Tipo de corte",
  catalog_filters_latinName: "Nombre latino",
  catalog_filters_advanced: "Filtros avanzados",
  catalog_filters_any: "Cualquiera",
  catalog_filters_all: "Todos",
  catalog_filters_state_frozen: "Congelado",
  catalog_filters_state_fresh: "Fresco",
  catalog_filters_state_chilled: "Refrigerado",
  catalog_results_none: "Ninguna oferta coincide con los filtros actuales.",
  catalog_results_resetFilters: "Restablecer filtros",

  catalog_access_anon_title: "Estás navegando como invitado",
  catalog_access_anon_body: "Puedes explorar ofertas, filtros y señales de mercado. Los precios exactos y los contactos directos de proveedores están protegidos para evitar el scraping de baja intención y proteger los datos del proveedor.",
  catalog_access_anon_cta: "Regístrate para acceder a precios exactos",
  catalog_access_reg_title: "Has iniciado sesión — el acceso completo requiere calificación",
  catalog_access_reg_body: "Puedes guardar ofertas, comparar proveedores, solicitar acceso al precio y seguir proveedores. Los precios exactos y los contactos directos se desbloquean tras calificar la cuenta.",
  catalog_access_reg_cta: "Solicitar calificación",
  catalog_access_qual_title: "Acceso completo de aprovisionamiento",
  catalog_access_qual_body: "Tienes precios exactos, contactos de proveedores y la capa completa de inteligencia. Úsala para decisiones de compra reales.",
  catalog_access_granted_toast_title: "Acceso a precios concedido",
  catalog_access_granted_toast_body: "El proveedor {company} ha aprobado tu solicitud. Los precios exactos y contactos ya están disponibles.",
  catalog_access_granted_toast_body_fallback: "El proveedor ha aprobado tu solicitud. Los precios exactos y contactos ya están disponibles.",
  catalog_access_devSwitcher_label: "Nivel de acceso demo",
  catalog_access_devSwitcher_anon: "Anónimo",
  catalog_access_devSwitcher_reg: "Registrado",
  catalog_access_devSwitcher_qual: "Calificado",
  catalog_access_devSwitcher_note: "Control demo, no es parte de la autorización real",

  catalog_value_cap_prices: "Desbloquear precios exactos",
  catalog_value_cap_suppliers: "Acceder a datos del proveedor",
  catalog_value_cap_intelligence: "Señales de precio y noticias por país",
  catalog_value_ctaSignup: "Crear cuenta de comprador",
  catalog_value_ctaQualify: "Solicitar acceso completo",
  catalog_trust_title: "Confianza",
  catalog_trust_subtitle: "Cómo YORSO protege cada paso de la compra",
  catalog_trust_verification_label: "Verificación de proveedores",
  catalog_trust_verification_hint: "Documentos, auditoría y referencias revisados antes de publicar",
  catalog_trust_activity_label: "Actividad del mercado",
  catalog_trust_activity_hint: "Alertas en tiempo real sobre precios y eventos de oferta",
  catalog_trust_access_label: "Acceso controlado",
  catalog_trust_access_hint: "Precios y nombres de proveedor se desbloquean tras revisión",
  catalog_trust_signals_label: "Inteligencia de compras",
  catalog_trust_signals_hint: "Noticias de origen y señales de precio por oferta",
  catalog_trust_documents_label: "Preparación documental",
  catalog_trust_documents_hint: "Certificados, origen y trazabilidad marcados por oferta",
  catalog_trust_recovery_label: "Soporte al comprador",
  catalog_trust_recovery_hint: "Ayuda cuando ninguna oferta cumple tu especificación",
  catalog_access_request_title: "Solicitar acceso completo de compras",
  catalog_access_request_subtitle: "Cuéntanos qué necesitas evaluar. Nuestro equipo de verificación revisa las solicitudes antes de conceder acceso completo a proveedores y precios.",
  catalog_access_request_scope_label: "¿A qué necesitas acceso?",
  catalog_access_request_scope_prices: "Precios exactos y tramos por volumen",
  catalog_access_request_scope_suppliers: "Identidad y contactos completos del proveedor",
  catalog_access_request_scope_intelligence: "Señales de precios y noticias por país",
  catalog_access_request_note_label: "Contexto breve (opcional)",
  catalog_access_request_note_placeholder: "Empresa, foco de compras, mercados objetivo, volumen esperado…",
  catalog_access_request_submit: "Enviar solicitud de acceso",
  catalog_access_request_cancel: "Cancelar",
  catalog_access_request_pending_title: "Solicitud de acceso enviada",
  catalog_access_request_pending_body: "Los proveedores verificados y nuestro equipo de revisión responderán tras la revisión. Recibirás una notificación cuando se conceda el acceso.",
  catalog_access_request_toast: "Solicitud de acceso enviada para revisión.",
  catalog_access_request_pending_scopes: "Solicitado:",
  catalog_access_request_cancel_pending: "Cancelar solicitud",
  catalog_access_request_canceled_toast: "Solicitud de acceso cancelada.",
  catalog_access_request_success_title: "Solicitud enviada al proveedor 🎉",
  catalog_access_request_success_body: "El proveedor se pondrá en contacto contigo en un plazo de 24 horas.",
  catalog_access_request_success_cta: "Volver al producto",
  catalog_reqForm_submitted_title: "Tus solicitudes enviadas",
  catalog_reqForm_submitted_subtitle: "Revisa tus últimas solicitudes de abastecimiento mientras los proveedores responden.",
  catalog_reqForm_submitted_at: "Enviado",
  catalog_reqForm_title: "¿No encontraste el producto exacto?",
  catalog_reqForm_subtitle: "Envía una solicitud de compra estructurada — los proveedores verificados pueden responder tras la revisión.",
  catalog_reqForm_product: "Producto / especie",
  catalog_reqForm_productPh: "p. ej. Salmón del Atlántico",
  catalog_reqForm_latin: "Nombre latino",
  catalog_reqForm_latinPh: "p. ej. Salmo salar",
  catalog_reqForm_format: "Formato / corte",
  catalog_reqForm_formatPh: "p. ej. HOG, filete, porciones",
  catalog_reqForm_origin: "Origen preferido",
  catalog_reqForm_originPh: "p. ej. Noruega, Chile",
  catalog_reqForm_supplierCountry: "País del proveedor",
  catalog_reqForm_supplierCountryPh: "Cualquier país verificado",
  catalog_reqForm_volume: "Volumen requerido",
  catalog_reqForm_volumePh: "p. ej. 20 t / mes",
  catalog_reqForm_destination: "Mercado de entrega",
  catalog_reqForm_destinationPh: "p. ej. UE, EAU, Singapur",
  catalog_reqForm_timing: "Plazo objetivo",
  catalog_reqForm_timingPh: "p. ej. Q2 2026, lo antes posible",
  catalog_reqForm_notes: "Notas adicionales",
  catalog_reqForm_notesPh: "Especificaciones, certificaciones, embalaje, condiciones de pago…",
  catalog_reqForm_photo: "Foto del producto",
  catalog_reqForm_photoHint: "Arrastra una foto aquí o haz clic para seleccionar un archivo. Hasta 5 MB.",
  catalog_reqForm_photoAdd: "Suelta la foto aquí o haz clic para subir",
  catalog_reqForm_photoRemove: "Eliminar foto",
  catalog_reqForm_photoTooLarge: "La imagen es demasiado grande. Máx. 5 MB.",
  catalog_reqForm_submit: "Enviar solicitud",
  catalog_reqForm_optional: "Opcional",
  catalog_reqForm_success_title: "Tu solicitud ha sido registrada",
  catalog_reqForm_success_body: "Los proveedores verificados pueden responder tras la revisión. Te notificaremos cuando lleguen ofertas que coincidan.",
  catalog_reqForm_success_new: "Enviar otra solicitud",

  catalog_card_priceRange: "Rango de precio",
  catalog_card_priceLocked: "Precio exacto bloqueado",
  catalog_card_priceLockedHint: "Regístrate para ver el precio exacto",
  catalog_card_supplierStub: "Proveedor verificado",
  catalog_card_supplierLocked: "Identidad del proveedor bloqueada",
  catalog_card_supplierPartial: "Perfil parcial del proveedor",
  catalog_card_volumeBreaks: "Descuentos por volumen",
  catalog_card_paymentTerms: "Pago",
  catalog_card_logistics: "Logística",
  catalog_card_interest: "Interés activo",
  catalog_card_action_signupForPrice: "Regístrate para precio exacto",
  catalog_card_action_requestSupplier: "Regístrate para ver al proveedor",
  catalog_card_action_sendRequest: "Enviar solicitud",
  catalog_card_action_save: "Guardar",
  catalog_card_action_compare: "Comparar",
  catalog_card_action_watch: "Seguir",
  catalog_card_action_followSupplier: "Seguir al proveedor",
  catalog_card_action_notifyPrice: "Notificar cambios de precio",
  catalog_card_action_contactSupplier: "Contactar al proveedor",
  catalog_card_action_addToCart: "Añadir a carrito de compras",
  catalog_card_action_view: "Ver oferta",

  catalog_intel_title: "Inteligencia de aprovisionamiento",
  catalog_intel_lockedTitle: "Vista previa de inteligencia",
  catalog_intel_lockedBody: "Regístrate para ver señales de mercado. La inteligencia completa está disponible tras la calificación.",
  catalog_intel_partialTitle: "Inteligencia limitada",
  catalog_intel_partialBody: "Ves titulares y dirección del precio. Las estadísticas completas y el análisis por país se desbloquean tras la calificación.",
  catalog_intel_priceTrend_title: "Tendencia de precio",
  catalog_intel_priceTrend_index: "Índice de precio",
  catalog_intel_priceTrend_d7: "7 días",
  catalog_intel_priceTrend_d30: "30 días",
  catalog_intel_priceTrend_d90: "90 días",
  catalog_intel_priceTrend_volatility: "Volatilidad",
  catalog_intel_priceTrend_vol_low: "Baja",
  catalog_intel_priceTrend_vol_medium: "Media",
  catalog_intel_priceTrend_vol_high: "Alta",
  catalog_intel_news_title: "Noticias de países que afectan a esta categoría",
  catalog_intel_news_more: "Fuente",
  catalog_intel_impact_title: "Países que afectan al precio",
  catalog_intel_impact_role_supplier_country: "País del proveedor",
  catalog_intel_impact_role_origin_country: "País de origen",
  catalog_intel_impact_role_export_port: "Hub de exportación",
  catalog_intel_impact_role_competing_producer: "Productor competidor",
  catalog_intel_impact_role_demand_driver: "Impulsor de demanda",
  catalog_intel_impact_share: "Impacto en el precio",
  catalog_intel_signals_title: "Señales de mercado",
  catalog_intel_signal_supply: "Oferta",
  catalog_intel_signal_demand: "Demanda",
  catalog_intel_signal_logistics: "Logística",
  catalog_intel_signal_regulation: "Regulación",
  catalog_intel_signal_severity_info: "Info",
  catalog_intel_signal_severity_watch: "Atención",
  catalog_intel_signal_severity_alert: "Alerta",
  catalog_intel_signal_severity_info_tooltip: "Info — solo contexto, no requiere acción.",
  catalog_intel_signal_severity_watch_tooltip: "Atención — tendencia emergente que puede afectar el precio o el suministro. Considera seguirla.",
  catalog_intel_signal_severity_alert_tooltip: "Alerta — evento relevante que probablemente afecta a esta oferta. Revísalo ahora.",
  catalog_intel_signal_drawer_context: "Contexto",
  catalog_intel_signal_drawer_meaning: "Qué significa para esta oferta",
  catalog_intel_signal_drawer_actions: "Acciones de compra sugeridas",
  catalog_intel_signal_drawer_published: "Publicado",
  catalog_intel_signal_drawer_close: "Cerrar",
  catalog_intel_signal_drawer_openHint: "Toca para ver el contexto completo",
  catalog_intel_signal_topLabel: "Señal principal",
  catalog_intel_signal_showAll: "Ver todas las señales",
  catalog_intel_signal_showLess: "Mostrar menos",
  catalog_intel_signal_watch_action_follow: "Seguir",
  catalog_intel_signal_watch_action_unfollow: "Dejar de seguir",
  catalog_intel_signal_watch_aria_follow: "Seguir esta señal — recibirás actualizaciones en tus alertas",
  catalog_intel_signal_watch_aria_unfollow: "Dejar de seguir esta señal",
  catalog_intel_signal_watch_following: "Siguiendo — las actualizaciones aparecerán en tus alertas",
  alerts_bell_aria: "Abrir alertas",
  alerts_panel_title: "Tus alertas",
  alerts_panel_subtitle: "Actualizaciones de las señales que sigues",
  alerts_panel_empty_title: "Aún no hay alertas",
  alerts_panel_empty_body: "Sigue una señal de mercado para recibir aquí actualizaciones relevantes para compras.",
  alerts_panel_markAllRead: "Marcar todo como leído",
  alerts_panel_viewSignal: "Ver señal",
  alerts_panel_unreadBadge: "Nuevo",

  catalog_relatedReq_title: "Solicitudes de compradores relacionadas",
  catalog_relatedReq_subtitle: "Solicitudes abiertas de compradores verificados — relevantes para esta categoría.",
  catalog_relatedReq_volume: "Volumen",
  catalog_relatedReq_buyer: "Comprador",
  catalog_relatedReq_respond: "Responder",

  catalog_recovery_title: "Desbloquea precios y nombres de proveedores",
  catalog_recovery_body: "Abre una cuenta de comprador para ver precios exactos, contactar con proveedores verificados, guardar ofertas y comparar acuerdos. Menos de un minuto · sin tarjeta.",
  catalog_recovery_signup: "Abrir cuenta de comprador",
  catalog_recovery_signin: "Iniciar sesión para continuar",

  catalog_row_signal_news: "noticias",
  catalog_row_signal_docsReady: "Documentos listos",
  catalog_row_signal_docsPending: "Documentos pendientes",

  catalog_panel_aria: "Inteligencia de la oferta seleccionada",
  catalog_panel_dock_aria: "Analítica de la oferta seleccionada",
  catalog_panel_dock_show: "Mostrar analítica",
  catalog_panel_dock_hide: "Ocultar analítica",
  catalog_panel_neutral_title: "Selecciona una oferta para ver la inteligencia de compra",
  catalog_panel_neutral_body: "Elige cualquier oferta a la izquierda para seguir el movimiento de precios, noticias por país, preparación documental y confianza del proveedor de ese producto.",
  catalog_panel_summary_title: "Oferta seleccionada",
  catalog_panel_summary_origin: "Origen",
  catalog_panel_summary_supplier: "País del proveedor",
  catalog_panel_summary_basis: "Logística",
  catalog_panel_news_title: "Noticias de países que afectan a esta oferta",
  catalog_panel_news_subtitle: "Priorizado para {origin} (origen) y {supplier} (proveedor).",
  catalog_panel_news_primary: "Directo",
  catalog_panel_docs_title: "Preparación documental",
  catalog_panel_docs_disclaimer: "Vista previa basada en datos del proveedor — confirma con el proveedor antes del contrato.",
  catalog_panel_doc_health: "Certificado sanitario",
  catalog_panel_doc_haccp: "HACCP",
  catalog_panel_doc_catch: "Certificado de captura / IUU",
  catalog_panel_doc_cert: "Cert. sostenibilidad",
  catalog_panel_doc_packing: "Lista de empaque / factura",
  catalog_panel_doc_traceability: "Datos de trazabilidad",
  catalog_panel_supplier_title: "Confianza del proveedor",
  catalog_panel_supplier_verification: "Verificación",
  catalog_panel_supplier_verified: "Verificado",
  catalog_panel_supplier_unverified: "Pendiente",
  catalog_panel_supplier_response: "Tiempo de respuesta",
  catalog_panel_supplier_since: "En activo desde",

  catalog_time_today: "hoy",
  catalog_time_dayAgo: "hace {n} día",
  catalog_time_daysAgo: "hace {n} días",
  catalog_time_weekAgo: "hace {n} semana",
  catalog_time_weeksAgo: "hace {n} semanas",

  catalog_news_reason_price: "Afecta al precio",
  catalog_news_reason_availability: "Afecta a la disponibilidad",
  catalog_news_reason_logistics: "Afecta a la logística",
  catalog_news_reason_compliance: "Afecta al cumplimiento",
  catalog_news_reason_supplier_risk: "Afecta al riesgo del proveedor",

  catalog_compare_addLabel: "Añadir a comparar",
  catalog_compare_removeLabel: "Quitar de comparar",
  catalog_row_supplierLocked_anon: "Datos del proveedor disponibles tras el acceso al precio",
  catalog_row_supplierLocked_reg: "Solicita acceso al precio para ver al proveedor",
  catalog_row_priceCta_anon: "Crear cuenta de comprador",
  catalog_row_priceCta_reg: "Solicitar acceso al precio",
  catalog_row_priceCta_reg_sent: "Solicitud enviada",
  catalog_row_priceAccess_anon: "Precio exacto disponible tras crear cuenta de comprador",
  catalog_row_priceAccess_reg: "Solicita acceso al precio exacto",
  catalog_row_priceSupplierLocked_anon: "Precio y proveedor — tras registrarse",
  catalog_row_priceSupplierLocked_reg: "Precio y proveedor — bajo solicitud de acceso",
  catalog_row_basisLabel: "Base de entrega",
  catalog_row_basisAltSuffix: "más",
  catalog_row_paymentLabel: "Pago",
  catalog_row_volumePricingLabel: "Precios por volumen",
  catalog_panel_compare_add: "Añadir a comparar",
  catalog_panel_compare_remove: "Quitar",
  catalog_row_viewDetails: "Ver detalles de la oferta",
  catalog_compare_trayTitle: "Comparar ofertas",
  catalog_compare_trayHint: "Selecciona 2–5 ofertas para compararlas lado a lado.",
  catalog_compare_open: "Abrir comparación",
  catalog_compare_clear: "Vaciar",
  catalog_compare_max: "Máximo 5 ofertas seleccionadas",
  catalog_compare_emptyHint: "Aún no hay ofertas seleccionadas",
  catalog_compare_dialogTitle: "Comparación lado a lado",
  catalog_compare_col_offer: "Oferta",
  catalog_compare_col_price: "Precio",
  catalog_compare_col_origin: "Origen",
  catalog_compare_col_supplierCountry: "País del proveedor",
  catalog_compare_col_basis: "Base logística",
  catalog_compare_col_moq: "MOQ",
  catalog_compare_col_certifications: "Certificaciones",

  catalog_filtersBar_title: "Filtros de aprovisionamiento",
  catalog_filtersBar_collapse: "Ocultar filtros",
  catalog_filtersBar_expand: "Mostrar filtros",
  catalog_filterPill_close: "Cerrar",
  catalog_filterPill_clear: "Limpiar",
  catalog_filterPill_apply: "Aplicar",
  catalog_filterPill_searchPlaceholder: "Buscar…",

  offerDetail_accessLocked_title: "Regístrate para ver datos del proveedor y precio",
  offerDetail_accessLocked_body: "El registro gratuito desbloquea precio orientativo, vista previa del proveedor y solicitud de contacto directo.",
  offerDetail_accessLimited_title: "Solicita acceso para ver el detalle completo",
  offerDetail_accessLimited_body: "Tu cuenta ve el resumen y el precio orientativo. Solicita acceso para ver el precio exacto, los contactos del proveedor y los términos comerciales completos.",
  offerDetail_requestAccessCta: "Solicitar acceso",
  offerDetail_priceLocked_label: "Precio disponible tras registrarte",
  offerDetail_priceLocked_anonCta: "Regístrate para ver precios exactos",
  offerDetail_priceLocked_regCta: "Solicitar acceso al precio",
  offerDetail_termsLocked_label: "Condiciones comerciales",
  offerDetail_termsLocked_hint: "MOQ, condiciones de pago, plazo de entrega y puerto de embarque se desbloquean con el acceso.",
  offerDetail_volumeLocked_label: "Los precios por volumen estarán disponibles tras conceder el acceso.",
  offerDetail_supplierMasked_name: "Proveedor verificado",
  offerDetail_supplierMasked_hint: "La identidad del proveedor se revela tras aprobar tu perfil de comprador.",
  offerDetail_supplierContactLocked: "Desbloquear contacto del proveedor",
  offerDetail_supplierProfileLocked: "Desbloquear perfil del proveedor",
  offerDetail_basisCountAvailable: "Bases de entrega disponibles: {n}",
  offerDetail_indicativePrice: "Rango orientativo",
};

export const translations: Record<Language, TranslationKeys> = { en, ru, es };

/**
 * Loose-typed dictionary for procurement-intelligence content (news headlines,
 * country impact reasons, market signals, price-trend explanations). The keys
 * mirror ids/category names from `mockIntelligence.ts`. Components call
 * `getIntelText(lang, key, fallbackEn)` and gracefully fall back to the EN
 * source string when the localized version is not provided.
 *
 * Backend-readiness: when real intelligence is server-side, drop this map and
 * have the API return localized content directly.
 */
export const intelI18n: Record<Language, Record<string, string>> = {
  en: {},
  ru: {
    // News
    intel_news_n1_headline: "Норвежский экспорт лосося вырос на 6% по объёму, но маржа сжимается из-за налога на ренту",
    intel_news_n1_summary: "Стоимость экспорта выросла год к году; производители сигналят более жёсткие спот-офферы Q2.",
    intel_news_n2_headline: "Чилийский урожай лосося ускоряется перед спросом на Великий пост в США",
    intel_news_n2_summary: "Высокий темп вылова смягчит цены для покупателей Северной Америки через 4–6 недель.",
    intel_news_n3_headline: "Урожай эквадорских прудов креветки сильный на фоне снижения энергозатрат",
    intel_news_n3_summary: "Снижение себестоимости выливается в стабильную FOB-цену во II квартале.",
    intel_news_n4_headline: "Индийские экспортёры креветки ждут итогов антидемпингового пересмотра USDOC",
    intel_news_n4_summary: "Ожидание решения сдерживает контракты в США; поставки в ЕС и MEA идут нормально.",
    intel_news_n5_headline: "Россия пересматривает квоты на треску и пикшу 2025 года в сторону снижения",
    intel_news_n5_summary: "Сокращение квоты продолжает поддерживать высокие цены на белую рыбу до III квартала.",
    intel_news_n6_headline: "Аукционные цены на свежую треску в Исландии стабильны по мере выбора зимней квоты",
    intel_news_n6_summary: "Стабильные результаты аукционов делают европейские офферы по свежей треске предсказуемыми.",
    intel_news_n7_headline: "Квота на королевского краба в Охотском море ужесточается на 2025 год",
    intel_news_n7_summary: "Жёсткие квоты толкают спот-цены вверх, особенно на азиатских направлениях.",
    intel_news_n8_headline: "Уловы жёлтого тунца на Филиппинах растут на фоне улучшения погодного окна",
    intel_news_n8_summary: "Лучшая погода увеличивает доступность уловов на удочки до апреля.",
    intel_news_n9_headline: "Сезон аргентинского кальмара illex заканчивается, экспортёры приоритизируют контракты ЕС",
    intel_news_n9_summary: "Конец сезона направляет остатки давним европейским покупателям.",
    intel_news_n10_headline: "Марокко сохраняет периоды моратория на осьминога, поставки остаются ограниченными",
    intel_news_n10_summary: "Закрытия по соображениям сохранения поддерживают высокие иберийские цены.",
    // Trend explanations
    intel_trend_Salmon_explanation: "Норвежские объёмы экспорта сжимаются из-за биологических ограничений роста; чилийские поставки компенсируют долгосрочно, но с лагом 2–3 недели.",
    intel_trend_Shrimp_explanation: "Пик урожайного цикла Эквадора давит на цену ваннамей; запасы Индии и Вьетнама стабильны.",
    intel_trend_Whitefish_explanation: "Снижение квот на треску в Баренцевом море 2025 года продолжает толкать цены трески и пикши вверх.",
    intel_trend_Tuna_explanation: "Уловы в Западной Пацифике стабильны; премиум за сашими-грейд сужается после окончания сезона в Японии.",
    intel_trend_Crab_explanation: "Сокращение квот в Охотском море и сложности с санкциями ужесточают доступность королевского краба.",
    "intel_trend_Squid & Octopus_explanation": "Сезон аргентинского illex заканчивается; квота на марокканского осьминога недавно пересмотрена, замедляя иберийские поставки.",
    // Market signals
    intel_signal_s1_text: "Норвегия: вес уловов ниже 5-летнего среднего на 11-й неделе",
    intel_signal_s2_text: "ЕС-ритейл усиливает промо к пасхальному окну",
    intel_signal_s3_text: "Авиафрахт Осло–США: ёмкость в норме",
    intel_signal_s4_text: "Эквадор: пруды стабильны; крупные размеры хорошо обеспечены",
    intel_signal_s5_text: "Антидемпинговый пересмотр USDOC по индийской креветке ожидается",
    intel_signal_s6_text: "Квота на баренцевоморскую треску снова снижена; рекомендуется план замещения",
    intel_signal_s7_text: "Авиафрахт Исландия–ЕС надёжен до апреля",
    intel_signal_s8_text: "Уловы Западной Пацифики улучшаются с погодой",
    intel_signal_s9_text: "Спрос Японии после сезона смягчается",
    intel_signal_s10_text: "Сокращение квоты на Дальнем Востоке РФ: обеспечивайте форвард заблаговременно",
    intel_signal_s11_text: "Сложность санкций сохраняется для отдельных направлений",
    intel_signal_s12_text: "Сезон illex закрывается; ожидайте форвардных дефицитов",
    intel_signal_s13_text: "Опубликованы даты марокканского моратория на следующий квартал",
    // Impact reasons (Salmon)
    intel_impact_Salmon_NO_reason: "Крупнейший производитель фермерского атлантического лосося; задаёт спот-бенчмарк.",
    intel_impact_Salmon_CL_reason: "Основная альтернативная поставка для североамериканских покупателей.",
    intel_impact_Salmon_FO_reason: "Меньший объём, но премиум-бенчмарк качества.",
    intel_impact_Salmon_US_reason: "Крупнейший импортный рынок; колебания спроса двигают мировой FOB.",
    intel_impact_Salmon_FR_reason: "Крупнейший европейский ритейл-спрос; сезон копчёного лосося подтягивает объёмы.",
    // Shrimp
    intel_impact_Shrimp_EC_reason: "Крупнейший экспортёр ваннамей; цикл вылова задаёт мировой бенчмарк.",
    intel_impact_Shrimp_IN_reason: "Крупный поставщик HOSO и PD; торговые меры США двигают цены.",
    intel_impact_Shrimp_VN_reason: "Хаб переработки добавленной стоимости; абсорбирует сырьё соседей.",
    intel_impact_Shrimp_CN_reason: "Переработка и спрос вместе; крупнейший swing-байер.",
    intel_impact_Shrimp_US_reason: "Тарифы и антидемпинговые пересмотры напрямую влияют на landed-цену.",
    // Whitefish
    intel_impact_Whitefish_RU_reason: "Крупнейший держатель квоты на треску и минтай в Северной Пацифике и Баренцевом море.",
    intel_impact_Whitefish_NO_reason: "Соуправляет квотой на баренцевоморскую треску; норвежские аукционы задают эталон ЕС.",
    intel_impact_Whitefish_IS_reason: "Премиум-бенчмарк свежей трески; аукционные цены отслеживаются плотно.",
    intel_impact_Whitefish_CN_reason: "Крупный переработчик российской и тихоокеанской трески для глобальной перепродажи.",
    intel_impact_Whitefish_GB_reason: "Высокий структурный спрос на треску и пикшу для fish-and-chips.",
    // Tuna
    intel_impact_Tuna_PH_reason: "Крупный флот по жёлтому тунцу: сашими-фокус.",
    intel_impact_Tuna_ID_reason: "Ключевой поставщик для рынков ЕС и Японии.",
    intel_impact_Tuna_VN_reason: "Сильные мощности по переработке филе для ЕС.",
    intel_impact_Tuna_JP_reason: "Премиум-спрос на сашими задаёт эталон высоких сортов.",
    intel_impact_Tuna_ES_reason: "Крупнейший переработчик и конечный покупатель тунца в ЕС.",
    // Crab
    intel_impact_Crab_RU_reason: "Доминирующий поставщик красного королевского краба; сокращения квоты напрямую двигают цену.",
    intel_impact_Crab_US_reason: "Аляскинский королевский краб; малый объём, но премиум-эталон цены.",
    intel_impact_Crab_KR_reason: "Крупнейший импортный рынок живого и замороженного королевского краба.",
    intel_impact_Crab_CN_reason: "Праздничные циклы спроса вызывают резкие краткосрочные движения цены.",
    // Squid & Octopus
    "intel_impact_Squid & Octopus_AR_reason": "Сезон Illex argentinus задаёт мировой бенчмарк по кальмару.",
    "intel_impact_Squid & Octopus_MA_reason": "Квота и мораторий на обыкновенного осьминога напрямую задают landed-цену.",
    "intel_impact_Squid & Octopus_MR_reason": "Альтернативный источник осьминога во время марокканских закрытий.",
    "intel_impact_Squid & Octopus_ES_reason": "Крупнейший потребитель цефалопод в ЕС.",
    "intel_impact_Squid & Octopus_JP_reason": "Стабильный премиум-спрос на сорт для суши.",
  },
  es: {
    intel_news_n1_headline: "Las exportaciones noruegas de salmón suben un 6% en volumen pero los márgenes se ajustan por el impuesto a la renta",
    intel_news_n1_summary: "Valor de exportación al alza interanual; los productores anticipan ofertas spot Q2 más ajustadas.",
    intel_news_n2_headline: "La cosecha chilena de salmón se acelera ante la demanda de Cuaresma en EE. UU.",
    intel_news_n2_summary: "Mayor ritmo de cosecha suavizará precios para compradores norteamericanos en 4–6 semanas.",
    intel_news_n3_headline: "Los rendimientos del langostino ecuatoriano se mantienen sólidos al bajar costes energéticos",
    intel_news_n3_summary: "Menores costes se traducen en precios FOB estables durante el Q2.",
    intel_news_n4_headline: "Exportadores indios de langostino esperan resultado del antidumping del USDOC",
    intel_news_n4_summary: "La revisión pendiente mantiene cautelosos los contratos a EE. UU.; UE y MEA siguen normales.",
    intel_news_n5_headline: "Rusia revisa a la baja las cuotas de bacalao y eglefino 2025",
    intel_news_n5_summary: "El recorte sostiene precios firmes de pescado blanco hasta el Q3.",
    intel_news_n6_headline: "Precios de subasta de bacalao fresco en Islandia estables al cubrirse la cuota invernal",
    intel_news_n6_summary: "Resultados estables de subasta hacen previsibles las ofertas europeas de bacalao fresco.",
    intel_news_n7_headline: "La cuota de cangrejo rey en el Mar de Ojotsk se ajusta más para 2025",
    intel_news_n7_summary: "Cuotas más estrictas empujan precios spot al alza, especialmente para rutas asiáticas.",
    intel_news_n8_headline: "Desembarcos de atún aleta amarilla en Filipinas suben con mejor ventana climática",
    intel_news_n8_summary: "Mejor tiempo aumenta la disponibilidad de capturas con caña hasta abril.",
    intel_news_n9_headline: "La temporada del calamar Illex argentino se cierra, exportadores priorizan contratos UE",
    intel_news_n9_summary: "El inventario de fin de temporada se dirige a clientes europeos consolidados.",
    intel_news_n10_headline: "Marruecos mantiene los moratorios del pulpo, la oferta sigue ajustada",
    intel_news_n10_summary: "Los cierres por conservación sostienen precios ibéricos elevados.",
    intel_trend_Salmon_explanation: "Volúmenes de exportación noruegos se ajustan por límites biológicos; la oferta chilena compensa pero con 2–3 semanas de retraso.",
    intel_trend_Shrimp_explanation: "El pico del ciclo ecuatoriano presiona el vannamei a la baja; existencias de India y Vietnam se mantienen estables.",
    intel_trend_Whitefish_explanation: "Las cuotas más bajas de bacalao en el Mar de Barents 2025 siguen empujando precios al alza.",
    intel_trend_Tuna_explanation: "Las capturas en el Pacífico Occidental son estables; el premio sashimi se reduce al bajar la demanda japonesa.",
    intel_trend_Crab_explanation: "Recortes de cuota en Ojotsk y la complejidad de sanciones ajustan la oferta de cangrejo rey.",
    "intel_trend_Squid & Octopus_explanation": "Cierra la temporada del Illex argentino; la cuota marroquí del pulpo se ha revisado, frenando flujos ibéricos.",
    intel_signal_s1_text: "Noruega: pesos de cosecha por debajo del promedio quinquenal en la semana 11",
    intel_signal_s2_text: "Promociones del retail de la UE intensifican de cara a Pascua",
    intel_signal_s3_text: "Carga aérea Oslo–EE. UU.: capacidad normal",
    intel_signal_s4_text: "Ecuador: rendimientos estables; tallas grandes bien abastecidas",
    intel_signal_s5_text: "Pendiente revisión antidumping del USDOC al langostino indio",
    intel_signal_s6_text: "Cuota de bacalao en Barents recortada de nuevo; recomendados planes de sustitución",
    intel_signal_s7_text: "Carga aérea Islandia–UE fiable hasta abril",
    intel_signal_s8_text: "Mejoran los desembarcos en el Pacífico Occidental",
    intel_signal_s9_text: "Demanda de Japón post-temporada se modera",
    intel_signal_s10_text: "Recorte de cuota en el Lejano Oriente ruso: cubrir forward pronto",
    intel_signal_s11_text: "Persiste complejidad de sanciones para algunos destinos",
    intel_signal_s12_text: "Cierra temporada del Illex; esperar escasez forward",
    intel_signal_s13_text: "Publicadas fechas del moratorio marroquí para el próximo trimestre",
    intel_impact_Salmon_NO_reason: "Mayor productor de salmón atlántico de cultivo; fija el referente spot.",
    intel_impact_Salmon_CL_reason: "Principal oferta alternativa para compradores norteamericanos.",
    intel_impact_Salmon_FO_reason: "Volumen menor, pero referente de calidad premium.",
    intel_impact_Salmon_US_reason: "Mayor mercado importador; sus oscilaciones mueven el FOB global.",
    intel_impact_Salmon_FR_reason: "Mayor demanda retail europea; la temporada de salmón ahumado tira del volumen.",
    intel_impact_Shrimp_EC_reason: "Mayor exportador de vannamei; el ciclo de cosecha marca el referente global.",
    intel_impact_Shrimp_IN_reason: "Gran proveedor HOSO y PD; las acciones comerciales de EE. UU. mueven precios.",
    intel_impact_Shrimp_VN_reason: "Hub de procesado con valor añadido; absorbe materia prima de vecinos.",
    intel_impact_Shrimp_CN_reason: "Reprocesado y demanda final combinados; mayor comprador swing.",
    intel_impact_Shrimp_US_reason: "Aranceles y revisiones antidumping impactan el coste landed.",
    intel_impact_Whitefish_RU_reason: "Mayor titular de cuota de bacalao y abadejo en Pacífico Norte y Barents.",
    intel_impact_Whitefish_NO_reason: "Cogestor de la cuota Barents; las subastas noruegas marcan referente UE.",
    intel_impact_Whitefish_IS_reason: "Referente premium de bacalao fresco; subastas seguidas de cerca.",
    intel_impact_Whitefish_CN_reason: "Gran reprocesador de bacalao ruso y del Pacífico para reventa global.",
    intel_impact_Whitefish_GB_reason: "Alta demanda estructural de bacalao y eglefino para fish-and-chips.",
    intel_impact_Tuna_PH_reason: "Gran flota de aleta amarilla con caña y palangre; foco sashimi.",
    intel_impact_Tuna_ID_reason: "Proveedor clave para mercados UE y japonés.",
    intel_impact_Tuna_VN_reason: "Fuerte capacidad de procesado de lomos para la UE.",
    intel_impact_Tuna_JP_reason: "Demanda premium de sashimi marca el referente de gama alta.",
    intel_impact_Tuna_ES_reason: "Mayor procesador y comprador final de atún de la UE.",
    intel_impact_Crab_RU_reason: "Proveedor dominante de cangrejo rey rojo; los recortes mueven precio directamente.",
    intel_impact_Crab_US_reason: "Cangrejo rey de Alaska; volumen pequeño pero referente premium.",
    intel_impact_Crab_KR_reason: "Mayor mercado importador de cangrejo rey vivo y congelado.",
    intel_impact_Crab_CN_reason: "Ciclos festivos provocan movimientos cortos y bruscos de precio.",
    "intel_impact_Squid & Octopus_AR_reason": "La temporada del Illex argentinus marca el referente global del calamar.",
    "intel_impact_Squid & Octopus_MA_reason": "Cuota y moratorio del pulpo común marcan el precio landed.",
    "intel_impact_Squid & Octopus_MR_reason": "Origen alternativo del pulpo durante los cierres marroquíes.",
    "intel_impact_Squid & Octopus_ES_reason": "Mayor consumidor de cefalópodos de la UE.",
    "intel_impact_Squid & Octopus_JP_reason": "Demanda premium estable para producto sushi.",
  },
};

export const getIntelText = (lang: Language, key: string, fallback: string): string => {
  return intelI18n[lang]?.[key] ?? fallback;
};

/**
 * Format a relative-time integer (days) into a localized string.
 * Backend-readiness: when API returns ISO timestamps, convert to days client-side.
 */
export const formatDaysAgo = (lang: Language, days: number): string => {
  const t = translations[lang];
  if (days <= 0) return t.catalog_time_today;
  if (days < 7) {
    const tpl = days === 1 ? t.catalog_time_dayAgo : t.catalog_time_daysAgo;
    return tpl.replace("{n}", String(days));
  }
  const weeks = Math.round(days / 7);
  const tpl = weeks === 1 ? t.catalog_time_weekAgo : t.catalog_time_weeksAgo;
  return tpl.replace("{n}", String(weeks));
};
