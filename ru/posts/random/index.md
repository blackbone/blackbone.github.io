---
layout: doc
ignore: true
title: Посты обо всём
description: Рандомные посты на рандомные темы
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

<ArticleList
    :tags="['random']"
    :lang="$frontmatter.lang"/>