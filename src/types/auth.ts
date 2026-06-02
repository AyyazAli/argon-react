export interface User {
  _id: string
  email: string
  role: 'user' | 'admin' | 'superAdmin' | 'financeManager'
  business: string
}

export interface AuthResponse {
  token: string
  expiresIn: number
  userId: string
  role?: string        // legacy single role (still sent by backend, unused on FE)
  roles?: string[]     // all roles for the business
}

export interface LoginCredentials {
  email: string
  password: string
  business: string
}

export interface BusinessInfo {
  business: string
  role?: string        // legacy single role (still sent by backend, unused on FE)
  roles?: string[]     // all roles for the business
}




