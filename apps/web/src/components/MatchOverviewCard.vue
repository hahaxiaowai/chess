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
  <Card>
    <CardHeader>
      <CardTitle>对局概览</CardTitle>
      <CardDescription>快速查看连接、身份与回合状态</CardDescription>
    </CardHeader>
    <CardContent>
      <div class="grid gap-3 sm:grid-cols-2">
        <div class="rounded-lg border bg-muted/30 p-3">
          <div class="text-xs text-muted-foreground">连接状态</div>
          <div class="mt-1 font-medium">{{ game.statsKV[game.connectionStatus.value] }}</div>
        </div>
        <div class="rounded-lg border bg-muted/30 p-3">
          <div class="text-xs text-muted-foreground">当前身份</div>
          <div class="mt-1 font-medium">{{ game.selfCampText.value }}</div>
        </div>
        <div class="rounded-lg border bg-muted/30 p-3 sm:col-span-2">
          <div class="text-xs text-muted-foreground">座位状态</div>
          <div class="mt-1 font-medium">{{ game.seatSummaryText.value }}</div>
        </div>
        <div class="rounded-lg border bg-muted/30 p-3 sm:col-span-2">
          <div class="text-xs text-muted-foreground">当前回合</div>
          <div class="mt-1 font-medium">{{ game.currentTurnText.value }}</div>
          <div class="mt-1 text-xs text-muted-foreground">{{ game.matchPhaseText.value }}</div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
