import { PrismaPg } from '@prisma/adapter-pg'

export const db = {
  adapter: null as PrismaPg | null,
  instance: null as any
}
