export function normalizeDigits(s: string): string {
  return (s || '').replace(/\D/g, '');
}

export function normalizeName(value: string): string {
  if (typeof value !== 'string') return value;

  return value.trim().replace(/\s+/g, ' ');
}

export function isValidDocument(doc: string): boolean {
  const formatedDocument = normalizeDigits(doc)
  return isCPFFormat(formatedDocument) || isCNPJFormat(formatedDocument);
}

export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isCPFFormat = (document: string): boolean =>
  /^\d{11}$/.test(document);

export const isCNPJFormat = (document: string): boolean =>
  /^\d{14}$/.test(document);

export const isNonNegativeInt = (n: unknown) => 
  Number.isInteger(n) && (n as number) >= 0;

export const isNonNegativeNumber = (n: unknown) =>
  typeof n === 'number' && Number.isFinite(n) && n >= 0;

export const isValidPassword = (password: string): boolean =>
  password.length >= 6;

export const isValidNickname = (nickname: string): boolean =>
  nickname.length >= 3;

export const isNotEmptyParam = (param: unknown): boolean =>
  param !== undefined && param !== null && param !== '';
