<script setup lang="ts">
import { computed } from 'vue'
import { Post, data as posts } from './posts.data.js'
import LastArticle from './LastArticle.vue'

const maxPosts = 7;

function getLastArticlesAsFeatures(): Post[] {
    return posts.posts.slice(0, maxPosts);
}

const features = getLastArticlesAsFeatures();
const grid = computed(() => {
    const length = features.length
    if (!length) return ''
    else if (length === 2) return 'grid-2'
    else if (length === 3) return 'grid-3'
    else if (length === 6) return 'grid-6'
    else if (length > 3) return 'grid-4'
})
</script>

<template>
    <div v-if="features" class="VPFeatures" style="margin-top: 65px;">
        <div class="container">
            <div class="items">
                <div v-for="feature in features" :key="feature.title" class="item" :class="[grid]">
                    <LastArticle
                        :icon="feature.icon"
                        :title="feature.title"
                        :details="feature.excerpt!"
                        :link="feature.url"
                        :link-text='"Читать полностью..."'
                        :rel="undefined"
                        :target="undefined"
                        :tags="feature.tags"
                        :date="feature.date">
                    </LastArticle>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.VPFeatures {
    position: relative;
    padding: 0 24px;
}

@media (min-width: 640px) {
    .VPFeatures {
        padding: 0 48px;
    }
}

@media (min-width: 960px) {
    .VPFeatures {
        padding: 0 64px;
    }
}

.container {
    margin: 0 auto;
    max-width: 1152px;
}

.items {
    display: flex;
    flex-wrap: wrap;
    margin: -8px;
}

.item {
    padding: 8px;
    width: 100%;
}

@media (min-width: 640px) {

    .item.grid-2,
    .item.grid-4,
    .item.grid-6 {
        width: calc(100% / 2);
    }
}

@media (min-width: 768px) {

    .item.grid-2,
    .item.grid-4 {
        width: calc(100% / 2);
    }

    .item.grid-3,
    .item.grid-6 {
        width: calc(100% / 3);
    }
}

@media (min-width: 960px) {
    .item.grid-4 {
        width: calc(100% / 4);
    }
}
</style>