<!-- docs/.vitepress/theme/Layout.vue -->
<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { inBrowser, useData } from 'vitepress'
import { watchEffect } from 'vue'
import LastArticles from './LastArticles.vue';

const { lang, frontmatter } = useData()
const { Layout } = DefaultTheme

watchEffect(() => {
  if (inBrowser) {
    document.cookie = `nf_lang=${lang.value}; expires=Mon, 1 Jan 2030 00:00:00 UTC; path=/`
  }
})
</script>

<template>
    <Layout>
        <template #home-features-before>
            <LastArticles v-if="frontmatter.layout==='home'"/>
        </template>
    </Layout>
</template>