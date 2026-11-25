// Depoimentos: troca com fusão pelas setas e sozinho a cada 7 s com o cartão na tela (para
// quando o mouse está em cima ou quando alguém clicou numa seta).
;(() => {
  const caixa = document.querySelector('[data-depo]')
  if (!caixa) return
  const itens = [...caixa.querySelectorAll('.depo__item')]
  const n = caixa.querySelector('[data-depo-n]')
  let atual = 0
  let timer = 0
  let parado = false
  const ir = (i) => {
    atual = (i + itens.length) % itens.length
    itens.forEach((it, k) => it.classList.toggle('ativo', k === atual))
    n.textContent = String(atual + 1).padStart(2, '0')
  }
  caixa.querySelector('[data-depo-prox]').addEventListener('click', () => ((parado = true), ir(atual + 1)))
  caixa.querySelector('[data-depo-ant]').addEventListener('click', () => ((parado = true), ir(atual - 1)))
  caixa.addEventListener('pointerenter', () => (parado = true))
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return
  new IntersectionObserver(([e]) => {
    clearInterval(timer)
    if (e.isIntersecting) timer = setInterval(() => parado || ir(atual + 1), 7000)
  }).observe(caixa)
})()
