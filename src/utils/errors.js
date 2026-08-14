/**
 * Turning an Axios failure into something a person can act on.
 *
 * The old pattern — `e?.response?.data?.detail || 'Failed to save'` — only ever
 * read one key, so DRF's field errors (`{"expiry_date": ["..."]}`) and
 * validation lists were thrown away and the user got a bare "Failed". Worse, a
 * dropped connection and a server crash produced identical text, so nobody
 * could tell whether to retry or report it.
 */

/** Human wording for the cases where the status alone tells the story. */
const BY_STATUS = {
  401: 'Your session has expired. Please log in again.',
  403: 'You do not have permission to do that.',
  404: 'We could not find that — it may have been removed.',
  409: 'That conflicts with something already saved. Refresh and try again.',
  413: 'That file is too large to upload.',
  429: 'Too many attempts. Please wait a moment and try again.',
};

/** Field names DRF returns that are not worth showing to the user as labels. */
const UNLABELLED = new Set(['detail', 'non_field_errors', '__all__']);

const prettyField = (name) =>
  name.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

/**
 * Pull the first useful message out of a DRF error body.
 *
 * Handles `{detail}`, `{field: ["msg"]}`, `{field: "msg"}`, nested dicts and
 * bare string/array bodies, labelling the field when it is not obvious.
 */
const fromBody = (data) => {
  if (!data) return null;
  if (typeof data === 'string') return data.slice(0, 300);
  if (Array.isArray(data)) return data.length ? String(data[0]) : null;
  if (typeof data !== 'object') return null;

  if (data.detail) return String(data.detail);

  for (const [field, value] of Object.entries(data)) {
    let message = null;
    if (Array.isArray(value) && value.length) message = String(value[0]);
    else if (typeof value === 'string') message = value;
    else if (value && typeof value === 'object') message = fromBody(value);

    if (!message) continue;
    return UNLABELLED.has(field) ? message : `${prettyField(field)}: ${message}`;
  }
  return null;
};

/**
 * @param error    the caught Axios error
 * @param fallback wording for the case where the server said nothing useful
 * @returns a message worth showing to a user
 */
export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  // Request never completed — offline, DNS, CORS, or the server is down.
  if (!error?.response) {
    if (error?.code === 'ECONNABORTED') {
      return 'That took too long and timed out. Please try again.';
    }
    return 'Could not reach the server. Check your connection and try again.';
  }

  const { status, data } = error.response;

  // 5xx: the body carries our support reference from the error middleware.
  if (status >= 500) {
    const reference = data?.reference;
    return reference
      ? `Something went wrong on our end (reference ${reference}). Our team has been notified.`
      : 'Something went wrong on our end. Our team has been notified.';
  }

  // A server-supplied message beats a generic one for the status.
  const fromServer = fromBody(data);
  if (fromServer) return fromServer;

  return BY_STATUS[status] || fallback;
};

/** The support reference on a 5xx, if there is one. */
export const getErrorReference = (error) => error?.response?.data?.reference || null;

export default getErrorMessage;
