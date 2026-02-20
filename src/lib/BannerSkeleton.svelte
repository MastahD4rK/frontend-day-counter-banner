<script lang="ts">
  // No props needed for the skeleton
</script>

<article
  class="relative w-full aspect-[16/9] sm:aspect-[2.5/1] overflow-hidden rounded-2xl sm:rounded-[2rem] border border-white/5 bg-slate-950 isolate shadow-2xl"
>
  <!-- Shimmer Effect -->
  <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite] z-10"></div>

  <!-- Background Placeholder -->
  <div class="absolute inset-0 z-0 bg-slate-900/40"></div>

  <div class="relative z-20 flex h-full items-end sm:items-center p-5 pb-6 sm:p-12 lg:p-16">
    <div class="flex flex-col w-full max-w-lg">
      <!-- Title Placeholder -->
      <div class="h-10 sm:h-20 w-2/3 bg-white/5 rounded-lg animate-pulse"></div>
      
      <!-- Countdown Placeholder -->
      <div class="mt-4 sm:mt-10 flex gap-2 sm:gap-4 items-end">
        {#each [1, 2, 3, 4] as i}
          <div class="flex flex-col gap-1 items-center">
            <div class="h-8 sm:h-12 w-10 sm:w-16 bg-white/5 rounded animate-pulse"></div>
          </div>
          {#if i < 4}
            <div class="h-6 sm:h-10 w-1 bg-white/5 rounded-full mb-1"></div>
          {/if}
        {/each}
      </div>
    </div>
  </div>
</article>

<style>
  @keyframes shimmer {
    100% {
      transform: translateX(100%);
    }
  }
</style>
