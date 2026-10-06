import { api } from '../lib/api.js';
import { postCard } from '../lib/templates.js';
import { escapeHtml, renderPager, setBusy, toast } from '../lib/ui.js';
import { LIMITS } from '../lib/validation.js';

/**
 * Renders a paginated list of posts with like / inline edit / delete.
 * fetchPage(page) must resolve to the API's page shape ({ items, page, totalPages, … }).
 */
export function createPostList($root, { fetchPage, emptyText = 'No posts yet.' }) {
  const $items = $('<div class="post-list"></div>');
  const $pager = $('<nav class="pager"></nav>');
  $root.empty().append($items, $pager);

  let currentPage = 1;
  const unmountVideos = [];

  function mountVideos() {
    $items.find('[data-video-src]').each((_, element) => {
      unmountVideos.push(
        window.Islands.mountVideoPlayer(element, { src: $(element).attr('data-video-src') }),
      );
    });
  }

  async function load(page) {
    currentPage = page;
    try {
      const data = await fetchPage(page);
      if (data.items.length === 0 && page > 1) {
        // The last post of the last page was removed; step back to the previous page.
        await load(page - 1);
        return;
      }
      unmountVideos.splice(0).forEach((unmount) => unmount());
      $items.html(
        data.items.length
          ? data.items.map(postCard).join('')
          : `<p class="muted">${escapeHtml(emptyText)}</p>`,
      );
      mountVideos();
      renderPager($pager, data, load);
    } catch (error) {
      $items.html(`<p class="error">${escapeHtml(error.message)}</p>`);
    }
  }

  const postIdOf = (element) => $(element).closest('[data-post-id]').attr('data-post-id');

  $items.on('click', '.js-like', async function toggleLike() {
    const $button = $(this);
    const postId = postIdOf(this);
    const isLiked = $button.hasClass('is-active');
    setBusy($button, true);
    try {
      const { likeCount, likedByMe } = isLiked
        ? await api.delete(`/api/posts/${postId}/like`)
        : await api.post(`/api/posts/${postId}/like`);
      $button.toggleClass('is-active', likedByMe).attr('aria-pressed', likedByMe);
      $button.find('.js-like-count').text(likeCount);
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setBusy($button, false);
    }
  });

  $items.on('click', '.js-delete', async function deletePost() {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.delete(`/api/posts/${postIdOf(this)}`);
      toast('Post deleted', 'success');
      await load(currentPage);
    } catch (error) {
      toast(error.message, 'error');
    }
  });

  $items.on('click', '.js-edit', function openEditor() {
    const $card = $(this).closest('[data-post-id]');
    if ($card.find('.js-edit-form').length) return;

    const hasImage = $card.find('.post-card__image').length > 0;
    const hasVideo = $card.find('.post-card__video').length > 0;
    const $content = $card.find('.post-card__content');
    const $form = $(`
      <form class="form js-edit-form" novalidate>
        <div class="field">
          <textarea name="content" rows="3" maxlength="${LIMITS.postMax}" aria-label="Post text"></textarea>
          <small class="field-error" data-error-for="content"></small>
        </div>
        <div class="row">
          ${hasImage ? '<label class="checkbox"><input type="checkbox" name="removeImage"> Remove image</label>' : ''}
          ${hasVideo ? '<label class="checkbox"><input type="checkbox" name="removeVideo"> Remove video</label>' : ''}
        </div>
        <div class="row">
          <button type="submit" class="btn btn--primary">Save</button>
          <button type="button" class="btn btn--ghost js-cancel-edit">Cancel</button>
        </div>
      </form>`);
    $form.find('textarea').val($content.text());
    $content.addClass('hidden').after($form);
  });

  $items.on('click', '.js-cancel-edit', function closeEditor() {
    const $card = $(this).closest('[data-post-id]');
    $card.find('.js-edit-form').remove();
    $card.find('.post-card__content').removeClass('hidden');
  });

  $items.on('submit', '.js-edit-form', async function saveEdit(event) {
    event.preventDefault();
    const $form = $(this);
    const $card = $form.closest('[data-post-id]');
    const content = $form.find('[name=content]').val().trim();
    const removeImage = $form.find('[name=removeImage]').is(':checked');
    const removeVideo = $form.find('[name=removeVideo]').is(':checked');
    const keepsMedia =
      ($card.find('.post-card__image').length > 0 && !removeImage) ||
      ($card.find('.post-card__video').length > 0 && !removeVideo);

    let message = null;
    if (content.length > LIMITS.postMax) message = `At most ${LIMITS.postMax} characters`;
    else if (!content && !keepsMedia) message = 'A post needs text, an image or a video';
    if (message) {
      $form.find('[data-error-for=content]').text(message);
      return;
    }

    const $submit = $form.find('[type=submit]');
    setBusy($submit, true);
    try {
      await api.patch(`/api/posts/${$card.attr('data-post-id')}`, {
        content,
        removeImage,
        removeVideo,
      });
      toast('Post updated', 'success');
      await load(currentPage);
    } catch (error) {
      $form.find('[data-error-for=content]').text(error.details?.content?.[0] ?? error.message);
      setBusy($submit, false);
    }
  });

  load(1);
  return { reload: () => load(currentPage), reset: () => load(1) };
}
