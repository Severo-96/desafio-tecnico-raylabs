import {
  normalizeDigits,
  normalizeName,
  isValidDocument,
  isValidEmail,
  isCPFFormat,
  isCNPJFormat,
  isNonNegativeInt,
  isNonNegativeNumber,
  isValidPassword,
  isValidNickname,
  isNotEmptyParam,
} from '../../core/validators.js';

describe('Validators - Unit Tests', () => {
  describe('normalizeDigits', () => {
    it('should remove all non-digit characters', () => {
      expect(normalizeDigits('123.456.789-00')).toBe('12345678900');
      expect(normalizeDigits('12.345/0001-10')).toBe('12345000110');
      expect(normalizeDigits('(11) 98765-4321')).toBe('11987654321');
      expect(normalizeDigits('abc123def456')).toBe('123456');
    });

    it('should handle empty strings', () => {
      expect(normalizeDigits('')).toBe('');
      expect(normalizeDigits(null as any)).toBe('');
      expect(normalizeDigits(undefined as any)).toBe('');
    });

    it('should handle strings with only digits', () => {
      expect(normalizeDigits('12345678900')).toBe('12345678900');
    });

    it('should handle strings with only non-digits', () => {
      expect(normalizeDigits('abc-def-ghi')).toBe('');
    });
  });

  describe('normalizeName', () => {
    it('should trim and normalize whitespace', () => {
      expect(normalizeName('  John   Doe  ')).toBe('John Doe');
      expect(normalizeName('Maria    da    Silva')).toBe('Maria da Silva');
      expect(normalizeName('   Test   ')).toBe('Test');
    });

    it('should handle multiple spaces', () => {
      expect(normalizeName('a      b      c')).toBe('a b c');
    });

    it('should return non-string values as-is', () => {
      expect(normalizeName(null as any)).toBe(null);
      expect(normalizeName(123 as any)).toBe(123);
      expect(normalizeName({} as any)).toEqual({});
    });

    it('should handle empty strings', () => {
      expect(normalizeName('')).toBe('');
      expect(normalizeName('   ')).toBe('');
    });
  });

  describe('isCPFFormat', () => {
    it('should validate 11-digit strings', () => {
      expect(isCPFFormat('12345678900')).toBe(true);
      expect(isCPFFormat('00000000000')).toBe(true);
      expect(isCPFFormat('99999999999')).toBe(true);
    });

    it('should reject non-11-digit strings', () => {
      expect(isCPFFormat('1234567890')).toBe(false); // 10 digits
      expect(isCPFFormat('123456789012')).toBe(false); // 12 digits
      expect(isCPFFormat('123.456.789-00')).toBe(false); // formatted
      expect(isCPFFormat('')).toBe(false);
    });

    it('should reject non-digit strings', () => {
      expect(isCPFFormat('abcdefghijk')).toBe(false);
      expect(isCPFFormat('1234567890a')).toBe(false);
    });
  });

  describe('isCNPJFormat', () => {
    it('should validate 14-digit strings', () => {
      expect(isCNPJFormat('12345678000190')).toBe(true);
      expect(isCNPJFormat('00000000000000')).toBe(true);
      expect(isCNPJFormat('99999999999999')).toBe(true);
    });

    it('should reject non-14-digit strings', () => {
      expect(isCNPJFormat('1234567800019')).toBe(false); // 13 digits
      expect(isCNPJFormat('123456780001901')).toBe(false); // 15 digits
      expect(isCNPJFormat('12.345.678/0001-90')).toBe(false); // formatted
      expect(isCNPJFormat('')).toBe(false);
    });

    it('should reject non-digit strings', () => {
      expect(isCNPJFormat('abcdefghijklmn')).toBe(false);
      expect(isCNPJFormat('1234567800019a')).toBe(false);
    });
  });

  describe('isValidDocument', () => {
    it('should validate CPF format', () => {
      expect(isValidDocument('12345678900')).toBe(true);
      expect(isValidDocument('390.533.447-05')).toBe(true); // will be normalized
      expect(isValidDocument('12345678901')).toBe(true);
    });

    it('should validate CNPJ format', () => {
      expect(isValidDocument('12345678000190')).toBe(true);
      expect(isValidDocument('12.345.678/0001-90')).toBe(true); // will be normalized
      expect(isValidDocument('45723174000110')).toBe(true);
    });

    it('should reject invalid document formats', () => {
      expect(isValidDocument('1234567890')).toBe(false); // 10 digits
      expect(isValidDocument('123456789012345')).toBe(false); // 15 digits
      expect(isValidDocument('')).toBe(false);
      expect(isValidDocument('abc123')).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.email@domain.co.uk')).toBe(true);
      expect(isValidEmail('user_name@example-domain.com')).toBe(true);
      expect(isValidEmail('a@b.co')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user @example.com')).toBe(false);
      expect(isValidEmail('user@exam ple.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isNonNegativeInt', () => {
    it('should validate non-negative integers', () => {
      expect(isNonNegativeInt(0)).toBe(true);
      expect(isNonNegativeInt(1)).toBe(true);
      expect(isNonNegativeInt(100)).toBe(true);
      expect(isNonNegativeInt(999999)).toBe(true);
    });

    it('should reject negative integers', () => {
      expect(isNonNegativeInt(-1)).toBe(false);
      expect(isNonNegativeInt(-100)).toBe(false);
    });

    it('should reject non-integer numbers', () => {
      expect(isNonNegativeInt(1.5)).toBe(false);
      expect(isNonNegativeInt(0.1)).toBe(false);
      expect(isNonNegativeInt(-0.1)).toBe(false);
    });

    it('should reject non-number values', () => {
      expect(isNonNegativeInt(null)).toBe(false);
      expect(isNonNegativeInt(undefined)).toBe(false);
      expect(isNonNegativeInt('123')).toBe(false);
      expect(isNonNegativeInt('abc')).toBe(false);
      expect(isNonNegativeInt({})).toBe(false);
    });
  });

  describe('isNonNegativeNumber', () => {
    it('should validate non-negative numbers', () => {
      expect(isNonNegativeNumber(0)).toBe(true);
      expect(isNonNegativeNumber(0.0)).toBe(true);
      expect(isNonNegativeNumber(1)).toBe(true);
      expect(isNonNegativeNumber(1.5)).toBe(true);
      expect(isNonNegativeNumber(100.99)).toBe(true);
    });

    it('should reject negative numbers', () => {
      expect(isNonNegativeNumber(-1)).toBe(false);
      expect(isNonNegativeNumber(-0.1)).toBe(false);
      expect(isNonNegativeNumber(-100.5)).toBe(false);
    });

    it('should reject non-finite numbers', () => {
      expect(isNonNegativeNumber(Infinity)).toBe(false);
      expect(isNonNegativeNumber(-Infinity)).toBe(false);
      expect(isNonNegativeNumber(NaN)).toBe(false);
    });

    it('should reject non-number values', () => {
      expect(isNonNegativeNumber(null)).toBe(false);
      expect(isNonNegativeNumber(undefined)).toBe(false);
      expect(isNonNegativeNumber('123')).toBe(false);
      expect(isNonNegativeNumber('abc')).toBe(false);
      expect(isNonNegativeNumber({})).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('should validate passwords with 6 or more characters', () => {
      expect(isValidPassword('123456')).toBe(true);
      expect(isValidPassword('password')).toBe(true);
      expect(isValidPassword('very-long-password-123')).toBe(true);
      expect(isValidPassword('1234567890')).toBe(true);
    });

    it('should validate passwords with exactly 6 characters', () => {
      expect(isValidPassword('123456')).toBe(true);
      expect(isValidPassword('abcdef')).toBe(true);
      expect(isValidPassword('P@ssw0')).toBe(true);
    });

    it('should reject passwords with less than 6 characters', () => {
      expect(isValidPassword('12345')).toBe(false); // 5 characters
      expect(isValidPassword('1234')).toBe(false); // 4 characters
      expect(isValidPassword('123')).toBe(false); // 3 characters
      expect(isValidPassword('12')).toBe(false); // 2 characters
      expect(isValidPassword('1')).toBe(false); // 1 character
      expect(isValidPassword('')).toBe(false); // empty
    });

    it('should handle passwords with special characters', () => {
      expect(isValidPassword('P@ssw0')).toBe(true);
      expect(isValidPassword('123!@#')).toBe(true);
      expect(isValidPassword('senha#123')).toBe(true);
    });

    it('should handle passwords with spaces', () => {
      expect(isValidPassword('senha 123')).toBe(true); // 8 characters
      expect(isValidPassword('123 45')).toBe(true); // 6 characters
    });
  });

  describe('isValidNickname', () => {
    it('should validate nicknames with 3 or more characters', () => {
      expect(isValidNickname('abc')).toBe(true); // exactly 3
      expect(isValidNickname('john')).toBe(true);
      expect(isValidNickname('very-long-nickname')).toBe(true);
      expect(isValidNickname('user123')).toBe(true);
    });

    it('should validate nicknames with exactly 3 characters', () => {
      expect(isValidNickname('abc')).toBe(true);
      expect(isValidNickname('123')).toBe(true);
      expect(isValidNickname('a1b')).toBe(true);
    });

    it('should reject nicknames with less than 3 characters', () => {
      expect(isValidNickname('ab')).toBe(false); // 2 characters
      expect(isValidNickname('a')).toBe(false); // 1 character
      expect(isValidNickname('')).toBe(false); // empty
    });

    it('should handle nicknames with numbers and special characters', () => {
      expect(isValidNickname('user123')).toBe(true);
      expect(isValidNickname('user_123')).toBe(true);
      expect(isValidNickname('user-123')).toBe(true);
      expect(isValidNickname('user.123')).toBe(true);
    });

    it('should handle nicknames with spaces', () => {
      expect(isValidNickname('user name')).toBe(true); // 9 characters
      expect(isValidNickname('a b c')).toBe(true); // 5 characters
    });

    it('should handle unicode characters', () => {
      expect(isValidNickname('josé')).toBe(true);
      expect(isValidNickname('café')).toBe(true);
      expect(isValidNickname('josé123')).toBe(true); // Unicode with numbers
    });
  });

  describe('isNotEmptyParam', () => {
    it('should validate non-empty strings', () => {
      expect(isNotEmptyParam('text')).toBe(true);
      expect(isNotEmptyParam('123')).toBe(true);
      expect(isNotEmptyParam('0')).toBe(true);
      expect(isNotEmptyParam('false')).toBe(true);
    });

    it('should validate numbers', () => {
      expect(isNotEmptyParam(0)).toBe(true);
      expect(isNotEmptyParam(1)).toBe(true);
      expect(isNotEmptyParam(-1)).toBe(true);
      expect(isNotEmptyParam(3.14)).toBe(true);
      expect(isNotEmptyParam(0.0)).toBe(true);
    });

    it('should validate booleans', () => {
      expect(isNotEmptyParam(true)).toBe(true);
      expect(isNotEmptyParam(false)).toBe(true);
    });

    it('should validate objects', () => {
      expect(isNotEmptyParam({})).toBe(true);
      expect(isNotEmptyParam({ key: 'value' })).toBe(true);
      expect(isNotEmptyParam([])).toBe(true);
      expect(isNotEmptyParam([1, 2, 3])).toBe(true);
    });

    it('should reject undefined', () => {
      expect(isNotEmptyParam(undefined)).toBe(false);
    });

    it('should reject null', () => {
      expect(isNotEmptyParam(null)).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isNotEmptyParam('')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isNotEmptyParam(NaN)).toBe(true); // NaN is not null/undefined/empty string
      expect(isNotEmptyParam(Infinity)).toBe(true); // Infinity is a number
      expect(isNotEmptyParam(-Infinity)).toBe(true); // -Infinity is a number
    });

    it('should handle zero values correctly', () => {
      expect(isNotEmptyParam(0)).toBe(true); // 0 is a valid number
      expect(isNotEmptyParam('0')).toBe(true); // '0' is a valid string
      expect(isNotEmptyParam(false)).toBe(true); // false is a valid boolean
    });
  });
});

