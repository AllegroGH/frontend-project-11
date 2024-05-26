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

export default () => {
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
  };

  const state = {
    rssForm: {
      state: 'filling',
      input: '',
      error: null,
    },
    feeds: [],
    posts: [],
  };

  const defaultLng = 'ru';
  const i18n = i18next.createInstance();
  i18n.init({
    lng: defaultLng,
    debug: false,
    resources,
  });

  // LOAD LOCALE
  elements.textNodes.main.header.textContent = i18n.t('main.header');
  elements.textNodes.main.subheader.textContent = i18n.t('main.subheader');
  elements.textNodes.main.form.inputLabel.textContent = i18n.t('main.form.inputLabel');
  elements.textNodes.main.form.btn.textContent = i18n.t('main.form.btn');
  elements.textNodes.main.linkExample.textContent = i18n.t('main.linkExample');

  yup.setLocale({
    string: {
      url: () => ({ key: 'errors.invalid' }),
    },
    mixed: {
      notOneOf: () => ({ key: 'errors.alreadyExists' }),
    },
  });

  // prettier-ignore
  const schema = (url, loadedUrls) => yup
    .string().url().notOneOf(loadedUrls).validate(url, { abortEarly: false });

  const watchedState = watch(elements, state, i18n);

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

  elements.urlInput.addEventListener('invalid', (e) => {
    if (e.target.value.length === 0) {
      e.target.setCustomValidity(i18n.t('errors.required'));
    }
  });

  elements.urlInput.addEventListener('input', (e) => {
    e.target.setCustomValidity('');
  });
};
