// https://vitepress.dev/guide/custom-theme
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './custom.css'
import Layout from './Layout.vue'

export default {
  extends: DefaultTheme,
  // https://vitepress.dev/guide/extending-default-theme#layout-slots
  Layout: Layout,
  enhanceApp({ app, router, siteData }) {
    // register your custom global components
    app.component('LastArticle' /* ... */)
  }
} satisfies Theme
