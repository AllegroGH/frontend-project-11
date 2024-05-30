// import onChange from 'on-change';
import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import watch from './view.js';
import resources from './locales/index.js';
import getRssData from './rss.js';

const getUniqueId = (prefix = '') => {
  let counter = 0;
  return () => {
    counter += 1;
    return `${prefix}${counter}`;
  };
};
const getFeedUniqueId = getUniqueId('feed-');
const getPostUniqueId = getUniqueId('post-');

const getProxyUrl = (url) => `https://allorigins.hexlet.app/get?disableCache=true&url=${url}`;

const getErrorValue = (error) => {
  if (error.isRSSDataError) return 'errors.noRssData';
  if (error.isAxiosError) return 'errors.networkError';
  return error.message.key;
};

const rssDataHandler = (data, watchedState) => {
  const { feed, posts } = data;
  feed.id = getFeedUniqueId();
  watchedState.feeds.push(feed);
  const postsWithIds = posts.map((post) => ({
    ...post,
    id: getPostUniqueId(),
    feedId: feed.id,
  }));
  watchedState.posts.push(...postsWithIds);
};

const postsRefresh = (watchedState) => {
  // prettier-ignore
  const updates = watchedState.feeds.map((feed) => axios.get(getProxyUrl(feed.url))
    .then((response) => {
      const { posts } = getRssData(response.data.contents);
      const currentFeedPosts = watchedState.posts.filter((post) => post.feedId === feed.id);
      const currentFeedPostsLinks = currentFeedPosts.map((post) => post.link);
      const newPosts = posts.filter((post) => !currentFeedPostsLinks.includes(post.link));

      const newPostsWithIds = newPosts.map((post) => ({
        ...post,
        id: getPostUniqueId(),
        feedId: feed.id,
      }));
      watchedState.posts.unshift(...newPostsWithIds);
    })
    .catch((error) => {
      console.error(`Axios error from ${feed.id}:`, error);
    }));
  return Promise.all(updates).finally(() => setTimeout(postsRefresh, 5000, watchedState));
};

export default () => {
  // define DOM elements
  const elements = {
    rssForm: document.querySelector('.rss-form'),
    urlInput: document.querySelector('#url-input'),
    submit: document.querySelector('[type="submit"]'),
    feedback: document.querySelector('.feedback'),
    posts: document.querySelector('.posts'),
    feeds: document.querySelector('.feeds'),
    textNodes: {
      main: {
        header: document.querySelector('h1[class="display-3 mb-0"]'),
        subheader: document.querySelector('p[class="lead"]'),
        form: {
          inputLabel: document.querySelector('label[for="url-input"]'),
          btn: document.querySelector('button[class="h-100 btn btn-lg btn-primary px-sm-5"]'),
        },
        linkExample: document.querySelector('p[class="mt-2 mb-0 text-muted"]'),
      },
    },
    modal: {
      div: document.querySelector('.modal'),
      header: document.querySelector('.modal-header'),
      body: document.querySelector('.modal-body'),
      href: document.querySelector('.full-article'),
    },
  };

  // define state
  const state = {
    defaultLng: 'ru',
    rssForm: {
      state: 'filling',
      input: '',
      error: null,
    },
    feeds: [],
    posts: [],
    ui: {
      readedPosts: new Set(),
      currentPost: null,
    },
  };

  const i18n = i18next.createInstance();
  i18n.init({
    lng: state.defaultLng,
    debug: false,
    resources,
  });

  // initial localization
  elements.textNodes.main.header.textContent = i18n.t('main.header');
  elements.textNodes.main.subheader.textContent = i18n.t('main.subheader');
  elements.textNodes.main.form.inputLabel.textContent = i18n.t('main.form.inputLabel');
  elements.textNodes.main.form.btn.textContent = i18n.t('main.form.btn');
  elements.textNodes.main.linkExample.textContent = i18n.t('main.linkExample');

  // setLocale yup rules
  yup.setLocale({
    string: {
      url: () => ({ key: 'errors.invalid' }),
    },
    mixed: {
      notOneOf: () => ({ key: 'errors.alreadyExists' }),
    },
  });

  // define yup chema
  // prettier-ignore
  const schema = (url, loadedUrls) => yup
    .string().url().notOneOf(loadedUrls).validate(url, { abortEarly: false });

  // define watchedState
  const watchedState = watch(elements, state, i18n);

  // submit event
  elements.rssForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const inputURL = formData.get('url');
    schema(
      inputURL,
      state.feeds.map(({ url }) => url),
    )
      .then(() => {
        watchedState.rssForm.error = null;
        watchedState.rssForm.state = 'sending';
        return axios.get(getProxyUrl(inputURL));
      })
      .then((response) => {
        const rssData = getRssData(response.data.contents, inputURL);
        rssDataHandler(rssData, watchedState);
        watchedState.rssForm.state = 'loaded';
      })
      .catch((err) => {
        watchedState.rssForm.state = 'invalid';
        watchedState.rssForm.error = getErrorValue(err);
      });
  });

  // applies to empty input
  elements.urlInput.addEventListener('invalid', (e) => {
    if (e.target.value.length === 0) {
      e.target.setCustomValidity(i18n.t('errors.required'));
    }
  });

  // applies to empty input
  elements.urlInput.addEventListener('input', (e) => {
    e.target.setCustomValidity('');
  });

  // post click event
  elements.posts.addEventListener('click', (e) => {
    const postId = e.target.dataset.id;
    if (postId) {
      watchedState.ui.currentPost = postId;
      watchedState.ui.readedPosts.add(postId);
    }
  });

  // auto refresh posts
  postsRefresh(watchedState);
};
