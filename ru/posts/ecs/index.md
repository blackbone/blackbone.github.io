---
layout: doc
ignore: true
title: Посты про УСЫ (ECS)
description: Посты прямо или косвенно у вас под носом.
lang: ru-RU
next: false
prev:
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