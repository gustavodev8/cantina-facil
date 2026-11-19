# Cantina Fácil

Protótipo interativo e responsivo de pedidos para cantina escolar, fiel às telas de referência: cardápio, revisão do pedido, acompanhamento e painel da atendente.

## Executar localmente

```bash
npm install
npm run dev
```

Use o endereço local informado pelo Vite. `npm run build` gera a pasta `dist/` para o Vercel.

## Entrar e usar

A página inicial tem login e cadastro. Para experimentar, escolha **Usar conta de demonstração** para preencher os dados e depois clique em **Entrar na cantina**:

- Aluno: `aluno@cantina.local` / `Recreio123!`
- Atendente: `atendente@cantina.local` / `Cantina123!`

O perfil de aluno tem busca, cardápio, carrinho, ajuste de quantidades, remoção, confirmação, acompanhamento e histórico. O perfil de atendente tem fila, atualização sequencial de status (Recebido → Em preparo → Pronto → Entregue), controle de disponibilidade e CRUD de produtos. É possível cadastrar contas adicionais de aluno.

As senhas são derivadas por PBKDF2 e os dados ficam no `localStorage` do navegador. As abas no mesmo navegador compartilham produtos e pedidos; cada aba pode manter seu próprio perfil para demonstrar aluno e atendente lado a lado. O projeto não tem autenticação de servidor ou banco remoto: dados não sincronizam entre dispositivos e não são adequados a informações reais. Não use senhas ou dados pessoais reais.

**Restaurar demonstração** repõe os produtos e pedidos de exemplo após confirmação.

## Publicação

Build command: `npm run build`. Output directory: `dist`.
