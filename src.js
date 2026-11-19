const demoProducts = [
  { id: "p1", name: "Suco de laranja", category: "Bebidas", price: 5, description: "Laranja espremida na hora", emoji: "🍊", available: true },
  { id: "p2", name: "Sanduíche natural", category: "Lanches", price: 8, description: "Frango, cenoura e pão integral", emoji: "🥪", available: true },
  { id: "p3", name: "Pão de queijo", category: "Lanches", price: 4, description: "Quentinho e feito hoje", emoji: "🧀", available: true },
  { id: "p4", name: "Bolo de chocolate", category: "Doces", price: 6, description: "Fatia com cobertura cremosa", emoji: "🍰", available: false },
  { id: "p5", name: "Água mineral", category: "Bebidas", price: 3, description: "Garrafa 500 ml", emoji: "💧", available: true },
  { id: "p6", name: "Cookie da casa", category: "Doces", price: 4.5, description: "Cookie com gotas de chocolate", emoji: "🍪", available: true },
];
const demoOrders = [
  { id: "022", items: [{ productId: "p1", name: "Suco de laranja", emoji: "🍊", price: 5, quantity: 1 }, { productId: "p3", name: "Pão de queijo", emoji: "🧀", price: 4, quantity: 1 }], status: "Entregue", createdAt: Date.now() - 33 * 60000 },
  { id: "023", items: [{ productId: "p2", name: "Sanduíche natural", emoji: "🥪", price: 8, quantity: 1 }], status: "Em preparo", createdAt: Date.now() - 9 * 60000 },
  { id: "024", items: [{ productId: "p1", name: "Suco de laranja", emoji: "🍊", price: 5, quantity: 1 }, { productId: "p2", name: "Sanduíche natural", emoji: "🥪", price: 8, quantity: 1 }], status: "Recebido", createdAt: Date.now() - 2 * 60000 },
];
const STORAGE_KEY = "cantina-facil-v1";
const readState = () => { try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY)); if (value && Array.isArray(value.products) && Array.isArray(value.orders)) return value; } catch {} return { products: structuredClone(demoProducts), orders: structuredClone(demoOrders), cart: [], nextOrder: 25, lastOrderId: "024" }; };
let state = readState();
let currentView = "student", category = "Todos", query = "", orderFilter = "Todos";
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const money = amount => Number(amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const statusClass = status => ({ "Recebido": "status-recebido", "Em preparo": "status-preparo", "Pronto": "status-pronto", "Entregue": "status-entregue" })[status] || "status-recebido";
const orderTotal = order => order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
const cartTotal = () => state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); render(); }
function toast(message, type = "success") { const node = document.createElement("div"); node.className = `toast ${type}`; node.textContent = message; $("#toasts").append(node); setTimeout(() => node.remove(), 3000); }
function renderCategories() {
  const labels = ["Todos", "Lanches", "Bebidas", "Doces"];
  $("#categories").innerHTML = labels.map(label => `<button class="category-chip ${category === label ? "active" : ""}" data-category="${label}">${label}</button>`).join("");
  $$("[data-category]").forEach(button => button.onclick = () => { category = button.dataset.category; renderProducts(); renderCategories(); });
}
function renderProducts() {
  const list = state.products.filter(item => (category === "Todos" || item.category === category) && `${item.name} ${item.description}`.toLowerCase().includes(query.toLowerCase()));
  $("#menu-count").textContent = `${list.length} ${list.length === 1 ? "opção fresquinha" : "opções fresquinhas"}`;
  $("#products").innerHTML = list.length ? list.map(item => `<article class="product-card"><div class="food-art">${escapeHTML(item.emoji || "🍽️")}</div><div class="product-info"><h3>${escapeHTML(item.name)}</h3><p>${escapeHTML(item.description || item.category)}</p><div class="price-line">${money(item.price)}</div><div class="availability ${item.available ? "" : "out"}">${item.available ? "Disponível agora" : "Esgotado por hoje"}</div></div><button class="add-button" data-add="${item.id}" ${item.available ? "" : "disabled"}>${item.available ? "Adicionar +" : "Esgotado"}</button></article>`).join("") : `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🔎</div><b>Nenhum item encontrado</b><span>Tente outro nome ou categoria.</span></div>`;
  $$('[data-add]').forEach(button => button.onclick = () => addToCart(button.dataset.add));
}
function renderCartBadge() { const count = state.cart.reduce((sum, item) => sum + item.quantity, 0); $("#cart-count").textContent = count; $("#cart-total").textContent = money(cartTotal()); }
function addToCart(id) { const product = state.products.find(item => item.id === id); if (!product?.available) return; const existing = state.cart.find(item => item.productId === id); if (existing) existing.quantity++; else state.cart.push({ productId: product.id, name: product.name, emoji: product.emoji, price: product.price, quantity: 1 }); save(); toast(`${product.name} adicionado ao pedido`); }
function adjustCart(id, amount) { const line = state.cart.find(item => item.productId === id); if (!line) return; line.quantity += amount; if (line.quantity <= 0) state.cart = state.cart.filter(item => item.productId !== id); else { const product = state.products.find(p => p.id === id); if (!product?.available) { toast("Este item está indisponível.", "error"); return; } } save(); renderCart(); }
function removeCartLine(id) { state.cart = state.cart.filter(item => item.productId !== id); save(); renderCart(); }
function renderCart() {
  const host = $("#cart-lines");
  if (!state.cart.length) { host.innerHTML = `<div class="empty-state"><div class="empty-icon">🧺</div><b>Seu pedido está vazio</b><span>Volte ao cardápio e escolha algo gostoso.</span></div>`; $("#cart-summary").innerHTML = ""; $("#confirm-order").disabled = true; $("#confirm-order").style.opacity = ".55"; return; }
  $("#confirm-order").disabled = false; $("#confirm-order").style.opacity = "1";
  host.innerHTML = state.cart.map(line => `<article class="cart-line"><div class="cart-emoji">${escapeHTML(line.emoji)}</div><div><h3>${escapeHTML(line.name)}</h3><small>${money(line.price)} cada</small><div class="quantity-controls"><button data-dec="${line.productId}" aria-label="Diminuir quantidade">−</button><span>${line.quantity}</span><button data-inc="${line.productId}" aria-label="Aumentar quantidade">+</button></div></div><div class="line-total">${money(line.price * line.quantity)}</div><button class="remove-button" data-remove="${line.productId}">Remover item</button></article>`).join("");
  $("#cart-summary").innerHTML = `<div class="summary-line"><span>${state.cart.reduce((sum, item) => sum + item.quantity, 0)} item(ns) · Pagamento na retirada</span><span></span></div><div class="summary-total"><span>Total</span><span>${money(cartTotal())}</span></div>`;
  $$('[data-inc]').forEach(button => button.onclick = () => adjustCart(button.dataset.inc, 1)); $$('[data-dec]').forEach(button => button.onclick = () => adjustCart(button.dataset.dec, -1)); $$('[data-remove]').forEach(button => button.onclick = () => removeCartLine(button.dataset.remove));
}
function confirmOrder() {
  if (!state.cart.length) return;
  const unavailable = state.cart.find(line => !state.products.find(product => product.id === line.productId)?.available);
  if (unavailable) { toast(`${unavailable.name} está indisponível. Remova do pedido para continuar.`, "error"); return; }
  const id = String(state.nextOrder++).padStart(3, "0");
  state.orders.push({ id, items: structuredClone(state.cart), status: "Recebido", createdAt: Date.now() }); state.lastOrderId = id; state.cart = []; save(); $("#cart-dialog").close(); toast(`Pedido #${id} enviado para a cantina!`); $("#tracking-card").scrollIntoView({ behavior: "smooth", block: "center" });
}
const statusOrder = ["Recebido", "Em preparo", "Pronto", "Entregue"];
function renderTracking() {
  const order = state.orders.find(item => item.id === state.lastOrderId) || [...state.orders].reverse().find(item => item.status !== "Entregue");
  const card = $("#tracking-card"); if (!order) { card.classList.add("hidden"); return; } card.classList.remove("hidden");
  const index = statusOrder.indexOf(order.status); const summary = order.items.map(item => `${item.quantity} ${escapeHTML(item.name)}`).join(" + ");
  const steps = ["Recebido", "Em preparo", "Pronto"].map((step, i) => `<div class="step ${index > i ? "done" : index === i ? "current" : ""}">${index > i ? "✓ " : "○ "}${step}</div>`).join("");
  card.innerHTML = `<div class="tracking-top"><div><p class="eyebrow">ACOMPANHAMENTO</p><b>Pedido confirmado!</b></div><span class="tracking-number">#${order.id}</span></div><p class="tracking-items">${summary} · ${money(orderTotal(order))}</p><p class="eyebrow">ANDAMENTO DO PEDIDO</p><div class="stepper">${steps}</div><div class="pickup-note ${order.status === "Pronto" || order.status === "Entregue" ? "ready" : ""}"><b>${order.status === "Pronto" || order.status === "Entregue" ? "Pode vir buscar!" : "Retirada do lanche"}</b><br>${order.status === "Pronto" || order.status === "Entregue" ? `Seu pedido #${order.id} está pronto no balcão.` : `Acompanhe por aqui. Avisaremos quando o pedido #${order.id} estiver pronto.`}</div>`;
}
function renderAttendant() {
  const active = state.orders.filter(order => order.status !== "Entregue");
  const preparing = state.orders.filter(order => order.status === "Em preparo").length;
  const ready = state.orders.filter(order => order.status === "Pronto").length;
  $("#queue-count").textContent = active.length;
  $("#attendant-stats").innerHTML = `<article class="stat-card"><span class="stat-label">Na fila</span><div class="stat-number orange">${active.length}</div></article><article class="stat-card"><span class="stat-label">Em preparo</span><div class="stat-number">${preparing}</div></article><article class="stat-card"><span class="stat-label">Prontos para retirada</span><div class="stat-number">${ready}</div></article>`;
  $("#inventory-chips").innerHTML = state.products.map(item => `<button class="inventory-chip ${item.available ? "" : "off"}" data-inventory="${item.id}">${escapeHTML(item.name)} · ${item.available ? "disponível" : "esgotado"}</button>`).join("");
  $$('[data-inventory]').forEach(button => button.onclick = () => { const item = state.products.find(product => product.id === button.dataset.inventory); item.available = !item.available; save(); toast(`${item.name}: ${item.available ? "disponível" : "marcado como esgotado"}`); });
  const shown = [...state.orders].reverse().filter(order => orderFilter === "Todos" || order.status === orderFilter);
  $("#orders-list").innerHTML = shown.length ? shown.map(order => {
    const items = order.items.map(item => `${item.quantity} ${escapeHTML(item.name)}`).join(" + ");
    return `<article class="order-card"><div><div class="order-main"><div class="order-avatar">🧾</div><div><h4 class="order-title">Pedido #${order.id}</h4><div class="order-meta">Aluno · ${relativeTime(order.createdAt)}</div><span class="order-status ${statusClass(order.status)}">${order.status}</span></div></div><div class="order-items">${items}</div><div class="order-total">${money(orderTotal(order))}</div><div class="order-time">Retirada no balcão</div></div><div class="order-controls">${["Em preparo", "Pronto", "Entregue"].map(status => `<button class="${order.status === status ? "selected" : ""}" data-status="${status}" data-order="${order.id}">${status}</button>`).join("")}</div></article>`;
  }).join("") : `<div class="empty-state"><div class="empty-icon">✨</div><b>Nenhum pedido por aqui</b><span>Quando alguém pedir, ele aparece nesta fila.</span></div>`;
  $$('[data-status]').forEach(button => button.onclick = () => updateStatus(button.dataset.order, button.dataset.status));
}
function updateStatus(id, status) { const order = state.orders.find(item => item.id === id); if (!order || order.status === status) return; order.status = status; save(); toast(`Pedido #${id}: ${status.toLowerCase()}`); }
function relativeTime(time) { const mins = Math.max(0, Math.floor((Date.now() - time) / 60000)); return mins < 1 ? "agora" : `há ${mins} min`; }
function renderManageList() {
  $("#manage-list").innerHTML = state.products.map(item => `<div class="manage-row"><div class="manage-product"><span>${escapeHTML(item.emoji)}</span><div><b>${escapeHTML(item.name)}</b><small>${money(item.price)} · ${item.available ? "Disponível" : "Esgotado"}</small></div></div><div class="manage-actions"><button data-edit="${item.id}">Editar</button><button class="delete-product" data-delete="${item.id}">Excluir</button></div></div>`).join("");
  $$('[data-edit]').forEach(button => button.onclick = () => editProduct(button.dataset.edit));
  $$('[data-delete]').forEach(button => button.onclick = () => deleteProduct(button.dataset.delete));
}
function editProduct(id) { const product = state.products.find(item => item.id === id); if (!product) return; const form = $("#product-form"); Object.entries({ id: product.id, name: product.name, price: product.price, category: product.category, description: product.description, emoji: product.emoji, available: String(product.available) }).forEach(([key, value]) => { form.elements[key].value = value; }); $("#save-product").innerHTML = "Salvar alterações <span>→</span>"; $("#cancel-edit").classList.remove("hidden"); form.scrollIntoView({ behavior: "smooth", block: "start" }); }
function clearProductForm() { $("#product-form").reset(); $("#product-form").elements.id.value = ""; $("#save-product").innerHTML = "Adicionar ao cardápio <span>→</span>"; $("#cancel-edit").classList.add("hidden"); }
function deleteProduct(id) { const product = state.products.find(item => item.id === id); if (!product || !confirm(`Excluir ${product.name} do cardápio?`)) return; state.products = state.products.filter(item => item.id !== id); state.cart = state.cart.filter(item => item.productId !== id); save(); renderManageList(); renderCartBadge(); toast(`${product.name} removido do cardápio.`); }
function escapeHTML(text = "") { return String(text).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]); }
function render() { renderProducts(); renderCartBadge(); renderTracking(); renderAttendant(); if ($("#manage-dialog").open) renderManageList(); }
$$(".role-tab").forEach(button => button.onclick = () => { currentView = button.dataset.view; $$(".role-tab").forEach(tab => tab.classList.toggle("active", tab === button)); $("#student-view").classList.toggle("active", currentView === "student"); $("#attendant-view").classList.toggle("active", currentView === "attendant"); });
$("#search").addEventListener("input", event => { query = event.target.value; renderProducts(); });
$("#open-cart").onclick = () => { renderCart(); $("#cart-dialog").showModal(); };
$("#confirm-order").onclick = confirmOrder;
$("#back-menu").onclick = () => $("#cart-dialog").close();
$("#manage-menu").onclick = () => { renderManageList(); $("#manage-dialog").showModal(); };
$$("[data-close]").forEach(button => button.onclick = () => $("#" + button.dataset.close).close());
$$(".dialog").forEach(dialog => dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); }));
$("#cancel-edit").onclick = clearProductForm;
$("#product-form").onsubmit = event => { event.preventDefault(); const form = event.currentTarget; const values = Object.fromEntries(new FormData(form)); const product = { id: values.id || `p${Date.now()}`, name: values.name.trim(), price: Number(values.price), category: values.category, description: values.description.trim(), emoji: values.emoji.trim() || "🍽️", available: values.available === "true" }; if (!Number.isFinite(product.price) || product.price <= 0) return; if (values.id) { const index = state.products.findIndex(item => item.id === values.id); state.products[index] = product; toast(`${product.name} atualizado.`); } else { state.products.push(product); toast(`${product.name} adicionado ao cardápio.`); } clearProductForm(); save(); renderManageList(); };
$("#order-filters").onclick = event => { const button = event.target.closest("[data-filter]"); if (!button) return; orderFilter = button.dataset.filter; $$(".filter-pill").forEach(pill => pill.classList.toggle("active", pill === button)); renderAttendant(); };
$("#reset-demo").onclick = () => { if (!confirm("Restaurar os dados iniciais? Isso apaga alterações feitas neste navegador.")) return; state = { products: structuredClone(demoProducts), orders: structuredClone(demoOrders), cart: [], nextOrder: 25, lastOrderId: "024" }; category = "Todos"; query = ""; $("#search").value = ""; save(); toast("Demonstração restaurada."); };
renderCategories(); render();
