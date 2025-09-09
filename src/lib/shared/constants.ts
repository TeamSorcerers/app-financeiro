export const PRETTY_PRINT_INDENT = 2;
export const MINIMUM_NAME_LENGTH = 2;
export const MINIMUM_PASSWORD_LENGTH = 6;
export const BCRYPT_ROUNDS = 12;
export const DATETIME_LOCAL_LENGTH = 16;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;
