import path from 'path'
import { writeFileSync } from 'fs'
import { Feed } from 'feed'
import { defineConfig, createContentLoader, HeadConfig, SiteConfig } from 'vitepress'
import { generateSidebar } from 'vitepress-sidebar';

const hostname: string = 'https://uprt.dev'
const copyright: string = 'Copyright © ' + (new Date().getFullYear() == 2023 ? '2023' : '2023 - ' + new Date().getFullYear()) + ' blackbone'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'en-US',
  head: [
    ['link', { rel: 'icon', href: 'favicon.ico' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { href: 'https://fonts.googleapis.com/css2?family=Source+Code+Pro:ital,wght@0,200..900;1,200..900&family=Ubuntu+Mono:wght@400..500&display=swap', rel: "stylesheet" }]
  ],
  transformHead: ({ pageData }) => {
    const head: HeadConfig[] = []

    if (pageData.frontmatter.title !== undefined) head.push(['meta', { property: 'og:title', content: pageData.frontmatter.title }])
    if (pageData.frontmatter.description !== undefined) head.push(['meta', { property: 'og:description', content: pageData.frontmatter.description }])

    return head
  },

  cleanUrls: true,
  sitemap: {
    hostname: hostname
  },

  // localization
  locales: {
    root:  {
      title: "Mess Dev",
      description: "Fresh, sweet cringe.",
      label: 'English',
      lang: 'en-US',
      themeConfig: {
        // top nav
        nav: [
          { text: 'Home', link: '/' },
          { text: 'All posts', link: '/posts' },
          { text: 'RSS', link: `${hostname}/feed.rss` },
        ],
        // sidebar for posts
        sidebar: generateSidebar([
          {
            sortMenusByFrontmatterOrder: true,
            useFolderLinkFromIndexFile: true,
            useTitleFromFrontmatter: true,
            useFolderTitleFromIndexFile: true,
            documentRootPath: '/posts/',
            scanStartPath: '/',
            resolvePath: '/posts/',
            excludeFiles: ['/posts/index.md'],
            includeRootIndexFile: false,
            collapseDepth: 1,
            excludeFolders: [".", "node_modules", "dist", "public", "src", "vitepress", "vitepress-sidebar"],
          }
        ]),
        // https://vitepress.dev/reference/default-theme-config
        logo: '/logo-dark.png',
        // social links
        socialLinks: [
          { icon: 'github', link: 'https://github.com/blackbone' }
        ],
        // footer content
        footer: {
          copyright: copyright
        },
      }
    },
    ru: {
      title: "Упрт Рзрбтк",
      description: "Упоротая, медовая дичь.",
      label: 'Русский',
      lang: 'ru-RU',
      themeConfig: {
        // top nav
        nav: [
          { text: 'Домой', link: '/ru/' },
          { text: 'Все посты', link: '/ru/posts' },
          { text: 'RSS', link: `${hostname}/feed.rss` },
        ],
        // sidebar for posts
        sidebar: generateSidebar([
          {
            sortMenusByFrontmatterOrder: true,
            useFolderLinkFromIndexFile: true,
            useTitleFromFrontmatter: true,
            useFolderTitleFromIndexFile: true,
            documentRootPath: '/ru/posts/',
            scanStartPath: '/',
            resolvePath: '/ru/posts/',
            excludeFiles: ['/ru/posts/index.md'],
            includeRootIndexFile: false,
            collapseDepth: 1,
            excludeFolders: [".", "node_modules", "dist", "public", "src", "vitepress", "vitepress-sidebar"],
          }
        ]),
        // https://vitepress.dev/reference/default-theme-config
        logo: '/logo-dark.png',
        // social links
        socialLinks: [
          { icon: 'github', link: 'https://github.com/blackbone' }
        ],
        // footer content
        footer: {
          copyright: copyright
        },
      }
    }
  },

  buildEnd: async (config: SiteConfig) => {
    const feed = new Feed({
      title: 'Упрт Рзрбтк',
      description: 'Упоротая, медовая дичь',
      id: hostname,
      link: hostname,
      language: 'ru',
      image: `${hostname}/logo-dark.png`,
      favicon: `${hostname}/favicon.ico`,
      copyright: copyright
    })

    // You might need to adjust this if your Markdown files 
    // are located in a subfolder
    const posts = await createContentLoader(['posts/**/*.md', '!*/index.md'], {
      excerpt: true,
      render: true
    }).load()
  
    posts.sort(
      (a, b) =>
        +new Date(b.frontmatter.date as string) -
        +new Date(a.frontmatter.date as string)
    )
  
    for (const { url, excerpt, frontmatter, html } of posts) {
      feed.addItem({
        title: frontmatter.title,
        id: `${hostname}${url}`,
        link: `${hostname}${url}`,
        description: excerpt,
        content: html,
        author: [
          {
            name: 'blackbone',
            link: `${hostname}`
          }
        ],
        date: frontmatter.date
      })
    }
  
    writeFileSync(path.join(config.outDir, 'feed.rss'), feed.rss2())
  }
})
