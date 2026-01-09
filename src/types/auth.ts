export interface User {
  _id: string
  email: string
  role: 'user' | 'admin' | 'superAdmin'
  business: string
}

export interface AuthResponse {
  token: string
  expiresIn: number
  userId: string
  role: string
}

export interface LoginCredentials {
  email: string
  password: string
  business: string
}

export interface BusinessInfo {
  business: string
  role: string
}




