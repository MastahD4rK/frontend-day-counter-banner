<script lang="ts">
  import { onMount } from 'svelte'
  import { fade, fly } from 'svelte/transition'
  import { flip } from 'svelte/animate'
  import BannerCard from './lib/BannerCard.svelte'

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
    { key: 'all', label: 'Todos' },
    { key: 'genshin', label: 'Genshin' },
    { key: 'hsr', label: 'HSR' },
    { key: 'zzz', label: 'ZZZ' },
  ] as const

  let isLoading = true
  let errorMessage = ''
  let banners: BannerItem[] = []
  let activeFilter: 'all' | 'genshin' | 'hsr' | 'zzz' = 'all'

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

  onMount(async () => {
    try {
      const response = await fetch(API_URL)

      if (!response.ok) {
        throw new Error(`La API respondió con estado ${response.status}`)
      }

      const payload = (await response.json()) as unknown
      const parsedBanners = pickBanners(payload)
        .filter(hasValidEndDate)
        .filter((b) => b.game_id !== 'general')

      if (parsedBanners.length === 0) {
        throw new Error('La API no devolvió banners válidos con fin_iso/end_date/fecha_fin')
      }

      banners = parsedBanners
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'No se pudo cargar el banner'
    } finally {
      isLoading = false
    }
  })
</script>

<main class="relative min-h-screen bg-slate-950 text-white overflow-x-hidden">
  <div class="pointer-events-none fixed inset-0 -z-10">
    <div class="absolute -top-20 -left-16 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl"></div>
    <div class="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-fuchsia-600/15 blur-3xl"></div>
    <div class="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl"></div>
  </div>

  <header class="sticky top-0 z-30 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
    <div class="mx-auto max-w-7xl px-4 py-4 sm:flex sm:items-center sm:justify-between">
      <div class="mb-4 sm:mb-0">
        <h1 class="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-fuchsia-400 uppercase italic">
          Banner Counter
        </h1>
        <p class="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Sincronizado con servidores oficiales</p>
      </div>
      <nav class="flex items-center gap-2 overflow-x-auto p-1.5 scrollbar-hide">
        {#each TABS as tab}
          <button
            type="button"
            class={`shrink-0 rounded-lg px-5 py-2 text-xs font-black uppercase tracking-wider transition-all duration-300 ${
              activeFilter === tab.key
                ? 'bg-white text-slate-950 shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-110 z-10'
                : 'bg-slate-900/50 text-slate-400 hover:bg-slate-800 hover:text-slate-100 border border-white/5 opacity-80 hover:opacity-100'
            }`}
            on:click={() => (activeFilter = tab.key)}
          >
            {tab.label}
          </button>
        {/each}
      </nav>
    </div>
  </header>

  <section class="mx-auto max-w-7xl px-4 py-8 md:py-12">
    {#if isLoading}
      <div class="flex flex-col items-center justify-center py-20 space-y-4">
        <div class="h-12 w-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <p class="text-slate-400 font-medium animate-pulse">Consultando el rastro galáctico...</p>
      </div>
    {:else if errorMessage}
      <div class="w-full max-w-2xl mx-auto rounded-3xl border border-red-500/20 bg-red-950/20 p-8 text-center backdrop-blur-sm" in:fade>
        <div class="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
          <svg class="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 class="text-red-300 text-xl font-black uppercase italic tracking-tight mb-2">Error de Sincronización</h3>
        <p class="text-red-300/60 text-sm max-w-md mx-auto">{errorMessage}</p>
      </div>
    {:else if filteredBanners.length === 0}
      <div class="w-full max-w-2xl mx-auto rounded-3xl border border-slate-800/50 bg-slate-900/30 p-12 text-center backdrop-blur-sm" in:fade>
        <p class="text-slate-400 text-lg font-medium italic">No se detectaron anomalías temporales para esta sección.</p>
        <p class="text-slate-600 text-xs mt-2 uppercase tracking-widest font-bold">Vuelve en la siguiente actualización</p>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {#each filteredBanners as banner (banner.id)}
          <div animate:flip={{ duration: 600 }} in:fly={{ y: 20, duration: 400, delay: 100 }} out:fade={{ duration: 200 }}>
            <BannerCard {banner} />
          </div>
        {/each}
      </div>
    {/if}
  </section>
</main>
