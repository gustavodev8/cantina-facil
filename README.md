# Cantina Fácil

Protótipo interativo e responsivo de pedidos para cantina escolar, fiel às telas de referência: cardápio, revisão do pedido, acompanhamento e painel da atendente.

## Executar localmente

```bash
npm install
npm run dev
```

Use o endereço local informado pelo Vite. `npm run build` gera a pasta `dist/` para o Vercel.

## Entrar e usar

A página inicial tem login e cadastro. Para experimentar como aluno, use **Preencher acesso** e depois clique em **Entrar na cantina**:

- Aluno: `aluno@cantina.local` / `Recreio123!`
- Atendente: `atendente@cantina.local` / `Cantina123!`

O protótipo abre limpo: sem pedido selecionado, sem histórico e com todos os produtos disponíveis. O perfil de aluno tem busca, cardápio, carrinho, ajuste de quantidades, remoção, confirmação, acompanhamento e histórico. O perfil de atendente tem fila, atualização sequencial de status (Recebido → Em preparo → Pronto → Entregue), controle de disponibilidade e CRUD de produtos. É possível cadastrar contas adicionais de aluno.

Para a apresentação, a atendente pode usar **Carregar cenário** para criar uma fila de exemplo de forma explícita. **Limpar demonstração** remove pedidos, carrinhos e alterações de disponibilidade.

As senhas são derivadas por PBKDF2 e os dados ficam no `localStorage` do navegador. As abas no mesmo navegador compartilham produtos e pedidos; cada aba pode manter seu próprio perfil para demonstrar aluno e atendente lado a lado. O projeto não tem autenticação de servidor ou banco remoto: dados não sincronizam entre dispositivos e não são adequados a informações reais. Não use senhas ou dados pessoais reais.

O fluxo pode ser demonstrado do zero em duas abas: entre como aluno em uma, faça um pedido; entre como atendente na outra e avance o pedido pelas etapas.

## Publicação

Build command: `npm run build`. Output directory: `dist`.
