import path from 'path'
import { writeFileSync } from 'fs'
import { Feed } from 'feed'
import { createContentLoader, defineConfig, HeadConfig, SiteConfig } from 'vitepress'
import { generateSidebar } from 'vitepress-sidebar';

const hostname: string = 'https://uprt.dev'
const copyright: string = 'Copyright © ' + (new Date().getFullYear() == 2023 ? '2023' : '2023 - ' + new Date().getFullYear()) + ' blackbone'

const langs = {
  en: {
    id: 'en-US',
    prefix: '/',
    isRoot: true,
    feed: new Feed({
      title: 'Uprt Dev',
      description: 'Fresh, sweet cringe',
      id: hostname,
      link: hostname,
      language: 'en-US',
      image: `${hostname}/logo-dark.png`,
      favicon: `${hostname}/favicon.ico`,
      copyright: copyright,
    }),
    feedPath: 'feed.rss'
  },
  ru: {
    id: 'ru-RU',
    prefix: 'ru/',
    isRoot: false,
    feed: new Feed({
      title: 'Упрт Рзрбтк',
      description: 'Упоротая, медовая дичь',
      id: hostname,
      link: hostname,
      language: 'ru-RU',
      image: `${hostname}/logo-dark.png`,
      favicon: `${hostname}/favicon.ico`,
      copyright: copyright
    }),
    feedPath: 'ru/feed.rss'
  },
}

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'en-US',
  head: [
    ['link', { rel: 'icon', href: 'favicon.ico' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { href: 'https://fonts.googleapis.com/css2?family=Source+Code+Pro:ital,wght@0,200..900;1,200..900&family=Ubuntu+Mono:wght@400..500&display=swap', rel: "stylesheet" }],
    ['script', { async: '', src: 'https://www.googletagmanager.com/gtag/js?id=G-R88DZGJBSN' }],
    ['script', {}, "window.dataLayer = window.dataLayer || [];\nfunction gtag(){dataLayer.push(arguments);}\ngtag('js', new Date());\ngtag('config', 'G-R88DZGJBSN');"]
  ],
  transformHead: ({ pageData }) => {
    const head: HeadConfig[] = []

    // TODO gather logo from frontmatter
    if (pageData.frontmatter.title !== undefined)       head.push(['meta', { property: 'og:title',        content: pageData.frontmatter.title }])
    if (pageData.frontmatter.description !== undefined) head.push(['meta', { property: 'og:description',  content: pageData.frontmatter.description }])
    if (pageData.frontmatter.logo !== undefined)        head.push(['meta', { property: 'og:image',        content: pageData.frontmatter.logo }])

    return head
  },

  cleanUrls: true,
  sitemap: {
    hostname: hostname
  },

  markdown: {
    lineNumbers: true
  },

  // localization
  locales: {
    root:  {
      title: "Uprt Dev",
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
            excludeFilesByFrontmatterFieldName: "draft",
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
        outline: {
          label: 'On this page',
          level: [2, 3]
        }
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
          { text: 'RSS', link: `${hostname}/ru/feed.rss` },
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
            excludeFilesByFrontmatterFieldName: "draft",
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
        outline: {
          label: 'Содержание',
          level: [2, 3]
        }
      }
    }
  },
  
  buildEnd: async (config: SiteConfig) => {
    await buildRssFeed(config, langs.en.feed, langs.en.id, langs.en.feedPath);
    await buildRssFeed(config, langs.ru.feed, langs.ru.id, langs.ru.feedPath);
  }
})

async function buildRssFeed(config: SiteConfig, feed: Feed, lang: string, feedPath: string) {
    // You might need to adjust this if your Markdown files 
    // are located in a subfolder
    var posts = await createContentLoader(['posts/**/*.md', '*/posts/**/*.md'], {
      excerpt: true,
      render: true
    }).load()

    posts = posts.filter(p => {
      return p.frontmatter.lang == lang
      && p.frontmatter.draft !== true
      && p.frontmatter.date !== undefined
    });

    posts.forEach(p => {
      console.log(p.frontmatter.lang + " : " + p.frontmatter.title)
    })
  
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
        content: frontmatter.description,
        author: [
          {
            name: 'blackbone',
            link: `${hostname}`
          }
        ],
        date: frontmatter.date
      })
    }
    
  writeFileSync(path.join(config.outDir, feedPath), feed.rss2())
}
