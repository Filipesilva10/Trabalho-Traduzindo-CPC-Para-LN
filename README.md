# Agente Web de Tradução entre Português (NL) e Lógica Proposicional (CPC)

Este repositório apresenta um agente desenvolvido para uso em navegadores, capaz de converter sentenças escritas em Língua Portuguesa para fórmulas do Cálculo Proposicional Clássico (CPC) e também realizar a tradução inversa.
A aplicação foi construída utilizando HTML, CSS e JavaScript, fornecendo uma interface simples para explorar relações entre linguagem natural e lógica formal.

## 1. Arquitetura do Sistema e Funcionamento Geral
### Introdução

O sistema é dividido em três elementos principais:

A interface Web, utilizada para interação com o usuário;

O mecanismo de tradução, responsável pelas regras e operações de conversão;

O dicionário de átomos, que contém o mapeamento entre proposições e letras simbólicas.

Essa separação organiza o fluxo entre apresentação, processamento e armazenamento.

Fluxo Geral de Operação
Usuário → Interface → Mecanismo de Tradução → Conversão (NL ↔ CPC)

### Como funciona

O usuário insere uma frase em português na interface.

O sistema normaliza o texto (remove pontuação e padroniza palavras).

As proposições simples são detectadas e associadas a letras maiúsculas.

Conectivos da língua portuguesa são traduzidos para símbolos formais da lógica proposicional.

A fórmula lógica é exibida junto do dicionário de proposições.

Para a tradução inversa, a árvore lógica é percorrida e reconstruída como uma frase em português.

## 2. Estratégia de Tradução (Regras, Padrões e Exemplos)
### Introdução

O método de tradução utiliza regras manuais desenvolvidas em JavaScript, sem apoio de modelos de linguagem.
Cada expressão típica da língua portuguesa é associada diretamente ao seu equivalente formal.

Regras Utilizadas
Expressão na Língua Natural	Símbolo	Operação
não	¬	Negação
e	∧	Conjunção
ou	∨	Disjunção
se ... então ...	→	Condicional
se e somente se	↔	Bicondicional
Exemplo de Funcionamento

Entrada (NL):
Se está chovendo, então levarei guarda-chuva.

Saída (CPC):

A → B


Dicionário gerado:

A = está chovendo

B = levarei guarda-chuva

Tradução inversa:
Se está chovendo, então levarei guarda-chuva.

## 3. Avaliação: Pontos Positivos e Restrições
### Pontos de acerto

Identifica corretamente os principais conectivos proposicionais.

Funciona bem para sentenças diretas e compostas simples.

Limitações encontradas

Ambiguidade na interpretação do conectivo “ou”.

Necessidade de validação manual do dicionário de átomos.

Baixo desempenho com sentenças mais complexas da linguagem natural.

Não utiliza recursos avançados de NLP.

## 4. Limitações Atuais e Caminhos de Aprimoramento
### Resumo

Por ser baseado em regras estáticas, o sistema não realiza interpretação semântica profunda das frases.

Limitações do modelo atual

Reconhecimento limitado de construções complexas.

Falta de ferramentas de análise sintática ou morfológica.

Traduções literais podem gerar ambiguidades.

Dependência do usuário para confirmar átomos.

Possíveis evoluções

Adição de modelos de linguagem para aprimorar a compreensão textual.

Inclusão de análise gramatical automatizada.

Implementação de geração automática de tabelas-verdade.

Exportação em PDF ou LaTeX para aplicações acadêmicas.

## 5. Demonstração em Vídeo

Um vídeo demonstra o funcionamento do agente, desde a tradução até o uso do dicionário de proposições.

Link para o vídeo:

## 6. Aplicação Online

O agente pode ser testado diretamente via GitHub Pages:

GitHub Pages:

## Autores

Filipe Silva Rodrigues — Ciência da Computação

Victor Hugo De Paula Malta — Ciência da Computação

Disciplina: Lógica para Computação

Instituição: Uni-FACEF

Ano: 2025
