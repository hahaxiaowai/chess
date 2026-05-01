<script setup lang="ts">
import type { ChessGameViewModel } from "@/composables/useChessGameViewModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ChineseThemePicker from "./ChineseThemePicker.vue";
import MatchOverviewCard from "./MatchOverviewCard.vue";
import RematchControls from "./RematchControls.vue";
import SeatSelector from "./SeatSelector.vue";
import TurnBanner from "./TurnBanner.vue";
import ViewControls from "./ViewControls.vue";

defineProps<{
  game: ChessGameViewModel;
}>();
</script>

<template>
  <aside class="absolute right-4 top-4 z-30 flex max-h-[calc(100dvh-2rem)] w-[min(25rem,calc(100vw-2rem))] flex-col gap-3 overflow-y-auto rounded-xl border bg-background/95 p-4 shadow-lg backdrop-blur">
    <header class="flex items-start justify-between gap-3">
      <div class="min-w-0 space-y-2">
        <div>
          <div class="text-xs font-medium text-muted-foreground">{{ game.gameTypeLabel.value }}</div>
          <h1 class="truncate text-lg font-semibold">房间 {{ game.roomId.value }}</h1>
        </div>
        <div class="flex flex-wrap gap-2">
          <Badge>{{ game.matchPhaseText.value }}</Badge>
          <Badge variant="secondary">{{ game.selfCampText.value }}</Badge>
        </div>
      </div>
      <Button v-if="game.canShareRoom.value" class="min-h-10" @click="game.shareRoom">
        {{ game.shareButtonText.value }}
      </Button>
    </header>

    <TurnBanner
      :label="game.turnIndicator.value.label"
      :title="game.turnIndicator.value.title"
      :detail="game.turnIndicator.value.detail"
      :tone="game.turnIndicator.value.tone"
      :highlighted="game.isTurnIndicatorHighlighted.value"
    />
    <MatchOverviewCard :game="game" />
    <RematchControls :game="game" />
    <SeatSelector :game="game" />
    <ViewControls :game="game" />
    <ChineseThemePicker :game="game" />
  </aside>
</template>
