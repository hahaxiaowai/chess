<script setup lang="ts">
import type { TurnTone } from "@/composables/useChessGameViewModel";

defineProps<{
  label: string;
  title: string;
  detail: string;
  tone: TurnTone;
  highlighted: boolean;
  compact?: boolean;
}>();

const toneClass: Record<TurnTone, string> = {
  waiting: "border-slate-200 bg-slate-900 text-slate-50",
  self: "border-neutral-900 bg-primary text-primary-foreground",
  opponent: "border-muted bg-secondary text-secondary-foreground",
  finished: "border-emerald-200 bg-emerald-900 text-emerald-50",
  check: "border-red-200 bg-red-700 text-white",
};
</script>

<template>
  <section
    :class="[
      'rounded-xl border p-4 shadow-sm transition-transform',
      toneClass[tone],
      highlighted && 'animate-[turnPulse_1.2s_ease]',
      compact && 'mt-3',
    ]"
  >
    <div class="text-xs font-medium opacity-75">{{ label }}</div>
    <div class="mt-1 text-lg font-semibold leading-tight">{{ title }}</div>
    <div class="mt-1 text-sm leading-relaxed opacity-80">{{ detail }}</div>
  </section>
</template>

<style scoped>
@keyframes turnPulse {
  0% {
    transform: scale(1);
  }

  35% {
    transform: scale(1.015);
  }

  100% {
    transform: scale(1);
  }
}
</style>
