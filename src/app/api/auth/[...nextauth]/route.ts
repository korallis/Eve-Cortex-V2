/**
 * NextAuth.js API Route Handler
 * Handles all authentication routes for EVE Online ESI OAuth
 */

import { handlers } from '@/lib/auth/config'

export const { GET, POST } = handlers
