<script setup lang="ts">
import type { Post } from './posts.data.ts'

const props = defineProps<{ date: Post['date'] }>()

function getDateTime() {
  return new Date(props.date.time).toISOString()
}
</script>

<template>
<time :datetime="getDateTime()" class="time">{{ date.string }}</time>
</template>

<style scoped>
.time {
    padding-top: 8px;
    flex-shrink: 0;
}
</style>