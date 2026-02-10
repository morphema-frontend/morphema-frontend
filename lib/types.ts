export type Role = 'admin' | 'horeca' | 'worker' | 'venue'

export interface AuthResult {
  accessToken: string
  refreshToken: string
  user: { id: number; email: string; role: Role }
}

export interface UserMe {
  id: number
  email: string
  role: Role
  sessionId?: string
  createdAt?: string
  updatedAt?: string
}

export interface JobType {
  id: number
  name: string
  minHourlyRate?: string | number
  isActive?: boolean
}

export type GigPublishStatus = 'draft' | 'preauthorized' | 'published'
export type GigStatus = 'open' | 'pending' | 'accepted' | 'completed' | 'cancelled'

export interface Gig {
  id: number
  publicId: string
  title: string
  description: string | null
  venueId: number
  jobTypeId: number | null
  status: GigStatus
  startTime: string
  endTime: string
  payAmount: string | null
  currency: string
  insuranceProductId: number | null
  insuranceSnapshot: any | null
  contractTemplateId: number | null
  contractSnapshot: any | null
  publishStatus: GigPublishStatus
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateGigDto {
  venueId: number
  jobTypeId?: number
  title: string
  description?: string
  startTime: string
  endTime: string
  payAmount?: number
  currency: string
}

export type BookingStatus = 'draft' | 'pending' | 'confirmed' | 'cancelled' | 'completed'

export interface Booking {
  id: number
  gigId: number
  venueId: number
  createdByUserId: number
  jobTypeId: number | null
  workerUserId: number | null
  status: BookingStatus
  startsAt: string | null
  endsAt: string | null
  insuranceSnapshot: any | null
  paymentSnapshot: any | null
  createdAt: string
  updatedAt: string
}

export interface HorecaVenue {
  id: number
  publicId: string
  name: string
  address: string
  city: string
  zipCode: string
  province: string
  country: string
  legalName: string
  vatNumber: string
  ownerId: number
  status: string
  createdAt: string
  updatedAt: string
}

export interface Skill {
  id: number
  code: string
  name: string
  jobTypeId: number
  active: boolean
}
