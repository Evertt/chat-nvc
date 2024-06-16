fetch("https://chat-nvc.vercel.app", {
  headers: {
    "User-Agent": `post-build.js running on ${
      process.env.VERCEL_URL || "no vercel url"
    }`,
  },
})
  .then((res) => ["UN", ""][+res.ok])
  .then((prefix) =>
    console.log(
      `Post build script ran ${prefix}successfully on ${
        process.env.VERCEL_URL || "no vercel url"
      }!`
    )
  )
