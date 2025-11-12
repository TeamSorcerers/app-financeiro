export const PRETTY_PRINT_INDENT = 2;
export const MINIMUM_NAME_LENGTH = 2;
export const MINIMUM_PASSWORD_LENGTH = 6;
export const BCRYPT_ROUNDS = 12;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Date/Time Constants
export const HOURS_IN_DAY = 23;
export const MINUTES_IN_HOUR = 59;
export const SECONDS_IN_MINUTE = 59;
export const MILLISECONDS = 999;
export const MONTHS_IN_YEAR = 12;
export const DECEMBER_MONTH = 11;
export const LAST_DAY_OF_MONTH = 31;

// Formatting Constants
export const PAD_LENGTH = 2;
export const PAD_CHAR = "0";
export const INITIALS_MAX = 2;
export const MAX_LENGTH_DESCRIPTION = 255;
export const MAX_LENGTH_NAME = 100;
export const MAX_LENGTH_EMAIL = 254;

// UI Constants
export const PERCENTAGE_MULTIPLIER = 100;
export const TOP_CATEGORIES_LIMIT = 5;
export const SORT_ORDER_FIRST = -1;
export const SORT_ORDER_LAST = 1;
export const ZERO = 0;
export const ONE = 1;

// Card Constants
export const CREDIT_CARD_LAST_DIGITS = 4;
export const MIN_INSTALLMENT_NUMBER = 1;

// Slice/Array Constants
export const FIRST_ELEMENT = 0;
export const MAX_RECENT_TRANSACTIONS = 10;

// Icon Constants
export const ICON_SIZE_SMALL = 14;
export const ICON_SIZE_MEDIUM = 18;
export const ICON_SIZE_DEFAULT = 20;
export const ICON_SIZE_LARGE = 24;
export const ICON_STROKE_THIN = 2;
export const ICON_STROKE_THICK = 2.5;

// Opacity Constants
export const OPACITY_60 = 0.6;
