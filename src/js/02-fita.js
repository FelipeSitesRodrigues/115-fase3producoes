// Fitas que correm sem parar ([data-fita]): eventos da faixa de prova, galeria e rostos dos
// depoimentos. O trilho tem o conteúdo duas vezes e anda meio trilho em loop, numa velocidade
// fixa em px/s (data-fita-px), pra esquerda ou pra direita (data-fita-dir="1"). Web Animations,
// só com a fita na tela (memória marquee-waapi-rolagem). Fotos lazy viram eager perto da fita:
// o lazy do Chrome conta o corte lateral e a foto que entra de lado chegaria em branco.
;(() => {
  const fitas = document.querySelectorAll('[data-fita]')
  if (!fitas.length || !('IntersectionObserver' in window)) return
  const reduzir = matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!reduzir) document.documentElement.classList.add('fita-anda')
  for (const fita of fitas) {
    new IntersectionObserver((es, io) => {
      if (!es[0].isIntersecting) return
      fita.querySelectorAll('img[loading="lazy"]').forEach((img) => (img.loading = 'eager'))
      io.disconnect()
    }, { rootMargin: '900px 0px' }).observe(fita)
    if (reduzir) continue
    const trilho = fita.querySelector('[data-fita-trilho]')
    if (!trilho || !trilho.animate) continue
    const pxs = Number(fita.dataset.fitaPx || 80) * (innerWidth < 768 ? 0.7 : 1)
    const dir = fita.dataset.fitaDir === '1' ? 1 : -1
    let anim = null
    let visivel = false
    const montar = () => {
      const t = anim ? anim.currentTime / anim.effect.getTiming().duration : 0
      if (anim) anim.cancel()
      const meio = trilho.firstElementChild.getBoundingClientRect().width
      if (!meio) return requestAnimationFrame(montar) // seção ainda pulada pelo content-visibility
      const duracao = Math.max(4000, (meio / pxs) * 1000)
      const ida = [{ transform: 'translate3d(0,0,0)' }, { transform: 'translate3d(-50%,0,0)' }]
      anim = trilho.animate(dir < 0 ? ida : [...ida].reverse(), { duration: duracao, iterations: Infinity })
      anim.currentTime = (t % 1) * duracao
      if (!visivel) anim.pause()
    }
    // a animação só nasce quando a fita chega perto da tela: medir o trilho na carga pagava o
    // layout da página inteira no meio do carregamento (TBT do celular)
    new IntersectionObserver(([e]) => {
      visivel = e.isIntersecting
      if (visivel && !anim) montar()
      if (anim) visivel ? anim.play() : anim.pause()
    }, { rootMargin: '200px 0px' }).observe(fita)
    let largura = innerWidth
    addEventListener('resize', () => {
      if (innerWidth === largura) return
      largura = innerWidth
      if (anim) montar()
    })
    // as fotos mudam a largura do trilho depois do 1º cálculo
    addEventListener('load', () => anim && montar(), { once: true })
  }
})()
