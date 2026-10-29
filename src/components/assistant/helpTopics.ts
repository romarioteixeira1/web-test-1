import type { AssistantLink } from '../../../shared/assistant'

export type HelpTopic = {
  question: string
  answer: string
  /** Screens the answer talks about; the chat shows an "Abrir …" button for each. */
  links: AssistantLink[]
  /** Words that point to this topic when someone types a question without the AI. */
  keywords: string[]
  /** Questions of other topics to offer next. */
  followUps: string[]
}

/**
 * Ready answers for the most common questions. They work without the AI
 * (no ANTHROPIC_API_KEY needed), so keep them in sync with the real screens.
 */
export const helpTopics: HelpTopic[] = [
  {
    question: 'Como cadastro minha empresa?',
    answer:
      '1. No menu lateral, abra "Minha empresa".\n2. Clique em "Cadastre sua empresa aqui".\n3. Preencha nome, CNPJ, endereço e licença ambiental e clique em "Cadastrar".\n\nEsses dados aparecem nos comprovantes das transações.',
    links: ['/empresa'],
    keywords: ['empresa', 'cnpj', 'licenca', 'ambiental', 'razao social', 'minha empresa'],
    followUps: ['Como cadastro um cliente?', 'Como imprimo um comprovante?'],
  },
  {
    question: 'Como cadastro um cliente?',
    answer:
      '1. Abra "Clientes" no menu (ou use o atalho "Novo cliente" no Início).\n2. Clique em "Novo cliente".\n3. Escolha pessoa física ou jurídica e se ele é fornecedor (vende material para você), comprador (compra de você) ou ambos.\n4. Preencha os dados e salve.',
    links: ['/clientes'],
    keywords: ['cliente', 'fornecedor', 'comprador', 'pessoa fisica', 'pessoa juridica', 'cpf', 'cadastrar cliente'],
    followUps: ['Como agendo uma coleta?', 'Como registro uma compra ou venda?'],
  },
  {
    question: 'Como cadastro um material e o preço?',
    answer:
      '1. Abra "Materiais" e clique em "Novo material".\n2. Informe o nome e a categoria.\n3. Depois, abra o material e clique em "Novo preço" para definir o preço de compra e de venda por kg.\n\nA margem por kg é a diferença entre os dois e aparece no Início e nos relatórios.',
    links: ['/materiais'],
    keywords: ['material', 'materiais', 'preco', 'kg', 'quilo', 'categoria', 'margem'],
    followUps: ['Como registro uma compra ou venda?', 'Onde vejo os relatórios?'],
  },
  {
    question: 'Como registro uma compra ou venda?',
    answer:
      '1. Abra "Transações" e clique em "Nova transação".\n2. Escolha se é compra (material que entra) ou venda (material que sai).\n3. Selecione o cliente, o material, o peso, a forma de pagamento e o status do pagamento.\n4. Salve. Depois você pode abrir o comprovante e clicar em "Imprimir comprovante".',
    links: ['/transacoes'],
    keywords: ['transacao', 'transacoes', 'compra', 'comprar', 'venda', 'vender', 'registrar', 'peso', 'pesagem'],
    followUps: ['Como imprimo um comprovante?', 'Como parcelo um pagamento?'],
  },
  {
    question: 'Como imprimo um comprovante?',
    answer:
      '1. Abra "Transações".\n2. Na linha da transação, abra o comprovante.\n3. Clique em "Imprimir comprovante".\n\nO comprovante usa os dados cadastrados em "Minha empresa".',
    links: ['/transacoes', '/empresa'],
    keywords: ['comprovante', 'imprimir', 'impressao', 'recibo', 'nota'],
    followUps: ['Como cadastro minha empresa?', 'Onde vejo meu fluxo de caixa?'],
  },
  {
    question: 'Como parcelo um pagamento?',
    answer:
      '1. Em "Formas de pagamento", tenha uma forma a prazo cadastrada.\n2. Ao registrar a transação, escolha essa forma.\n3. Informe o número de parcelas (até 10, sem juros).',
    links: ['/formas-pagamento', '/transacoes'],
    keywords: ['parcela', 'parcelar', 'parcelas', 'prazo', 'pagamento', 'pix', 'dinheiro', 'forma de pagamento', 'juros'],
    followUps: ['Como registro uma compra ou venda?', 'Onde vejo meu fluxo de caixa?'],
  },
  {
    question: 'Como agendo uma coleta?',
    answer: '1. Abra "Coletas" no menu.\n2. Clique em "Nova coleta".\n3. Escolha o cliente, a data e o tipo de coleta e salve.',
    links: ['/coletas'],
    keywords: ['coleta', 'coletas', 'agendar', 'agendamento', 'buscar material', 'retirada', 'caminhao'],
    followUps: ['Como cadastro um cliente?', 'Como registro uma compra ou venda?'],
  },
  {
    question: 'Onde vejo os relatórios?',
    answer:
      'Abra "Relatórios" no menu, em ANÁLISES. Escolha o período e use os filtros para ver os resultados por cliente ou por material.',
    links: ['/relatorios'],
    keywords: ['relatorio', 'relatorios', 'resultado', 'filtro', 'periodo', 'analise', 'lucro'],
    followUps: ['Onde vejo meu fluxo de caixa?', 'Como cadastro um material e o preço?'],
  },
  {
    question: 'Onde vejo meu fluxo de caixa?',
    answer:
      'Abra "Fluxo de caixa" no menu, em ANÁLISES. Lá aparecem as entradas (vendas) e saídas (compras) pagas por período, com o saldo inicial e o saldo final.\n\nPara ver resultados por cliente ou material, use "Relatórios".',
    links: ['/caixa', '/relatorios'],
    keywords: ['caixa', 'fluxo', 'saldo', 'entrada', 'entradas', 'saida', 'saidas', 'dinheiro'],
    followUps: ['Onde vejo os relatórios?', 'Como registro uma compra ou venda?'],
  },
]

export const notConfiguredReply =
  'Ainda não consigo responder perguntas livres: o assistente com IA não foi ativado neste servidor. Escolha um dos assuntos abaixo que eu explico o passo a passo.'

export const noMatchReply =
  'Não encontrei um passo a passo para isso. Tente escrever de outro jeito, ou escolha um dos assuntos abaixo.'

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

export function findTopicByQuestion(question: string) {
  return helpTopics.find((t) => t.question === question)
}

/** Best built-in topic for a typed question, used when the AI is off. */
export function matchTopic(text: string): HelpTopic | undefined {
  const query = normalize(text)
  let best: HelpTopic | undefined
  let bestScore = 0
  for (const topic of helpTopics) {
    const score = topic.keywords.reduce((sum, k) => (query.includes(k) ? sum + k.length : sum), 0)
    if (score > bestScore) {
      best = topic
      bestScore = score
    }
  }
  return best
}

/** All topics, with the ones about the current screen first. */
export function topicsForPage(pathname: string): HelpTopic[] {
  const onPage = (t: HelpTopic) => t.links.some((l) => (l === '/' ? pathname === '/' : pathname.startsWith(l)))
  return [...helpTopics.filter(onPage), ...helpTopics.filter((t) => !onPage(t))]
}
