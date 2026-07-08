// ============== STATO GLOBALE ==============
const state = {
  token: localStorage.getItem('token') || null,
  user: null
  };

// ============== FUNZIONI DI SUPPORTO ==============

// Salva il token e aggiorna lo stato
function setToken(token) {
  state.token = token;
  localStorage.setItem('token', token);
  }

// Rimuove il token (logout)
function clearToken() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('token');
  }

// Verifica che l'utente sia autenticato (e opzionalmente recupera i dati utente)
async function checkAuth() {
  if (!state.token) return false;
  try {
    const res = await fetch('/api/me', {headers: { 'Authorization': `Bearer ${state.token}`}});
    if (!res.ok) throw new Error('Token non valido');
    const data = await res.json();
    state.user = data.user;
    return true;
    } 
  catch (_e) {
    clearToken();
    return false;
    }
}

// Effettua una richiesta autenticata (o no) e restituisce la response
async function apiFetch(url, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (state.token) {headers['Authorization'] = `Bearer ${state.token}`;}
  const response = await fetch(url, { ...options, headers });
  return response;
  }

// Renderizza il menu in base allo stato di autenticazione
function renderMenu() {
  const authMenu = document.getElementById('auth-menu');
  if (state.user) {
    authMenu.innerHTML = `
    <span> ${state.user.username} €${state.user.balance}</span>
    <button class="logout-btn" id="logoutBtn">Logout</button>
    `;
    document.getElementById('logoutBtn').addEventListener('click', () => {
      clearToken();
      renderMenu();
      router();
      });
    }
  else  authMenu.innerHTML = `<a href="#/login">Login</a><a href="#/register">Registrati</a>`;
        }

// ============== VISTE (pagina) ==============

function renderHome() {
  return `
  <div class="card">
  <h1>Bazaar of Baghdad</h1>
  <p style="font-style: italic; margin-bottom: 1.5rem;">
  Gli ultimi acquisti al Bazaar di Baghdad, registrati anche tu per prender parte al nuovo modo di acquistare carte di Magic</p>
  <h2>Ultimi acquisti</h2>
  <div id="purchases-container">
  <p>Caricamento in corso...</p>
  </div></div>`;
  }

async function afterRenderHome() {
  const container = document.getElementById('purchases-container');
  try {
    const res = await fetch('/api/home');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Errore nel caricamento');
    if (!data.purchases || data.purchases.length === 0) {
      container.innerHTML = '<p>Nessun acquisto recente. Sii il primo!</p>';
      return;
    }
    let html = '<ul style="list-style: none; padding: 0;">';
    for (const p of data.purchases) {
      const date = new Date(p.purchase_date).toLocaleDateString('it-IT', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      html += `<li style="border-bottom: 1px solid #eee; padding: 0.8rem 0; display: flex; align-items: center; gap: 1rem;">
      ${p.image_url ? `<img src="${p.image_url}" alt="${p.card_name}" style="width: 50px; height: 50px; object-fit: contain; background: #f9f9f9; border-radius: 4px;">` : `<div style="width: 50px; height: 50px; background: #eee; display: flex; align-items: center; justify-content: center; border-radius: 4px; font-size: 0.7rem;">No Img</div>`}
      <div style="flex: 1;">
      <strong>${p.card_name}</strong>
      <span style="color: #27ae60; font-weight: bold;">€${parseFloat(p.price).toFixed(2)}</span>
      <br>
      <small>Venduto da <strong>${p.seller_username}</strong> a <strong>${p.buyer_username}</strong> – ${date}</small>
      </div>
      </li>`;
      }
    html += '</ul>';
    container.innerHTML = html;
    } 
    catch (err) {container.innerHTML = `<p style="color: red;">Errore: ${err.message}</p>`;}
}

function renderLogin() {
  return `
  <div class="card">
    <h1>Login</h1>
    <form id="loginForm">
      <div class="form-group">
        <label for="loginUsername">Username</label>
        <input type="text" id="loginUsername" required>
      </div>
      <div class="form-group">
        <label for="loginPassword">Password</label>
        <input type="password" id="loginPassword" required>
      </div>
      <button type="submit">Accedi</button>
      <div class="error hidden" id="loginError"></div>
    </form>
    <p class="message">Non hai un account? <a href="#/register">Registrati</a></p>
  </div> `;}

function afterRenderLogin() {
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    try {
      const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login fallito');
      setToken(data.token);
      state.user = data.user;
      renderMenu();
      // Vai alla home dopo il login
      location.hash = '#/';
      router();
    } catch (err) {
      errorDiv.textContent = err.message;
      errorDiv.classList.remove('hidden');
    }
  });
}

