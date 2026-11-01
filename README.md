# KyronixPlayer High-Throughput Media Resolver API

A lightweight, serverless Node.js/TypeScript resolver for Instagram, deployable to **Vercel** with 1 click (free, handles 50,000+ requests without rate limits).

## Features
- **No yt-dlp required!** Resolves Instagram reels, videos, posts, and audio streams directly.
- **Vercel Ready**: Deploy for free in 30 seconds.
- Returns JSON with `audioUrl` and metadata that KyronixPlayer consumes directly.

## Deployment to Vercel

1. Push this folder to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "feat: KyronixPlayer resolver"
   git branch -M main
   git remote add origin https://github.com/paradox6ygf/kyronix-resolver-api.git
   git push -u origin main
   ```
2. Import the repository in [Vercel](https://vercel.com/new).
3. Click **Deploy**.
4. You will get an instant URL, for example: `https://kyronix-resolver.vercel.app`.

## Configure in KyronixPlayer `application.yml`

```yaml
plugins:
  kyronixplayer:
    sources:
      instagram: true
    instagram:
      enabled: true
      apiUrl: "https://kyronix-resolver.vercel.app" # Your Vercel resolver URL
```

