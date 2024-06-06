import { defineConfig, HeadConfig } from 'vitepress'
import { generateSidebar } from 'vitepress-sidebar';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'ru-RU',
  title: "Упрт Рзрбтк",
  description: "Упртя рзрбтка от упртг рзрбтчк.\nТут больше кринжи, чем полезной информации, так что - зло пожаловать.",
  head: [
    ['link', { rel: 'icon', href: 'favicon.ico' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { href: 'https://fonts.googleapis.com/css2?family=Source+Code+Pro:ital,wght@0,200..900;1,200..900&family=Noto+Sans:wght@400..500&display=swap', rel: "stylesheet" }]
  ],
  transformHead: ({ pageData }) => {
    const head: HeadConfig[] = []

    head.push(['meta', { property: 'og:title', content: pageData.frontmatter.title }])
    head.push(['meta', { property: 'og:description', content: pageData.frontmatter.description }])

    return head
  },

  cleanUrls: true,
  sitemap: {
    hostname: 'https://blackbone.github.io'
  },

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/logo-dark.png',
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
      themeConfig: {
        nav: [
          { text: 'Домой', link: '/' },
          { text: 'Все посты', link: '/posts' },
          { text: 'RSS', link: '/rss' },
        ],
        sidebar: generateSidebar([
          {
            sortMenusByFrontmatterOrder: true,
            useFolderLinkFromIndexFile: true,
            useTitleFromFrontmatter: true,
            useFolderTitleFromIndexFile: true,
            documentRootPath: '/posts/',
            scanStartPath: '/',
            resolvePath: '/posts/',
            excludeFiles: ['posts/index.md'],
            includeRootIndexFile: false,
            collapseDepth: 1,
            excludeFolders: [".", "node_modules", "dist", "public", "src", "vitepress", "vitepress-sidebar"],
          }
        ])
      }
    }
  }
})