function renderRegister() {
  return `
    <div class="card">
      <h1>Registrazione</h1>
      <form id="registerForm">
        <div class="form-group">
          <label for="regUsername">Username</label>
          <input type="text" id="regUsername" required>
        </div>
          <div class="form-group">
            <label for="regPassword">Password</label>
            <input type="password" id="regPassword" required>
          </div>
          <div class="form-group">
            <label for="regEmail">Email (opzionale)</label>
            <input type="email" id="regEmail">
          </div>
          <button type="submit">Registrati</button>
          <div class="error hidden" id="registerError"></div>
      </form>
      <p class="message">Hai già un account? <a href="#/login">Accedi</a></p>
    </div>
  `;
}

function afterRenderRegister() {
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const email = document.getElementById('regEmail').value;
    const errorDiv = document.getElementById('registerError');

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registrazione fallita');
      setToken(data.token);
      state.user = data.user;
      renderMenu();
      location.hash = '#/';
      router();
    } catch (err) {
      errorDiv.textContent = err.message;
      errorDiv.classList.remove('hidden');
      }
  });
}

// Pagine protette: Buy e Sell
function renderBuy() {
  if (!state.user) return `<div class="card"><h1>Acquista</h1><p>Effettua il <a href="#/login">login</a> per vedere le carte in vendita.</p></div>`;
  return `
    <div class="card">
      <h1>Acquista</h1>
      <p>Carte disponibili nel Bazaar:</p>
      <div id="cards-container" style="margin-top:1rem;">
      </div>
    </div>`;
}
        
async function afterRenderBuy() {
  if (!state.user) return;
  const container = document.getElementById('cards-container');
  try {
    const res = await apiFetch('/api/buy');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Errore nel caricamento delle carte');
    if (!data.cards || data.cards.length === 0) {
      container.innerHTML = '<p>Nessuna carta in vendita al momento.</p>';
      return;
    }

    let html = '<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap:1rem;">';
    for (const card of data.cards) {
    html += `
    <div style="border:1px solid #ccc; border-radius:8px; padding:1rem; background:#fff;">
      ${card.image_url ? `<img src="${card.image_url}" alt="${card.name}" style="width:100%; height:180px; object-fit:contain; background:#f9f9f9; border-radius:4px; margin-bottom:0.5rem;">` : `<div style="width:100%; height:180px; background:#eee; display:flex; align-items:center; justify-content:center; border-radius:4px; margin-bottom:0.5rem;">No Image</div>`}
      <h3 style="margin:0.3rem 0;">${card.name}</h3>
      <p style="font-size:0.9rem; color:#555;">${card.set_name || 'Set sconosciuto'} | ${card.condition || 'N/D'}</p>
      <p style="font-weight:bold; font-size:1.2rem; color:#27ae60;">€${parseFloat(card.price).toFixed(2)}</p>
      <p style="font-size:0.9rem;">Venditore: <strong>${card.seller_username}</strong></p>
      ${card.description ? `<p style="font-size:0.9rem; color:#333;">${card.description}</p>` : ''}
      <button class="buy-btn" data-card-id="${card.id}" style="width:100%; margin-top:0.5rem; background:#3498db;">Compra</button>
    </div>`;
    }
    html += '</div>';
    container.innerHTML = html;
document.querySelectorAll('.buy-btn').forEach(btn => {
  btn.addEventListener('click', async (e) => {
  const cardId = e.target.getAttribute('data-card-id');
  // Disabilita il bottone per evitare doppi click
  btn.disabled = true;
  btn.textContent = 'Acquisto in corso...';
  try {
    const res = await apiFetch('/api/buy', {
    method: 'POST',
    body: JSON.stringify({ card_id: cardId })
            });
    const result = await res.json();
        
    if (!res.ok) {
    if (res.status === 401) {
      clearToken();
      renderMenu();
      location.hash = '#/login';
      return;
      }
      throw new Error(result.error || 'Errore sconosciuto');
      }
    // Acquisto riuscito: aggiorna il saldo nel menu
    state.user.balance = result.new_balance;
      alert(result.message);
      // Ricarica la lista delle carte per rimuovere quella appena venduta
      router()
    } catch (err) {
      alert('Errore: ' + err.message);
      btn.disabled = false;
      btn.textContent = 'Compra';
    }
  });
});
    } catch (err) {
      container.innerHTML = `<p style="color:red;">Errore: ${err.message}</p>`;
    }
}

