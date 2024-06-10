<script setup lang="ts">
import { computed } from 'vue';
import { Post, data as postsData } from './posts.data.js'
import { useData } from 'vitepress';
import LastArticle from './LastArticle.vue'

const props = defineProps<{
    tags?: string[] | undefined;
    limit?: number | undefined;
    lang?: string | undefined
}>();

const filteredPosts = computed(() => filterPosts(postsData.posts, props.tags, props.limit, props.lang));
const { lang } = useData()
const readFull: Record<string, string> = {
    'en-US': "Continue reading...",
    'ru-RU': "Читать далее..."
} // much nicer syntax for initialization.

function computeGrid(posts:Post[]):string {
    const length = posts?.length
    if (!length) return ''
    else if (length === 2) return 'grid-2'
    else if (length === 3) return 'grid-3'
    else if (length === 6) return 'grid-6'
    else if (length > 3) return 'grid-4'
    return ''
}

function filterPosts(posts:Post[], tags?:string[], limit?:number, lang?:string): Post[] {
  var filteredPosts = posts;
  if (lang === undefined) {
    lang = 'en-US'
  }

  filteredPosts = filteredPosts.filter(p => p.lang == lang);
  
  if (tags && tags.length > 0) {
    filteredPosts = filteredPosts.filter(post => {
      if (post.tags == undefined) return false;
      return post.tags.some(tag => tags.includes(tag));
    });
  }

  if (limit !== undefined) {
    filteredPosts = filteredPosts.slice(0, limit);
  }

  return filteredPosts;
}
</script>

<template>
    <div v-if="filteredPosts" class="VPFeatures" style="margin-top: 65px;">
        <div class="container">
            <div class="items">
                <div v-for="post in filteredPosts" :key="post.title" class="item" :class="[computeGrid(filteredPosts)]">
                    <LastArticle
                        :icon="post.icon"
                        :title="post.title"
                        :details="post.excerpt!"
                        :link="post.url"
                        :link-text='readFull[lang]'
                        :rel="undefined"
                        :target="undefined"
                        :tags="post.tags"
                        :date="post.date">
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