const parse = (feedData, feedUrl) => {
  const parser = new DOMParser();
  const data = parser.parseFromString(feedData, 'text/xml');

  const parseError = data.querySelector('parsererror');
  if (parseError) {
    const error = new Error(parseError.textContent);
    error.isRSSDataError = true;
    throw error;
  }

  const feed = {
    url: feedUrl,
    title: data.querySelector('title').textContent,
    description: data.querySelector('description').textContent,
  };

  const posts = Array.from(data.querySelectorAll('item')).map((post) => ({
    link: post.querySelector('link').textContent,
    title: post.querySelector('title').textContent,
    description: post.querySelector('description').textContent,
  }));

  return { feed, posts };
};

export default parse;
