---
layout: doc
ignore: true
title: Посты обо всём
desscription: Рандомные посты на рандомные темы
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
    :tags="['random']"
    :lang="$frontmatter.lang"/>