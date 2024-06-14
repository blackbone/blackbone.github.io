---
layout: doc
ignore: true
title: Source Generators и Unity
descrition: Немножко о том как заставить код писать код в контексте всеми любимого багованного движка.
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
    :tags="['sourcegenerators']"
    :lang="$frontmatter.lang"/>