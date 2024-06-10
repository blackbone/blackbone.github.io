import { DefaultTheme, createContentLoader } from 'vitepress'

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

declare const data: PostsData
export { data }

export default createContentLoader(['posts/**/*.md', 'ru/posts/**/*.md'], {
  excerpt: true,
  transform(raw): PostsData {
    var posts = raw
      .filter((p) => {
        return !p.frontmatter.draft && !p.frontmatter.ignore})
      .map(({ url, frontmatter }) => ({
        title: frontmatter.title,
        url,
        icon: {
          src: url ? (url.replace('/ru', '') + "logo.jpg") : '/not_found.jpg',
          width: "100%",
          height: "100%"
        },
        excerpt: frontmatter.description,
        date: formatDate(frontmatter.date, frontmatter.lang),
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

function formatDate(raw: string, lang?: string): Post['date'] {
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

// copy and use where needed
function getFilteredPosts(posts:Post[], filter?:string[], limit?:number): Post[] {
  console.log(filter)
  console.log(limit)
  
  var filteredPosts = posts;
  if (filter && filter.length > 0) {
    filteredPosts = filteredPosts.filter(post => {
      if (post.tags == undefined) return false;
      return post.tags.some(tag => filter.includes(tag));
    });
  }

  if (limit !== undefined) {
    filteredPosts = filteredPosts.slice(0, limit);
  }

  console.log(filteredPosts)
  return filteredPosts;
}
