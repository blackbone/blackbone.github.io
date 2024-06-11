<script setup lang="ts">
import { VPBadge } from 'vitepress/theme';

defineProps<{
  tag?: string
}>()
</script>

<template>
    <VPBadge v-if="tag" class="tag">#{{ tag }}</VPBadge>
</template>