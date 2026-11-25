/**
 * Imagens do site em src/assets/img (AVIF e WebP em várias larguras, com manifesto.json pro
 * width/height do <img>) e ícones em src/raiz. Base da 0114 DJ Sky.
 *
 * Origem:
 *  - insumos/quadros: quadros dos vídeos do YouTube da Fase3 (galeria, rostos) e a capa de cada
 *    trecho de vídeo (1º quadro, igual ao vídeo: memória video-aparece-parado)
 *  - ../0115 - F3 Production/Recursos Site/imagens-ia: as 9 imagens limpas do ChatGPT
 *  - ../0115 - F3 Production/Recursos Site/logo-fase3-branco.svg
 * Uso: node scripts/processar-imagens.mjs   (depois: node build.mjs)
 */
import sharp from 'sharp'
import { mkdirSync, writeFileSync, rmSync, readdirSync, copyFileSync, readFileSync } from 'node:fs'
import path from 'node:path'

sharp.cache(false)
const REC = '../0115 - F3 Production/Recursos Site'
const IA = `${REC}/imagens-ia`
const Q = 'insumos/quadros'
const OUT = 'src/assets/img'
const RAIZ = 'src/raiz'
mkdirSync(OUT, { recursive: true })
mkdirSync(RAIZ, { recursive: true })
for (const f of readdirSync(OUT)) rmSync(path.join(OUT, f), { recursive: true, force: true })
const manifesto = {}

async function gravar(pipeline, nome) {
  const info = await pipeline.toFile(path.join(OUT, nome))
  manifesto[nome] = { w: info.width, h: info.height, kb: Math.round(info.size / 1024) }
}

// recorta na proporção (w/h). foco: posição do sharp ou {x, y} em fração da imagem (centro do
// recorte). O foco por saliência do sharp errava o rosto nos quadros de festa (pegava mão,
// vestido, prédio), por isso os rostos têm posição escrita à mão em FOCOS
const FOCOS = {
  'medicina-formanda': { x: 0.56, y: 0.32 }, 'formanda-sorriso': { x: 0.3, y: 0.4 }, 'agrarias-copo': { x: 0.47, y: 0.36 },
  'jiraya-copo': { x: 0.56, y: 0.32 }, 'infernato-galera': { x: 0.56, y: 0.42 }, 'biomedicina-pista': { x: 0.42, y: 0.35 },
  'juu-copo': { x: 0.6, y: 0.4 }, 'vestido-azul': { x: 0.62, y: 0.35 }, chapeu: { x: 0.5, y: 0.3 }, 'agrarias-brinde': { x: 0.42, y: 0.4 }, 'juu-amigas': { x: 0.5, y: 0.35 },
}
async function recorte(arq, proporcao, foco = 'centre', zoom = 1) {
  const buf = await sharp(arq).rotate().toBuffer()
  if (!proporcao) return buf
  const m = await sharp(buf).metadata()
  let w = Math.min(m.width, Math.round(m.height * proporcao))
  let h = Math.min(m.height, Math.round(w / proporcao))
  w = Math.round(w / zoom)
  h = Math.round(h / zoom)
  if (typeof foco === 'object') {
    const left = Math.max(0, Math.min(m.width - w, Math.round(foco.x * m.width - w / 2)))
    const top = Math.max(0, Math.min(m.height - h, Math.round(foco.y * m.height - h / 2)))
    return sharp(buf).extract({ left, top, width: w, height: h }).toBuffer()
  }
  return sharp(buf).resize(w, h, { fit: 'cover', position: foco }).toBuffer()
}

async function variantes(nome, buf, larguras, qualidade = 52) {
  const { width } = await sharp(buf).metadata()
  for (const w of larguras) {
    const lw = Math.min(w, width)
    if (manifesto[`${nome}-${lw}.webp`]) continue
    for (const f of ['avif', 'webp']) {
      let p = sharp(buf).resize({ width: lw, kernel: 'lanczos3' })
      p = f === 'avif' ? p.avif({ quality: qualidade, effort: 7 }) : p.webp({ quality: 74, effort: 6, smartSubsample: true })
      await gravar(p, `${nome}-${lw}.${f}`)
    }
  }
  console.log(nome.padEnd(30), larguras.join(', '))
}

// ---------------------------------------------------------------- capas dos trechos de vídeo
// deitada (computador) e em pé (celular), mesmo 1º quadro do vídeo
const CLIPES = ['estrutural', 'unificadas', 'infernato', 'juu', 'jiraya', 'medicina', 'biomedicina']
for (const c of CLIPES) {
  await variantes(`capa-${c}`, await recorte(`${Q}/capa-${c}.jpg`), [480, 960, 1280])
  await variantes(`capa-${c}-cel`, await recorte(`${Q}/capa-${c}-cel.jpg`), [540])
}

