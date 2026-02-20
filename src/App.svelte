<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { fade, fly, scale } from 'svelte/transition'
  import { cubicOut, quintOut } from 'svelte/easing'
  import BannerCard from './lib/BannerCard.svelte'
  import BannerSkeleton from './lib/BannerSkeleton.svelte'
  import { t, locale, type Locale } from './lib/i18n/translations'
  import type { Banner, GameStatus, BannersEnvelope, StatusResponse } from './lib/types'

  const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
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

  // --- Dark / Light mode ---
  let isDark = typeof window !== 'undefined' ? localStorage.getItem('theme') !== 'light' : true

  $: if (typeof window !== 'undefined') {
    if (isDark) {
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }

  $: filteredBanners =
    activeFilter === 'all' ? banners : banners.filter((b) => b.game_id === activeFilter)

  const backgroundMap: Record<string, string> = {
    genshin: '/images/genshin/environments/nodkrai.webp',
    hsr: '/images/hsr/environments/planarcardia.webp',
    zzz: '/images/zzz/environments/failume.webp',
  }

  const THEME_COLORS: Record<string, string> = {
    all: '#6366f1',
    genshin: '#0ea5e9',
    hsr: '#a855f7',
    zzz: '#eab308',
  }

  $: activeBg = backgroundMap[activeFilter] || ''
  $: themeColor = THEME_COLORS[activeFilter] || THEME_COLORS.all

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

<main class="relative h-screen text-[var(--c-text)] overflow-y-auto overflow-x-hidden scrollbar-thin">
  <!-- Solid Base Background -->
  <div class="fixed inset-0 -z-30 bg-[var(--c-bg)]"></div>

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
    <div 
      class="absolute -top-40 -left-16 h-96 w-96 rounded-full blur-[120px] transition-colors duration-1000" 
      style={`background-color: ${themeColor}15`}
    ></div>
    <div class="absolute top-1/2 -right-24 h-96 w-96 rounded-full bg-fuchsia-600/10 blur-[120px]"></div>
    <div class="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]"></div>
  </div>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <header class="sticky top-0 z-50 backdrop-blur-3xl border-b" style="background: var(--c-header); border-color: var(--c-border);" on:mouseleave={closeDropdowns}>
    <div class="mx-auto max-w-7xl px-3 sm:px-4 py-3 lg:py-5">

      <!-- Mobile layout: 2 rows. Desktop: 1 row -->
      <!-- ROW 1 (mobile): Logo + controls | Desktop: Logo -->
      <div class="flex items-center justify-between lg:hidden mb-2.5">
        <h1 class="text-xl font-black uppercase italic tracking-tighter">
          BANNER <span class="transition-colors duration-500" style={`color: ${themeColor}`}>COUNTER</span>
        </h1>

        <!-- Right controls: theme toggle + lang -->
        <div class="flex items-center gap-1.5">
          <!-- Theme Toggle -->
          <button
            on:click={() => (isDark = !isDark)}
            class="flex items-center justify-center w-8 h-8 rounded-lg border transition-all"
            style="background: var(--c-control); border-color: var(--c-border);"
            title={isDark ? 'Modo claro' : 'Modo oscuro'}
          >
            {#if isDark}
              <!-- sun -->
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            {:else}
              <!-- moon -->
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"/>
              </svg>
            {/if}
          </button>

          <!-- Language Switch (mobile) -->
          <div class="relative">
            <button
              on:click={() => (showLanguageDropdown = !showLanguageDropdown)}
              class="flex items-center gap-1 px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all"
              style="background: var(--c-control); border-color: var(--c-border); color: var(--c-text);"
            >
              {$locale.toUpperCase()}
              <svg class={`w-2.5 h-2.5 transition-transform duration-300 ${showLanguageDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {#if showLanguageDropdown}
              <div 
                class="absolute top-full right-0 mt-2 w-24 rounded-xl overflow-hidden backdrop-blur-3xl shadow-2xl z-[60] border"
                style="background: var(--c-panel); border-color: var(--c-border-md);"
                in:fly={{ y: -10, duration: 200 }}
              >
                {#each ['es', 'en'] as l}
                  <button
                    on:click={() => { $locale = l as Locale; showLanguageDropdown = false; }}
                    class={`w-full text-center px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${
                      $locale === l ? 'bg-white text-black' : (isDark ? 'hover:bg-white/5' : 'hover:bg-black/5')
                    }`}
                    style={$locale !== l ? `color: var(--c-text-muted);` : ''}
                  >
                    {l === 'es' ? 'ES' : 'EN'}
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      </div>

      <!-- ROW 2 (mobile): Server + Filters scrollable -->
      <div class="flex items-center gap-2 lg:hidden">
        <!-- Server Selection -->
        <div class="relative flex-shrink-0">
          <button
            on:click={() => (showServerDropdown = !showServerDropdown)}
            class="flex items-center gap-1 px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap border transition-all"
            style="background: var(--c-control); border-color: var(--c-border); color: var(--c-text);"
          >
            {SERVERS.find(s => s.key === currentServer)?.key.slice(0, 3) || 'AME'}
            <svg class={`w-2.5 h-2.5 transition-transform duration-300 ${showServerDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {#if showServerDropdown}
            <div 
              class="absolute top-full left-0 mt-2 w-36 rounded-xl overflow-hidden backdrop-blur-3xl shadow-2xl z-[60] border"
              style="background: var(--c-panel); border-color: var(--c-border-md);"
              in:fly={{ y: -10, duration: 200 }}
            >
              {#each SERVERS as server}
                <button
                  on:click={() => { currentServer = server.key; showServerDropdown = false; }}
                  class={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${
                    currentServer === server.key ? 'bg-indigo-600 text-white' : (isDark ? 'hover:bg-white/5' : 'hover:bg-black/5')
                  }`}
                  style={currentServer !== server.key ? `color: var(--c-text-muted);` : ''}
                >
                  {$t(server.label)}
                </button>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Filter Tabs (scrollable) -->
        <nav class="flex items-center gap-0.5 p-0.5 rounded-lg overflow-x-auto scrollbar-hide border" style="background: var(--c-control); border-color: var(--c-border);">
          {#each TABS as tab}
            {@const isActive = activeFilter === tab.key}
            {@const tabColor = THEME_COLORS[tab.key] || THEME_COLORS.all}
            <button
              on:click={() => (activeFilter = tab.key)}
              class={`px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-md transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                isActive ? 'text-white' : ''
              }`}
              style={isActive
                ? `background-color: ${tabColor}; box-shadow: 0 4px 12px ${tabColor}44;`
                : `color: var(--c-text-muted);`}
            >
              {tab.key === 'all' ? $t(tab.label) : $t(`game.${tab.key}`)}
            </button>
          {/each}
        </nav>
      </div>

      <!-- DESKTOP: single row -->
      <div class="hidden lg:flex items-center justify-between">
        <h1 class="text-2xl font-black uppercase italic tracking-tighter">
          BANNER <span class="transition-colors duration-500" style={`color: ${themeColor}`}>COUNTER</span>
        </h1>

        <div class="flex items-center gap-4">
          <!-- Server Selection -->
          <div class="relative">
            <button
              on:click={() => (showServerDropdown = !showServerDropdown)}
              class="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-80 transition-all border"
              style="background: var(--c-control); border-color: var(--c-border); color: var(--c-text);"
            >
              <span class="font-bold" style="color: var(--c-text-muted);">SERVER:</span>
              {SERVERS.find(s => s.key === currentServer)?.key || 'AMERICA'}
              <svg class={`w-3 h-3 transition-transform duration-300 ${showServerDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {#if showServerDropdown}
              <div 
                class="absolute top-full left-0 mt-2 w-40 rounded-xl overflow-hidden backdrop-blur-3xl shadow-2xl z-[60] border"
                style="background: var(--c-panel); border-color: var(--c-border-md);"
                in:fly={{ y: -10, duration: 200 }}
              >
                {#each SERVERS as server}
                  <button
                    on:click={() => { currentServer = server.key; showServerDropdown = false; }}
                    class={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${
                      currentServer === server.key ? 'bg-indigo-600 text-white' : (isDark ? 'hover:bg-white/5' : 'hover:bg-black/5')
                    }`}
                    style={currentServer !== server.key ? `color: var(--c-text-muted);` : ''}
                  >
                    {$t(server.label)}
                  </button>
                {/each}
              </div>
            {/if}
          </div>

          <!-- Filter Navigation -->
          <nav class="flex items-center gap-1 p-1 rounded-xl border" style="background: var(--c-control); border-color: var(--c-border);">
            {#each TABS as tab}
              {@const isActive = activeFilter === tab.key}
              {@const tabColor = THEME_COLORS[tab.key] || THEME_COLORS.all}
              <button
                on:click={() => (activeFilter = tab.key)}
                class={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all duration-300 whitespace-nowrap ${
                  isActive ? 'text-white' : (isDark ? 'hover:bg-white/5' : 'hover:bg-black/5')
                }`}
                style={isActive
                  ? `background-color: ${tabColor}; box-shadow: 0 5px 15px ${tabColor}44;`
                  : `color: var(--c-text-muted);`}
              >
                {tab.key === 'all' ? $t(tab.label) : $t(`game.${tab.key}`)}
              </button>
            {/each}
          </nav>

          <!-- Theme Toggle -->
          <button
            on:click={() => (isDark = !isDark)}
            class="flex items-center justify-center w-9 h-9 rounded-xl border transition-all hover:opacity-80"
            style="background: var(--c-control); border-color: var(--c-border);"
            title={isDark ? 'Modo claro' : 'Modo oscuro'}
          >
            {#if isDark}
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="color: var(--c-text);">
                <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            {:else}
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="color: var(--c-text);">
                <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"/>
              </svg>
            {/if}
          </button>

          <!-- Language Switch -->
          <div class="relative">
            <button
              on:click={() => (showLanguageDropdown = !showLanguageDropdown)}
              class="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-80 transition-all border"
              style="background: var(--c-control); border-color: var(--c-border); color: var(--c-text);"
            >
              <span class="font-bold" style="color: var(--c-text-muted);">LANG:</span>
              {$locale.toUpperCase()}
              <svg class={`w-3 h-3 transition-transform duration-300 ${showLanguageDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {#if showLanguageDropdown}
              <div 
                class="absolute top-full right-0 mt-2 w-28 rounded-xl overflow-hidden backdrop-blur-3xl shadow-2xl z-[60] border"
                style="background: var(--c-panel); border-color: var(--c-border-md);"
                in:fly={{ y: -10, duration: 200 }}
              >
                {#each ['es', 'en'] as l}
                  <button
                    on:click={() => { $locale = l as Locale; showLanguageDropdown = false; }}
                    class={`w-full text-center px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${
                      $locale === l ? 'bg-white text-black' : (isDark ? 'hover:bg-white/5' : 'hover:bg-black/5')
                    }`}
                    style={$locale !== l ? `color: var(--c-text-muted);` : ''}
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

  <section class="relative mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-6 lg:py-10 grid grid-cols-1 overflow-hidden">
    {#if isLoading}
      <div class="col-start-1 row-start-1 flex flex-col items-center gap-5 sm:gap-10" out:fade={{ duration: 250 }}>
        {#each Array(3) as _}
          <BannerSkeleton />
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
                      <h2 class="text-2xl sm:text-4xl font-black uppercase italic tracking-tighter mb-2 sm:mb-3" style="color: var(--c-text);">
                          {$t(`game.${game}`)}
                      </h2>
                      <div class="h-[1px] w-32" style="background: linear-gradient(to right, transparent, var(--c-border-md), transparent);"></div>
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
  <footer class="relative mx-auto max-w-7xl px-3 sm:px-4 pb-4 pt-4 sm:pt-6">
    <div class="h-[1px] w-full mb-4" style="background: linear-gradient(to right, transparent, var(--c-border-md), transparent);"></div>
    <div class="flex flex-col items-center gap-2">
      <div class="flex items-center justify-center gap-2 text-[10px] sm:text-xs" style="color: var(--c-text-muted);">
        <span class="uppercase tracking-wider font-medium">{$t('footer.madeBy')}</span>
        <a
          href="https://github.com/MastahD4rK"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 transition-colors duration-300 text-[var(--c-text-muted)] hover:text-[var(--c-text)]"
        >
          <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          <span class="font-black uppercase tracking-wider">mastah_d4rk</span>
        </a>
      </div>
      <p class="text-[9px] sm:text-[10px] text-center max-w-lg leading-relaxed opacity-60" style="color: var(--c-text-muted);">
        {$t('footer.disclaimer')}
      </p>
    </div>
  </footer>
</main>
