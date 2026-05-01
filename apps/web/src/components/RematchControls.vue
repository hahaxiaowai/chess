<script setup lang="ts">
import type { ChessGameViewModel } from "@/composables/useChessGameViewModel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

defineProps<{
  game: ChessGameViewModel;
  compact?: boolean;
}>();
</script>

<template>
  <Card>
    <CardHeader v-if="!compact">
      <CardTitle>对局控制</CardTitle>
      <CardDescription>重开与房间操作集中在这里</CardDescription>
    </CardHeader>
    <CardContent :class="compact ? 'p-0' : ''">
      <div v-if="game.snapshot.value?.game.status === 'finished' && game.canRequestRematch.value" class="flex gap-2">
        <Button class="min-h-10 flex-1" @click="game.requestRematch">申请重开</Button>
      </div>
      <div v-else-if="game.snapshot.value?.game.status === 'finished' && game.isPendingForSelf.value" class="flex gap-2">
        <Button class="min-h-10 flex-1" @click="game.respondRematch(true)">接受</Button>
        <Button class="min-h-10 flex-1" variant="outline" @click="game.respondRematch(false)">拒绝</Button>
      </div>
      <div v-else-if="game.snapshot.value?.game.status === 'finished'" class="text-sm text-muted-foreground">
        {{ game.rematchStatusText.value }}
      </div>
      <div v-if="game.isGobang.value" class="mt-3 text-sm text-muted-foreground">
        提示：黑方先手，点击棋盘交叉点即可落子
      </div>
    </CardContent>
  </Card>
</template>
