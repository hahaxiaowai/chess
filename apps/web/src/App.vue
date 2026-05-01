<script setup lang="ts">
import ChessBoardHost from "@/components/ChessBoardHost.vue";
import DesktopGamePanel from "@/components/DesktopGamePanel.vue";
import GameTypeSelectionCard from "@/components/GameTypeSelectionCard.vue";
import MessageToast from "@/components/MessageToast.vue";
import MobileGameOverlay from "@/components/MobileGameOverlay.vue";
import { useChessGameViewModel } from "@/composables/useChessGameViewModel";

const game = useChessGameViewModel();
</script>

<template>
  <MessageToast v-if="game.messageShow.value" :message="game.message.value" />

  <ChessBoardHost
    :inactive="!game.hasSelectedGameType.value"
    :mobile-layout="game.isMobileBoardMode.value"
    :board-styles="game.boardStyles.value"
  />

  <template v-if="game.hasSelectedGameType.value">
    <DesktopGamePanel v-if="!game.isMobileBoardMode.value" :game="game" />
    <MobileGameOverlay v-else :game="game" @height-change="game.setMobileOverlayHeight" />
  </template>

  <GameTypeSelectionCard v-else :game="game" />
</template>
