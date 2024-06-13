<script setup lang="ts">
import { DefaultTheme } from 'vitepress';
import type { Post } from './posts.data.ts'
import VPLink from 'vitepress/dist/client/theme-default/components/VPLink.vue';
import VPImage from 'vitepress/dist/client/theme-default/components/VPImage.vue';
import Tags from './Tags.vue'
import Date from './Date.vue'

defineProps<{
  icon?: DefaultTheme.FeatureIcon
  title: string
  details?: string
  link?: string
  linkText?: string
  rel?: string
  target?: string
  tags?: string[]
  date: Post['date']
}>()

</script>

<template>
    <VPLink
        class="LastArticle"
        :href="link"
        :rel="rel"
        :target="target"
        :no-icon="true"
        :tag="link ? 'a' : 'div'"
    >
        <article class="box">
        <div v-if="typeof icon === 'object' && icon.wrap" class="icon">
            <VPImage
            :image="icon"
            :alt="icon.alt"
            :height="icon.height || 48"
            :width="icon.width || 48"
            />
        </div>
        <VPImage
            v-else-if="typeof icon === 'object'"
            :image="icon"
            :alt="icon.alt"
            :height="icon.height || 48"
            :width="icon.width || 48"
        />
        <div v-else-if="icon" class="icon" v-html="icon"></div>


        <div class="bottom">
          <h2 class="title" v-html="title"></h2>
          <p v-if="details" class="details" v-html="details"></p>
          <Tags v-if="tags" :tags="tags"/>
          <div v-if="linkText" class="link-text">
                <p class="link-text-value">
                {{ linkText }} <span class="vpi-arrow-right link-text-icon" />
                </p>
          </div>
          <Date :date="date" class="date"/>
        </div>
        </article>
    </VPLink>
</template>

<style scoped>
.LastArticle {
  display: block;
  border: 1px solid var(--vp-c-bg-soft-1);
  border-radius: 12px;
  height: 100%;
  background-color: var(--vp-c-bg-soft);
  transition: border-color 0.25s, background-color 0.25s;
}

.LastArticle.link:hover {
  border-color: var(--vp-c-brand-1);
}

.box {
  display: flex;
  flex-direction: column;
  padding: 24px 24px 12px 24px;
  height: 100%;
}

.box > :deep(.VPImage) {
  margin-bottom: 20px;
}

.icon {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
  border-radius: 6px;
  background-color: var(--vp-c-default-soft);
  width: 48px;
  height: 48px;
  font-size: 24px;
  transition: background-color 0.25s;
}

.title {
  line-height: 24px;
  font-size: 16px;
  font-weight: 600;
}

.details {
  flex-grow: 1;
  padding-top: 8px;
  line-height: 24px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-2);
}

.link-text {
  padding-top: 8px;
  flex-shrink: 0;
}

.link-text-value {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-brand-1);
}

.link-text-icon {
  margin-left: 6px;
}

.bottom {
  position: relative;
  margin-top: 6px;
  display: flex;
  align-items: start;
  flex-direction: column;
  height: 100%;
  flex-wrap: wrap;
}

.date {
  position: absolute;
  padding: 0;
  font-size: 13px;
  margin: 0px -12px;
  right: 0;
  bottom: 0;
}
</style>