export function github(
  token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN,
  fetcher = fetch,
) {
  if (!token) throw Error("GitHub release operations require a token");
  return async (path, { method = "GET", body, optional = false } = {}) => {
    const response = await fetcher(`https://api.github.com${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (optional && response.status === 404) return null;
    if (!response.ok) throw Error(`GitHub ${path}: HTTP ${response.status}`);
    return response.json();
  };
}
