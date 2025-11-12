/**
 * Validation Utilities
 * Reusable validation functions
 */

export class Validator {
  // Email validation
  static isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(String(email).toLowerCase())
  }

  // Password validation
  static validatePassword(password) {
    const errors = []
    
    if (password.length < 6) {
      errors.push('Password harus minimal 6 karakter')
    }
    
    if (password.length > 128) {
      errors.push('Password terlalu panjang (maksimal 128 karakter)')
    }
    
    // Optional: Check for complexity
    // if (!/[A-Z]/.test(password)) {
    //   errors.push('Password harus mengandung huruf besar')
    // }
    // if (!/[a-z]/.test(password)) {
    //   errors.push('Password harus mengandung huruf kecil')
    // }
    // if (!/[0-9]/.test(password)) {
    //   errors.push('Password harus mengandung angka')
    // }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Name validation
  static isValidName(name) {
    return name && name.trim().length >= 2 && name.trim().length <= 100
  }

  // 2FA Code validation (6 digits)
  static isValid2FACode(code) {
    const cleanCode = code.replace(/\s/g, '')
    return /^\d{6}$/.test(cleanCode)
  }

  // Backup code validation (format: XXXX-XXXX or XXXXXXXX)
  static isValidBackupCode(code) {
    const cleanCode = code.replace(/\s|-/g, '')
    return /^[A-Z0-9]{8}$/i.test(cleanCode)
  }

  // Order validation
  static isValidOrder(order) {
    return (
      order &&
      order.userId &&
      order.items &&
      Array.isArray(order.items) &&
      order.items.length > 0 &&
      order.total &&
      order.total > 0
    )
  }

  // Price validation
  static isValidPrice(price) {
    return typeof price === 'number' && price >= 0 && !isNaN(price)
  }

  // Quantity validation
  static isValidQuantity(quantity) {
    return Number.isInteger(quantity) && quantity > 0
  }

  // Generic required field validation
  static isRequired(value, fieldName = 'Field') {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return {
        isValid: false,
        error: `${fieldName} harus diisi`
      }
    }
    return { isValid: true }
  }

  // Sanitize input (remove dangerous characters)
  static sanitize(input) {
    if (typeof input !== 'string') return input
    
    return input
      .replace(/[<>]/g, '') // Remove < and >
      .trim()
  }

  // Validate order status
  static isValidOrderStatus(status) {
    const validStatuses = ['pending', 'processing', 'completed', 'cancelled']
    return validStatuses.includes(status)
  }

  // Validate user role
  static isValidRole(role) {
    const validRoles = ['user', 'admin']
    return validRoles.includes(role)
  }
}
