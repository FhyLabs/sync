export const isFullUrl = (url) => /^https?:\/\//i.test(url);
export const resolveUrl = (base, endpoint) => {
  try {
    if (isFullUrl(endpoint)) return endpoint;
    return new URL(endpoint, base).toString();
  } catch (err) {
    return endpoint;
  }
};