function renderSell() {
  if(!state.user) 
    return `<div class="card"><h1>Vendi</h1><p>Effettua il <a href="#/login">login</a> per accedere alla vendita.</p></div>`;
    
  return `
    <div class="card">
      <h1>Vendi</h1>
      
      <h2>Le tue carte in vendita</h2>
      <div id="user-cards-container">
        <p>Caricamento...</p>
      </div>
      <hr style="margin: 2rem 0;">
      <h2>Metti in vendita una nuova carta</h2>
      <form id="sell-form">
        <div class="form-group">
          <label for="cardName">Nome carta*</label>
          <input type="text" id="cardName" required>
        </div>
        <div class="form-group">
          <label for="cardSet">Set</label>
          <input type="text" id="cardSet">
        </div>
        <div class="form-group">
          <label for="cardCondition">Condizione</label>
          <input type="text" id="cardCondition" placeholder="es. Mint, Near Mint, Played...">
        </div>
        <div class="form-group">
          <label for="cardPrice">Prezzo (€)*</label>
          <input type="number" id="cardPrice" step="0.01" min="0" required>
        </div>
        <div class="form-group">
          <label for="cardDescription">Descrizione</label>
          <textarea id="cardDescription" rows="3" style="width:100%;"></textarea>
        </div>
        <div class="form-group">
          <label for="cardImageUrl">URL immagine (opzionale)</label>
          <input type="url" id="cardImageUrl" placeholder="https://...">
        </div>
        <button type="submit">Metti in vendita</button>
        <div class="error hidden" id="sell-error"></div>
      </form>
    </div>`;
}

