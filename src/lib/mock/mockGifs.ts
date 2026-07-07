const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const searchGifs = async (query: string = "trending") => {
  await delay(400); // simulate network
  
  // Return some hardcoded valid tenor/giphy URLs for testing
  return Array.from({ length: 12 }).map((_, i) => ({
    id: `gif_${i}`,
    url: `https://media.giphy.com/media/l41lFw057lAJQMwg0/giphy.gif`,
    thumb: `https://media.giphy.com/media/l41lFw057lAJQMwg0/giphy.gif`
  }));
};
