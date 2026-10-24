// Indian phone number: exactly 10 digits (no country code)
export const PHONE_REGEX = /^[6-9]\d{9}$/

// Email validation
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// GST Number: 15 characters alphanumeric
export const GST_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}\d{1}[Z]{1}[A-Z\d]{1}$/

// PAN: 10 characters
export const PAN_REGEX = /^[A-Z]{5}\d{4}[A-Z]{1}$/

// Password: min 8 chars, at least 1 letter and 1 number
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

// Validators that return error message or null
export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required'
  if (!EMAIL_REGEX.test(email.trim())) return 'Enter a valid email address'
  return null
}

export function validatePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '')
  // Remove leading 91 country code if present
  const cleaned = digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits
  if (!cleaned) return 'Phone number is required'
  if (cleaned.length !== 10) return 'Phone number must be 10 digits'
  if (!PHONE_REGEX.test(cleaned)) return 'Enter a valid Indian mobile number'
  return null
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required'
  if (password.length < 8) return 'Password must be at least 8 characters'
  if (!PASSWORD_REGEX.test(password)) return 'Password must contain at least 1 letter and 1 number'
  return null
}

export function validateGST(gst: string): string | null {
  if (!gst.trim()) return null // GST is optional
  if (!GST_REGEX.test(gst.trim().toUpperCase())) return 'Enter a valid 15-character GST number'
  return null
}

// Format phone for display: "9876543210" → "+91 98765 43210"
export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  const cleaned = digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
  }
  return phone
}

// Strip to digits only (for storing)
export function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

// Format currency for display
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}
