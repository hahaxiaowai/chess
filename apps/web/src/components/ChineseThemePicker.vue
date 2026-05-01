<script setup lang="ts">
import type { ChessGameViewModel } from "@/composables/useChessGameViewModel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

defineProps<{
  game: ChessGameViewModel;
}>();
</script>

<template>
  <Card v-if="game.boardGameType.value === 'chinese-chess'">
    <CardHeader>
      <CardTitle>主题皮肤</CardTitle>
      <CardDescription>当前使用 {{ game.currentChineseTheme.value.name }}</CardDescription>
    </CardHeader>
    <CardContent>
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-3" role="list" aria-label="中国象棋主题">
        <button
          v-for="theme in game.chineseChessThemes"
          :key="theme.id"
          type="button"
          :class="[
            'rounded-lg border bg-background p-2 text-left transition hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            game.chineseChessTheme.value === theme.id && 'border-primary bg-accent',
          ]"
          @click="game.setChineseChessTheme(theme.id)"
        >
          <span
            class="theme-preview"
            :class="`theme-preview--${theme.previewPattern}`"
            :style="{
              '--theme-preview-background': theme.previewBackground,
              '--theme-preview-glow': theme.previewGlow,
              '--theme-preview-line': theme.lineColor,
              '--theme-preview-piece': theme.pieceBase,
              '--theme-preview-accent': theme.targetColor,
            }"
            aria-hidden="true"
          >
            <span class="theme-preview__grid"></span>
            <span class="theme-preview__piece theme-preview__piece--primary"></span>
            <span class="theme-preview__piece theme-preview__piece--secondary"></span>
          </span>
          <span class="mt-2 block text-sm font-medium">{{ theme.name }}</span>
          <span class="mt-1 block text-xs text-muted-foreground">{{ theme.description }}</span>
        </button>
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
.theme-preview {
  position: relative;
  display: block;
  min-height: 4.2rem;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--theme-preview-line) 20%, transparent);
  border-radius: 0.5rem;
  background: var(--theme-preview-background);
}

.theme-preview::after {
  position: absolute;
  right: 12%;
  bottom: 12%;
  width: 3.6rem;
  height: 3.6rem;
  border-radius: 999px;
  background: var(--theme-preview-glow);
  content: "";
  filter: blur(10px);
}

.theme-preview__grid,
.theme-preview__piece {
  position: absolute;
}

.theme-preview__grid {
  inset: 16% 12%;
  border: 1px solid color-mix(in srgb, var(--theme-preview-line) 45%, transparent);
  border-radius: 0.5rem;
  background:
    linear-gradient(color-mix(in srgb, var(--theme-preview-line) 38%, transparent) 0 0) center/74% 1px no-repeat,
    linear-gradient(90deg, color-mix(in srgb, var(--theme-preview-line) 38%, transparent) 0 0) center/1px 68% no-repeat;
}

.theme-preview__piece {
  width: 1rem;
  height: 1rem;
  border: 1px solid color-mix(in srgb, var(--theme-preview-line) 24%, transparent);
  border-radius: 999px;
  background: var(--theme-preview-piece);
  box-shadow: 0 2px 8px rgb(0 0 0 / 12%);
}

.theme-preview__piece--primary {
  top: 34%;
  left: 28%;
}

.theme-preview__piece--secondary {
  right: 24%;
  bottom: 24%;
  background: var(--theme-preview-accent);
}
</style>