// ---------------------------------------------------------------- imagens do ChatGPT
await variantes('manifesto', await recorte(`${IA}/01-manifesto.png`), [768, 1280, 1672])
await variantes('manifesto-cel', await recorte(`${IA}/01-manifesto.png`, 4 / 5, 'centre'), [600])
for (const [n, arq] of [['sobre-criacao', '02-sobre-criacao'], ['sobre-montagem', '03-sobre-montagem'], ['sobre-camera', '04-sobre-camera']]) {
  await variantes(n, await recorte(`${IA}/${arq}.png`, 4 / 3), [480, 760, 1020])
}
for (const [n, arq] of [['frente-formaturas', '05-frente-formaturas'], ['frente-live', '06-frente-live-marketing'], ['frente-production', '07-frente-production']]) {
  await variantes(n, await recorte(`${IA}/${arq}.png`, 4 / 5, 'centre'), [420, 640, 860])
}
await variantes('cta', await recorte(`${IA}/08-cta-final.png`), [768, 1280, 1672])
await variantes('cta-cel', await recorte(`${IA}/08-cta-final.png`, 3 / 4, 'centre'), [600])
await variantes('corporativo', await recorte(`${IA}/09-corporativo-provisorio.png`), [768, 1280, 1672])
await variantes('corporativo-cel', await recorte(`${IA}/09-corporativo-provisorio.png`, 9 / 16, 'centre'), [540])

// ---------------------------------------------------------------- galeria e rostos
// pe = retrato 2:3; deitada = 3:2. Os mesmos retratos servem às fitas dos depoimentos
const GALERIA = JSON.parse(readFileSync('src/dados/galeria.json', 'utf8'))
for (const g of GALERIA) {
  const prop = g.pe ? 2 / 3 : 3 / 2
  await variantes(`galeria-${g.id}`, await recorte(`${Q}/g-${g.id}.jpg`, prop, g.pe ? FOCOS[g.id] || 'centre' : 'centre'), g.pe ? [300, 560] : [660, 1260])
}
for (const id of JSON.parse(readFileSync('src/dados/rostos.json', 'utf8'))) {
  await variantes(`rosto-${id}`, await recorte(`${Q}/g-${id}.jpg`, 2 / 3, FOCOS[id] || 'centre'), [240, 400])
}
// avatares do cartão do hero: quadrado no rosto
for (const id of ['medicina-formanda', 'agrarias-copo', 'chapeu']) {
  const buf = await recorte(`${Q}/g-${id}.jpg`, 1, FOCOS[id], 2.6)
  await variantes(`avatar-${id}`, buf, [96])
}

// ---------------------------------------------------------------- grão de filme (ladrilho parado)
{
  const n = 128
  const px = Buffer.alloc(n * n)
  for (let i = 0; i < px.length; i++) px[i] = Math.floor(Math.random() * 256)
  await sharp(px, { raw: { width: n, height: n, channels: 1 } }).png().toFile(path.join(OUT, 'grao.png'))
}

// ---------------------------------------------------------------- logo, ícones e compartilhamento
copyFileSync(`${REC}/logo-fase3-branco.svg`, 'src/svg/logo-fase3.svg')
const logo = readFileSync(`${REC}/logo-fase3-branco.svg`)
async function icone(lado, arq) {
  const marca = await sharp(logo, { density: 300 }).resize(Math.round(lado * 0.7)).png().toBuffer()
  await sharp({ create: { width: lado, height: lado, channels: 4, background: '#0B1A6B' } })
    .composite([{ input: marca, gravity: 'centre' }])
    .png()
    .toFile(path.join(RAIZ, arq))
}
await icone(32, 'favicon-32.png')
await icone(180, 'apple-touch-icon.png')
await icone(192, 'icon-192.png')
await icone(512, 'icon-512.png')
{
  const fundo = await sharp(`${Q}/capa-unificadas.jpg`).resize(1200, 630, { fit: 'cover' }).modulate({ brightness: 0.55 }).toBuffer()
  const marca = await sharp(logo, { density: 300 }).resize(360).png().toBuffer()
  await sharp(fundo).composite([{ input: marca, gravity: 'centre' }]).jpeg({ quality: 82 }).toFile(path.join(OUT, 'og.jpg'))
}

writeFileSync(path.join(OUT, 'manifesto.json'), JSON.stringify(manifesto, null, 1))
const total = Object.values(manifesto).reduce((s, m) => s + m.kb, 0)
console.log(`ok ${Object.keys(manifesto).length} arquivos, ${total} KB`)
