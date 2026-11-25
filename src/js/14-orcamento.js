// Orçamento flutuante: o botão abre o painel; o formulário nasce do template só no 1º clique
// (form no HTML desde o início fazia o autofill forçar layout no 1º quadro). O envio monta a
// mensagem com nome e tipo de evento e abre o WhatsApp.
;(() => {
  const caixa = document.querySelector('.orc')
  if (!caixa) return
  const painel = caixa.querySelector('.orc__painel')
  const botao = caixa.querySelector('[data-orc-abrir]')
  const numero = caixa.dataset.numero
  const montar = () => {
    const molde = painel.querySelector('template[data-orc-form]')
    if (!molde) return
    painel.appendChild(molde.content.cloneNode(true))
    molde.remove()
    painel.querySelector('[data-orc-enviar]').addEventListener('submit', (e) => {
      e.preventDefault()
      const f = new FormData(e.currentTarget)
      const nome = String(f.get('nome') || '').trim()
      const tipo = f.get('tipo')
      const texto = `Olá! Vim pelo site e quero um orçamento.\nNome: ${nome}\nTipo de evento: ${tipo}`
      window.open(`https://wa.me/${numero}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener')
      fechar()
    })
  }
  const abrir = () => {
    montar()
    caixa.classList.add('orc--aberto')
    painel.inert = false
    botao.setAttribute('aria-expanded', 'true')
    setTimeout(() => painel.querySelector('input[name="nome"]')?.focus({ preventScroll: true }), 60)
  }
  const fechar = () => {
    if (!caixa.classList.contains('orc--aberto')) return
    caixa.classList.remove('orc--aberto')
    painel.inert = true
    botao.setAttribute('aria-expanded', 'false')
  }
  botao.addEventListener('click', () => (caixa.classList.contains('orc--aberto') ? fechar() : abrir()))
  painel.querySelector('[data-orc-fechar]').addEventListener('click', () => { fechar(); botao.focus() })
  document.addEventListener('keydown', (e) => e.key === 'Escape' && fechar())
  document.addEventListener('click', (e) => !caixa.contains(e.target) && fechar())
  // quando o botão some (hero, CTA, rodapé), o painel fecha junto
  new MutationObserver(() => !caixa.classList.contains('zap--visivel') && fechar()).observe(caixa, { attributes: true, attributeFilter: ['class'] })
})()
