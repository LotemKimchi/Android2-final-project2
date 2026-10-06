/** Thin promise wrapper over jQuery Ajax for the JSON API. */

function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== '' && value !== undefined && value !== null,
    ),
  );
}

function toApiError(xhr) {
  const body = xhr.responseJSON;
  const fallback = xhr.status === 0 ? 'Network error — is the server running?' : 'Unexpected error';
  const error = new Error(body?.error?.message ?? fallback);
  error.status = xhr.status;
  error.details = body?.error?.details ?? {};
  return error;
}

function redirectToLogin() {
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.assign(`/login?next=${next}`);
}

function request(method, url, data) {
  const options = { method, url, dataType: 'json' };
  if (data instanceof FormData) {
    Object.assign(options, { data, processData: false, contentType: false });
  } else if (method === 'GET') {
    options.data = cleanParams(data);
  } else if (data !== undefined) {
    Object.assign(options, { data: JSON.stringify(data), contentType: 'application/json' });
  }

  return new Promise((resolve, reject) => {
    $.ajax(options)
      .done((body) => resolve(body))
      .fail((xhr) => {
        const error = toApiError(xhr);
        if (error.status === 401 && !url.startsWith('/api/auth/')) redirectToLogin();
        reject(error);
      });
  });
}

export const api = {
  get: (url, params) => request('GET', url, params),
  post: (url, body) => request('POST', url, body),
  patch: (url, body) => request('PATCH', url, body),
  delete: (url, body) => request('DELETE', url, body),
};
