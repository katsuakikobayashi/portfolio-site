/** コピー完了メッセージを表示しておく時間（ミリ秒） */
export const COPIED_STATUS_DURATION_MS = 2000

/**
 * @function showCopiedStatus
 * @description リンクに隣接するステータス要素を一時的に表示し、コピー完了を伝える
 * @param {HTMLAnchorElement} link - コピー操作の起点となったリンク
 * @returns {void}
 */
const showCopiedStatus = (link: HTMLAnchorElement): void => {
  const status = link.nextElementSibling
  if (!(status instanceof HTMLElement)) {
    return
  }

  status.hidden = false
  window.setTimeout(() => {
    status.hidden = true
  }, COPIED_STATUS_DURATION_MS)
}

/**
 * @function initEmailCopyLinks
 * @description `.js-email-link` を持つリンクのクリックを横取りし、mailto 遷移の代わりに
 *              メールアドレスをクリップボードへコピーする。コピーに失敗した場合や
 *              Clipboard API が利用できない場合は通常の mailto 遷移にフォールバックする。
 * @returns {void}
 */
export const initEmailCopyLinks = (): void => {
  document.querySelectorAll<HTMLAnchorElement>('.js-email-link').forEach((link) => {
    link.addEventListener('click', (event) => {
      const email = link.dataset['email']
      if (!email || !navigator.clipboard) {
        return
      }

      event.preventDefault()
      navigator.clipboard
        .writeText(email)
        .then(() => showCopiedStatus(link))
        .catch(() => {
          window.location.href = link.href
        })
    })
  })
}
