const axios = require('axios');

// Rotated user agents
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400'); // Edge cache

  if (req.method === 'OPTIONS') return res.status(200).end();

  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  const match = targetUrl.match(/instagram\.com\/(?:reel|p|tv|stories)\/([A-Za-z0-9_-]+)/i);
  if (!match) {
    return res.status(400).json({ error: 'Invalid Instagram URL' });
  }
  const shortcode = match[1];

  // --------------------------------------------------------------------------
  // STRATEGY 1: Official Instagram GraphQL API with Cookie (Recommended for 50k+)
  // Provide INSTAGRAM_COOKIE or IG_SESSION_ID in your Vercel Environment Variables
  // --------------------------------------------------------------------------
  const cookie = process.env.INSTAGRAM_COOKIE || (process.env.IG_SESSION_ID ? `sessionid=${process.env.IG_SESSION_ID}` : null);
  if (cookie) {
    try {
      const doc_id = '8845758582119845';
      const variables = JSON.stringify({ shortcode });
      const apiRes = await axios.get(`https://www.instagram.com/graphql/query/?doc_id=${doc_id}&variables=${encodeURIComponent(variables)}`, {
        headers: {
          'User-Agent': getRandomUserAgent(),
          'X-IG-App-ID': '936619743392459',
          'Cookie': cookie,
          'Referer': 'https://www.instagram.com/'
        },
        timeout: 6000
      });

      const media = apiRes.data?.data?.xdt_shortcode_media;
      if (media && media.video_url) {
        return res.status(200).json({
          id: shortcode,
          title: media.edge_media_to_caption?.edges?.[0]?.node?.text?.slice(0, 100) || `Instagram Reel (${shortcode})`,
          author: media.owner?.username || 'Instagram',
          duration: Math.round((media.video_duration || 0) * 1000),
          thumbnail: media.display_url || '',
          videoUrl: media.video_url,
          audioUrl: media.video_url
        });
      }
    } catch (err) {
      console.warn('Strategy 1 (Cookie GraphQL) failed:', err.message);
    }
  }

  // --------------------------------------------------------------------------
  // STRATEGY 2: Public SnapInsta / SaveClip API Gateway
  // --------------------------------------------------------------------------
  try {
    const snapRes = await axios.post('https://snapinsta.to/api/ajaxSearch', 
      new URLSearchParams({ q: `https://www.instagram.com/reel/${shortcode}/`, t: 'media', lang: 'en' }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': getRandomUserAgent(),
          'Referer': 'https://snapinsta.to/'
        },
        timeout: 7000
      }
    );

    const htmlData = snapRes.data?.data;
    if (htmlData) {
      const videoMatch = htmlData.match(/href="([^"]+)"[^>]*download/i) || 
                         htmlData.match(/href="([^"]+)"[^>]*class="btn download-media/i);
      if (videoMatch && videoMatch[1].startsWith('http')) {
        return res.status(200).json({
          id: shortcode,
          title: `Instagram Reel (${shortcode})`,
          author: 'Instagram',
          duration: 0,
          thumbnail: '',
          videoUrl: videoMatch[1],
          audioUrl: videoMatch[1]
        });
      }
    }
  } catch (err) {
    // Continue to next strategy
  }

  // --------------------------------------------------------------------------
  // STRATEGY 3: Instagram Web OpenGraph Crawler View
  // --------------------------------------------------------------------------
  try {
    const crawlerRes = await axios.get(`https://www.instagram.com/p/${shortcode}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html'
      },
      timeout: 5000
    });

    const html = crawlerRes.data;
    const videoMatch = html.match(/property="og:video" content="([^"]+)"/i) ||
                       html.match(/property="og:video:secure_url" content="([^"]+)"/i);
    const titleMatch = html.match(/property="og:title" content="([^"]+)"/i);

    if (videoMatch) {
      const videoUrl = videoMatch[1].replace(/&amp;/g, '&');
      return res.status(200).json({
        id: shortcode,
        title: titleMatch ? titleMatch[1].replace(/&amp;/g, '&') : `Instagram Video (${shortcode})`,
        author: 'Instagram',
        duration: 0,
        thumbnail: '',
        videoUrl: videoUrl,
        audioUrl: videoUrl
      });
    }
  } catch (err) {
    // Continue
  }

  return res.status(404).json({
    error: 'Failed to extract media. To guarantee 100% uptime for 50k+ requests, add INSTAGRAM_COOKIE or IG_SESSION_ID to your Vercel Environment Variables.'
  });
};
