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

export const HTML_LANG: Record<Locale, string> = {
  en: 'en',
  mn: 'mn',
  cn: 'zh-CN',
  kr: 'ko',
  jp: 'ja',
};

export type TranslationKeys = {
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
};

export type Translations = Record<Locale, TranslationKeys>;
