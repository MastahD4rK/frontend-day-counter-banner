<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { fade } from 'svelte/transition'
  import { t } from './i18n/translations'

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

  export let banner: BannerItem

  type Countdown = {
    days: number
    hours: number
    minutes: number
    seconds: number
    finished: boolean
  }

  let countdown: Countdown = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    finished: false,
  }

  let intervalId: ReturnType<typeof setInterval> | null = null
  let carouselInterval: ReturnType<typeof setInterval> | null = null
  let imageFailed = false
  let mousePosition = { x: 0, y: 0 }
  let activeIndex = 0
  let isHovered = false

  const featured = banner.featured_characters && banner.featured_characters.length > 0
    ? banner.featured_characters
    : [{ name: banner.character, image: banner.image || '' }]

  const handleMouseMove = (e: MouseEvent) => {
    isHovered = true
    const { left, top, width, height } = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = (e.clientX - left) / width - 0.5
    const y = (e.clientY - top) / height - 0.5
    mousePosition = { x, y }
  }

  const resetMouse = () => {
    isHovered = false
    mousePosition = { x: 0, y: 0 }
  }

  const startCarousel = () => {
    if (featured.length <= 1) return
    carouselInterval = setInterval(() => {
      if (!isHovered) {
        activeIndex = (activeIndex + 1) % featured.length
      }
    }, 3500)
  }

  const endDateRaw = banner.fin_iso || banner.end_date || ''
  
  $: activeCharacter = featured[activeIndex]
  $: currentTitle = activeCharacter.name || banner.character
  $: currentImage = activeCharacter.image || banner.image || ''

  const subtitle = banner.subtitle || ''
  const category = banner.banner_type || ''
  const game = banner.game_id

  const gameLabel = game === 'hsr' ? 'HSR' : game === 'zzz' ? 'ZZZ' : 'Genshin'
  const accent = banner.color || (game === 'genshin' ? '#22d3ee' : game === 'hsr' ? '#a78bfa' : '#fb923c')

  const calculateCountdown = (endDate: string): Countdown => {
    const target = new Date(endDate).getTime()

    if (Number.isNaN(target)) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        finished: true,
      }
    }

    const now = Date.now()
    const diff = Math.max(0, target - now)
    const finished = diff === 0

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
    const minutes = Math.floor((diff / (1000 * 60)) % 60)
    const seconds = Math.floor((diff / 1000) % 60)

    return { days, hours, minutes, seconds, finished }
  }

  const formatTime = (value: number) => String(value).padStart(2, '0')

  onMount(() => {
    countdown = calculateCountdown(endDateRaw)

    intervalId = setInterval(() => {
      countdown = calculateCountdown(endDateRaw)
    }, 1000)

    startCarousel()
  })

  onDestroy(() => {
    if (intervalId) clearInterval(intervalId)
    if (carouselInterval) clearInterval(carouselInterval)
  })
</script>

<article
  class="group relative w-full aspect-[2/3] overflow-hidden rounded-3xl border transition-all duration-700 hover:shadow-[0_20px_50px_rgba(0,0,0,0.8)] cursor-pointer bg-slate-950 isolate"
  style={`border-color: ${accent}44; box-shadow: 0 0 40px ${accent}15; transform: perspective(1000px) rotateX(${mousePosition.y * -5}deg) rotateY(${mousePosition.x * 5}deg);`}
  on:mousemove={handleMouseMove}
  on:mouseleave={resetMouse}
