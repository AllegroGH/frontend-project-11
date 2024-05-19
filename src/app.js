// import onChange from 'on-change';
import * as yup from 'yup';
import i18next from 'i18next';
import watch from './view.js';
import resources from './locales/index.js';

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
      errors: null,
    },
    feed: {
      urls: [],
    },
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
  const schema = yup.string().url();

  const watchedState = watch(elements, state, i18n);

  elements.rssForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const input = formData.get('url');
    schema
      .validate(input, { abortEarly: false })
      .then(() => {
        watchedState.rssForm.errors = [];
      })
      .catch((err) => {
        const messages = err.errors.map((error) => i18n.t(error.key));
        watchedState.rssForm.errors = messages;
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
