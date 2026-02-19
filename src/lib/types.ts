// Types matching the backend API contract

export interface Banner {
  id: string
  game_id: 'genshin' | 'hsr' | 'zzz'
  character: string
  end_date: string              // ISO 8601 UTC
  color: string                 // Hex: "#60A5FA", "#A855F7", "#FB923C"
  featured_characters: string[] // Names of all 5★ featured characters
}

export interface GameStatus {
  game_id: string
  status: 'ok' | 'maintenance' | 'error'
  banner_count: number
}

export interface BannersEnvelope {
  banners: Banner[]
  game_statuses: GameStatus[]
  fetched_at: string            // ISO 8601 UTC
  next_refresh_at: string       // ISO 8601 UTC
  data_hash: string             // MD5 truncated (12 chars)
}

export interface StatusResponse {
  game_statuses: GameStatus[]
  data_hash: string
  fetched_at: string
  next_refresh_at: string
}
