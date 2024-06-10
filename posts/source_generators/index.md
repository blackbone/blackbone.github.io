---
layout: doc
ignore: true
title: Source Generators in Unity
lang: en-US
next: false
prev: Все посты
---

<script setup lang="ts">
import { useData } from 'vitepress'
import { Post, data as postsData } from 'posts.data.js'

const posts = getFilteredPosts();

function getFilteredPosts(): Post[] {
    return undefined;
}

</script>

# {{ $frontmatter.title }}

A bit about how to make code write code in the context of everyone's favorite buggy engine.

<ArticleList
    :tags="['sourcegenerator']"
    :lang="$frontmatter.lang"/>