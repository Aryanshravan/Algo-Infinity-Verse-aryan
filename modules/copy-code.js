(function () {
  'use strict'

  var CLIPBOARD_SUPPORTED = navigator.clipboard && navigator.clipboard.writeText

  function initCodeCopy(container) {
    if (!container) container = document

    var codeBlocks = container.querySelectorAll('pre code')
    codeBlocks.forEach(function (codeBlock) {
      var pre = codeBlock.parentElement
      if (pre.classList.contains('code-block--has-copy')) return
      pre.classList.add('code-block--has-copy')
      pre.style.position = 'relative'

      var btn = document.createElement('button')
      btn.className = 'copy-code-btn'
      btn.setAttribute('aria-label', 'Copy code to clipboard')
      btn.innerHTML =
        '<span class="copy-code-btn-icon"><i class="fa-regular fa-copy"></i></span> <span class="copy-code-btn-text">Copy</span>'

      btn.addEventListener('click', function (e) {
        e.stopPropagation()
        var code = codeBlock.textContent

        ;(function doCopy() {
          if (CLIPBOARD_SUPPORTED) {
            return navigator.clipboard.writeText(code)
          }
          return new Promise(function (resolve, reject) {
            try {
              var ta = document.createElement('textarea')
              ta.value = code
              ta.style.position = 'fixed'
              ta.style.opacity = '0'
              ta.style.left = '-9999px'
              document.body.appendChild(ta)
              ta.select()
              document.execCommand('copy')
              document.body.removeChild(ta)
              resolve()
            } catch (err) {
              reject(err)
            }
          })
        })().catch(function () {
          /* copy failed silently */
        })

        btn.classList.add('copy-code-btn--copied')
        btn.setAttribute('aria-label', 'Code copied to clipboard')
        var textSpan = btn.querySelector('.copy-code-btn-text')
        var iconSpan = btn.querySelector('.copy-code-btn-icon')
        if (textSpan) textSpan.textContent = 'Copied!'
        if (iconSpan) iconSpan.innerHTML = '<i class="fa-solid fa-check"></i>'

        setTimeout(function () {
          btn.classList.remove('copy-code-btn--copied')
          btn.setAttribute('aria-label', 'Copy code to clipboard')
          if (textSpan) textSpan.textContent = 'Copy'
          if (iconSpan) iconSpan.innerHTML = '<i class="fa-regular fa-copy"></i>'
        }, 2000)
      })

      pre.appendChild(btn)
    })
  }

  window.copyCode = { init: initCodeCopy }
})()
