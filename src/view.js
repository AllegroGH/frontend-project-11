/* eslint object-curly-newline: ["error", { "multiline": true }] */
import onChange from 'on-change';

export default (elements, state, i18n) => {
  //  const { rssForm, urlInput, submit, feedback, feeds } = elements;
  const { rssForm, urlInput, feedback } = elements;

  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'rssForm.errors':
        if (value.length) {
          urlInput.classList.add('is-invalid');
          const [feedbackText] = value;
          feedback.textContent = feedbackText;
          feedback.classList.remove('text-success');
          feedback.classList.add('text-danger');
        } else {
          urlInput.classList.remove('is-invalid');
          feedback.textContent = i18n.t('main.successfulFeedback');
          feedback.classList.add('text-success');
          feedback.classList.remove('text-danger');
          rssForm.reset();
          urlInput.focus();
        }
        break;
      default:
        console.log(`unwatchable path: ${path}`);
    }
  });

  return watchedState;
};
