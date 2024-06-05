import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'ru-RU',
  title: "Mess Dev",
  description: "Mess development from sick dude",
  head: [
    ['link', { rel: 'icon', href: 'favicon.ico' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { href: 'https://fonts.googleapis.com/css2?family=Source+Code+Pro:ital,wght@0,200..900;1,200..900&family=Comfortaa:wght@400..500&display=swap', rel: "stylesheet" }]
  ],
  cleanUrls: true,
  sitemap: {
    hostname: 'https://blackbone.github.io'
  },

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/logo.jpg',
    // social links
    socialLinks: [
      { icon: 'github', link: 'https://github.com/blackbone' }
    ],

    // footer content
    footer: {
      copyright: 'Copyright © ' + (new Date().getFullYear() == 2023 ? '2023' : '2023 - ' + new Date().getFullYear()) + ' blackbone'
    },
  },

  // localization
  locales: {
    root:  {
      label: 'Русский',
      lang: 'ru-RU',
      dir: 'ru',
      themeConfig: {
        nav: [
          { text: 'Домой', link: '/' },
          { text: 'Все посты', link: '/posts' },
          { text: 'RSS', link: '/rss' },
        ],
        // sidebar: [
        //   {
        //     items: [
        //       { text: 'Все посты', link: '/posts' },
        //       { text: 'RSS', link: '/rss' }
        //     ]
        //   }
        // ],
      }
    }
  }
})
