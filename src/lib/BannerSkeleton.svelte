<script lang="ts">
  interface Props { game?: 'genshin' | 'hsr' | 'zzz' | string }
  const { game }: Props = $props()

  const GAME_COLORS: Record<string, string> = {
    genshin: '#0ea5e9',
    hsr:     '#a855f7',
    zzz:     '#eab308',
  }
  const accent = $derived(game ? (GAME_COLORS[game] ?? '#6366f1') : '#6366f1')
</script>

<article
  class="relative w-full aspect-[16/9] sm:aspect-[2.5/1] overflow-hidden rounded-2xl sm:rounded-[2rem] border bg-slate-950 isolate shadow-2xl"
  style={`border-color: ${accent}22;`}
>
  <!-- Shimmer Effect -->
  <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite] z-10"></div>

  <!-- Subtle accent glow -->
  <div
    class="absolute inset-0 -z-10 opacity-10 pointer-events-none"
    style={`background: radial-gradient(circle at 30% 60%, ${accent}55 0%, transparent 60%);`}
  ></div>

  <!-- Background Placeholder -->
  <div class="absolute inset-0 z-0" style={`background: linear-gradient(135deg, #0f0f1a 0%, #0a0a14 100%);`}></div>
  <!-- Fake character silhouette -->
  <div class="absolute right-0 top-0 bottom-0 w-1/2 sm:w-2/5 opacity-5" style={`background: linear-gradient(to left, ${accent}44, transparent);`}></div>

  <div class="relative z-20 flex h-full items-end sm:items-center p-5 pb-6 sm:p-12 lg:p-16">
    <div class="flex flex-col w-full max-w-lg gap-4 sm:gap-8">
      <!-- Title Placeholder -->
      <div class="h-9 sm:h-16 lg:h-20 w-3/5 rounded-xl animate-pulse" style={`background: ${accent}15;`}></div>

      <!-- Countdown Placeholder -->
      <div class="flex gap-1.5 sm:gap-3 items-end">
        {#each [1, 2, 3, 4] as i}
          <div class="flex flex-col gap-1">
            <div class="h-7 sm:h-12 w-8 sm:w-14 rounded-lg animate-pulse" style={`background: ${accent}12; animation-delay: ${(i - 1) * 80}ms`}></div>
          </div>
          {#if i < 4}
            <div class="h-4 sm:h-8 w-0.5 rounded-full mb-1 opacity-20" style={`background: ${accent};`}></div>
          {/if}
        {/each}
        <!-- Share button placeholder -->
        <div class="h-7 sm:h-9 w-7 sm:w-9 rounded-xl animate-pulse ml-1" style={`background: ${accent}10;`}></div>
      </div>
    </div>
  </div>

  <!-- Progress bar placeholder -->
  <div class="absolute bottom-0 left-0 right-0 h-1.5 rounded-b-2xl sm:rounded-b-[2rem] overflow-hidden opacity-30" style={`background: ${accent}22;`}>
    <div class="h-full w-1/3 animate-[skeleton-progress_2s_ease-in-out_infinite]" style={`background: linear-gradient(to right, ${accent}44, ${accent}88, ${accent}44);`}></div>
  </div>
</article>

<style>
  @keyframes shimmer {
    100% { transform: translateX(100%); }
  }
  @keyframes skeleton-progress {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(400%); }
  }
</style>
