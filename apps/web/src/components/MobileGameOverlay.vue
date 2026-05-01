<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { ChessGameViewModel, MobileMenuSection } from "@/composables/useChessGameViewModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChineseThemePicker from "./ChineseThemePicker.vue";
import MatchOverviewCard from "./MatchOverviewCard.vue";
import RematchControls from "./RematchControls.vue";
import SeatSelector from "./SeatSelector.vue";
import TurnBanner from "./TurnBanner.vue";
import ViewControls from "./ViewControls.vue";

const props = defineProps<{
  game: ChessGameViewModel;
}>();

const emit = defineEmits<{
  "height-change": [height: number];
}>();

const overlayRef = ref<HTMLElement | null>(null);
let resizeObserver: ResizeObserver | null = null;

const emitHeight = () => {
  emit("height-change", overlayRef.value?.offsetHeight ?? 0);
};

const observeOverlay = () => {
  resizeObserver?.disconnect();
  resizeObserver = null;

  if (typeof ResizeObserver === "undefined" || !overlayRef.value) {
    emitHeight();
    return;
  }

  resizeObserver = new ResizeObserver(emitHeight);
  resizeObserver.observe(overlayRef.value);
  emitHeight();
};

const updateActiveSection = (value: string) => {
  props.game.selectMenuSection(value as MobileMenuSection);
};

onMounted(() => {
  void nextTick(observeOverlay);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});

watch(
  () => [
    props.game.isMobileMenuExpanded.value,
    props.game.activeMenuSection.value,
    props.game.snapshot.value?.game.status,
    props.game.snapshot.value?.game.turn,
    props.game.canShareRoom.value,
  ],
  () => void nextTick(observeOverlay),
);
</script>

<template>
  <div ref="overlayRef" class="fixed bottom-[calc(env(safe-area-inset-bottom)+12px)] left-3 right-3 z-40 flex flex-col gap-3">
    <section class="rounded-xl border bg-background/95 p-4 shadow-lg backdrop-blur">
      <div class="flex flex-col gap-3">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="text-xs font-medium text-muted-foreground">{{ game.gameTypeLabel.value }}</div>
            <h1 class="truncate text-lg font-semibold">房间 {{ game.roomId.value }}</h1>
            <div class="mt-2 flex flex-wrap gap-2">
              <Badge>{{ game.matchPhaseText.value }}</Badge>
              <Badge variant="secondary">{{ game.selfCampText.value }}</Badge>
            </div>
          </div>
          <div class="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
            <div class="text-xs text-muted-foreground">身份</div>
            <div class="font-medium">{{ game.selfCampText.value }}</div>
          </div>
        </div>

        <TurnBanner
          compact
          :label="game.turnIndicator.value.label"
          :title="game.turnIndicator.value.title"
          :detail="game.turnIndicator.value.detail"
          :tone="game.turnIndicator.value.tone"
          :highlighted="game.isTurnIndicatorHighlighted.value"
        />

        <div class="flex flex-wrap gap-2">
          <template v-if="game.snapshot.value?.game.status === 'finished'">
            <Button v-if="game.canRequestRematch.value" class="min-h-10 flex-1" @click="game.requestRematch">
              申请重开
            </Button>
            <template v-else-if="game.isPendingForSelf.value">
              <Button class="min-h-10 flex-1" @click="game.respondRematch(true)">接受</Button>
              <Button class="min-h-10 flex-1" variant="outline" @click="game.respondRematch(false)">拒绝</Button>
            </template>
            <span v-else class="flex min-h-10 items-center text-sm text-muted-foreground">
              {{ game.rematchStatusText.value }}
            </span>
          </template>
          <Button v-else-if="game.canShareRoom.value" class="min-h-10 flex-1" variant="outline" @click="game.shareRoom">
            {{ game.shareButtonText.value }}
          </Button>
          <Button class="min-h-10 flex-1" @click="game.toggleMobileMenu">
            {{ game.isMobileMenuExpanded.value ? "收起菜单" : "展开菜单" }}
          </Button>
        </div>
      </div>
    </section>

    <section v-if="game.isMobileMenuExpanded.value" class="max-h-[min(28rem,52dvh)] overflow-y-auto rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur">
      <Tabs :model-value="game.activeMenuSection.value" @update:model-value="updateActiveSection">
        <TabsList class="grid h-auto w-full grid-cols-3">
          <TabsTrigger value="match">对局</TabsTrigger>
          <TabsTrigger value="seat">身份</TabsTrigger>
          <TabsTrigger value="view">视角</TabsTrigger>
        </TabsList>
        <TabsContent value="match" class="space-y-3">
          <MatchOverviewCard :game="game" />
          <RematchControls :game="game" />
          <Button v-if="game.canShareRoom.value" class="min-h-10 w-full" variant="outline" @click="game.shareRoom">
            复制房间链接
          </Button>
        </TabsContent>
        <TabsContent value="seat">
          <SeatSelector :game="game" />
        </TabsContent>
        <TabsContent value="view" class="space-y-3">
          <ViewControls :game="game" />
          <ChineseThemePicker :game="game" />
        </TabsContent>
      </Tabs>
    </section>
  </div>
</template>
