---
layout: doc
ignore: true
title: Посты связанные про УСЫ (ECS)
description: Посты связанные про УСЫ (ECS)
lang: ru-RU
next: false
prev:
  text: 'Все посты'
  link: '/ru/posts'
---

<script setup lang="ts">
import { useData } from 'vitepress'
</script>

# {{ $frontmatter.title }}

{{ $frontmatter.description }}

<ArticleList
    :tags="['ecs']"
    :lang="$frontmatter.lang"/>