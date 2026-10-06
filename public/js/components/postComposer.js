import { api } from '../lib/api.js';
import { clearFieldErrors, setBusy, showFieldErrors, toast } from '../lib/ui.js';
import { validatePostDraft } from '../lib/validation.js';

/** Wires a postComposer.ejs form: text + image/video upload + optional canvas doodle island. */
export function initPostComposer($form, { groupId = null, onCreated }) {
  const $doodleHost = $form.find('.js-doodle-host');
  const $toggleDoodle = $form.find('.js-toggle-doodle');
  let doodleBlob = null;
  let unmountDoodle = null;

  function closeDoodle() {
    unmountDoodle?.();
    unmountDoodle = null;
    doodleBlob = null;
    $doodleHost.addClass('hidden');
    $toggleDoodle.text('🎨 Draw a doodle');
  }

  function openDoodle() {
    $doodleHost.removeClass('hidden');
    unmountDoodle = window.Islands.mountDoodleCanvas($doodleHost[0], {
      onChange: (blob) => {
        doodleBlob = blob;
      },
    });
    $toggleDoodle.text('✖ Remove doodle');
  }

  $toggleDoodle.on('click', () => (unmountDoodle ? closeDoodle() : openDoodle()));

  $form.on('submit', async (event) => {
    event.preventDefault();
    clearFieldErrors($form);

    const content = $form.find('[name=content]').val().trim();
    const image = $form.find('[name=image]')[0].files[0];
    const video = $form.find('[name=video]')[0].files[0];
    const errors = validatePostDraft({ content, image, video, doodle: doodleBlob });
    if (errors) return showFieldErrors($form, errors);

    const formData = new FormData();
    formData.append('content', content);
    if (groupId) formData.append('groupId', groupId);
    if (image) formData.append('image', image);
    else if (doodleBlob) formData.append('image', doodleBlob, 'doodle.png');
    if (video) formData.append('video', video);

    const $submit = $form.find('[type=submit]');
    setBusy($submit, true);
    try {
      const { post } = await api.post('/api/posts', formData);
      $form[0].reset();
      closeDoodle();
      toast('Post published', 'success');
      onCreated?.(post);
    } catch (error) {
      showFieldErrors($form, error.details);
      toast(error.message, 'error');
    } finally {
      setBusy($submit, false);
    }
  });
}
