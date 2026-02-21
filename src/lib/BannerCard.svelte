<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { fade } from 'svelte/transition'
  import { t } from './i18n/translations'
  import { resolveCharacterImage } from './utils/images'
  import type { Banner } from './types'

  interface Props { banner: Banner }
  const { banner }: Props = $props()

  // Reactive state
  let now = $state(Date.now())
  let activeIndex = $state(0)
  let imageFailed = $state(false)
  let ticker: ReturnType<typeof setInterval>
  let carouselInterval: ReturnType<typeof setInterval>

  // Derived from props (reactive)
  const featured = $derived.by(() => {
    const fc = banner.featured_characters
    if (fc && fc.length > 0) {
      return fc.map((name: string) => ({
        name,
        image: resolveCharacterImage(name)
      }))
    }
    return [{ name: banner.character, image: resolveCharacterImage(banner.character) }]
  })

  const targetDate = $derived(new Date(banner.end_date).getTime())
  const accent = $derived(banner.color || '#60A5FA')

  const countdown = $derived.by(() => {
    if (Number.isNaN(targetDate)) return { days: 0, hours: 0, minutes: 0, seconds: 0, finished: true }
    const diff = Math.max(0, targetDate - now)
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      finished: diff <= 0
    }
  })

  const activeCharacter = $derived(featured[activeIndex])
  const currentTitle = $derived(activeCharacter?.name || banner.character)
  const currentImage = $derived(activeCharacter?.image || '')

  // --- Progress bar (using real start_date from backend) ---
  const startDate = $derived(new Date(banner.start_date).getTime())
  const progress = $derived.by(() => {
    if (Number.isNaN(targetDate) || Number.isNaN(startDate)) return 0
    const total = targetDate - startDate
    const elapsed = now - startDate
    return Math.min(100, Math.max(0, (elapsed / total) * 100))
  })

  // --- Share ---
  let copied = $state(false)
  const shareUrl = $derived(`${typeof window !== 'undefined' ? window.location.origin : ''}`)

  const handleShare = async () => {
    const text = `${currentTitle} — ${countdown.days}d ${countdown.hours}h ${countdown.minutes}m restantes`
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'Banner Counter', text, url: shareUrl })
        return
      } catch { /* cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${shareUrl}`)
      copied = true
      setTimeout(() => (copied = false), 2000)
    } catch { /* clipboard denied */ }
  }

  const formatTime = (value: number) => String(value).padStart(2, '0')

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const formattedStart = $derived(formatDate(banner.start_date))
  const formattedEnd   = $derived(formatDate(banner.end_date))

  onMount(() => {
    ticker = setInterval(() => { now = Date.now() }, 1000)

    if (featured.length > 1) {
      carouselInterval = setInterval(() => {
        activeIndex = (activeIndex + 1) % featured.length
      }, 4000)
    }
  })

  onDestroy(() => {
    clearInterval(ticker)
    if (carouselInterval) clearInterval(carouselInterval)
  })
</script>

<article
  class="relative w-full aspect-[16/9] sm:aspect-[2.5/1] overflow-hidden rounded-2xl sm:rounded-[2rem] border bg-slate-950 isolate shadow-2xl"
  style={`border-color: ${accent}33; box-shadow: 0 0 60px ${accent}05;`}
