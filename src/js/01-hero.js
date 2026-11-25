// Hero: os 4 trechos tocam em sequência com fusão. O 1º só carrega depois do load (a capa é o
// LCP e o vídeo começa no mesmo quadro dela, então a troca não aparece). Cada trecho chama o
// próximo 1,3 s antes de acabar. Barras e "tocando agora" acompanham. Para fora da tela.
;(() => {
  const hero = document.querySelector('[data-hero]')
  if (!hero) return
  const videos = [...hero.querySelectorAll('.hero__video')]
  const barras = [...hero.querySelectorAll('[data-barra]')]
  const nome = hero.querySelector('[data-hero-nome]')
  const numero = hero.querySelector('[data-hero-n]')
  const minis = [...hero.querySelectorAll('.hero__mini img')]
  const NOMES = ['Unificadas · Estrutura', 'Infernato Med · Araraquara', 'JUU · Jogos Universitários', 'Baile do Jiraya']
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const celular = matchMedia('(max-width: 47.99em)').matches
  const FUSAO = 1.3
  let atual = -1
  let visivel = true
  let raf = 0

  const carregar = (v) => {
    if (v.src) return
    v.src = celular ? v.dataset.srcCel : v.dataset.src
    v.load()
  }
  const marcar = (i) => {
    nome.textContent = NOMES[i]
    nome.classList.remove('troca')
    void nome.offsetWidth
    nome.classList.add('troca')
    numero.textContent = String(i + 1).padStart(2, '0')
    minis.forEach((m, k) => m.classList.toggle('ativo', k === i))
    barras.forEach((b, k) => b.style.setProperty('--p', k < i ? 1 : 0))
  }
  const ir = (i) => {
    const anterior = videos[atual]
    const v = videos[i]
    carregar(v)
    v.currentTime = 0
    const tocar = v.play()
    if (tocar) tocar.catch(() => {})
    v.classList.remove('ativo')
    void v.offsetWidth // reinicia o zoom
    v.classList.add('ativo')
    if (anterior && anterior !== v) {
      anterior.classList.remove('ativo')
      setTimeout(() => anterior.classList.contains('ativo') || anterior.pause(), FUSAO * 1000 + 200)
    }
    atual = i
    marcar(i)
    carregar(videos[(i + 1) % videos.length]) // o próximo já vem baixando
  }
  const quadro = () => {
    raf = 0
    const v = videos[atual]
    if (v && v.duration) {
      barras[atual]?.style.setProperty('--p', Math.min(1, v.currentTime / v.duration).toFixed(4))
      if (v.currentTime >= v.duration - FUSAO && !v.dataset.chamou) {
        v.dataset.chamou = '1'
        ir((atual + 1) % videos.length)
        setTimeout(() => delete v.dataset.chamou, 2000)
      }
    }
    if (visivel && !document.hidden) raf = requestAnimationFrame(quadro)
  }
  const rodar = () => {
    if (!raf && visivel && !document.hidden) raf = requestAnimationFrame(quadro)
  }

  barras.forEach((b, i) => b.addEventListener('click', () => i !== atual && ir(i)))

  const comecar = () => {
    const v = videos[0]
    carregar(v)
    v.addEventListener('playing', () => {
      if (atual === -1) {
        atual = 0
        v.classList.add('ativo')
        carregar(videos[1])
        rodar()
      }
    }, { once: true })
    const tocar = v.play()
    if (tocar) tocar.catch(() => {})
  }
  // computador: começa logo depois do load. Celular: só no 1º toque ou rolagem (a capa segura
  // o hero até lá). Vídeo tocando desde o load não deixa o celular ficar ocioso e o PageSpeed
  // cobra o bloqueio inteiro (mesmo padrão da 0114, memória video-alfa-vp9-celular)
  if (celular) {
    const eventos = ['pointerdown', 'touchstart', 'scroll', 'keydown']
    const primeiro = () => {
      eventos.forEach((ev) => removeEventListener(ev, primeiro))
      comecar()
    }
    eventos.forEach((ev) => addEventListener(ev, primeiro, { passive: true, once: true }))
  } else if (document.readyState === 'complete') setTimeout(comecar, 300)
  else addEventListener('load', () => setTimeout(comecar, 300), { once: true })

  new IntersectionObserver(([e]) => {
    visivel = e.isIntersecting
    const v = videos[atual]
    if (!v) return
    if (visivel) {
      const p = v.play()
      if (p) p.catch(() => {})
      rodar()
    } else v.pause()
  }).observe(hero)
  document.addEventListener('visibilitychange', () => {
    const v = videos[atual]
    if (!v) return
    if (document.hidden) v.pause()
    else if (visivel) {
      const p = v.play()
      if (p) p.catch(() => {})
      rodar()
    }
  })
})()
