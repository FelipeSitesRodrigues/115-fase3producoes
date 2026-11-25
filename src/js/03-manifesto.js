// Manifesto: o selo REC conta o tempo de gravação (hh:mm:ss a partir de 23:47:00) enquanto a
// seção está na tela. Onde não há animação ligada à rolagem, a frase entra com .visivel.
;(() => {
  const secao = document.querySelector('[data-manifesto]')
  if (!secao || !('IntersectionObserver' in window)) return
  const rec = secao.querySelector('[data-rec]')
  let s = 23 * 3600 + 47 * 60
  let timer = 0
  const dois = (n) => String(n).padStart(2, '0')
  const passo = () => {
    s++
    rec.textContent = `${dois(Math.floor(s / 3600) % 24)}:${dois(Math.floor(s / 60) % 60)}:${dois(s % 60)}`
  }
  const reduzir = matchMedia('(prefers-reduced-motion: reduce)').matches
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) secao.classList.add('visivel')
    if (reduzir) return
    clearInterval(timer)
    if (e.isIntersecting) timer = setInterval(passo, 1000)
  }, { threshold: 0.25 }).observe(secao)
})()