>
  <!-- Background Glow -->
  <div 
    class="absolute -inset-1 opacity-20 blur-[80px] sm:blur-[100px] -z-20 pointer-events-none"
    style={`background: radial-gradient(circle at center, ${accent}44 0%, transparent 70%);`}
  ></div>

  <!-- Carousel Indicators -->
  {#if featured.length > 1}
    <div class="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2">
      {#each featured as _, i}
        <div
          class="h-1 rounded-full transition-all duration-500"
          style={`background-color: ${activeIndex === i ? accent : 'rgba(255,255,255,0.1)'}; width: ${activeIndex === i ? '16px' : '6px'};`}
        ></div>
      {/each}
    </div>
  {/if}

  {#if currentImage && !imageFailed}
    <div class="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      {#key activeIndex}
        <img
          src={currentImage}
          alt={currentTitle}
          class={`absolute right-0 bottom-0 h-full w-full object-cover object-top sm:object-center sm:w-3/4 ${countdown.finished ? 'opacity-20 grayscale blur-sm' : 'opacity-100'}`}
          in:fade={{ duration: 800 }}
          out:fade={{ duration: 400 }}
          loading="lazy"
          onerror={() => (imageFailed = true)}
        />
      {/key}
      <!-- Smooth multi-stop gradient -->
      <div class="absolute inset-0 bg-gradient-to-t from-slate-950 from-0% via-slate-950/70 via-35% to-transparent to-60% sm:bg-gradient-to-r sm:from-slate-950 sm:from-15% sm:via-slate-950/90 sm:via-30% sm:to-transparent sm:to-65%"></div>
      <div class="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent sm:from-slate-950/50"></div>
    </div>
  {:else}
    <div class="absolute inset-0 flex items-center justify-center bg-slate-900 z-0 overflow-hidden pointer-events-none">
      <span class="text-6xl font-black text-white/20 uppercase italic tracking-tighter z-10">{currentTitle}</span>
    </div>
  {/if}

  <div class="relative z-20 flex h-full items-end sm:items-center p-5 pb-6 sm:p-12 lg:p-16">
    <div class="flex flex-col max-w-lg w-full">
      <div class="grid grid-cols-1">
        {#key currentTitle}
          <div 
            class="col-start-1 row-start-1"
            in:fade={{ duration: 400 }}
            out:fade={{ duration: 250 }}
          >
            <h3 class="text-3xl sm:text-6xl lg:text-7xl font-black text-white uppercase italic tracking-tighter leading-[0.85]">
              {currentTitle}
            </h3>
          </div>
        {/key}
      </div>

      <div class="mt-4 sm:mt-10 flex items-end gap-3 sm:flex-col sm:items-start sm:gap-5">
        <!-- Countdown -->
        <div>
          {#if countdown.finished}
            <span class="text-base sm:text-2xl font-black text-red-500 italic tracking-tighter uppercase">
              {$t('card.finished')}
            </span>
          {:else}
            <div class="flex items-baseline gap-0.5 sm:gap-1 font-mono">
              <span class="text-2xl sm:text-5xl font-black text-white tabular-nums">{formatTime(countdown.days)}</span>
              <span class="text-xs sm:text-xl font-bold text-white/30">d</span>
              <span class="text-white/10 text-base sm:text-2xl mx-0.5 sm:mx-1">:</span>
              <span class="text-2xl sm:text-5xl font-black text-white tabular-nums">{formatTime(countdown.hours)}</span>
              <span class="text-xs sm:text-xl font-bold text-white/30">h</span>
              <span class="text-white/10 text-base sm:text-2xl mx-0.5 sm:mx-1">:</span>
              <span class="text-2xl sm:text-5xl font-black text-white tabular-nums">{formatTime(countdown.minutes)}</span>
              <span class="text-xs sm:text-xl font-bold text-white/30">m</span>
              <span class="text-white/10 text-base sm:text-2xl mx-0.5 sm:mx-1">:</span>
              <span class="text-2xl sm:text-5xl font-black text-white tabular-nums">{formatTime(countdown.seconds)}</span>
              <span class="text-xs sm:text-xl font-bold text-white/30">s</span>
            </div>
          {/if}
        </div>

        <!-- Share Button -->
        <button
          onclick={handleShare}
          class={`flex-shrink-0 flex items-center justify-center sm:gap-2 sm:px-4 sm:py-2.5 w-8 h-8 sm:w-auto sm:h-auto rounded-xl border transition-all duration-200 sm:text-xs sm:font-black sm:uppercase sm:tracking-wider ${copied ? 'text-green-400 bg-green-500/10 border-green-500/30' : 'text-white/40 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white'}`}
          title={copied ? $t('card.copied') : $t('card.share')}
        >
          {#if copied}
            <svg class="w-4 h-4 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span class="hidden sm:inline">{$t('card.copied')}</span>
          {:else}
            <svg class="w-4 h-4 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span class="hidden sm:inline">{$t('card.share')}</span>
          {/if}
        </button>

        <!-- Dates -->
        <div class="hidden sm:flex items-center gap-1.5 text-[10px] font-medium text-white/30 tracking-wide">
          <svg class="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{formattedStart}</span>
          <span class="opacity-40">—</span>
          <span>{formattedEnd}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Progress Bar -->
  {#if !countdown.finished}
    <div
      class="absolute bottom-0 left-0 right-0 z-30 h-1.5 bg-white/10 rounded-b-2xl sm:rounded-b-[2rem] overflow-hidden"
      title={`${formattedStart} — ${formattedEnd}`}
    >
      <div
        class="h-full transition-all duration-1000"
        style={`width: ${progress}%; background: linear-gradient(to right, ${accent}bb, ${accent}ff);`}
      ></div>
    </div>
  {/if}
</article>
