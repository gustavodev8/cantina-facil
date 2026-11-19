const STORAGE_KEY = "cantina-facil-v2";
const SESSION_KEY = "cantina-facil-session";
const DEMO_STUDENT = { id: "demo-student", name: "Aluno", email: "aluno@cantina.local", role: "student", salt: "cantina-facil-student", passwordHash: "" };
const DEMO_ATTENDANT = { id: "demo-attendant", name: "Atendente", email: "atendente@cantina.local", role: "attendant", salt: "cantina-facil-attendant", passwordHash: "" };
const defaultProducts = [
  { id: "p1", name: "Suco de laranja", category: "Bebidas", price: 5, description: "Laranja espremida na hora", emoji: "🍊", available: true },
  { id: "p2", name: "Sanduíche natural", category: "Lanches", price: 8, description: "Frango, cenoura e pão integral", emoji: "🥪", available: true },
  { id: "p3", name: "Pão de queijo", category: "Lanches", price: 4, description: "Quentinho e feito hoje", emoji: "🧀", available: true },
  { id: "p4", name: "Bolo de chocolate", category: "Doces", price: 6, description: "Fatia com cobertura cremosa", emoji: "🍰", available: false },
];
const demoOrders = [
  { id: "022", userId: DEMO_STUDENT.id, studentName: "Aluno", items: [{ productId: "p1", name: "Suco de laranja", emoji: "🍊", price: 5, quantity: 1 }, { productId: "p3", name: "Pão de queijo", emoji: "🧀", price: 4, quantity: 1 }], status: "Entregue", createdAt: Date.now() - 33 * 60000 },
  { id: "023", userId: DEMO_STUDENT.id, studentName: "Aluno", items: [{ productId: "p2", name: "Sanduíche natural", emoji: "🥪", price: 8, quantity: 1 }], status: "Em preparo", createdAt: Date.now() - 9 * 60000 },
  { id: "024", userId: DEMO_STUDENT.id, studentName: "Aluno", items: [{ productId: "p1", name: "Suco de laranja", emoji: "🍊", price: 5, quantity: 1 }, { productId: "p2", name: "Sanduíche natural", emoji: "🥪", price: 8, quantity: 1 }], status: "Recebido", createdAt: Date.now() - 2 * 60000 },
];
const readState = () => {
  try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); if (value && Array.isArray(value.products) && Array.isArray(value.orders) && Array.isArray(value.users)) return value; } catch { /* empty or malformed storage */ }
  return { products: structuredClone(defaultProducts), orders: structuredClone(demoOrders), users: [], carts: {}, nextOrder: 25 };
};
let state = readState();
let userId = sessionStorage.getItem(SESSION_KEY) || "";
let cart = [];
let category = "Todos", query = "", orderFilter = "Todos";
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const money = amount => Number(amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const orderTotal = order => order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
const statusClass = status => ({ "Recebido": "status-recebido", "Em preparo": "status-preparo", "Pronto": "status-pronto", "Entregue": "status-entregue" })[status] || "status-recebido";
const currentUser = () => state.users.find(user => user.id === userId) || null;
const studentOrders = () => state.orders.filter(order => order.userId === userId).sort((a, b) => b.createdAt - a.createdAt);
function save() { if (currentUser()) state.carts[userId] = cart; localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); render(); }
function toast(message, type = "success") { const node = document.createElement("div"); node.className = `toast ${type}`; node.textContent = message; $("#toasts").append(node); setTimeout(() => node.remove(), 3200); }
function bytesToBase64(bytes) { return btoa(String.fromCharCode(...new Uint8Array(bytes))); }
async function passwordHash(password, salt) {
  if (!crypto.subtle) throw new Error("Este navegador não oferece armazenamento seguro para a senha. Acesse pelo endereço HTTPS.");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: new TextEncoder().encode(salt), iterations: 120000, hash: "SHA-256" }, key, 256);
  return bytesToBase64(bits);
}
async function initialize() {
  if (!state.users.some(user => user.id === DEMO_STUDENT.id)) state.users.push({ ...DEMO_STUDENT, passwordHash: await passwordHash("Recreio123!", DEMO_STUDENT.salt) });
  if (!state.users.some(user => user.id === DEMO_ATTENDANT.id)) state.users.push({ ...DEMO_ATTENDANT, passwordHash: await passwordHash("Cantina123!", DEMO_ATTENDANT.salt) });
  state.users = state.users.map(user => ({ ...user, role: user.role === "attendant" ? "attendant" : "student" }));
  if (!state.carts || typeof state.carts !== "object") state.carts = {};
  if (!Number.isInteger(state.nextOrder)) state.nextOrder = 25;
  if (!state.orders.length) state.orders = structuredClone(demoOrders);
  state.orders = state.orders.map(order => ({ ...order, userId: order.userId || DEMO_STUDENT.id, studentName: order.studentName || (state.users.find(user => user.id === order.userId)?.name ?? "Aluno") }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (userId && currentUser()) { cart = state.carts[userId] || []; showApp(); }
  else { userId = ""; sessionStorage.removeItem(SESSION_KEY); showAuth("login"); }
  render();
}
function showAuth(mode = "login") {
  $("#auth-screen").classList.remove("hidden"); $("#app-shell").classList.add("hidden");
  const registering = mode === "register";
  $("#login-form").classList.toggle("hidden", registering); $("#register-form").classList.toggle("hidden", !registering);
  $$("[data-auth-mode]").forEach(button => button.classList.toggle("active", button.dataset.authMode === mode));
  $("#auth-title").innerHTML = registering ? "Sua pausa gostosa<br/><em>começa aqui.</em>" : "Que bom ter você<br/><em>por aqui.</em>";
  $("#auth-description").textContent = registering ? "Crie sua conta de aluno e peça sem entrar na fila." : "Entre para pedir seu lanche ou acompanhar a cantina.";
}
function showApp() {
  const user = currentUser(); if (!user) return showAuth("login");
  $("#auth-screen").classList.add("hidden"); $("#app-shell").classList.remove("hidden");
  $("#account-name").textContent = user.name; $("#account-name").title = user.email;
  $$(".role-tab").forEach(tab => { const active = tab.dataset.view === (user.role === "student" ? "student" : "attendant"); tab.classList.toggle("active", active); tab.classList.remove("hidden"); });
  $("#student-view").classList.toggle("active", user.role === "student"); $("#attendant-view").classList.toggle("active", user.role === "attendant");
}
function login(user) { userId = user.id; cart = state.carts[userId] || []; localStorage.setItem(SESSION_KEY, userId); showApp(); render(); toast(`Olá, ${user.name}!`); }
function renderCategories() {
  const labels = ["Todos", "Lanches", "Bebidas", "Doces"];
  $("#categories").innerHTML = labels.map(label => `<button class="category-chip ${category === label ? "active" : ""}" data-category="${label}">${label}</button>`).join("");
  $$('[data-category]').forEach(button => button.onclick = () => { category = button.dataset.category; renderProducts(); renderCategories(); });
}
function renderProducts() {
  const list = state.products.filter(item => (category === "Todos" || item.category === category) && `${item.name} ${item.description}`.toLowerCase().includes(query.toLowerCase()));
  $("#menu-count").textContent = `${list.length} ${list.length === 1 ? "opção" : "opções"}`;
  $("#products").innerHTML = list.length ? list.map(item => `<article class="product-card"><div class="food-art">${escapeHTML(item.emoji || "🍽️")}</div><div class="product-info"><h3>${escapeHTML(item.name)}</h3><p>${escapeHTML(item.description || item.category)}</p><div class="price-line">${money(item.price)}</div><div class="availability ${item.available ? "" : "out"}">${item.available ? "Disponível" : "Esgotado"}</div></div><button class="add-button" data-add="${escapeHTML(item.id)}" ${item.available ? "" : "disabled"}>${item.available ? "Adicionar" : "Esgotado"}</button></article>`).join("") : `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🔎</div><b>Nenhum item encontrado</b><span>Tente outro nome ou categoria.</span></div>`;
  $$('[data-add]').forEach(button => button.onclick = () => addToCart(button.dataset.add));
}
function renderCartBadge() { const count = cart.reduce((sum, item) => sum + item.quantity, 0); $("#cart-count").textContent = count; $("#cart-total").textContent = money(cart.reduce((sum, item) => sum + item.price * item.quantity, 0)); }
function addToCart(id) {
  const product = state.products.find(item => item.id === id); if (!product?.available) return;
  const line = cart.find(item => item.productId === id); if (line) line.quantity++; else cart.push({ productId: product.id, name: product.name, emoji: product.emoji, price: product.price, quantity: 1 });
  save(); toast(`${product.name} adicionado ao pedido.`);
}
function adjustCart(id, amount) {
  const line = cart.find(item => item.productId === id); if (!line) return;
  if (amount > 0 && !state.products.find(product => product.id === id)?.available) return toast("Este item está indisponível.", "error");
  line.quantity += amount; if (line.quantity <= 0) cart = cart.filter(item => item.productId !== id); save(); renderCart();
}
function removeCartLine(id) { cart = cart.filter(item => item.productId !== id); save(); renderCart(); }
function renderCart() {
  const host = $("#cart-lines");
  if (!cart.length) { host.innerHTML = `<div class="empty-state"><div class="empty-icon">🧺</div><b>Seu pedido está vazio</b><span>Volte ao cardápio e escolha algo gostoso.</span></div>`; $("#cart-summary").innerHTML = ""; $("#confirm-order").disabled = true; $("#confirm-order").style.opacity = ".55"; return; }
  $("#confirm-order").disabled = false; $("#confirm-order").style.opacity = "1";
  host.innerHTML = cart.map(line => `<article class="cart-line"><div class="cart-emoji">${escapeHTML(line.emoji)}</div><div><h3>${escapeHTML(line.name)}</h3><small>${money(line.price)} cada</small><div class="quantity-controls"><button data-dec="${escapeHTML(line.productId)}" aria-label="Diminuir quantidade">−</button><span>${line.quantity}</span><button data-inc="${escapeHTML(line.productId)}" aria-label="Aumentar quantidade">+</button></div></div><div class="line-total">${money(line.price * line.quantity)}</div><button class="remove-button" data-remove="${escapeHTML(line.productId)}">Remover item</button></article>`).join("");
  $("#cart-summary").innerHTML = `<div class="summary-line"><span>${cart.reduce((sum, item) => sum + item.quantity, 0)} item(ns) · Pagamento na retirada</span></div><div class="summary-total"><span>Total</span><span>${money(cart.reduce((sum, item) => sum + item.price * item.quantity, 0))}</span></div>`;
  $$('[data-inc]').forEach(button => button.onclick = () => adjustCart(button.dataset.inc, 1)); $$('[data-dec]').forEach(button => button.onclick = () => adjustCart(button.dataset.dec, -1)); $$('[data-remove]').forEach(button => button.onclick = () => removeCartLine(button.dataset.remove));
}
function confirmOrder() {
  if (!cart.length || currentUser()?.role !== "student") return;
  const unavailable = cart.find(line => !state.products.find(product => product.id === line.productId)?.available);
  if (unavailable) return toast(`${unavailable.name} está indisponível. Remova do pedido.`, "error");
  const idNum = Math.max(state.nextOrder || 25, ...state.orders.map(order => Number(order.id) + 1 || 25));
  state.nextOrder = idNum + 1; const id = String(idNum).padStart(3, "0");
  state.orders.push({ id, userId, studentName: currentUser().name, items: structuredClone(cart), status: "Recebido", createdAt: Date.now() });
  cart = []; state.carts[userId] = []; save(); $("#cart-dialog").close(); toast(`Pedido #${id} enviado para a cantina!`); $("#tracking-card").scrollIntoView({ behavior: "smooth", block: "center" });
}
const statusOrder = ["Recebido", "Em preparo", "Pronto", "Entregue"];
function renderTracking() {
  const orders = studentOrders(), order = orders.find(item => item.status !== "Entregue") || orders[0], card = $("#tracking-card");
  if (!order) { card.classList.add("hidden"); return; } card.classList.remove("hidden");
  const index = statusOrder.indexOf(order.status), summary = order.items.map(item => `${item.quantity} ${escapeHTML(item.name)}`).join(" + ");
  const steps = ["Recebido", "Em preparo", "Pronto"].map((step, i) => `<div class="step ${index > i ? "done" : index === i ? "current" : ""}">${index > i ? "✓ " : "○ "}${step}</div>`).join("");
  card.innerHTML = `<div class="tracking-top"><div><p class="eyebrow">ACOMPANHAMENTO DO PEDIDO</p><b>Pedido confirmado!</b></div><span class="tracking-number">#${escapeHTML(order.id)}</span></div><p class="tracking-items">${summary} · ${money(orderTotal(order))}</p><p class="eyebrow">ANDAMENTO</p><div class="stepper">${steps}</div><div class="pickup-note ${order.status === "Pronto" || order.status === "Entregue" ? "ready" : ""}"><b>${order.status === "Pronto" || order.status === "Entregue" ? "Pronto para retirada" : "Retirada do lanche"}</b><br>${order.status === "Pronto" || order.status === "Entregue" ? `Seu pedido #${escapeHTML(order.id)} está no balcão. Faça o pagamento na retirada.` : `Acompanhe por aqui. O pedido #${escapeHTML(order.id)} está ${order.status.toLowerCase()}.`}</div>`;
}
function renderStudentHistory() {
  const orders = studentOrders();
  $("#student-orders").innerHTML = orders.length ? orders.map(order => `<article class="history-row"><span class="history-order">#${escapeHTML(order.id)}</span><span>${order.items.map(item => `${item.quantity} ${escapeHTML(item.name)}`).join(" + ")}</span><span class="order-status ${statusClass(order.status)}">${order.status}</span><b>${money(orderTotal(order))}</b></article>`).join("") : `<div class="empty-state"><div class="empty-icon">🧾</div><b>Seus pedidos aparecem aqui</b><span>Escolha algo no cardápio para começar.</span></div>`;
}
function renderAttendant() {
  const active = state.orders.filter(order => order.status !== "Entregue"); $("#queue-count").textContent = active.length;
  $("#attendant-stats").innerHTML = `<article class="stat-card"><span class="stat-label">Na fila</span><div class="stat-number orange">${active.length}</div></article><article class="stat-card"><span class="stat-label">Em preparo</span><div class="stat-number">${state.orders.filter(order => order.status === "Em preparo").length}</div></article><article class="stat-card"><span class="stat-label">Prontos</span><div class="stat-number">${state.orders.filter(order => order.status === "Pronto").length}</div></article>`;
  $("#inventory-chips").innerHTML = state.products.map(item => `<button class="inventory-chip ${item.available ? "" : "off"}" data-inventory="${escapeHTML(item.id)}">${escapeHTML(item.name)}: ${item.available ? "disponível" : "esgotado"}</button>`).join("");
  $$('[data-inventory]').forEach(button => button.onclick = () => { const item = state.products.find(product => product.id === button.dataset.inventory); item.available = !item.available; save(); toast(`${item.name}: ${item.available ? "disponível" : "esgotado"}`); });
  const shown = [...state.orders].sort((a, b) => b.createdAt - a.createdAt).filter(order => orderFilter === "Todos" || order.status === orderFilter);
  $("#orders-list").innerHTML = shown.length ? shown.map(order => {
    const items = order.items.map(item => `${item.quantity} ${escapeHTML(item.name)}`).join(" + ");
    return `<article class="order-card"><div><div class="order-main"><div class="order-avatar">🧾</div><div><h4 class="order-title">Pedido #${escapeHTML(order.id)}</h4><div class="order-meta">${escapeHTML(order.studentName || "Aluno")} · ${relativeTime(order.createdAt)}</div><span class="order-status ${statusClass(order.status)}">${order.status}</span></div></div><div class="order-items">${items}</div><div class="order-total">${money(orderTotal(order))}</div><div class="order-time">Retirada no balcão · pagamento na retirada</div></div><div class="order-controls">${["Em preparo", "Pronto", "Entregue"].map(status => `<button class="${order.status === status ? "selected" : ""}" data-status="${status}" data-order="${escapeHTML(order.id)}">${status}</button>`).join("")}</div></article>`;
  }).join("") : `<div class="empty-state"><div class="empty-icon">✨</div><b>Nenhum pedido por aqui</b><span>Quando um aluno pedir, ele aparece nesta fila.</span></div>`;
  $$('[data-status]').forEach(button => button.onclick = () => updateStatus(button.dataset.order, button.dataset.status));
}
function updateStatus(id, status) {
  if (currentUser()?.role !== "attendant") return;
  const order = state.orders.find(item => item.id === id); if (!order || order.status === status) return;
  const next = { "Recebido": "Em preparo", "Em preparo": "Pronto", "Pronto": "Entregue", "Entregue": null };
  if (next[order.status] !== status) return toast("Avance o pedido uma etapa por vez.", "error");
  order.status = status; save(); toast(`Pedido #${id}: ${status.toLowerCase()}`);
}
function relativeTime(time) { const mins = Math.max(0, Math.floor((Date.now() - time) / 60000)); return mins < 1 ? "agora" : `há ${mins} min`; }
function renderManageList() {
  $("#manage-list").innerHTML = state.products.map(item => `<div class="manage-row"><div class="manage-product"><span>${escapeHTML(item.emoji)}</span><div><b>${escapeHTML(item.name)}</b><small>${money(item.price)} · ${item.available ? "Disponível" : "Esgotado"}</small></div></div><div class="manage-actions"><button data-edit="${escapeHTML(item.id)}">Editar</button><button class="delete-product" data-delete="${escapeHTML(item.id)}">Excluir</button></div></div>`).join("");
  $$('[data-edit]').forEach(button => button.onclick = () => editProduct(button.dataset.edit)); $$('[data-delete]').forEach(button => button.onclick = () => deleteProduct(button.dataset.delete));
}
function editProduct(id) {
  if (currentUser()?.role !== "attendant") return;
  const product = state.products.find(item => item.id === id); if (!product) return;
  const form = $("#product-form");
  Object.entries({ id: product.id, name: product.name, price: product.price, category: product.category, description: product.description, emoji: product.emoji, available: String(product.available) }).forEach(([key, value]) => { form.elements[key].value = value; });
  $("#save-product").innerHTML = "Salvar alterações <span>→</span>"; $("#cancel-edit").classList.remove("hidden"); form.scrollIntoView({ behavior: "smooth", block: "start" });
}
function clearProductForm() { $("#product-form").reset(); $("#product-form").elements.id.value = ""; $("#save-product").innerHTML = "Adicionar ao cardápio <span>→</span>"; $("#cancel-edit").classList.add("hidden"); }
function deleteProduct(id) {
  if (currentUser()?.role !== "attendant") return;
  const product = state.products.find(item => item.id === id); if (!product || !confirm(`Excluir ${product.name} do cardápio?`)) return;
  state.products = state.products.filter(item => item.id !== id); Object.values(state.carts).forEach(lines => { const index = lines.findIndex(line => line.productId === id); if (index >= 0) lines.splice(index, 1); });
  cart = cart.filter(item => item.productId !== id); save(); renderManageList(); toast(`${product.name} removido do cardápio.`);
}
function render() { if (!currentUser()) return; renderCategories(); renderProducts(); renderCartBadge(); renderTracking(); renderStudentHistory(); renderAttendant(); if ($("#manage-dialog").open) renderManageList(); }
$$("[data-auth-mode]").forEach(button => button.onclick = () => showAuth(button.dataset.authMode));
$$(".show-password").forEach(button => button.onclick = () => { const field = button.parentElement.querySelector("input"); field.type = field.type === "password" ? "text" : "password"; });
$("#login-form").onsubmit = async event => {
  event.preventDefault(); const data = new FormData(event.currentTarget), email = String(data.get("email")).trim().toLowerCase(), password = String(data.get("password"));
  const user = state.users.find(item => item.email.toLowerCase() === email);
  if (!user || await passwordHash(password, user.salt) !== user.passwordHash) return toast("E-mail ou senha não conferem.", "error");
  login(user); event.currentTarget.reset();
};
$("#register-form").onsubmit = async event => {
  event.preventDefault(); const form = event.currentTarget, data = new FormData(form), email = String(data.get("email")).trim().toLowerCase(), name = String(data.get("name")).trim(), password = String(data.get("password"));
  if (state.users.some(user => user.email.toLowerCase() === email)) return toast("Já existe uma conta com esse e-mail.", "error");
  if (password.length < 6 || name.length < 2 || !/^\S+@\S+\.\S+$/.test(email)) return toast("Confira nome, e-mail e senha (mínimo de 6 caracteres).", "error");
  const user = { id: `student-${crypto.randomUUID()}`, name, email, role: "student", salt: crypto.randomUUID(), passwordHash: "" };
  user.passwordHash = await passwordHash(password, user.salt); state.users.push(user); save(); login(user); form.reset(); toast("Conta de aluno criada.");
};
$$('[data-fill-demo]').forEach(button => button.onclick = () => {
  const student = button.dataset.fillDemo === "student", form = $("#login-form");
  showAuth("login"); form.elements.email.value = student ? DEMO_STUDENT.email : DEMO_ATTENDANT.email;
  form.elements.password.value = student ? "Recreio123!" : "Cantina123!";
  form.elements.password.focus();
});
$("#logout-button").onclick = () => { state.carts[userId] = cart; localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); sessionStorage.removeItem(SESSION_KEY); userId = ""; cart = []; showAuth("login"); toast("Você saiu da conta."); };
$$(".role-tab").forEach(button => button.onclick = () => {
  const user = currentUser(), view = button.dataset.view;
  if ((view === "attendant" && user.role !== "attendant") || (view === "student" && user.role !== "student")) return toast("Entre com a conta correspondente para acessar esta área.", "error");
  $$(".role-tab").forEach(tab => tab.classList.toggle("active", tab === button)); $("#student-view").classList.toggle("active", view === "student"); $("#attendant-view").classList.toggle("active", view === "attendant"); render();
});
$("#search").addEventListener("input", event => { query = event.target.value; renderProducts(); });
$("#open-cart").onclick = () => { renderCart(); $("#cart-dialog").showModal(); };
$("#confirm-order").onclick = confirmOrder; $("#back-menu").onclick = () => $("#cart-dialog").close();
$("#manage-menu").onclick = () => { if (currentUser()?.role !== "attendant") return toast("Acesso exclusivo da atendente.", "error"); renderManageList(); $("#manage-dialog").showModal(); };
$$("[data-close]").forEach(button => button.onclick = () => $("#" + button.dataset.close).close());
$$(".dialog").forEach(dialog => dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); }));
$("#cancel-edit").onclick = clearProductForm;
$("#product-form").onsubmit = event => {
  event.preventDefault(); if (currentUser()?.role !== "attendant") return;
  const form = event.currentTarget, values = Object.fromEntries(new FormData(form)), price = Number(values.price);
  if (!values.name.trim() || !Number.isFinite(price) || price <= 0) return toast("Informe nome e preço válidos.", "error");
  const product = { id: values.id || `p-${crypto.randomUUID()}`, name: values.name.trim(), price, category: values.category, description: values.description.trim(), emoji: values.emoji.trim() || "🍽️", available: values.available === "true" };
  if (values.id) { const index = state.products.findIndex(item => item.id === values.id); if (index < 0) return toast("Este produto não existe mais.", "error"); state.products[index] = product; toast(`${product.name} atualizado.`); }
  else { state.products.push(product); toast(`${product.name} adicionado ao cardápio.`); }
  clearProductForm(); save(); renderManageList();
};
$("#order-filters").onclick = event => { const button = event.target.closest("[data-filter]"); if (!button) return; orderFilter = button.dataset.filter; $$(".filter-pill").forEach(pill => pill.classList.toggle("active", pill === button)); renderAttendant(); };
$("#reset-demo").onclick = () => {
  if (currentUser()?.role !== "attendant") return;
  if (!confirm("Restaurar cardápio e pedidos de exemplo? As alterações desta demonstração serão substituídas.")) return;
  state.products = structuredClone(defaultProducts); state.orders = structuredClone(demoOrders); state.nextOrder = 25; state.carts = {}; cart = []; save(); renderManageList(); toast("Demonstração restaurada.");
};
initialize().catch(error => { console.error(error); toast(error.message || "Não foi possível iniciar a cantina.", "error"); });
window.addEventListener("storage", event => {
  if (event.key !== STORAGE_KEY || !event.newValue) return;
  try { const incoming = JSON.parse(event.newValue); if (Array.isArray(incoming.products) && Array.isArray(incoming.orders) && Array.isArray(incoming.users)) { state = incoming; cart = state.carts?.[userId] || []; render(); } } catch { /* ignore invalid cross-tab updates */ }
});
