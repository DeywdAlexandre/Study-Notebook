/**
 * Transforms a Google Doc URL into an embeddable preview URL.
 * Also returns the original URL for the "Edit" button.
 * @param url The original Google Doc URL.
 * @returns An object with the embedUrl and originalUrl, or null if invalid.
 */
export const transformGoogleDocUrl = (url: string): { embedUrl: string; originalUrl: string } | null => {
  if (!url || !url.includes('docs.google.com/document/d/')) {
    return null;
  }

  // Find the DOC ID, which is between /d/ and /
  const match = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
  if (!match || !match[1]) {
    return null;
  }
  const docId = match[1];

  // The original URL for editing is just the input URL if it contains /edit
  // or a constructed one if not.
  const originalUrl = url.includes('/edit') ? url : `https://docs.google.com/document/d/${docId}/edit`;
  
  // The embed URL uses /preview at the end
  const embedUrl = `https://docs.google.com/document/d/${docId}/preview`;

  return { embedUrl, originalUrl };
};
