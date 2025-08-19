import { ContentData, DefaultTheme, createContentLoader } from 'vitepress'

export interface PostsData {
  posts: Post[],
  tags: string[]
}

export interface Post {
    title: string
    url: string
    lang: string | undefined
    icon?: DefaultTheme.FeatureIcon
    date: {
      time: number
      string: string
    }
    excerpt: string | undefined,
    tags: string[] | undefined
    html: string | undefined
}

declare const data: PostsData
export { data }

// get rid of this and use exported function
export default createContentLoader(['posts/**/*.md'], {
  excerpt: true,
  transform(raw): PostsData {
    var posts = raw
      .filter((p) => {
        return !p.frontmatter.draft && !p.frontmatter.ignore})
      .map(({ url, frontmatter, html }) => ({
        title: frontmatter.title,
        url,
        icon: {
          src: url ? url + "logo.jpg" : '/not_found.jpg',
          width: "100%",
          height: "100%"
        },
        excerpt: frontmatter.description,
        date: formatDate(frontmatter.date, frontmatter.lang),
        lang: frontmatter.lang,
        tags: Array.isArray(frontmatter.tags) ? Array.from(frontmatter.tags).filter((x, i, a) => a.indexOf(x) === i) : frontmatter.tags !== undefined ? [frontmatter.tags] : [],
        html: html
      }))
      .sort((a, b) => b.date.time - a.date.time)
      var tags = getAllTags(posts)
      let result: PostsData = {
        posts: posts,
        tags: tags
      }

      return result;
  }
})

export function filterPosts(posts:Post[], tags?:string[], limit?:number, lang?:string): Post[] {
  var filteredPosts = posts;
  if (lang === undefined) {
    lang = 'en-US'
  }

  filteredPosts = filteredPosts.filter(p => p.lang == lang);
  
  if (tags && tags.length > 0) {
    filteredPosts = filteredPosts.filter(post => {
      if (post.tags == undefined) return false;
      return post.tags.some(tag => tags.includes(tag));
    });
  }

  if (limit !== undefined) {
    filteredPosts = filteredPosts.slice(0, limit);
  }

  return filteredPosts;
}

export function formatDate(raw: string, lang?: string): Post['date'] {
  const date = new Date(raw)
  return {
    time: +date,
    string: date.toLocaleDateString(lang != undefined ? lang : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
}

export function getAllTags(posts:Post[]): string[] {
  var tags: string[] = []
  posts.forEach(p => {
    if (p.tags == undefined) return;
    p.tags.forEach(t => {
      if (tags.indexOf(t) == -1) tags.push(t)
    })
  });
  tags.filter((x, i, a) => a.indexOf(x) === i)
  return tags;
}

export function transform(raw: ContentData[]): PostsData {
  var posts = raw
    .filter((p) => {
      return !p.frontmatter.draft && !p.frontmatter.ignore})
    .map(({ url, frontmatter, html }) => ({
      title: frontmatter.title,
      url,
      icon: {
        src: url ? url + "logo.jpg" : '/not_found.jpg',
        alt: url ? url + "logo.jpg" : '/not_found.jpg',
        width: "100%",
        height: "100%"
      },
      excerpt: frontmatter.description,
      date: formatDate(frontmatter.date, frontmatter.lang),
      lang: frontmatter.lang,
      tags: Array.isArray(frontmatter.tags) ? Array.from(frontmatter.tags).filter((x, i, a) => a.indexOf(x) === i) : frontmatter.tags !== undefined ? [frontmatter.tags] : [],
      html: html
    }))
    .sort((a, b) => b.date.time - a.date.time)
    var tags = getAllTags(posts)
    let result: PostsData = {
      posts: posts,
      tags: tags
    }

    return result;
}