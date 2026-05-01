<script setup lang="ts">
import type { SeatCamp } from "@chess/game-core";
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

const options: Array<{ value: SeatCamp; label: string }> = [
  { value: "red", label: "red" },
  { value: "black", label: "black" },
  { value: "viewer", label: "观众" },
];
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>身份选择</CardTitle>
      <CardDescription>切换执子或保持观战</CardDescription>
    </CardHeader>
    <CardContent class="space-y-3">
      <RadioGroup
        :model-value="game.camp.value"
        class="grid grid-cols-1 gap-2 sm:grid-cols-3"
        @update:model-value="game.setSelectedCamp($event as SeatCamp)"
      >
        <label
          v-for="option in options"
          :key="option.value"
          class="flex min-h-10 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-medium has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50"
        >
          <RadioGroupItem :value="option.value" :disabled="!game.isCampSelectable(option.value)" />
          <span>{{ option.value === "viewer" ? option.label : game.campText(option.value) }}</span>
        </label>
      </RadioGroup>
      <Button class="min-h-10 w-full" @click="game.confirm">确定</Button>
    </CardContent>
  </Card>
</template>
