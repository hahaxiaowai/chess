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
}>();
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>视角预设</CardTitle>
      <CardDescription>在俯视和正视之间快速切换</CardDescription>
    </CardHeader>
    <CardContent class="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <Button class="min-h-10" @click="game.setView('down')">俯视</Button>
      <Button class="min-h-10" @click="game.setView('front')">正视</Button>
    </CardContent>
  </Card>
</template>
