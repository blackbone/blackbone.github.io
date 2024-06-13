---
layout: doc
ignore: true
title: Source Generators in Unity
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

{{ $frontmatter.description }}

<ArticleList
    :tags="['sourcegenerators']"
    :lang="$frontmatter.lang"/>