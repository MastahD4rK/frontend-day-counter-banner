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

  $: filteredBanners =
    activeFilter === 'all' ? banners : banners.filter((banner) => banner.game_id === activeFilter)

  $: if (currentServer) {
    fetchBanners()
  }

  onMount(() => {
    // El reactive statement ya se encarga del fetch inicial
  })
</script>

<main class="relative min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
  <div class="pointer-events-none fixed inset-0 -z-10">
    <div class="absolute -top-40 -left-16 h-96 w-96 rounded-full bg-indigo-600/10 blur-[120px]"></div>
    <div class="absolute top-1/2 -right-24 h-96 w-96 rounded-full bg-fuchsia-600/10 blur-[120px]"></div>
    <div class="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]"></div>
  </div>

  <header class="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-3xl border-b border-white/5">
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

          <!-- Mobile Language Switcher (Only visible on small mobile) -->
          <div class="flex items-center gap-1 p-0.5 bg-white/[0.03] border border-white/5 rounded-xl lg:hidden">
            {#each ['es', 'en'] as l}
              <button
                on:click={() => ($locale = l as Locale)}
                class={`px-2 py-1 text-[9px] font-black uppercase rounded-lg transition-all duration-500 ${
                  $locale === l ? 'bg-white text-black' : 'text-slate-600'
                }`}
              >
                {l}
              </button>
            {/each}
          </div>
        </div>

        <!-- Controls Cluster (Horizontal on Desktop) -->
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
          
          <!-- Server Selection -->
          <div class="flex items-center gap-1 p-1 bg-white/[0.03] border border-white/5 rounded-xl">
            {#each SERVERS as server}
              <button
                on:click={() => (currentServer = server.key)}
                class={`text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all duration-500 ${
                  currentServer === server.key
                    ? 'bg-white text-black shadow-lg scale-100'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                {$t(server.label)}
              </button>
            {/each}
          </div>

          <!-- Filter Navigation -->
          <nav class="flex items-center gap-1 p-1 bg-white/[0.03] border border-white/5 rounded-xl overflow-x-auto scrollbar-hide">
            {#each TABS as tab}
              <button
                on:click={() => (activeFilter = tab.key)}
                class={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all duration-500 whitespace-nowrap ${
                  activeFilter === tab.key
                    ? 'bg-indigo-600 text-white shadow-[0_5px_15px_rgba(79,70,229,0.3)]'
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                {$t(tab.label)}
              </button>
            {/each}
          </nav>

          <!-- Desktop Language Switch -->
          <div class="hidden lg:flex items-center gap-1 p-1 bg-white/[0.03] border border-white/5 rounded-xl">
            {#each ['es', 'en'] as l}
              <button
                on:click={() => ($locale = l as Locale)}
                class={`px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all duration-500 ${
                  $locale === l ? 'bg-white/10 text-white shadow-inner' : 'text-slate-600 hover:text-slate-300'
                }`}
              >
                {l}
              </button>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </header>

  <section class="mx-auto max-w-7xl px-4 py-8 lg:py-12">
    {#if isLoading}
      <div class="flex flex-wrap justify-center gap-10">
        {#each Array(3) as _}
          <div class="aspect-[2/3] w-full max-w-[320px] rounded-3xl bg-white/5 animate-pulse flex flex-col justify-end p-8 border border-white/5 shadow-2xl">
             <div class="h-8 w-3/4 bg-white/10 rounded-lg mb-4"></div>
             <div class="h-14 w-full bg-white/10 rounded-xl mb-4"></div>
             <div class="h-5 w-1/2 bg-white/10 rounded-lg"></div>
          </div>
        {/each}
      </div>
    {:else if errorMessage}
      <div class="w-full max-w-2xl mx-auto rounded-3xl border border-red-500/20 bg-red-950/20 p-8 text-center backdrop-blur-sm" in:fade>
        <div class="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
          <svg class="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 class="text-red-300 text-xl font-black uppercase italic tracking-tight mb-2">{$t('error.title')}</h3>
        <p class="text-red-300/60 text-sm max-w-md mx-auto">{errorMessage}</p>
      </div>
    {:else if activeFilter === 'all'}
      <div class="space-y-20">
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
              
              <div class="flex flex-wrap justify-center gap-10">
                {#each gameBanners as banner (banner.id)}
                  <div in:fly={{ y: 20, duration: 400, delay: 100 }} class="w-full max-w-[320px]">
                    <BannerCard {banner} />
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        {/each}

        {#if banners.length === 0}
          <div class="w-full max-w-2xl mx-auto rounded-3xl border border-slate-800/50 bg-slate-900/30 p-12 text-center backdrop-blur-sm" in:fade>
            <p class="text-slate-400 text-lg font-medium italic">{$t('empty.message')}</p>
            <p class="text-slate-600 text-xs mt-2 uppercase tracking-widest font-bold">{$t('empty.submessage')}</p>
          </div>
        {/if}
      </div>
    {:else if filteredBanners.length === 0}
      <div class="w-full max-w-2xl mx-auto rounded-3xl border border-slate-800/50 bg-slate-900/30 p-12 text-center backdrop-blur-sm" in:fade>
        <p class="text-slate-400 text-lg font-medium italic">{$t('empty.message')}</p>
        <p class="text-slate-600 text-xs mt-2 uppercase tracking-widest font-bold">{$t('empty.submessage')}</p>
      </div>
    {:else}
      {#key activeFilter}
        <div 
          class="flex flex-wrap justify-center gap-10"
          in:fade={{ duration: 400, delay: 200 }}
          out:fade={{ duration: 200 }}
        >
          {#each filteredBanners as banner (banner.id)}
            <div in:fly={{ y: 20, duration: 400, delay: 100 }} class="w-full max-w-[320px]">
              <BannerCard {banner} />
            </div>
          {/each}
        </div>
      {/key}
    {/if}
  </section>
</main>
