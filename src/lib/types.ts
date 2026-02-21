// Types matching the backend API contract

export interface Banner {
  id: string
  game_id: 'genshin' | 'hsr' | 'zzz'
  character: string
  start_date: string            // ISO 8601 UTC
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

export interface VersionPhase {
  phase_id: string;   // ID único: "hsr-4-0-p1", "genshin-luna-iv-p2", "zzz-2-6-p1"
  game_id: "genshin" | "hsr" | "zzz";
  version: string;    // "4.0", "Luna IV", "2.6"
  phase: number;      // 1 = primera mitad, 2 = segunda mitad de la versión
  start_date: string; // ISO 8601 UTC: "2026-02-13T00:00:00Z"
  end_date: string;   // ISO 8601 UTC: "2026-03-24T23:59:59Z"
}

export interface VersionsResponse {
  game_id: string;
  versions: VersionPhase[]; // Ordenadas: más reciente primero
}

export interface HistoryResponse {
  phase: VersionPhase;
  banners: Banner[]; // Mismo tipo que los banners live
}
