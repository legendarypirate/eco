export const LOCALES = ['en', 'mn', 'cn', 'kr', 'jp'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'mn';

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  mn: 'Монгол',
  cn: '中文',
  kr: '한국어',
  jp: '日本語',
};

export const LOCALE_CODES: Record<Locale, string> = {
  en: 'EN',
  mn: 'MN',
  cn: 'CN',
  kr: 'KR',
  jp: 'JP',
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  en: '🇺🇸',
  mn: '🇲🇳',
  cn: '🇨🇳',
  kr: '🇰🇷',
  jp: '🇯🇵',
};

export const HTML_LANG: Record<Locale, string> = {
  en: 'en',
  mn: 'mn',
  cn: 'zh-CN',
  kr: 'ko',
  jp: 'ja',
};

export type TranslationKeys = {
  // Header & auth
  searchPlaceholder: string;
  googleAccount: string;
  myProfile: string;
  myOrders: string;
  paymentMethods: string;
  settings: string;
  logout: string;
  allCategories: string;
  category: string;
  loadingCategories: string;
  allProducts: string;
  close: string;
  all: string;
  login: string;
  welcome: string;
  googleLoginError: string;
  loginSuccess: string;
  loginError: string;
  googleLoggingIn: string;
  googleLogin: string;
  orEmailPhone: string;
  emailOrPhone: string;
  emailPlaceholder: string;
  password: string;
  forgotPassword: string;
  passwordPlaceholder: string;
  loggingIn: string;
  newUser: string;
  register: string;
  language: string;

  // Footer
  footerLoading: string;
  footerLinksTitle: string;
  footerContactTitle: string;
  footerPhoneLabel: string;
  footerEmailLabel: string;
  footerAddressLabel: string;
  footerDefaultDescription: string;
  footerLinkHome: string;
  footerLinkProducts: string;
  footerLinkCategories: string;
  footerLinkAbout: string;
  footerLinkHelp: string;
  footerPrivacyPolicy: string;
  footerTermsOfService: string;
  footerPaymentTerms: string;

  // Common
  loading: string;
  errorOccurred: string;
  tryAgainError: string;
  addToCart: string;
  addingToCart: string;
  outOfStock: string;
  inStock: string;
  productOutOfStock: string;
  alreadyInCart: string;
  addedToCart: string;
  productsCount: string;
  learnMore: string;
  delete: string;
  removeFromWishlist: string;
  addToWishlist: string;
  free: string;
  apply: string;
  payNow: string;

  // Home & sections
  homePageTitle: string;
  promoDefaultText: string;
  promoAltText: string;
  categoryBadge: string;
  categoryTitleLine1: string;
  categoryTitleLine2: string;
  categoryDescription: string;
  partnersTitle: string;
  featuredTitle: string;
  noFeaturedProducts: string;
  featuredNotAvailable: string;
  bestsellerPrefix: string;
  bestsellerSuffix: string;
  bestsellerBadge: string;
  noBestsellerProducts: string;
  bestsellerNotAvailable: string;

  // Cart & wishlist
  cartTitle: string;
  yourCart: string;
  cartLoading: string;
  wishlistTitle: string;
  emptyCart: string;
  emptyCartDesc: string;
  continueShopping: string;
  cartSummary: string;
  subtotal: string;
  shipping: string;
  discount: string;
  total: string;
  promoCode: string;
  promoLoginRequired: string;
  promoPlaceholder: string;
  promoApplyHint: string;
  promoLoginHint: string;
  saveCart: string;
  cartSaved: string;
  checkout: string;
  loginAndPay: string;
  emptyWishlist: string;
  emptyWishlistDesc: string;
  clearWishlist: string;
  clearWishlistConfirm: string;
  wishlistCleared: string;
  removedFromWishlist: string;
  addedToWishlist: string;
  addAllToCart: string;

  // Register
  registerTitle: string;
  registerPageTitle: string;
  fullName: string;
  fullNamePlaceholder: string;
  confirmPassword: string;
  confirmPasswordPlaceholder: string;
  registering: string;
  registerSubmit: string;
  haveAccount: string;
  loginHere: string;
};

export type Translations = Record<Locale, TranslationKeys>;
