// Turns any Axios/network error into a readable message.
// FastAPI returns { detail: "text" } or { detail: [{ loc, msg }, ...] } for validation errors.
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback

  if (error.code === 'ECONNABORTED') {
    return 'The request timed out. The server may still be working on it.'
  }

  if (!error.response) {
    return 'Cannot reach the PromptLab server. Check that the backend is running.'
  }

  const detail = error.response.data?.detail

  if (typeof detail === 'string') return detail

  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((item) => {
        const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : ''
        return field && field !== 'body' ? `${field}: ${item.msg}` : item.msg
      })
      .join('. ')
  }

  if (error.response.status >= 500) return 'The server ran into a problem. Please try again.'

  return fallback
}
