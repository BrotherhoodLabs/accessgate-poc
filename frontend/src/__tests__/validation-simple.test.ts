// Tests simples pour les utilitaires de validation
describe('Simple Validation Tests', () => {
  describe('Email Validation', () => {
    const isValidEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'john.doe@sub.example.co.uk',
        'user123@mail.net',
        'admin@company.org'
      ];

      validEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        'test@',
        '@domain.com',
        'test @domain.com',
        'test@domain',
        'test@.com',
        '@.com',
        'test@domain.',
        'test@@domain.com'
      ];

      invalidEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(false);
      });
    });
  });

  describe('Password Validation', () => {
    const isStrongPassword = (password: string): boolean => {
      // Au moins 8 caractères, une majuscule, une minuscule, un chiffre
      return password.length >= 8 && 
             /[a-z]/.test(password) && 
             /[A-Z]/.test(password) && 
             /\d/.test(password);
    };

    it('should validate strong passwords', () => {
      const strongPasswords = [
        'Password123',
        'MySecure1',
        'Admin2024',
        'UserPass9'
      ];

      strongPasswords.forEach(password => {
        expect(isStrongPassword(password)).toBe(true);
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        'password',      // Pas de majuscule, chiffre
        '123456',        // Pas de lettres
        'Password',      // Pas de chiffre
        'Pass1',         // Trop court
        'PASSWORD123',   // Pas de minuscule
        'password123'    // Pas de majuscule
      ];

      weakPasswords.forEach(password => {
        expect(isStrongPassword(password)).toBe(false);
      });
    });
  });

  describe('Form Validation', () => {
    const validateRequired = (value: string): boolean => {
      return value.trim().length > 0;
    };

    const validateMinLength = (value: string, minLength: number): boolean => {
      return value.length >= minLength;
    };

    it('should validate required fields', () => {
      expect(validateRequired('')).toBe(false);
      expect(validateRequired('   ')).toBe(false);
      expect(validateRequired('valid')).toBe(true);
      expect(validateRequired(' valid ')).toBe(true);
    });

    it('should validate minimum length', () => {
      expect(validateMinLength('test', 5)).toBe(false);
      expect(validateMinLength('test', 4)).toBe(true);
      expect(validateMinLength('testing', 5)).toBe(true);
    });
  });

  describe('Password Confirmation', () => {
    const validatePasswordMatch = (password: string, confirmPassword: string): boolean => {
      return password === confirmPassword;
    };

    it('should validate matching passwords', () => {
      expect(validatePasswordMatch('Password123', 'Password123')).toBe(true);
      expect(validatePasswordMatch('test', 'test')).toBe(true);
    });

    it('should reject non-matching passwords', () => {
      expect(validatePasswordMatch('Password123', 'Different123')).toBe(false);
      expect(validatePasswordMatch('test', 'testing')).toBe(false);
      expect(validatePasswordMatch('', 'test')).toBe(false);
    });
  });
});
