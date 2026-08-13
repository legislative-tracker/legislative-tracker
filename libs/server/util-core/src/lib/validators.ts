/**
 * Checks whether the provided string is a valid URI for an image file
 */
export const isImageLink = (urlStr: string | undefined): boolean => {
  if (!urlStr || typeof urlStr !== "string") return false;
  if (/(no[-_]?image|placeholder|default[-_]?photo)/i.test(urlStr)) return false;

  try {
    const url = new URL(urlStr);
    if (!["http:", "https:"].includes(url.protocol)) return false;

    const imageExtensions = /\.(jpg|jpeg|png|webp|avif|gif|svg)($|\?)/i;
    if (imageExtensions.test(url.pathname) || imageExtensions.test(url.href)) {
      return true;
    }
    return /\/(images|headshot|photos?|avatars?)\//i.test(url.pathname);
  } catch (e) {
    return false;
  }
};

/**
 * Checks whether the provided string is a valid Email address
 */
export const isEmail = (email: string | undefined): boolean => {
  if (!email || typeof email !== "string") return false;
  const cleanEmail = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(cleanEmail);
};
