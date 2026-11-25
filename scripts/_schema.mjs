// JSON-LD da Fase3 (LocalBusiness + ProfessionalService) e das perguntas (FAQPage), puxado pelo build.
import * as cheerio from 'cheerio'

export function schemaEmpresa(html, cfg) {
  const base = (cfg.dominio || '').replace(/\/$/, '')
  const e = cfg.endereco || {}
  const empresa = {
    '@type': ['LocalBusiness', 'ProfessionalService'],
    '@id': `${base}/#fase3`,
    name: 'Fase3',
    alternateName: ['F3 Production', 'Fase3 Formaturas', 'Fase3 Live Marketing'],
    description: cfg.descricao,
    telephone: `+${cfg.whatsapp}`,
    image: `${base}/assets/img/og.jpg`,
    logo: `${base}/icon-512.png`,
    address: { '@type': 'PostalAddress', streetAddress: e.rua, addressLocality: e.cidade, addressRegion: e.uf, postalCode: e.cep, addressCountry: 'BR' },
    areaServed: [{ '@type': 'State', name: 'São Paulo' }, { '@type': 'State', name: 'Minas Gerais' }],
    knowsAbout: ['Formaturas', 'Baile de formatura', 'Festa de 100 dias', 'Festa Meia Profissão', 'Festa 1.000 dias', 'Eventos corporativos', 'Live marketing', 'Stands', 'Cenografia', 'Aftermovie', 'Fashion film', 'Produção audiovisual'],
    sameAs: Object.values(cfg.redes || {}).filter(Boolean),
  }
  if (base) empresa.url = `${base}/`
  const $ = cheerio.load(html)
  const perguntas = $('#perguntas .pergunta')
    .map((_, d) => ({
      '@type': 'Question',
      name: $(d).find('.pergunta__q').text().replace(/\s+/g, ' ').trim(),
      acceptedAnswer: { '@type': 'Answer', text: $(d).find('.pergunta__r').text().replace(/\s+/g, ' ').trim() },
    }))
    .get()
    .filter((q) => q.name && q.acceptedAnswer.text)
  const grafo = [empresa]
  if (perguntas.length) grafo.push({ '@type': 'FAQPage', '@id': `${base}/#perguntas`, mainEntity: perguntas })
  return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': grafo })}</script>`
}
