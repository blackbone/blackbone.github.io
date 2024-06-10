---
layout: doc
ignore: true
title: Posts Related to ECS
description: Posts Related to ECS
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

{{ $frontmatter.description }}

<ArticleList
    :tags="['ecs']"
    :lang="$frontmatter.lang"/>
