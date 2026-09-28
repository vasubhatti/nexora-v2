import AppError from "../utils/AppError.js";

export const searchWeb = async (query) => {
  try {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": process.env.SERPER_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: query,
        num: 5, // top 5 results
      }),
    });

    if (!response.ok) {
      throw new AppError("Web search failed.", 500);
    }

    const data = await response.json();

    // Extract clean results
    const results = (data.organic || []).slice(0, 5).map((r) => ({
      title: r.title,
      link: r.link,
      snippet: r.snippet,
    }));

    // Format for AI context
    const formatted = results
      .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.link}\n${r.snippet}`)
      .join("\n\n");

    return { results, formatted };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`Search error: ${error.message}`, 500);
  }
};