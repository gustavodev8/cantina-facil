# Cantina Fácil

Protótipo web responsivo de pedidos para cantina escolar, baseado no fluxo de telas do projeto: cardápio, revisão do pedido, acompanhamento e painel da atendente.

## Rodar localmente

```bash
npm install
npm run dev
```

Abra o endereço mostrado pelo Vite. `npm run build` gera a versão estática em `dist/` para publicação no Vercel.

## Como usar

- A aba **Aluno** permite buscar itens, adicionar ao carrinho, ajustar quantidades, remover itens, confirmar o pedido e acompanhar o andamento.
- A aba **Atendente** mostra a fila de pedidos em ordem recente, permite avançar entre **Em preparo**, **Pronto** e **Entregue** e controlar a disponibilidade do cardápio.
- O botão **Gerenciar cardápio** abre o CRUD de produtos: cadastrar, editar, alternar disponibilidade e excluir.
- Os dados ficam salvos em `localStorage` neste navegador. O protótipo não sincroniza dados entre navegadores ou dispositivos e não tem autenticação de produção nem pagamento real.
- **Restaurar demonstração** volta ao cardápio e aos pedidos de exemplo.

## Publicação

Projeto estático pronto para importar no Vercel. Build command: `npm run build`; output directory: `dist`.
