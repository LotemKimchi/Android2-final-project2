import { api } from '../lib/api.js';
import { clearFieldErrors, formValues, setBusy, showFieldErrors, toast } from '../lib/ui.js';
import {
  LIMITS,
  PASSWORD_RULES,
  USERNAME_RULES,
  rules,
  validateFields,
} from '../lib/validation.js';

const $form = $('#register-form');

$form.on('submit', async (event) => {
  event.preventDefault();
  clearFieldErrors($form);

  const values = formValues($form);
  values.password = $form.find('[name=password]').val();
  values.confirmPassword = $form.find('[name=confirmPassword]').val();

  const errors = validateFields(values, {
    username: USERNAME_RULES,
    displayName: [rules.required(), rules.maxLength(LIMITS.displayNameMax)],
    email: [rules.required(), rules.email()],
    password: PASSWORD_RULES,
    confirmPassword: [rules.matches(values.password, 'Passwords do not match')],
    birthDate: [rules.required(), rules.birthDate()],
    gender: [rules.required('Choose a gender')],
    city: [rules.maxLength(LIMITS.cityMax)],
  });
  if (errors) return showFieldErrors($form, errors);

  const { confirmPassword: _confirm, ...payload } = values;
  const $submit = $form.find('[type=submit]');
  setBusy($submit, true);
  try {
    await api.post('/api/auth/register', payload);
    window.location.assign('/feed');
  } catch (error) {
    showFieldErrors($form, error.details);
    toast(error.message, 'error');
  } finally {
    setBusy($submit, false);
  }
});
