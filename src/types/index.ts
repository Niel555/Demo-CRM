export type ContactType = 'buyer' | 'seller' | 'prospect'
export type ContactStatus = 'active' | 'inactive' | 'closed'

export interface Contact {
  id: string
  name: string
  email: string
  phone: string
  type: ContactType
  status: ContactStatus
  notes?: string
  budget?: number
  created_at: string
}

export type PropertyType = 'apartment' | 'house' | 'commercial' | 'land'
export type PropertyStatus = 'available' | 'reserved' | 'sold'

export interface Property {
  id: string
  title: string
  address: string
  city: string
  price: number
  size: number
  rooms: number
  type: PropertyType
  status: PropertyStatus
  description?: string
  created_at: string
}

export type DealStatus = 'lead' | 'viewing' | 'offer' | 'won' | 'lost'

export interface Deal {
  id: string
  contact: Contact
  property: Property
  status: DealStatus
  value: number
  commission: number
  notes?: string
  created_at: string
}

export type ViewingStatus = 'scheduled' | 'completed' | 'cancelled'

export interface Viewing {
  id: string
  contact: Contact
  property: Property
  deal?: Pick<Deal, 'id' | 'status'>
  date: string
  time: string
  status: ViewingStatus
  notes?: string
  created_at: string
}
