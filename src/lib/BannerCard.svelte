<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { fade } from 'svelte/transition'
  import { t } from './i18n/translations'
  import { resolveCharacterImage } from './utils/images'

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
    ? banner.featured_characters.map(char => ({
        ...char,
        image: resolveCharacterImage(char.name, char.image)
      }))
    : [{ name: banner.character, image: resolveCharacterImage(banner.character, banner.image || '') }]

  const handleMouseMove = (e: MouseEvent) => {
    isHovered = true
    requestAnimationFrame(() => {
      const { left, top, width, height } = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const x = (e.clientX - left) / width - 0.5
      const y = (e.clientY - top) / height - 0.5
      mousePosition = { x, y }
    })
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

  const gameLabel = game === 'hsr' ? 'HSR' : game === 'zzz' ? 'ZZZ' : 'GENSHIN'
  const accent = banner.color || (game === 'genshin' ? '#60A5FA' : game === 'hsr' ? '#A855F7' : '#FB923C')

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
  class="group relative w-full aspect-[21/9] sm:aspect-[2.5/1] overflow-hidden rounded-[2rem] border transition-transform duration-500 hover:shadow-[0_40px_80px_rgba(0,0,0,0.9)] cursor-pointer bg-slate-950 isolate will-change-transform"
  style={`
    border-color: ${accent}33; 
    box-shadow: 0 0 60px ${accent}10; 
    transform: perspective(2000px) rotateX(${mousePosition.y * -3}deg) rotateY(${mousePosition.x * 3}deg) translateZ(0);
    -webkit-mask-image: -webkit-radial-gradient(white, black);
  `}
  on:mousemove={handleMouseMove}
  on:mouseleave={resetMouse}
>
  <!-- Background Glow -->
  <div 
    class="absolute -inset-1 opacity-20 group-hover:opacity-100 transition-opacity duration-700 blur-[100px] -z-20 pointer-events-none"
    style={`background: radial-gradient(circle at center, ${accent}44 0%, transparent 70%); transform: translate(${mousePosition.x * 40}px, ${mousePosition.y * 40}px);`}
  ></div>

  <!-- Carousel Indicators -->
  {#if featured.length > 1}
    <div class="absolute left-6 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2.5">
      {#each featured as char, i}
        <button
          type="button"
          aria-label={`${$t('card.view')} ${char.name}`}
          class="h-1 w-4 rounded-full transition-all duration-500"
          style={`background-color: ${activeIndex === i ? accent : 'rgba(255,255,255,0.1)'}; width: ${activeIndex === i ? '24px' : '12px'};`}
          on:click|stopPropagation={() => (activeIndex = i)}
        ></button>
      {/each}
    </div>
  {/if}

  {#if currentImage && !imageFailed}
    <div 
      class="absolute inset-0 transition-transform duration-700 ease-out z-0 pointer-events-none"
      style={`transform: scale(1.05) translate(${mousePosition.x * -15}px, ${mousePosition.y * -15}px);`}
    >
      {#key activeIndex}
        <img
          src={currentImage}
          alt={currentTitle}
          class={`absolute right-0 h-full w-full sm:w-2/3 object-cover object-center transition-opacity duration-1000 ${countdown.finished ? 'opacity-30 grayscale' : 'opacity-100'}`}
          in:fade={{ duration: 800 }}
          loading="lazy"
          on:error={() => (imageFailed = true)}
        />
      {/key}
      <!-- Multi-layered Gradients for Banner Look -->
      <div class="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent"></div>
      <div class="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent"></div>
    </div>
  {:else}
    <div class="absolute inset-0 flex items-center justify-center bg-slate-900 z-0 overflow-hidden pointer-events-none">
      <span class="text-6xl font-black text-white/20 uppercase italic tracking-tighter z-10">{currentTitle}</span>
    </div>
  {/if}

  <!-- Shine Effect on Hover -->
  <div class="absolute inset-0 opacity-0 group-hover:opacity-30 pointer-events-none transition-opacity duration-700 z-10 overflow-hidden">
    <div class="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1500 ease-in-out bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12"></div>
  </div>

  <div class="relative z-20 flex h-full items-center p-8 sm:p-12 lg:p-16">
    <div class="flex flex-col max-w-lg">
      <div class="space-y-4">
        <h3 class="text-5xl sm:text-6xl lg:text-7xl font-black text-white uppercase italic tracking-tighter leading-[0.85] group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/70 transition-all duration-500">
          {currentTitle}
        </h3>
      </div>

      <div class="mt-12 sm:mt-16">
        {#if countdown.finished}
          <div class="px-8 py-4 bg-red-600/20 border border-red-500/30 rounded-2xl backdrop-blur-xl">
            <span class="text-2xl font-black text-red-500 italic tracking-tighter uppercase animate-pulse">
              {$t('card.finished')}
            </span>
          </div>
        {:else}
          <div class="flex items-center gap-4">
            {#each [
              { value: countdown.days, label: $t('card.days') },
              { value: countdown.hours, label: $t('card.hours') },
              { value: countdown.minutes, label: $t('card.minutes') },
              { value: countdown.seconds, label: $t('card.seconds') }
            ] as part, i}
              <div class="flex flex-col items-center min-w-[75px] sm:min-w-[85px] bg-white/[0.02] rounded-[1.25rem] p-5 sm:p-6 border border-white/5 backdrop-blur-3xl group/item relative overflow-hidden transition-all duration-500 hover:bg-white/[0.08] hover:-translate-y-1">
                <span class="text-3xl sm:text-4xl font-black text-white tabular-nums z-10 leading-none mb-1">
                  {formatTime(part.value)}
                </span>
                <span class="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] z-10">{part.label}</span>
                <div 
                  class="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-2/3 scale-x-0 group-hover/item:scale-x-100 transition-transform duration-500"
                  style={`background-color: ${accent}; shadow: 0 0 15px ${accent};`}
                ></div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
</article>
