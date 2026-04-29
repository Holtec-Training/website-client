export interface Trainer {
  _id: string
  name: string
  slug: { current: string }
  photo?: { asset: { url: string }; hotspot?: object }
  location: string
  specialties: string[]
  spec: string
  isNew: boolean
  bio?: any[]  // Portable Text blocks
  certifications?: string[]
  email?: string
  bookingUrl?: string
  instagramHandle?: string
}
