// Shared behaviour for every page. Page-specific code lives in /js/pages/*.
import { api } from './lib/api.js';
import { toast } from './lib/ui.js';

$(document).on('click', '.js-logout', async () => {
  try {
    await api.post('/api/auth/logout');
    window.location.assign('/login');
  } catch (error) {
    toast(error.message, 'error');
  }
});