>
  <!-- Background Glow -->
  <div 
    class="absolute -inset-1 opacity-10 group-hover:opacity-100 transition-opacity duration-700 blur-3xl -z-20 pointer-events-none"
    style={`background: radial-gradient(circle at center, ${accent}66 0%, transparent 80%); transform: translate(${mousePosition.x * 20}px, ${mousePosition.y * 20}px);`}
  ></div>

  <!-- Carousel Indicators -->
  {#if featured.length > 1}
    <div class="absolute right-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2">
      {#each featured as char, i}
        <button
          type="button"
          aria-label={`${$t('card.view')} ${char.name}`}
          class="h-1.5 w-1.5 rounded-full transition-all duration-300"
          style={`background-color: ${activeIndex === i ? accent : 'rgba(255,255,255,0.2)'}; transform: scale(${activeIndex === i ? 1.5 : 1});`}
          on:click|stopPropagation={() => (activeIndex = i)}
        ></button>
      {/each}
    </div>
  {/if}

  {#if currentImage && !imageFailed}
    <div 
      class="absolute inset-x-0 top-0 h-[105%] transition-transform duration-500 ease-out z-0 pointer-events-none"
      style={`transform: scale(1.1) translate(${mousePosition.x * -10}px, ${mousePosition.y * -10}px);`}
    >
      {#key activeIndex}
        <img
          src={currentImage}
          alt={currentTitle}
          class="absolute inset-0 h-full w-full object-cover object-top"
          in:fade={{ duration: 600 }}
          loading="lazy"
          on:error={() => (imageFailed = true)}
        />
      {/key}
      <!-- Vignette and Gradient Overlay -->
      <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
      <div class="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition-colors duration-500"></div>
    </div>
  {:else}
    <div class="absolute inset-0 flex items-center justify-center bg-slate-900 z-0 overflow-hidden pointer-events-none">
      <div class="absolute text-[8rem] font-black text-white/5 whitespace-nowrap -rotate-12 select-none uppercase pointer-events-none">
        {gameLabel} {gameLabel} {gameLabel}
      </div>
      <span class="text-4xl font-black text-white/20 uppercase italic tracking-tighter z-10">{currentTitle}</span>
    </div>
  {/if}

  <!-- Shine Effect on Hover -->
  <div class="absolute inset-0 opacity-0 group-hover:opacity-20 pointer-events-none transition-opacity duration-500 z-10 overflow-hidden">
    <div class="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white to-transparent -skew-x-12"></div>
  </div>

  <div class="relative z-20 flex h-full flex-col justify-end p-5 sm:p-6">
    <!-- Header: Badge and Title -->
    <div class="mb-auto flex items-start justify-between">
      <div
        class="rounded-md border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest backdrop-blur-md"
        style={`border-color: ${accent}88; background-color: ${accent}22; color: ${accent};`}
      >
        {gameLabel}
      </div>
      {#if category}
        <span class="text-[9px] font-bold uppercase tracking-widest text-white/40 bg-white/5 px-2 py-0.5 rounded backdrop-blur-sm border border-white/5">
          {category}
        </span>
      {/if}
    </div>

    <div class="mt-4">
      <h3 class="text-2xl font-black text-white uppercase italic tracking-tighter leading-none group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/60 transition-all duration-300 min-h-[0.8em]">
        {currentTitle}
      </h3>
      {#if subtitle}
        <p class="mt-1 text-[11px] font-bold text-white/50 uppercase tracking-widest line-clamp-1">{subtitle}</p>
      {/if}
    </div>

    <div class="mt-6 space-y-3">
      <div class="flex items-center gap-1.5 overflow-hidden">
        {#each [
          { value: countdown.days, label: $t('card.days') },
          { value: countdown.hours, label: $t('card.hours') },
          { value: countdown.minutes, label: $t('card.minutes') },
          { value: countdown.seconds, label: $t('card.seconds') }
        ] as part, i}
          <div class="flex-1 flex flex-col items-center bg-white/5 rounded-lg py-2 border border-white/5 backdrop-blur-md relative overflow-hidden group/item">
            <span class="text-xl font-black text-white tabular-nums z-10">
               {countdown.finished ? '00' : formatTime(part.value)}
            </span>
            <span class="text-[9px] font-bold text-white/30 uppercase z-10">{part.label}</span>
            <div 
              class="absolute bottom-0 left-0 h-0.5 w-full scale-x-0 group-hover/item:scale-x-100 transition-transform duration-300"
              style={`background-color: ${accent};`}
            ></div>
          </div>
          {#if i < 3}
            <span class="text-white/20 font-black animate-pulse">:</span>
          {/if}
        {/each}
      </div>

      <div class="flex items-center justify-between pt-2">
        <div class="flex items-center gap-1.5">
          <div class={`h-1.5 w-1.5 rounded-full ${countdown.finished ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'} animate-pulse`}></div>
          <span class="text-[10px] font-black uppercase tracking-widest text-white/60">
            {countdown.finished ? $t('card.finished') : $t('card.open')}
          </span>
        </div>
        <div class="text-[9px] font-medium text-white/20 uppercase tracking-tighter">
          {$t('card.sync')}
        </div>
      </div>
    </div>
  </div>
</article>
