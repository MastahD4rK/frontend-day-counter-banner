<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { fade, fly, scale } from 'svelte/transition'
  import { cubicOut, quintOut } from 'svelte/easing'
  import BannerCard from './lib/BannerCard.svelte'
  import { t, locale, type Locale } from './lib/i18n/translations'
  import type { Banner, GameStatus, BannersEnvelope, StatusResponse } from './lib/types'

  const API_BASE = '/api'
  const POLL_INTERVAL = 60_000  // 60s polling
  const EXPIRY_REFETCH_DELAY = 5_000  // 5s after banner expires

  const TABS = [
    { key: 'all' as const, label: 'nav.all' },
    { key: 'genshin' as const, label: 'nav.genshin' },
    { key: 'hsr' as const, label: 'nav.hsr' },
    { key: 'zzz' as const, label: 'nav.zzz' },
  ] as const

  const SERVERS = [
    { key: 'america', label: 'server.america' },
    { key: 'europe', label: 'server.europe' },
    { key: 'asia', label: 'server.asia' },
    { key: 'sar', label: 'server.sar' },
  ] as const

  let isLoading = true
  let errorMessage = ''
  let banners: Banner[] = []
  let gameStatuses: GameStatus[] = []
  let dataHash = ''
  let activeFilter: 'all' | 'genshin' | 'hsr' | 'zzz' = 'all'
  let currentServer: 'america' | 'europe' | 'asia' | 'sar' = 'america'

  let pollTimer: ReturnType<typeof setInterval>
  let expiryTimer: ReturnType<typeof setTimeout>

  // --- Data fetching ---

  const fetchBanners = async (silent = false) => {
    if (!silent) {
      isLoading = true
      errorMessage = ''
    }
    try {
      const response = await fetch(`${API_BASE}/banners?server=${currentServer}`)
      if (!response.ok) throw new Error(`API ${response.status}`)

      const envelope = (await response.json()) as BannersEnvelope
      banners = envelope.banners ?? []
      gameStatuses = envelope.game_statuses ?? []
      dataHash = envelope.data_hash ?? ''

      scheduleExpiryRefresh()
    } catch (error) {
      if (!silent) {
        errorMessage = error instanceof Error ? error.message : 'No se pudo cargar los banners'
      }
    } finally {
      if (!silent) isLoading = false
    }
  }

  // --- Polling via /api/status ---

  const pollStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/status?server=${currentServer}`)
      if (!response.ok) return

      const status = (await response.json()) as StatusResponse
      if (status.data_hash !== dataHash) {
        await fetchBanners(true)
      } else {
        gameStatuses = status.game_statuses ?? gameStatuses
      }
    } catch {
      // Silent fail — next poll will retry
    }
  }

  const startPolling = () => {
    stopPolling()
    pollTimer = setInterval(pollStatus, POLL_INTERVAL)
  }

  const stopPolling = () => {
    if (pollTimer) clearInterval(pollTimer)
  }

  // --- Auto-refresh on banner expiry ---

  const scheduleExpiryRefresh = () => {
    if (expiryTimer) clearTimeout(expiryTimer)

    const now = Date.now()
    const soonest = banners
      .map(b => new Date(b.end_date).getTime())
      .filter(t => t > now)
      .sort((a, b) => a - b)[0]

    if (soonest) {
      const delay = soonest - now + EXPIRY_REFETCH_DELAY
      expiryTimer = setTimeout(() => fetchBanners(true), delay)
    }
  }

  // --- Game status helpers ---

  const getGameStatus = (gameId: string): GameStatus | undefined =>
    gameStatuses.find(s => s.game_id === gameId)

  // --- UI state ---

  let showServerDropdown = false
  let showLanguageDropdown = false

  const closeDropdowns = () => {
    showServerDropdown = false
    showLanguageDropdown = false
  }

  $: filteredBanners =
    activeFilter === 'all' ? banners : banners.filter((b) => b.game_id === activeFilter)

  const backgroundMap: Record<string, string> = {
    genshin: '/images/genshin/environments/nodkrai.webp',
    hsr: '/images/hsr/environments/planarcardia.webp',
    zzz: '/images/zzz/environments/failume.webp',
  }

  $: activeBg = backgroundMap[activeFilter] || ''

  $: if (currentServer) {
    fetchBanners()
    startPolling()
  }

  onMount(() => {
    // Reactive statement handles initial fetch + polling
  })

  onDestroy(() => {
    stopPolling()
    if (expiryTimer) clearTimeout(expiryTimer)
  })
</script>

<main class="relative h-screen text-white overflow-y-auto overflow-x-hidden scrollbar-thin">
  <!-- Solid Base Background -->
  <div class="fixed inset-0 -z-30 bg-[#0a0a0f]"></div>

  <!-- Dynamic Environment Backgrounds -->
  <div class="pointer-events-none fixed inset-0 -z-20 overflow-hidden">
    {#key activeBg}
      {#if activeBg}
        <div 
          class="absolute inset-0 bg-cover bg-center will-change-[opacity,transform,filter]"
          style={`background-image: url('${activeBg}')`}
          in:scale={{ duration: 1000, start: 1.05, easing: cubicOut, opacity: 0 }}
          out:fade={{ duration: 600 }}
        ></div>
        <!-- Cinematic Blur Overlay -->
        <div 
          class="absolute inset-0 backdrop-blur-sm"
          in:fade={{ duration: 1000, easing: cubicOut }}
          out:fade={{ duration: 600 }}
        ></div>
        <!-- Darkness Overlay -->
        <div class="absolute inset-0 bg-[#0a0a0f]/50"></div>
      {/if}
    {/key}
  </div>

  <div class="pointer-events-none fixed inset-0 -z-10">
    <div class="absolute -top-40 -left-16 h-96 w-96 rounded-full bg-indigo-600/10 blur-[120px]"></div>
    <div class="absolute top-1/2 -right-24 h-96 w-96 rounded-full bg-fuchsia-600/10 blur-[120px]"></div>
    <div class="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]"></div>
  </div>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <header class="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-3xl border-b border-white/5" on:mouseleave={closeDropdowns}>
    <div class="mx-auto max-w-7xl px-3 sm:px-4 py-3 sm:py-4 lg:py-5">
      <div class="flex flex-col gap-3 sm:gap-6 lg:flex-row lg:items-center lg:justify-between">
        <!-- Logo & Brand -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl sm:text-2xl font-black uppercase italic tracking-tighter text-white">
              BANNER <span class="bg-gradient-to-r from-indigo-500 via-purple-400 to-pink-500 bg-clip-text text-transparent">COUNTER</span>
            </h1>
          </div>
        </div>

        <!-- Controls Cluster -->
        <div class="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4">
          
          <!-- Server Selection (Dropdown) -->
          <div class="relative">
            <button
              on:click={() => (showServerDropdown = !showServerDropdown)}
              class="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-white/[0.03] border border-white/5 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/5 transition-all"
            >
              <span class="text-slate-500 font-bold hidden sm:inline">SERVER:</span>
              {SERVERS.find(s => s.key === currentServer)?.key || 'AMERICA'}
              <svg class={`w-3 h-3 transition-transform duration-300 ${showServerDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {#if showServerDropdown}
              <div 
                class="absolute top-full left-0 mt-2 w-40 bg-[#0a0a0f]/95 border border-white/10 rounded-xl overflow-hidden backdrop-blur-3xl shadow-2xl z-[60]"
                in:fly={{ y: -10, duration: 200 }}
              >
                {#each SERVERS as server}
                  <button
                    on:click={() => { currentServer = server.key; showServerDropdown = false; }}
                    class={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${
                      currentServer === server.key ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {$t(server.label)}
                  </button>
                {/each}
              </div>
            {/if}
          </div>

          <!-- Filter Navigation -->
          <nav class="flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 bg-white/[0.03] border border-white/5 rounded-lg sm:rounded-xl overflow-x-auto scrollbar-hide">
            {#each TABS as tab}
              <button
                on:click={() => (activeFilter = tab.key)}
                class={`px-2.5 sm:px-4 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-black uppercase tracking-wider rounded-md sm:rounded-lg transition-all duration-300 whitespace-nowrap ${
                  activeFilter === tab.key
                    ? 'bg-indigo-600 text-white shadow-[0_5px_15px_rgba(79,70,229,0.3)]'
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.key === 'all' ? $t(tab.label) : $t(`game.${tab.key}`)}
              </button>
            {/each}
          </nav>

          <!-- Language Switch (Dropdown) -->
          <div class="relative">
            <button
              on:click={() => (showLanguageDropdown = !showLanguageDropdown)}
              class="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-white/[0.03] border border-white/5 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/5 transition-all"
            >
              <span class="text-slate-500 font-bold hidden sm:inline">LANG:</span>
              {$locale.toUpperCase()}
              <svg class={`w-3 h-3 transition-transform duration-300 ${showLanguageDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {#if showLanguageDropdown}
              <div 
                class="absolute top-full right-0 mt-2 w-24 bg-[#0a0a0f]/95 border border-white/10 rounded-xl overflow-hidden backdrop-blur-3xl shadow-2xl z-[60]"
                in:fly={{ y: -10, duration: 200 }}
              >
                {#each ['es', 'en'] as l}
                  <button
                    on:click={() => { $locale = l as Locale; showLanguageDropdown = false; }}
                    class={`w-full text-center px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${
                      $locale === l ? 'bg-white text-black' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {l === 'es' ? 'Español' : 'English'}
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </header>

  <section class="relative mx-auto max-w-7xl px-3 sm:px-4 py-5 sm:py-8 lg:py-12 grid grid-cols-1 overflow-hidden">
    {#if isLoading}
      <div class="col-start-1 row-start-1 flex flex-col items-center gap-5 sm:gap-10" out:fade={{ duration: 250 }}>
        {#each Array(3) as _}
          <div class="aspect-[4/3] sm:aspect-[2.5/1] w-full max-w-4xl rounded-2xl sm:rounded-3xl bg-white/5 animate-pulse flex flex-col justify-end p-5 sm:p-8 border border-white/5 shadow-2xl">
             <div class="h-6 sm:h-8 w-1/4 bg-white/10 rounded-lg mb-3 sm:mb-4"></div>
             <div class="h-10 sm:h-14 w-1/2 bg-white/10 rounded-xl mb-3 sm:mb-4"></div>
             <div class="h-4 sm:h-5 w-1/3 bg-white/10 rounded-lg"></div>
          </div>
        {/each}
      </div>
    {:else if errorMessage}
      <div class="col-start-1 row-start-1 w-full max-w-2xl mx-auto rounded-3xl border border-red-500/20 bg-red-950/20 p-8 text-center backdrop-blur-sm" in:fade out:fade={{ duration: 250 }}>
        <div class="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
          <svg class="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 class="text-red-300 text-xl font-black uppercase italic tracking-tight mb-2">{$t('error.title')}</h3>
        <p class="text-red-300/60 text-sm max-w-md mx-auto">{errorMessage}</p>
      </div>
    {:else}
      {#key activeFilter}
        <div 
          class="col-start-1 row-start-1 w-full pt-4 flex flex-col items-center origin-top"
          in:scale={{ duration: 700, start: 0.98, easing: cubicOut, opacity: 0 }}
          out:fade={{ duration: 300, easing: cubicOut }}
        >
          {#if activeFilter === 'all'}
            <div class="space-y-12 sm:space-y-24 w-full flex flex-col items-center">
              {#each ['genshin', 'hsr', 'zzz'] as game}
                {@const gameBanners = banners.filter(b => b.game_id === game)}
                {@const status = getGameStatus(game)}
                  <div class="w-full space-y-6 sm:space-y-10 group/game">
                    <div class="max-w-3xl mx-auto flex flex-col items-center mb-6 sm:mb-10 text-center">
                      <h2 class="text-2xl sm:text-4xl font-black uppercase italic tracking-tighter text-white/95 mb-2 sm:mb-3 group block">
                        <span class="bg-gradient-to-r from-white/40 via-white to-white/40 bg-clip-text text-transparent group-hover:from-white group-hover:via-white/70 group-hover:to-white transition-all duration-700">
                          {$t(`game.${game}`)}
                        </span>
                      </h2>
                      <div class="h-[1px] w-32 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                    </div>
                    
                    {#if status?.status === 'maintenance'}
                      <div class="w-full max-w-4xl mx-auto rounded-2xl sm:rounded-[2rem] border border-amber-500/15 bg-amber-950/10 p-8 sm:p-12 text-center">
                        <div class="bg-amber-500/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
                          <svg class="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p class="text-amber-300/80 text-sm sm:text-base font-bold uppercase tracking-wider">{$t('status.maintenance')}</p>
                      </div>
                    {:else if status?.status === 'error'}
                      <div class="w-full max-w-4xl mx-auto rounded-2xl sm:rounded-[2rem] border border-red-500/15 bg-red-950/10 p-8 sm:p-12 text-center">
                        <div class="bg-red-500/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                          <svg class="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <p class="text-red-300/80 text-sm sm:text-base font-bold uppercase tracking-wider">{$t('status.error')}</p>
                      </div>
                    {:else if gameBanners.length > 0}
                    <div class="flex flex-col items-center gap-5 sm:gap-10">
                      {#each gameBanners as banner (banner.id)}
                        <div class="w-full max-w-4xl hover-perspective">
                          <BannerCard {banner} />
                        </div>
                      {/each}
                    </div>
                    {:else}
                      <div class="w-full max-w-4xl mx-auto rounded-2xl sm:rounded-[2rem] border border-slate-800/15 bg-slate-900/10 p-8 sm:p-12 text-center">
                        <p class="text-slate-500 text-sm font-bold uppercase tracking-wider">{$t('empty.message')}</p>
                      </div>
                    {/if}
                  </div>
              {/each}
            </div>
          {:else}
            {@const status = getGameStatus(activeFilter)}
            {#if status?.status === 'maintenance'}
              <div class="w-full max-w-2xl mx-auto rounded-2xl sm:rounded-[2rem] border border-amber-500/15 bg-amber-950/10 p-10 sm:p-16 text-center">
                <div class="bg-amber-500/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 border border-amber-500/20">
                  <svg class="w-7 h-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p class="text-amber-300/80 text-base sm:text-xl font-black italic uppercase tracking-tighter">{$t('status.maintenance')}</p>
              </div>
            {:else if status?.status === 'error'}
              <div class="w-full max-w-2xl mx-auto rounded-2xl sm:rounded-[2rem] border border-red-500/15 bg-red-950/10 p-10 sm:p-16 text-center">
                <div class="bg-red-500/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 border border-red-500/20">
                  <svg class="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p class="text-red-300/80 text-base sm:text-xl font-black italic uppercase tracking-tighter">{$t('status.error')}</p>
              </div>
            {:else if filteredBanners.length === 0}
              <div class="w-full max-w-2xl mx-auto rounded-[2rem] border border-slate-800/20 bg-slate-900/10 p-16 text-center backdrop-blur-3xl">
                <p class="text-slate-400 text-xl font-black italic uppercase tracking-tighter">{$t('empty.message')}</p>
              </div>
            {:else}
              <div class="flex flex-col items-center gap-5 sm:gap-10 w-full">
                {#each filteredBanners as banner (banner.id)}
                  <div class="w-full max-w-4xl hover-perspective">
                    <BannerCard {banner} />
                  </div>
                {/each}
              </div>
            {/if}
          {/if}
        </div>
      {/key}
    {/if}
  </section>

  <!-- Footer -->
  <footer class="relative mx-auto max-w-7xl px-3 sm:px-4 pb-6 pt-8 sm:pt-12">
    <div class="h-[1px] w-full bg-gradient-to-r from-transparent via-white/5 to-transparent mb-6"></div>
    <div class="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-slate-400">
      <span class="uppercase tracking-wider font-medium">{$t('footer.madeBy')}</span>
      <a
        href="https://github.com/MastahD4rK"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1.5 text-white/60 hover:text-white transition-colors duration-300"
      >
        <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
        </svg>
        <span class="font-black uppercase tracking-wider">mastah_d4rk</span>
      </a>
    </div>
  </footer>
</main>