async function afterRenderSell() {
  if (!state.user) return;

  // Carica le carte dell'utente
  const container = document.getElementById('user-cards-container');
  try {
    const res = await apiFetch('/api/sell');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Errore');

    if (!data.cards || data.cards.length === 0) 
      container.innerHTML = '<p>Attualmente non hai nessuna carta in vendita.</p>';
    else {
      let html = '<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap:1rem;">';
      for (const card of data.cards) {
        html += `<div class="card-item" style="border:1px solid #ccc; border-radius:8px; padding:1rem; background:#fff;">
        ${card.image_url ? `<img src="${card.image_url}" alt="${card.name}" style="width:100%; height:180px; object-fit:contain; background:#f9f9f9; border-radius:4px; margin-bottom:0.5rem;">` : `<div style="width:100%; height:180px; background:#eee; display:flex; align-items:center; justify-content:center; border-radius:4px; margin-bottom:0.5rem;">No Image</div>`}
        <h3>${card.name}</h3>
        <p>${card.set_name || 'Set sconosciuto'} | ${card.condition || 'N/D'}</p>
        <p>Prezzo attuale: <strong>€${parseFloat(card.price).toFixed(2)}</strong></p>
        <div class="update-price" style="display:flex; gap:0.5rem; margin-top:0.5rem;">
          <input type="number" class="new-price-input" value="${card.price}" step="0.01" min="0" style="flex:1; padding:0.3rem;">
          <button class="update-price-btn" data-card-id="${card.id}">Aggiorna</button>
        </div>
      </div>`;
      }
      html += '</div>';
      container.innerHTML = html;

      // Event listener per i pulsanti di aggiornamento prezzo
      document.querySelectorAll('.update-price-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const cardId = e.target.getAttribute('data-card-id');
          const input = e.target.parentElement.querySelector('.new-price-input');
          const newPrice = parseFloat(input.value);
          if (isNaN(newPrice) || newPrice < 0) {
            alert('Inserisci un prezzo valido.');
            return;
          }
          try {
            const res = await apiFetch('/api/sell', {
              method: 'POST',
              body: JSON.stringify({ action: 'update_price', card_id: cardId, new_price: newPrice })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error);
            alert('Prezzo aggiornato!');
            router(); // ricarica la vista
          } catch (e) {alert('Errore: ' + e.message)};
        });
      });
    }
  } catch (e) {
      container.innerHTML = `<p style="color:red;">Errore: ${e.message}</p>`;
  }

  // Gestione submit form nuova carta
  document.getElementById('sell-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorDiv = document.getElementById('sell-error');
    errorDiv.classList.add('hidden');
    const name = document.getElementById('cardName').value.trim();
    const price = document.getElementById('cardPrice').value;
    if (!name || !price) {
      errorDiv.textContent = 'Nome e prezzo sono obbligatori.';
      errorDiv.classList.remove('hidden');
      return;
    }

    const body = {
      name,
      price: parseFloat(price),
      set_name: document.getElementById('cardSet').value.trim(),
      condition: document.getElementById('cardCondition').value.trim(),
      description: document.getElementById('cardDescription').value.trim(),
      image_url: document.getElementById('cardImageUrl').value.trim() || null
    };

    try {
      const res = await apiFetch('/api/sell', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      alert(result.message);
      document.getElementById('sell-form').reset();
      router(); // ricarica la vista
    } catch (e) {
        errorDiv.textContent = e.message;
        errorDiv.classList.remove('hidden');
    }
  });
}
        
// ============== ROUTER ==============

const routes = {
  home: { render: renderHome, afterRender: afterRenderHome },
  buy:  { render: renderBuy,  afterRender: afterRenderBuy },
  sell: { render: renderSell, afterRender: afterRenderSell },
  login:{ render: renderLogin, afterRender: afterRenderLogin },
  register:{ render: renderRegister, afterRender: afterRenderRegister }
};

function getRouteFromHash() {
  const hash = location.hash.slice(1);
  if (hash === '/' || hash === '') return 'home';
  return hash.replace('/', '');
}

async function router() {
  const route = getRouteFromHash();
  const app = document.getElementById('app');
  const view = routes[route] || routes.home;

  if (!['home','login','register'].includes(route)) {
    if (!state.token) {
      // Nessun token: reindirizza a login
      location.hash = '#/login';
      return;
    } else {
      // Verifica la validità del token 
      const isAuth = await checkAuth();
      if (!isAuth) {
        location.hash = '#/login';
        return;
      }
    }
  }

  app.innerHTML = view.render();
  if (view.afterRender) {
      await view.afterRender();
  }
  renderMenu();
}

// All'avvio: prova a verificare il token esistente, poi avvia il router
addEventListener('load', async () => {
  if (state.token) {
    const valid = await checkAuth();
    if (!valid) {
      clearToken();
    }
  }
  renderMenu();
  router();
});

// Navigazione
addEventListener('hashchange', router);
