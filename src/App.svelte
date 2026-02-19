<script lang="ts">
  import { onMount } from 'svelte'
  import { fade, fly } from 'svelte/transition'
  import BannerCard from './lib/BannerCard.svelte'
  import { t, locale, type Locale } from './lib/i18n/translations'

  type FeaturedCharacter = {
    name: string
    image: string
  }

  type BannerItem = {
    id: string | number
    game_id: 'genshin' | 'hsr' | 'zzz' | 'general'
    character: string
    image?: string
    color?: string
    subtitle?: string
    banner_type?: string
    fin_iso?: string
    end_date?: string
    featured_characters?: FeaturedCharacter[]
  }

  const API_URL = '/api/banners'
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
  let banners: BannerItem[] = []
  let activeFilter: 'all' | 'genshin' | 'hsr' | 'zzz' = 'all'
  let currentServer: 'america' | 'europe' | 'asia' | 'sar' = 'america'

  const fetchBanners = async () => {
    isLoading = true
    errorMessage = ''
    try {
      const response = await fetch(`${API_URL}?server=${currentServer}`)

      if (!response.ok) {
        throw new Error(`La API respondió con estado ${response.status}`)
      }

      const payload = (await response.json()) as unknown
      const parsedBanners = pickBanners(payload)
        .filter(hasValidEndDate)
        .filter((b) => b.game_id !== 'general')

      banners = parsedBanners
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'No se pudo cargar el banner'
    } finally {
      isLoading = false
    }
  }

  const pickBanners = (payload: unknown): BannerItem[] => {
    if (Array.isArray(payload)) {
      return payload as BannerItem[]
    }

    if (payload && typeof payload === 'object') {
      const obj = payload as Record<string, unknown>

      if (Array.isArray(obj.banners)) {
        return obj.banners as BannerItem[]
      }

      if (Array.isArray(obj.data)) {
        return obj.data as BannerItem[]
      }
    }

    return []
  }

  const hasValidEndDate = (item: BannerItem) => Boolean(item.fin_iso || item.end_date)

  let showServerDropdown = false
  let showLanguageDropdown = false

  const closeDropdowns = () => {
    showServerDropdown = false
    showLanguageDropdown = false
  }

  $: filteredBanners =
    activeFilter === 'all' ? banners : banners.filter((banner) => banner.game_id === activeFilter)

  // Map filters to background images
  const backgroundMap: Record<string, string> = {
    genshin: '/images/genshin/environments/nodkrai.webp',
    hsr: '/images/hsr/environments/planarcardia.webp',
    zzz: '/images/zzz/environments/failume.webp',
  }

  $: activeBg = backgroundMap[activeFilter] || ''

  $: if (currentServer) {
    fetchBanners()
  }

  onMount(() => {
    // El reactive statement ya se encarga del fetch inicial
  })
</script>

