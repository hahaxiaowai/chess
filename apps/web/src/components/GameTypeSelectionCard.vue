<script setup lang="ts">
import type { GameType } from "@chess/game-core";
import type { ChessGameViewModel } from "@/composables/useChessGameViewModel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

defineProps<{
  game: ChessGameViewModel;
}>();

const options: Array<{ value: GameType; label: string }> = [
  { value: "chinese-chess", label: "中国象棋" },
  { value: "gobang", label: "五子棋" },
];
</script>

<template>
  <Card class="absolute left-1/2 top-1/2 z-30 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2">
    <CardHeader class="text-center">
      <CardDescription>在线棋盘</CardDescription>
      <CardTitle>进入房间前请选择玩法</CardTitle>
      <CardDescription>房间号：{{ game.roomId.value }}</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <RadioGroup
        :model-value="game.gameType.value"
        class="grid grid-cols-1 gap-2 sm:grid-cols-2"
        @update:model-value="game.selectGameType($event as GameType)"
      >
        <label
          v-for="option in options"
          :key="option.value"
          class="flex min-h-10 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-medium"
        >
          <RadioGroupItem :value="option.value" />
          <span>{{ option.label }}</span>
        </label>
      </RadioGroup>
      <Button
        class="w-full"
        :disabled="!game.gameType.value"
        @click="game.gameType.value && game.selectGameType(game.gameType.value)"
      >
        进入对局
      </Button>
      <p class="text-center text-sm text-muted-foreground">选择后会创建对应房间并进入对局</p>
    </CardContent>
  </Card>
</template>
