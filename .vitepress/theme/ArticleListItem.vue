<script setup lang="ts">
import { DefaultTheme } from 'vitepress';
import type { Post } from './posts.data.ts'
import VPLink from 'vitepress/dist/client/theme-default/components/VPLink.vue';
import VPImage from 'vitepress/dist/client/theme-default/components/VPImage.vue';
import Date from './Date.vue'
import Tags from './Tags.vue'

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
        class="ArticleListItem"
        :href="link"
        :rel="rel"
        :target="target"
        :no-icon="true"
        :tag="link ? 'a' : 'div'"
    >
        <div class="box">
          <div v-if="typeof icon === 'object' && icon.wrap" class="icon">
              <VPImage
              :image="icon"
              :alt="icon.alt"
              :height="108"
              :width="108"
              style="width: 108px; height: 108px; margin-right: 16px;"
              />
          </div>
          <VPImage
              v-else-if="typeof icon === 'object'"
              :image="icon"
              :alt="icon.alt"
              :height="108"
              :width="108"
              style="width: 108px; height: 108px; margin-right: 16px;"
          />
          <div v-else-if="icon" class="icon" v-html="icon">
          </div>
          
          <div class="content">
            <h2 class="title" v-html="title"></h2>
            <p v-if="details" class="details" v-html="details"></p>
            <Tags :tags="tags" class="tags"/>
            <div v-if="linkText" class="link-text">
              <p class="link-text-value">
                {{ linkText }} <span class="vpi-arrow-right link-text-icon" />
              </p>
            </div>
            <Date :date="date" v-if="date" class="date"/>
          </div>
        </div>
    </VPLink>
</template>

<style scoped>
.ArticleListItem {
  display: block;
  border: 1px solid var(--vp-c-bg-soft-1);
  border-radius: 12px;
  height: 134px;
  background-color: var(--vp-c-bg-soft);
  transition: border-color 0.25s, background-color 0.25s;
}

.ArticleListItem.link:hover {
  border-color: var(--vp-c-brand-1);
}

a {
  color: inherit;
  text-decoration: none;
}

a:hover {
  color: inherit;
  text-decoration: none;
}

.box {
  display: flex;
  flex-direction: row;
  padding: 12px 12px 6px 12px;
  height: 100%;
}

.content {
  position: relative;
  display: block;
  width: 100%;
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
  margin: 0;
  padding: 0;
  position: relative;
  border-top: 0px;
  line-height: 24px;
  font-size: 16px;
  font-weight: 600;
}

.details {
  padding: 4px 0;
  margin: 0;
  line-height: 24px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-2);
}

.link-text {
  position: absolute;
  font-size: 13px;
  margin: 4px 0px;
  padding: 0;
  right: 0;
  bottom: 0;
}

.link-text-value {
  margin: 0;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-brand-1);
}

.link-text-icon {
  margin-left: 6px;
}

.date {
  position: absolute;
  padding: 0;
  font-size: 13px;
  margin: 4px 0px;
  left: 0;
  bottom: 0;
}

@media (min-width: 320px) {
    .details {
        display: flex;
        font-size: 14px;
        line-height: 1.3;
    }
    
    .tags { 
      display: none;
    }

    .date {
      position: absolute;
      left: 0;
      right: auto;
      top: auto;
      bottom: 0;
    }
}

@media (min-width: 640px) {
    .details {
        display: flex;
    }
    
    .tags { 
      display: flex;
      position: absolute;
      left: 0;
      right: auto;
      top: auto;
      bottom: 4px;
    }

    .date {
      position: absolute;
      margin: -6px 4px;
      left: auto;
      right: 0;
      top: 0;
      bottom: auto;
    }
}
</style>