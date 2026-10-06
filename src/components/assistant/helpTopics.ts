/**
 * Ready answers for the most common questions. They work without the AI
 * (no ANTHROPIC_API_KEY needed), so keep them in sync with the real screens.
 */
export const helpTopics: { question: string; answer: string }[] = [
  {
    question: 'Como cadastro minha empresa?',
    answer:
      '1. No menu lateral, abra "Minha empresa".\n2. Clique em "Cadastre sua empresa aqui".\n3. Preencha nome, CNPJ, endereço e licença ambiental e clique em "Cadastrar".\n\nEsses dados aparecem nos comprovantes das transações.',
  },
  {
    question: 'Como cadastro um cliente?',
    answer:
      '1. Abra "Clientes" no menu (ou use o atalho "Novo cliente" no Início).\n2. Clique em "Novo cliente".\n3. Escolha pessoa física ou jurídica e se ele é fornecedor (vende material para você), comprador (compra de você) ou ambos.\n4. Preencha os dados e salve.',
  },
  {
    question: 'Como cadastro um material e o preço?',
    answer:
      '1. Abra "Materiais" e clique em "Novo material".\n2. Informe o nome e a categoria.\n3. Depois, abra o material e clique em "Novo preço" para definir o preço de compra e de venda por kg.\n\nA margem por kg é a diferença entre os dois e aparece no Início e nos relatórios.',
  },
  {
    question: 'Como registro uma compra ou venda?',
    answer:
      '1. Abra "Transações" e clique em "Nova transação".\n2. Escolha se é compra (material que entra) ou venda (material que sai).\n3. Selecione o cliente, o material, o peso, a forma de pagamento e o status do pagamento.\n4. Salve. Depois você pode abrir o comprovante e clicar em "Imprimir comprovante".',
  },
  {
    question: 'Como agendo uma coleta?',
    answer: '1. Abra "Coletas" no menu.\n2. Clique em "Nova coleta".\n3. Escolha o cliente, a data e o tipo de coleta e salve.',
  },
  {
    question: 'Onde vejo meu fluxo de caixa?',
    answer:
      'Abra "Fluxo de caixa" no menu, em ANÁLISES. Lá aparecem as entradas (vendas) e saídas (compras) pagas por período, com o saldo inicial e o saldo final.\n\nPara ver resultados por cliente ou material, use "Relatórios".',
  },
]

export const notConfiguredReply =
  'Ainda não consigo responder perguntas livres: o assistente com IA não foi ativado neste servidor. Escolha um dos assuntos abaixo que eu explico o passo a passo.'
