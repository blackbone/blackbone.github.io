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
}

function getAllTags(posts:Post[]): string[] {
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

declare const data: PostsData
export { data }

const exludedPaths = [
    "/posts/",
    "/posts/source_generators/"
]

export default createContentLoader(['posts/**/*.md'], {
  excerpt: true,
  transform(raw): PostsData {
    var posts = raw
      .filter((p) => {
        return exludedPaths.indexOf(p.url) == -1})
      .map(({ url, frontmatter, excerpt }) => ({
        title: frontmatter.title,
        url,
        icon: {
          src: url ? (url + "logo.jpg") : '/not_found.jpg',
          width: "100%",
          height: "100%"
        },
        excerpt,
        date: formatDate(frontmatter.date),
        lang: frontmatter.lang,
        tags: Array.isArray(frontmatter.tags) ? Array.from(frontmatter.tags).filter((x, i, a) => a.indexOf(x) === i) : frontmatter.tags !== undefined ? [frontmatter.tags] : []
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

function formatDate(raw: string): Post['date'] {
  const date = new Date(raw)
  return {
    time: +date,
    string: date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
}