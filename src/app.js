import onChange from 'on-change';
import * as yup from 'yup';

const schema = yup.string().trim().url().required();

export default () => {
  const elements = {
    rssForm: document.querySelector('.rss-form'),
    urlInput: document.querySelector('#url-input'),
    submit: document.querySelector('[type="submit"]'),
    feedback: document.querySelector('.feedback'),
    feeds: document.querySelector('.feeds'),
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

  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'rssForm.errors':
        if (value.length) {
          elements.urlInput.classList.add('is-invalid');
          const [feedbackText] = value;
          elements.feedback.textContent = feedbackText;
          elements.feedback.classList.remove('text-success');
          elements.feedback.classList.add('text-danger');
        } else {
          elements.urlInput.classList.remove('is-invalid');
          const feedbackText = 'RSS успешно загружен';
          elements.feedback.textContent = feedbackText;
          elements.feedback.classList.add('text-success');
          elements.feedback.classList.remove('text-danger');
          elements.rssForm.reset();
          elements.urlInput.focus();
        }
        break;
      default:
        console.log(`unwatchable path: ${path}`);
    }
  });

  elements.rssForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const input = formData.get('url');
    schema
      .validate(input)
      .then(() => {
        watchedState.rssForm.errors = [];
      })
      .catch((err) => {
        watchedState.rssForm.errors = err.errors;
      });
  });
};
