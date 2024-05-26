/* eslint object-curly-newline: ["error", { "multiline": true }] */
import onChange from 'on-change';

const errorsHandler = (error, { feedback }, i18n) => {
  if (error) feedback.textContent = i18n.t(error);
};

const formStateHandler = (state, { rssForm, urlInput, submit, feedback }, i18n) => {
  switch (state) {
    case 'invalid':
      submit.disabled = false;
      urlInput.classList.add('is-invalid');
      feedback.classList.remove('text-success');
      feedback.classList.remove('text-warning');
      feedback.classList.add('text-danger');
      break;

    case 'sending':
      submit.disabled = true;
      urlInput.classList.remove('is-invalid');
      feedback.classList.remove('text-danger');
      feedback.classList.remove('text-success');
      feedback.classList.add('text-warning');
      feedback.textContent = i18n.t('main.sendingFeedback');
      break;

    case 'loaded': {
      submit.disabled = false;
      urlInput.classList.remove('is-invalid');
      feedback.classList.remove('text-warning');
      feedback.classList.remove('text-danger');
      feedback.classList.add('text-success');
      feedback.textContent = i18n.t('main.loadedFeedback');
      rssForm.reset();
      urlInput.focus();
      break;
    }

    default:
      break;
  }
};

const createFeedNodes = (stateFeeds) => {
  const feedNodes = stateFeeds.map((feed) => {
    const node = document.createElement('li');
    node.classList.add('list-group-item', 'border-0', 'border-end-0');

    const nodeTitle = document.createElement('h3');
    nodeTitle.classList.add('h6', 'm-0');
    nodeTitle.textContent = feed.title;
    node.append(nodeTitle);

    const nodeDescription = document.createElement('p');
    nodeDescription.classList.add('m-0', 'small', 'text-black-50');
    nodeDescription.textContent = feed.description;
    node.append(nodeDescription);

    return node;
  });
  return feedNodes;
};

// refactoring + renderPosts
const renderFeeds = (stateFeeds, { feeds }, i18n) => {
  feeds.innerHTML = '';
  const card = document.createElement('div');
  card.classList.add('card', 'border-0');

  const cardBody = document.createElement('div');
  cardBody.classList.add('card-body');

  const cardTitle = document.createElement('h2');
  cardTitle.classList.add('card-title', 'h4');
  cardTitle.textContent = i18n.t('feeds.header');

  cardBody.append(cardTitle);
  card.append(cardBody);

  const list = document.createElement('ul');
  list.classList.add('list-group', 'border-0', 'rounded-0');
  list.append(...createFeedNodes(stateFeeds));

  card.append(list);
  feeds.append(card);
};

const createPostNodes = (statePosts, i18n) => {
  const postNodes = statePosts.map((post) => {
    const node = document.createElement('li');
    node.classList.add(
      'list-group-item',
      'd-flex',
      'justify-content-between',
      'align-items-start',
      'border-0',
      'border-end-0',
    );

    const nodeHref = document.createElement('a');
    nodeHref.setAttribute('href', post.link);
    nodeHref.setAttribute('data-id', post.id);
    nodeHref.setAttribute('target', '_blank');
    nodeHref.setAttribute('target', '_blank');
    nodeHref.textContent = post.title;

    const nodeBtn = document.createElement('button');
    nodeBtn.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    nodeBtn.textContent = i18n.t('posts.previewBtn');

    node.append(nodeHref, nodeBtn);
    return node;
  });
  return postNodes;
};

// refactoring + renderFeeds
const renderPosts = (statePosts, { posts }, i18n) => {
  posts.innerHTML = '';
  const card = document.createElement('div');
  card.classList.add('card', 'border-0');

  const cardBody = document.createElement('div');
  cardBody.classList.add('card-body');

  const cardTitle = document.createElement('h2');
  cardTitle.classList.add('card-title', 'h4');
  cardTitle.textContent = i18n.t('posts.header');

  cardBody.append(cardTitle);
  card.append(cardBody);

  const list = document.createElement('ul');
  list.classList.add('list-group', 'border-0', 'rounded-0');
  list.append(...createPostNodes(statePosts, i18n));

  card.append(list);
  posts.append(card);
};

export default (elements, state, i18n) => {
  //  const { rssForm, urlInput, submit, feedback, feeds, posts } = elements;
  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'rssForm.error':
        errorsHandler(value, elements, i18n);
        break;

      case 'rssForm.state':
        formStateHandler(value, elements, i18n);
        break;

      case 'feeds':
        renderFeeds(value, elements, i18n);
        break;

      case 'posts':
        renderPosts(value, elements, i18n);
        break;

      default:
        console.log(`unwatchable path: ${path}`);
    }
  });

  return watchedState;
};
