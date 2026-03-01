/**
 * MSW Request Handlers
 *
 * Intercepts API requests and returns mock data during development/testing.
 */

import { http, HttpResponse } from 'msw'

// In-memory key-value store for game data (mirrors Netlify Blob game-data store)
const gameDataStore = new Map<string, unknown>()

export const handlers = [
  // ============================================
  // Game Data (key-value store for Phase 0 game state)
  // ============================================

  http.get('*/game/data', ({ request }) => {
    const url = new URL(request.url)
    const key = url.searchParams.get('key')
    if (!key) return HttpResponse.json({ error: 'Missing key' }, { status: 400 })
    return HttpResponse.json(gameDataStore.get(key) ?? null)
  }),

  http.put('*/game/data', async ({ request }) => {
    const body = await request.json() as { key: string; value: unknown }
    if (!body.key) return HttpResponse.json({ error: 'Missing key' }, { status: 400 })
    gameDataStore.set(body.key, body.value)
    return HttpResponse.json({ success: true })
  }),

  http.delete('*/game/data', ({ request }) => {
    const url = new URL(request.url)
    const key = url.searchParams.get('key')
    if (!key) return HttpResponse.json({ error: 'Missing key' }, { status: 400 })
    gameDataStore.delete(key)
    return HttpResponse.json({ success: true })
  }),

  // ============================================
  // Health Check
  // ============================================

  // GET /.netlify/functions/health - Health check endpoint
  http.get('*/health', () => {
    return HttpResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      mock: true
    })
  }),
]