<main class="relative min-h-screen text-white overflow-x-hidden">
  <!-- Solid Base Background -->
  <div class="fixed inset-0 -z-30 bg-[#0a0a0f]"></div>

  <!-- Dynamic Environment Backgrounds -->
  <div class="pointer-events-none fixed inset-0 -z-20 overflow-hidden">
    {#key activeBg}
      {#if activeBg}
        <div 
          class="absolute inset-0 bg-cover bg-center transition-opacity duration-700 scale-100 will-change-opacity"
          style={`background-image: url('${activeBg}')`}
          in:fade={{ duration: 700 }}
          out:fade={{ duration: 500 }}
        ></div>
        <!-- Darkness Overlay for readability (Lighter now) -->
        <div class="absolute inset-0 bg-[#0a0a0f]/50 backdrop-blur-sm"></div>
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
    <div class="mx-auto max-w-7xl px-4 py-4 lg:py-5">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <!-- Logo & Brand -->
        <div class="flex items-center justify-between">
          <div class="space-y-0.5">
            <h1 class="text-2xl font-black uppercase italic tracking-tighter text-white">
              BANNER <span class="bg-gradient-to-r from-indigo-500 via-purple-400 to-pink-500 bg-clip-text text-transparent">COUNTER</span>
            </h1>
            <p class="text-[9px] font-bold tracking-[0.3em] text-slate-500 uppercase leading-none">
              {$t('header.sync')}
            </p>
          </div>
        </div>

        <!-- Controls Cluster -->
        <div class="flex flex-wrap items-center gap-3 md:gap-4">
          
          <!-- Server Selection (Dropdown) -->
          <div class="relative">
            <button
              on:click={() => (showServerDropdown = !showServerDropdown)}
              class="flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/5 transition-all"
            >
              <span class="text-slate-500 font-bold">SERVER:</span>
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
          <nav class="flex items-center gap-1 p-1 bg-white/[0.03] border border-white/5 rounded-xl overflow-x-auto scrollbar-hide">
            {#each TABS as tab}
              <button
                on:click={() => (activeFilter = tab.key)}
                class={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all duration-500 whitespace-nowrap ${
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
              class="flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/5 transition-all"
            >
              <span class="text-slate-500 font-bold">LANG:</span>
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

  <section class="mx-auto max-w-7xl px-4 py-8 lg:py-12 grid grid-cols-1 overflow-hidden">
    {#if isLoading}
      <div class="col-start-1 row-start-1 flex flex-col items-center gap-10" out:fade={{ duration: 200 }}>
        {#each Array(3) as _}
          <div class="aspect-[2.5/1] w-full max-w-4xl rounded-3xl bg-white/5 animate-pulse flex flex-col justify-end p-8 border border-white/5 shadow-2xl">
             <div class="h-8 w-1/4 bg-white/10 rounded-lg mb-4"></div>
             <div class="h-14 w-1/2 bg-white/10 rounded-xl mb-4"></div>
             <div class="h-5 w-1/3 bg-white/10 rounded-lg"></div>
          </div>
        {/each}
      </div>
    {:else if errorMessage}
      <div class="col-start-1 row-start-1 w-full max-w-2xl mx-auto rounded-3xl border border-red-500/20 bg-red-950/20 p-8 text-center backdrop-blur-sm" in:fade out:fade={{ duration: 200 }}>
        <div class="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
          <svg class="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 class="text-red-300 text-xl font-black uppercase italic tracking-tight mb-2">{$t('error.title')}</h3>
        <p class="text-red-300/60 text-sm max-w-md mx-auto">{errorMessage}</p>
      </div>
    {:else if activeFilter === 'all'}
      <div class="col-start-1 row-start-1 space-y-20 w-full" in:fade out:fade={{ duration: 200 }}>
        {#each ['genshin', 'hsr', 'zzz'] as game}
          {@const gameBanners = banners.filter(b => b.game_id === game)}
          {#if gameBanners.length > 0}
            <div in:fade={{ duration: 600 }}>
              <div class="max-w-3xl mx-auto flex flex-col items-center mb-10 text-center">
                <h2 class="text-3xl font-black uppercase italic tracking-tighter text-white/90 mb-3">
                  {$t(`game.${game}`)}
                </h2>
                <div class="h-[1px] w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              </div>
              
              <div class="flex flex-col items-center gap-10">
                {#each gameBanners as banner (banner.id)}
                  <div in:fly={{ y: 20, duration: 400, delay: 100 }} class="w-full max-w-4xl">
                    <BannerCard {banner} />
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        {/each}

        {#if banners.length === 0}
          <div class="w-full max-w-2xl mx-auto rounded-3xl border border-slate-800/50 bg-slate-900/30 p-12 text-center backdrop-blur-sm" in:fade out:fade={{ duration: 200 }}>
            <p class="text-slate-400 text-lg font-medium italic">{$t('empty.message')}</p>
            <p class="text-slate-600 text-xs mt-2 uppercase tracking-widest font-bold">{$t('empty.submessage')}</p>
          </div>
        {/if}
      </div>
    {:else if filteredBanners.length === 0}
      <div class="col-start-1 row-start-1 w-full max-w-2xl mx-auto rounded-3xl border border-slate-800/50 bg-slate-900/30 p-12 text-center backdrop-blur-sm" in:fade out:fade={{ duration: 200 }}>
        <p class="text-slate-400 text-lg font-medium italic">{$t('empty.message')}</p>
        <p class="text-slate-600 text-xs mt-2 uppercase tracking-widest font-bold">{$t('empty.submessage')}</p>
      </div>
    {:else}
      <div class="col-start-1 row-start-1 w-full flex justify-center">
        {#key activeFilter}
          <div class="grid grid-cols-1 grid-rows-1 justify-items-center w-full">
            <div 
              class="col-start-1 row-start-1 flex flex-col items-center gap-10 w-full"
              in:fade={{ duration: 400, delay: 200 }}
              out:fade={{ duration: 200 }}
            >
              {#each filteredBanners as banner (banner.id)}
                <div in:fly={{ y: 20, duration: 400, delay: 100 }} class="w-full max-w-4xl">
                  <BannerCard {banner} />
                </div>
              {/each}
            </div>
          </div>
        {/key}
      </div>
    {/if}
  </section>
</main>
