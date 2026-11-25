// Abertura: quando a tela termina de subir, sai do layout e o vídeo de fundo para e solta o
// arquivo (não fica uma camada fixa nem um vídeo tocando por baixo).
;(() => {
  const a = document.querySelector('[data-abertura]')
  if (!a) return
  if (!document.documentElement.classList.contains('abre')) return a.remove()
  const fim = () => {
    if (!a.isConnected) return
    const v = a.querySelector('video')
    if (v) {
      v.pause()
      v.removeAttribute('src')
      v.load()
    }
    a.remove()
  }
  a.addEventListener('animationend', (e) => e.target === a && fim())
  setTimeout(fim, 4200)
})()
