import { api } from '../lib/api.js';
import { DEFAULT_AVATAR } from '../lib/templates.js';
import { clearFieldErrors, formValues, setBusy, showFieldErrors, toast } from '../lib/ui.js';
import { IMAGE_TYPES, LIMITS, PASSWORD_RULES, rules, validateFields } from '../lib/validation.js';

const $profileForm = $('#profile-form');
const $passwordForm = $('#password-form');
const $deleteForm = $('#delete-account-form');

function fillProfileForm(user) {
  $profileForm.find('[name=displayName]').val(user.displayName);
  $profileForm.find('[name=email]').val(user.email);
  $profileForm.find('[name=birthDate]').val(user.birthDate);
  $profileForm.find('[name=gender]').val(user.gender);
  $profileForm.find('[name=city]').val(user.city);
  $profileForm.find('[name=bio]').val(user.bio);
  $profileForm.find('[name=avatar]').val('');
  $profileForm.find('[name=removeAvatar]').prop('checked', false);
  $('#avatar-preview').attr('src', user.avatarUrl || DEFAULT_AVATAR);
}

/** Shared submit flow: validate → send → show server errors. */
function handleSubmit($form, { validate, send, onSuccess }) {
  $form.on('submit', async (event) => {
    event.preventDefault();
    clearFieldErrors($form);
    const errors = validate();
    if (errors) return showFieldErrors($form, errors);

    const $submit = $form.find('[type=submit]');
    setBusy($submit, true);
    try {
      onSuccess(await send());
    } catch (error) {
      showFieldErrors($form, error.details);
      toast(error.message, 'error');
    } finally {
      setBusy($submit, false);
    }
  });
}

handleSubmit($profileForm, {
  validate: () => {
    const values = formValues($profileForm);
    return validateFields(
      { ...values, avatar: $profileForm.find('[name=avatar]')[0].files[0] },
      {
        displayName: [rules.required(), rules.maxLength(LIMITS.displayNameMax)],
        email: [rules.required(), rules.email()],
        birthDate: [rules.required(), rules.birthDate()],
        city: [rules.maxLength(LIMITS.cityMax)],
        bio: [rules.maxLength(LIMITS.bioMax)],
        avatar: [rules.file(IMAGE_TYPES, 'image')],
      },
    );
  },
  send: () => {
    const formData = new FormData($profileForm[0]);
    // An empty file input still adds an empty "avatar" part; drop it.
    if (!$profileForm.find('[name=avatar]')[0].files[0]) formData.delete('avatar');
    return api.patch('/api/users/me', formData);
  },
  onSuccess: ({ user }) => {
    fillProfileForm(user);
    $('.user-chip img').attr('src', user.avatarUrl || DEFAULT_AVATAR);
    $('.user-chip span').text(user.displayName);
    toast('Profile saved', 'success');
  },
});

handleSubmit($passwordForm, {
  validate: () =>
    validateFields(
      {
        currentPassword: $passwordForm.find('[name=currentPassword]').val(),
        newPassword: $passwordForm.find('[name=newPassword]').val(),
      },
      { currentPassword: [rules.required()], newPassword: PASSWORD_RULES },
    ),
  send: () =>
    api.patch('/api/users/me', {
      currentPassword: $passwordForm.find('[name=currentPassword]').val(),
      newPassword: $passwordForm.find('[name=newPassword]').val(),
    }),
  onSuccess: () => {
    $passwordForm[0].reset();
    toast('Password updated', 'success');
  },
});

handleSubmit($deleteForm, {
  validate: () =>
    validateFields(
      {
        password: $deleteForm.find('[name=password]').val(),
        confirm: $deleteForm.find('[name=confirm]').is(':checked') ? 'yes' : '',
      },
      { password: [rules.required()], confirm: [rules.required('Please confirm')] },
    ),
  send: () => api.delete('/api/users/me', { password: $deleteForm.find('[name=password]').val() }),
  onSuccess: () => window.location.assign('/register'),
});

api
  .get('/api/auth/me')
  .then(({ user }) => fillProfileForm(user))
  .catch((error) => toast(error.message, 'error'));
