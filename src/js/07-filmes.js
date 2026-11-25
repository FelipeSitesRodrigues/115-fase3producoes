// Portfólio em tela cheia.
// - [data-encaixa]: a palavra gigante ocupa a largura toda (mede em 100 px e escala). A altura
//   dela vai em --alto na seção, pros controles ficarem logo acima.
// - [data-filmes]: o trecho mudo do filme atual toca em tela cheia (a capa embaixo é o mesmo 1º
//   quadro); acaba, passa pro próximo. Setas e "a seguir" trocam na mão. Só roda na tela.
// - Play: abre o filme inteiro do YouTube (youtube.com/embed) no player (13-player).
;(() => {
  const reduzir = matchMedia('(prefers-reduced-motion: reduce)').matches
  const celular = matchMedia('(max-width: 47.99em)').matches

  // ---------------------------------------------------------------- palavra encaixada
  const palavras = [...document.querySelectorAll('[data-encaixa]')]
  const encaixar = (el) => {
    const sec = el.closest('section')
    const pad = parseFloat(getComputedStyle(el).paddingLeft) * 2
    const livre = sec.clientWidth - pad
    el.style.fontSize = '100px'
    el.style.width = 'max-content'
    const w = el.getBoundingClientRect().width - pad
    el.style.width = ''
    if (w <= 0) return (el.style.fontSize = '')
    el.style.fontSize = `${Math.floor((100 * livre) / w)}px`
    sec.style.setProperty('--alto', `${Math.round(el.getBoundingClientRect().height)}px`)
  }
  // cada palavra encaixa quando a seção chega perto da tela: antes disso ela está pulada pelo
  // content-visibility e mede zero. Até lá vale o 16,4vw do CSS
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && encaixar(e.target)), { rootMargin: '300px 0px' })
    palavras.forEach((el) => io.observe(el))
  } else palavras.forEach(encaixar)
  let largura = innerWidth
  addEventListener('resize', () => {
    if (innerWidth === largura) return
    largura = innerWidth
    palavras.forEach(encaixar)
  })

  // corporativo: a foto respira quando a seção aparece
  const corp = document.querySelector('[data-corporativo]')
  if (corp && 'IntersectionObserver' in window) new IntersectionObserver(([e], io) => e.isIntersecting && (corp.classList.add('visivel'), io.disconnect()), { threshold: 0.2 }).observe(corp)

  // ---------------------------------------------------------------- player
  const player = document.querySelector('[data-player]')
  const tela = player?.querySelector('[data-player-tela]')
  const link = player?.querySelector('[data-player-link]')
  const abrirPlayer = (yt, nome) => {
    if (!player) return window.open(`https://www.youtube.com/watch?v=${yt}`, '_blank', 'noopener')
    // youtube.com e não youtube-nocookie: o nocookie pede login ("confirme que não é um bot") com
    // mais frequência. Origin e referrer vão juntos porque o YouTube recusa embed sem eles.
    const origem = encodeURIComponent(location.origin)
    tela.innerHTML = `<iframe src="https://www.youtube.com/embed/${yt}?autoplay=1&rel=0&playsinline=1&origin=${origem}" title="${nome.replace(/"/g, '&quot;')}" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`
    if (link) link.href = `https://www.youtube.com/watch?v=${yt}`
    player.showModal()
    window.lenis?.stop()
    document.querySelectorAll('.filme__video.tocando').forEach((v) => v.pause())
  }
  player?.addEventListener('close', () => {
    tela.innerHTML = ''
    window.lenis?.start()
  })
  player?.addEventListener('click', (e) => (e.target === player || e.target.closest('[data-player-fechar]')) && player.close())

  // ---------------------------------------------------------------- seções com filmes
  for (const sec of document.querySelectorAll('[data-filmes]')) {
    const lista = JSON.parse(sec.querySelector('[data-filmes-dados]').textContent)
    const capas = [...sec.querySelectorAll('.filme__midia img')]
    const minis = [...sec.querySelectorAll('.filme__seguir-mini img')]
    const barras = [...sec.querySelectorAll('.filme__barras .barras__item')]
    const video = sec.querySelector('.filme__video')
    const nome = sec.querySelector('[data-filme-nome]')
    const info = sec.querySelector('[data-filme-info]')
    const n = sec.querySelector('[data-filme-n]')
    const seguir = sec.querySelector('[data-filme-seguir]')
    const play = sec.querySelector('[data-filme-play]')
    let atual = 0
    let visivel = false
    let raf = 0

    const mostrar = (i) => {
      atual = (i + lista.length) % lista.length
      const f = lista[atual]
      const prox = (atual + 1) % lista.length
      capas.forEach((c, k) => c.classList.toggle('ativo', k === atual))
      minis.forEach((c, k) => c.classList.toggle('ativo', k === prox))
      barras.forEach((b, k) => b.style.setProperty('--p', k < atual ? 1 : 0))
      for (const el of [nome, info]) {
        el.classList.remove('troca')
        void el.offsetWidth
        el.classList.add('troca')
      }
      nome.textContent = f.nome
      info.textContent = f.info
      n.textContent = String(atual + 1).padStart(2, '0')
      seguir.textContent = lista[prox].nome
      play.setAttribute('aria-label', `Assistir o filme ${f.nome}`)
      if (reduzir) return
      video.classList.remove('tocando')
      video.src = `/assets/video/${f.id}${celular ? '-cel' : ''}.mp4`
      if (visivel) tocar()
    }
    const tocar = () => {
      const p = video.play()
      if (p) p.catch(() => {})
    }
    const quadro = () => {
      raf = 0
      if (video.duration) barras[atual]?.style.setProperty('--p', Math.min(1, video.currentTime / video.duration).toFixed(4))
      if (visivel) raf = requestAnimationFrame(quadro)
    }
    video.addEventListener('playing', () => video.classList.add('tocando'))
    video.addEventListener('ended', () => mostrar(atual + 1))

    sec.querySelectorAll('[data-filme-prox]').forEach((b) => b.addEventListener('click', () => mostrar(atual + 1)))
    sec.querySelector('[data-filme-ant]').addEventListener('click', () => mostrar(atual - 1))
    play.addEventListener('click', () => abrirPlayer(lista[atual].yt, lista[atual].nome))

    if (!('IntersectionObserver' in window)) continue
    new IntersectionObserver(([e]) => {
      visivel = e.isIntersecting
      if (reduzir) return
      if (visivel) {
        if (!video.src) mostrar(atual)
        else tocar()
        raf ||= requestAnimationFrame(quadro)
      } else video.pause()
    }, { threshold: 0.35 }).observe(sec)
  }
})()
