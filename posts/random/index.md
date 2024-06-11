---
layout: doc
ignore: true
title: Random posts
description: Random posts on random topics
lang: en-US
next: false
prev:
  text: 'All posts'
  link: '/posts'
---

<script setup lang="ts">
import { useData } from 'vitepress'
</script>

# {{ $frontmatter.title }}

<ArticleList
    :tags="['random']"
    :lang="$frontmatter.lang"/>