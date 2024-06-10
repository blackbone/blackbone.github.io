<script setup lang="ts">
import { computed } from 'vue';
import { Post, data as postsData } from './posts.data.js'
import { useData } from 'vitepress';
import ArticleListItem from './ArticleListItem.vue';

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
    <div v-if="filteredPosts" class="ArticleList" style="margin-top: 65px;">
        <div class="container">
            <div class="items">
                <div v-for="post in filteredPosts" :key="post.title" class="item">
                    <ArticleListItem
                        :icon="post.icon"
                        :title="post.title"
                        :details="post.excerpt"
                        :link="post.url"
                        :link-text='readFull[lang]'
                        :rel="undefined"
                        :target="undefined"
                        :tags="post.tags"
                        :date="post.date">
                    </ArticleListItem>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.ArticleList {
    position: relative;
    padding: 0 0px;
}

@media (min-width: 640px) {
    .ArticleList {
        padding: 0 48px;
    }
}

@media (min-width: 960px) {
    .ArticleList {
        padding: 0 4px;
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
</style>