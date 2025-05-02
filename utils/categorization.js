// Tab categorization utilities

// Simple keyword-based categorization
// In a real extension, this could be replaced with a more sophisticated ML model
export function categorizeTab(tab) {
  return new Promise((resolve) => {
    const url = tab.url || ""
    const title = tab.title || ""

    const lowerUrl = url.toLowerCase()
    const lowerTitle = title.toLowerCase()

    // Define category keywords
    const categories = {
      work: [
        "docs",
        "sheets",
        "office",
        "github",
        "gitlab",
        "jira",
        "confluence",
        "trello",
        "asana",
        "slack",
        "teams",
        "zoom",
        "meet",
        "notion",
        "figma",
        "miro",
        "airtable",
        "monday",
        "basecamp",
        "clickup",
        "linear",
        "gmail",
        "outlook",
        "calendar",
        "drive",
        "dropbox",
        "onedrive",
      ],
      social: [
        "facebook",
        "twitter",
        "instagram",
        "linkedin",
        "reddit",
        "whatsapp",
        "messenger",
        "discord",
        "telegram",
        "tiktok",
        "snapchat",
        "pinterest",
        "tumblr",
        "clubhouse",
        "signal",
        "wechat",
        "line",
        "viber",
        "skype",
        "dating",
        "tinder",
        "bumble",
        "hinge",
        "okcupid",
        "match",
        "social",
      ],
      shopping: [
        "amazon",
        "ebay",
        "etsy",
        "walmart",
        "target",
        "shop",
        "cart",
        "checkout",
        "product",
        "buy",
        "purchase",
        "order",
        "shipping",
        "delivery",
        "price",
        "deal",
        "discount",
        "sale",
        "offer",
        "coupon",
        "promo",
        "store",
        "mall",
        "market",
        "shop",
        "bestbuy",
        "newegg",
        "aliexpress",
        "wayfair",
      ],
      entertainment: [
        "youtube",
        "netflix",
        "hulu",
        "disney",
        "spotify",
        "music",
        "video",
        "stream",
        "game",
        "play",
        "movie",
        "show",
        "series",
        "episode",
        "season",
        "watch",
        "listen",
        "twitch",
        "steam",
        "epic",
        "xbox",
        "playstation",
        "nintendo",
        "anime",
        "manga",
        "comic",
        "book",
        "read",
        "audible",
        "podcast",
        "radio",
      ],
      news: ["news", "cnn", "bbc", "nyt", "read", "audible", "podcast", "radio"],
      news: [
        "news",
        "cnn",
        "bbc",
        "nyt",
        "reuters",
        "guardian",
        "washington post",
        "huffington",
        "article",
        "blog",
        "report",
        "headline",
        "breaking",
        "politics",
        "economy",
        "finance",
        "stock",
        "market",
        "crypto",
        "bitcoin",
        "weather",
        "sport",
        "espn",
        "fox",
        "nbc",
        "abc",
        "cbs",
        "msnbc",
        "cnbc",
      ],
      dev: [
        "stackoverflow",
        "github",
        "gitlab",
        "bitbucket",
        "code",
        "developer",
        "programming",
        "javascript",
        "python",
        "java",
        "c++",
        "ruby",
        "php",
        "html",
        "css",
        "react",
        "angular",
        "vue",
        "node",
        "npm",
        "yarn",
        "webpack",
        "babel",
        "typescript",
        "api",
        "rest",
        "graphql",
        "database",
        "sql",
        "nosql",
        "mongodb",
      ],
      reference: [
        "wikipedia",
        "dictionary",
        "thesaurus",
        "encyclopedia",
        "docs",
        "documentation",
        "manual",
        "guide",
        "tutorial",
        "learn",
        "course",
        "class",
        "lecture",
        "study",
        "research",
        "paper",
        "journal",
        "science",
        "math",
        "history",
        "geography",
        "language",
        "translate",
        "converter",
        "calculator",
      ],
    }

    // Check each category
    for (const [category, keywords] of Object.entries(categories)) {
      for (const keyword of keywords) {
        if (lowerUrl.includes(keyword) || lowerTitle.includes(keyword)) {
          return resolve(category)
        }
      }
    }

    // Check for domain patterns
    const domainMatch = lowerUrl.match(/^https?:\/\/([^/]+)/)
    if (domainMatch) {
      const domain = domainMatch[1]

      // Check for common domain patterns
      if (domain.includes("mail.") || domain.includes("outlook.")) {
        return resolve("work")
      }

      if (domain.includes("docs.") || domain.includes("sheets.")) {
        return resolve("work")
      }

      if (domain.includes("news.") || domain.endsWith(".news")) {
        return resolve("news")
      }

      if (domain.includes("shop.") || domain.endsWith(".shop") || domain.includes("store.")) {
        return resolve("shopping")
      }

      if (domain.includes("play.") || domain.includes("game.") || domain.includes("stream.")) {
        return resolve("entertainment")
      }

      if (domain.includes("dev.") || domain.includes("code.") || domain.endsWith(".dev")) {
        return resolve("dev")
      }
    }

    // Default category
    resolve("other")
  })
}

// Get color for a category
export function getTabColor(category) {
  const colors = {
    work: "blue",
    social: "pink",
    shopping: "green",
    entertainment: "yellow",
    news: "red",
    other: "grey",
    dev: "purple",
    reference: "cyan",
  }

  return colors[category] || "grey"
}
