---
layout: doc
ignore: true
title: Posts Related to ECS
description: All stuff related to ECS in direct or indirect way
lang: en-US
next: false
prev:
  text: 'All Posts'
  link: '/posts'
---

<script setup lang="ts">
import { useData } from 'vitepress'
</script>

# {{ $frontmatter.title }}

<ArticleList
    :tags="['ecs']"
    :lang="$frontmatter.lang"/>
