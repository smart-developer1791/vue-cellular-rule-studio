<script setup lang="ts">
defineProps<{ name: 'upload' | 'close' }>()
const paths = { upload: 'M12 16V4m-5 5 5-5 5 5M5 16v4h14v-4', close: 'm6 6 12 12M6 18 18 6' }
</script>
<template>
  <svg
    class="size-4 shrink-0"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="paths[name]" />
  </svg>
</template>
