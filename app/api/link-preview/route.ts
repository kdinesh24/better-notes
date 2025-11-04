import { NextRequest, NextResponse } from "next/server";
import ogs from "open-graph-scraper";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    let normalizedUrl = url.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    const youtubeRegex =
      /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;
    const youtubeMatch = normalizedUrl.match(youtubeRegex);

    if (youtubeMatch) {
      const videoId = youtubeMatch[1];
      return NextResponse.json({
        title: "YouTube Video",
        description: "Watch this video on YouTube",
        image: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        url: normalizedUrl,
        siteName: "YouTube",
        favicon: "https://www.youtube.com/favicon.ico",
      });
    }

    const options = {
      url: normalizedUrl,
      timeout: 10000,
      fetchOptions: {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      },
    };

    const { result, error } = await ogs(options);
    const hostname = new URL(normalizedUrl).hostname;

    if (error) {
      const githubRegex = /github\.com\/([^/]+)(?:\/([^/]+))?/i;
      const githubMatch = normalizedUrl.match(githubRegex);

      if (githubMatch) {
        const username = githubMatch[1];
        const repo = githubMatch[2];

        return NextResponse.json({
          title: repo ? `${username}/${repo}` : username,
          description: repo ? "GitHub Repository" : "GitHub Profile",
          image: `https://github.com/${username}.png`,
          url: normalizedUrl,
          siteName: "GitHub",
          favicon: "https://github.com/favicon.ico",
        });
      }

      return NextResponse.json({
        title: hostname,
        description: normalizedUrl,
        image: `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`,
        url: normalizedUrl,
        siteName: hostname,
        favicon: `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`,
      });
    }

    const ogData = result;

    return NextResponse.json({
      title: ogData.ogTitle || ogData.twitterTitle || hostname,
      description:
        ogData.ogDescription || ogData.twitterDescription || normalizedUrl,
      image:
        ogData.ogImage?.[0]?.url ||
        ogData.twitterImage?.[0]?.url ||
        `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`,
      url: normalizedUrl,
      siteName: ogData.ogSiteName || hostname,
      favicon: `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`,
    });
  } catch (error) {
    console.error("Error fetching link preview:", error);
    return NextResponse.json(
      { error: "Failed to fetch link preview" },
      { status: 500 },
    );
  }
}
