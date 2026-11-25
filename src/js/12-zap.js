// Grão de filme depois do load (fora da janela do LCP)
if (document.readyState === 'complete') document.documentElement.classList.add('carregou')
else addEventListener('load', () => document.documentElement.classList.add('carregou'), { once: true })

// WhatsApp flutuante: aparece quando o hero sai da tela e some de novo no CTA final e no
// rodapé (onde já tem botão de WhatsApp à vista).
;(() => {
  const zap = document.querySelector('[data-zap]')
  const hero = document.querySelector('[data-hero]')
  if (!zap || !hero || !('IntersectionObserver' in window)) return
  const esconder = new Set()
  const atualizar = () => zap.classList.toggle('zap--visivel', esconder.size === 0)
  const io = new IntersectionObserver((es) => {
    for (const e of es) e.isIntersecting ? esconder.add(e.target) : esconder.delete(e.target)
    atualizar()
  })
  ;[hero, document.querySelector('.cta'), document.querySelector('.rodape')].forEach((el) => el && io.observe(el))
})()
