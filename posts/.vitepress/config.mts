import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lastUpdated: true,
  base: "/",
  assetsDir: "static",

  title: "Messy Dev",
  description: "Messy development from mentally ill developer",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'All Posts', link: '/posts' }
    ],

    sidebar: [
      {
        text: 'Posts',
        items: [
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
