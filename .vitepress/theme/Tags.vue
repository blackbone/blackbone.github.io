<script setup lang="ts">
import Tag from './Tag.vue'

defineProps<{
  tags?: string[]
}>()
</script>

<template>
    <div v-if="tags" class="items">
      <div v-for="tag in tags" class="item">
        <Tag :tag="tag" />
      </div>
    </div>
</template>

<style scoped>
.items {
    display: flex;
    flex-grow: 1;
    flex-wrap: wrap;
    align-content: end;
    padding-top: 4px;
    padding-bottom: 4px;
    margin-left: -6px;
}

.item {
    margin: 0;
    color: var(--vp-c-brand-1);
    height: 26px;
}
</style>