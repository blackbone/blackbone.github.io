import path from 'path'
import { writeFileSync } from 'fs'
import { Feed } from 'feed'
import { createContentLoader, defineConfig, HeadConfig, SiteConfig } from 'vitepress'
import { generateSidebar } from 'vitepress-sidebar';

const hostname: string = 'https://uprt.dev'
const copyright: string = 'Copyright © ' + (new Date().getFullYear() == 2023 ? '2023' : '2023 - ' + new Date().getFullYear()) + ' blackbone'
const tg_svg: string = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path d="M12,0 C18.6274,0 24,5.3726 24,12 C24,18.6274 18.6274,24 12,24 C5.3726,24 0,18.6274 0,12 C0,5.3726 5.3726,0 12,0 Z M17.3298,7.2 C16.8726636,7.20811258 16.171266,7.44889362 12.7957776,8.83499728 C11.6135541,9.32046312 9.25077193,10.3254377 6.19904958,11.8493737 C5.1320479,12.0752705 4.83042508,12.2962628 4.80319782,12.5123505 C4.75001384,12.9272162 5.35549555,13.0563697 6.11668435,13.3006513 C6.73728242,13.4998144 7.57209596,13.7336148 8.00608126,13.7420714 C8.39963111,13.7504681 8.83912362,13.5902384 9.32421013,13.2613824 C12.6348635,11.0550561 14.3438362,10.0958721 14.4511313,10.0838308 C14.5268255,10.0644796 14.6317191,10.0383066 14.7027893,10.1369299 C14.7738596,10.2355531 14.766873,10.4007585 14.7593448,10.4880645 C14.6991511,10.8054092 11.5891779,13.1981483 11.4101969,13.3816784 L11.3243622,13.4679668 C10.6646323,14.1193646 9.99759322,14.5446066 11.1487996,15.2928197 C12.186798,15.9683949 12.7911508,16.3993654 13.8609223,17.0916841 C14.5445686,17.5341162 15.0805559,18.0587741 15.7864018,17.9948641 C16.1107927,17.965521 16.4466804,17.6636266 16.6170625,16.7643752 C16.940694,14.6391762 17.8112125,10.0345165 17.9941723,8.1370463 C18.0101583,7.97080345 17.9885299,7.7580992 17.978537,7.66464966 C17.9685441,7.57120011 17.9317852,7.43822246 17.8008196,7.33967629 C17.6551916,7.22294463 17.4306218,7.19888395 17.3298,7.2 Z"/>
</svg>`

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
    hostname: hostname,

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
          { icon: 'github', link: 'https://github.com/blackbone' },
          { icon: { svg: tg_svg }, link: 'https://t.me/uprt_rzrbtk'}
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
    await generateRobotsTxt(config);
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

async function generateRobotsTxt(config: SiteConfig) {
  const robotsPath = 'robots.txt';
  const robotsContent = `User-agent: *
Disallow: 
Sitemap: https://uprt.dev/sitemap.xml`;

  writeFileSync(path.join(config.outDir, robotsPath), robotsContent)
}
