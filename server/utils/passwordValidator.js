const validator = require('validator');

class PasswordValidator {
  constructor() {
    this.minLength = 8;
    this.maxLength = 128;
    this.requireUppercase = true;
    this.requireLowercase = true;
    this.requireNumbers = true;
    this.requireSpecialChars = true;
    this.maxRepeatingChars = 2;
    this.forbiddenPatterns = [
      'password',
      '123456',
      'qwerty',
      'admin',
      'user',
      'login',
      'welcome',
      'default'
    ];
    this.forbiddenSequences = [
      '12345678',
      '87654321',
      'abcdefgh',
      'hgfedcba',
      'qwertyui',
      'asdfghjk',
      'zxcvbnm,'
    ];
  }

  /**
   * Validates password strength and returns detailed feedback
   * @param {string} password - The password to validate
   * @returns {Object} Validation result with details
   */
  validate(password) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      strength: 'weak',
      score: 0
    };

    // Basic length validation
    if (!password) {
      result.isValid = false;
      result.errors.push('Password is required');
      return result;
    }

    if (password.length < this.minLength) {
      result.isValid = false;
      result.errors.push(`Password must be at least ${this.minLength} characters long`);
    }

    if (password.length > this.maxLength) {
      result.isValid = false;
      result.errors.push(`Password cannot exceed ${this.maxLength} characters`);
    }

    // Character type requirements
    if (this.requireUppercase && !/[A-Z]/.test(password)) {
      result.isValid = false;
      result.errors.push('Password must contain at least one uppercase letter');
    }

    if (this.requireLowercase && !/[a-z]/.test(password)) {
      result.isValid = false;
      result.errors.push('Password must contain at least one lowercase letter');
    }

    if (this.requireNumbers && !/\d/.test(password)) {
      result.isValid = false;
      result.errors.push('Password must contain at least one number');
    }

    if (this.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      result.isValid = false;
      result.errors.push('Password must contain at least one special character');
    }

    // Advanced security checks
    this.checkRepeatingChars(password, result);
    this.checkForbiddenPatterns(password, result);
    this.checkSequences(password, result);
    this.checkCommonPasswords(password, result);

    // Calculate strength
    this.calculateStrength(password, result);

    return result;
  }

  /**
   * Check for repeating characters
   */
  checkRepeatingChars(password, result) {
    const regex = new RegExp(`(.)\\1{${this.maxRepeatingChars},}`, 'i');
    if (regex.test(password)) {
      result.warnings.push(`Password contains ${this.maxRepeatingChars + 1} or more repeating characters`);
      result.score -= 10;
    }
  }

  /**
   * Check for forbidden patterns
   */
  checkForbiddenPatterns(password, result) {
    const lowerPassword = password.toLowerCase();
    
    for (const pattern of this.forbiddenPatterns) {
      if (lowerPassword.includes(pattern)) {
        result.warnings.push(`Password contains common pattern: "${pattern}"`);
        result.score -= 15;
        break;
      }
    }
  }

  /**
   * Check for keyboard sequences
   */
  checkSequences(password, result) {
    const lowerPassword = password.toLowerCase();
    
    for (const sequence of this.forbiddenSequences) {
      if (lowerPassword.includes(sequence)) {
        result.warnings.push('Password contains keyboard sequence pattern');
        result.score -= 20;
        break;
      }
    }
  }

  /**
   * Check against common passwords
   */
  checkCommonPasswords(password, result) {
    const commonPasswords = [
      'password123',
      'admin123',
      '12345678',
      'qwerty123',
      'abc12345',
      'password1',
      'letmein',
      'welcome1',
      'monkey123',
      'dragon123'
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      result.warnings.push('Password is too common');
      result.score -= 25;
    }
  }

  /**
   * Calculate password strength score
   */
  calculateStrength(password, result) {
    let score = 0;

    // Length scoring
    if (password.length >= 8) score += 10;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;

    // Character variety scoring
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/\d/.test(password)) score += 10;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15;

    // Complexity scoring
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= password.length * 0.5) score += 10;
    if (uniqueChars >= password.length * 0.7) score += 10;

    // Entropy calculation (simplified)
    const charSets = [
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /\d/.test(password),
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    ].filter(Boolean).length;

    const entropy = password.length * Math.log2(charSets * 26);
    if (entropy >= 40) score += 10;
    if (entropy >= 60) score += 10;

    result.score = Math.max(0, Math.min(100, score));

    // Determine strength level
    if (result.score >= 80) {
      result.strength = 'very_strong';
    } else if (result.score >= 60) {
      result.strength = 'strong';
    } else if (result.score >= 40) {
      result.strength = 'medium';
    } else if (result.score >= 20) {
      result.strength = 'weak';
    } else {
      result.strength = 'very_weak';
    }
  }

  /**
   * Generate password strength requirements message
   */
  getRequirementsMessage() {
    const requirements = [];
    
    requirements.push(`At least ${this.minLength} characters`);
    if (this.requireUppercase) requirements.push('One uppercase letter');
    if (this.requireLowercase) requirements.push('One lowercase letter');
    if (this.requireNumbers) requirements.push('One number');
    if (this.requireSpecialChars) requirements.push('One special character');

    return requirements;
  }

  /**
   * Create validation middleware for Express
   */
  middleware() {
    return (req, res, next) => {
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({
          message: 'Password is required',
          requirements: this.getRequirementsMessage()
        });
      }

      const validation = this.validate(password);
      
      if (!validation.isValid) {
        return res.status(400).json({
          message: 'Password does not meet security requirements',
          errors: validation.errors,
          warnings: validation.warnings,
          requirements: this.getRequirementsMessage()
        });
      }

      // Add validation result to request for potential use
      req.passwordValidation = validation;
      next();
    };
  }

  /**
   * Create validation rules for express-validator
   */
  getValidatorRules() {
    return {
      isLength: {
        options: { min: this.minLength, max: this.maxLength },
        errorMessage: `Password must be between ${this.minLength} and ${this.maxLength} characters`
      },
      matches: {
        options: [
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/,
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        ],
        errorMessage: 'Password does not meet complexity requirements'
      },
      custom: {
        options: (value) => {
          const validation = this.validate(value);
          return validation.isValid;
        },
        errorMessage: 'Password does not meet security requirements'
      }
    };
  }
}

// Create singleton instance
const passwordValidator = new PasswordValidator();

module.exports = {
  PasswordValidator,
  passwordValidator
};
