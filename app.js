const SUPABASE_URL = "https://evihbqsrcmxugeqpolwh.supabase.co";
const SUPABASE_KEY = "sb_publishable_xspmsb3snbFURMPshbb2Uw_H3vO0Ot-";

const INSTAGRAM = "https://www.instagram.com/onlybosshats/";

let supabaseClient = null;
let products = [];
let cart = JSON.parse(localStorage.getItem("obh_cart") || "[]");

// ==============================
// INICIAR SUPABASE
// ==============================
function initSupabase() {
  if (!window.supabase) {
    console.error("Supabase no está cargado.");
    return;
  }

  supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

  checkSession();
}

// ==============================
// SESIÓN DEL ADMIN
// ==============================
async function checkSession() {
  if (!supabaseClient) return;

  const { data } = await supabaseClient.auth.getSession();

  if (data.session) {
    if (data.session.user.email === "onlybosshats@gmail.com") {
      showAdminPanel();
    }
  }
}

async function loginAdmin() {
  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value;

  if (!email || !password) {
    alert("Escribe tu correo y contraseña.");
    return;
  }

  const { data, error } =
    await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

  if (error) {
    alert("Correo o contraseña incorrectos.");
    return;
  }

  if (data.user.email !== "onlybosshats@gmail.com") {
    await supabaseClient.auth.signOut();
    alert("Este usuario no tiene acceso al panel.");
    return;
  }

  showAdminPanel();
}

async function logoutAdmin() {
  await supabaseClient.auth.signOut();
  document.getElementById("adminPanel").remove();
}

// ==============================
// CREAR PANEL ADMIN
// ==============================
function createAdminButton() {
  const button = document.createElement("button");

  button.id = "adminButton";
  button.textContent = "OWNER";
  button.style.cssText = `
    position:fixed;
    bottom:20px;
    right:20px;
    z-index:9999;
    background:#e00000;
    color:white;
    border:0;
    padding:12px 18px;
    border-radius:8px;
    font-weight:800;
    cursor:pointer;
  `;

  button.onclick = openAdminLogin;

  document.body.appendChild(button);
}

function openAdminLogin() {
  if (document.getElementById("adminLogin")) return;

  const box = document.createElement("div");

  box.id = "adminLogin";

  box.innerHTML = `
    <div style="
      position:fixed;
      inset:0;
      background:rgba(0,0,0,.85);
      display:flex;
      justify-content:center;
      align-items:center;
      z-index:10000;
    ">
      <div style="
        background:#111;
        color:white;
        padding:30px;
        width:min(90%,400px);
        border-radius:15px;
        border:1px solid #333;
      ">
        <h2>ONLYBOSSHATS OWNER</h2>

        <input
          id="adminEmail"
          type="email"
          placeholder="Correo"
          style="width:100%;padding:12px;margin:8px 0"
        >

        <input
          id="adminPassword"
          type="password"
          placeholder="Contraseña"
          style="width:100%;padding:12px;margin:8px 0"
        >

        <button
          onclick="loginAdmin()"
          style="
            width:100%;
            padding:12px;
            background:#e00000;
            color:white;
            border:0;
            font-weight:800;
            cursor:pointer;
          "
        >
          ENTRAR
        </button>

        <button
          onclick="document.getElementById('adminLogin').remove()"
          style="
            width:100%;
            padding:10px;
            margin-top:8px;
            background:#222;
            color:white;
            border:0;
            cursor:pointer;
          "
        >
          CANCELAR
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(box);
}

// ==============================
// PANEL
// ==============================
function showAdminPanel() {
  document.getElementById("adminLogin")?.remove();
  document.getElementById("adminPanel")?.remove();

  const panel = document.createElement("div");

  panel.id = "adminPanel";

  panel.innerHTML = `
    <div style="
      position:fixed;
      inset:0;
      overflow:auto;
      background:#080808;
      color:white;
      z-index:10001;
      padding:30px;
    ">

      <div style="
        max-width:1000px;
        margin:auto;
      ">

        <div style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:15px;
        ">
          <div>
            <p style="color:#e00000;font-weight:800">
              ONLYBOSSHATS
            </p>

            <h1>PANEL OWNER</h1>

            <p>
              Sesión: onlybosshats@gmail.com
            </p>
          </div>

          <button
            onclick="logoutAdmin()"
            style="
              padding:12px 18px;
              background:#e00000;
              color:white;
              border:0;
              cursor:pointer;
            "
          >
            CERRAR SESIÓN
          </button>
        </div>

        <hr>

        <h2>Agregar gorra</h2>

        <input
          id="newName"
          placeholder="Nombre de la gorra"
          style="padding:12px;width:100%;margin:5px 0"
        >

        <input
          id="newBrand"
          placeholder="Marca"
          style="padding:12px;width:100%;margin:5px 0"
        >

        <input
          id="newPrice"
          type="number"
          placeholder="Precio"
          style="padding:12px;width:100%;margin:5px 0"
        >

        <input
          id="newStock"
          type="number"
          placeholder="Stock"
          style="padding:12px;width:100%;margin:5px 0"
        >

        <input
          id="newImage"
          placeholder="URL de imagen"
          style="padding:12px;width:100%;margin:5px 0"
        >

        <textarea
          id="newDescription"
          placeholder="Descripción"
          style="padding:12px;width:100%;margin:5px 0"
        ></textarea>

        <button
          onclick="addProduct()"
          style="
            padding:13px 20px;
            background:#e00000;
            color:white;
            border:0;
            font-weight:800;
            cursor:pointer;
          "
        >
          PUBLICAR GORRA
        </button>

        <hr>

        <h2>Gorras publicadas</h2>

        <div id="adminProducts"></div>

      </div>
    </div>
  `;

  document.body.appendChild(panel);

  loadProducts();
}

// ==============================
// PRODUCTOS
// ==============================
async function loadProducts() {
  if (!supabaseClient) return;

  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  products = data || [];

  renderProducts();
  renderAdminProducts();
}

function renderProducts() {
  const grid = document.querySelector(".grid");

  if (!grid) return;

  if (!products.length) return;

  grid.innerHTML = products.map((product, index) => `
    <article class="product">

      <div class="product-image">

        ${
          product.image
            ? `<img src="${escapeHTML(product.image)}"
                    alt="${escapeHTML(product.name)}"
                    loading="lazy">`
            : `<div style="height:100%;display:grid;place-items:center">
                 ONLYBOSSHATS
               </div>`
        }

        <span>${String(index + 1).padStart(2, "0")}</span>

      </div>

      <div class="product-info">

        <div>
          <p class="brand">
            ${escapeHTML(product.brand || "ONLYBOSSHATS")}
          </p>

          <h3>
            ${escapeHTML(product.name)}
          </h3>

          <p class="description">
            ${escapeHTML(product.description || "")}
          </p>

          <strong>
            $${Number(product.price).toLocaleString("es-MX")} MXN
          </strong>

          <p>
            ${
              Number(product.stock) > 0
                ? `Stock: ${product.stock}`
                : "AGOTADA"
            }
          </p>
        </div>

        ${
          Number(product.stock) > 0
            ? `
              <button
                class="buy"
                onclick="addToCart('${product.id}')"
              >
                AGREGAR AL CARRITO
              </button>
            `
            : `
              <button class="buy" disabled>
                AGOTADA
              </button>
            `
        }

      </div>

    </article>
  `).join("");
}

// ==============================
// AGREGAR PRODUCTO
// ==============================
async function addProduct() {
  const name = document.getElementById("newName").value.trim();
  const brand = document.getElementById("newBrand").value.trim();
  const price = Number(document.getElementById("newPrice").value);
  const stock = Number(document.getElementById("newStock").value);
  const image = document.getElementById("newImage").value.trim();
  const description =
    document.getElementById("newDescription").value.trim();

  if (!name || !price) {
    alert("Pon mínimo nombre y precio.");
    return;
  }

  const { error } = await supabaseClient
    .from("products")
    .insert({
      name,
      brand,
      price,
      stock,
      image,
      description
    });

  if (error) {
    alert("No se pudo publicar: " + error.message);
    return;
  }

  alert("Gorra publicada.");

  document.getElementById("newName").value = "";
  document.getElementById("newBrand").value = "";
  document.getElementById("newPrice").value = "";
  document.getElementById("newStock").value = "";
  document.getElementById("newImage").value = "";
  document.getElementById("newDescription").value = "";

  loadProducts();
}

// ==============================
// ADMIN: LISTA
// ==============================
function renderAdminProducts() {
  const container = document.getElementById("adminProducts");

  if (!container) return;

  container.innerHTML = products.map(product => `
    <div style="
      border:1px solid #333;
      padding:15px;
      margin:10px 0;
      border-radius:10px;
    ">

      <strong>
        ${escapeHTML(product.name)}
      </strong>

      <p>
        $${Number(product.price).toLocaleString("es-MX")}
        · Stock: ${product.stock}
      </p>

      <button
        onclick="deleteProduct('${product.id}')"
        style="
          background:#e00000;
          color:white;
          border:0;
          padding:8px 12px;
          cursor:pointer;
        "
      >
        ELIMINAR
      </button>

    </div>
  `).join("");
}

async function deleteProduct(id) {
  if (!confirm("¿Seguro que quieres eliminar esta gorra?")) return;

  const { error } = await supabaseClient
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    alert("No se pudo eliminar.");
    return;
  }

  loadProducts();
}

// ==============================
// CARRITO
// ==============================
function addToCart(id) {
  const product = products.find(p => p.id === id);

  if (!product || product.stock <= 0) return;

  const existing = cart.find(item => item.id === id);

  if (existing) {
    existing.quantity++;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: 1
    });
  }

  localStorage.setItem("obh_cart", JSON.stringify(cart));

  alert("Agregada al carrito.");
}

// ==============================
// SEGURIDAD
// ==============================
function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ==============================
// ARRANQUE
// ==============================
document.addEventListener("DOMContentLoaded", () => {

  createAdminButton();

  const script = document.createElement("script");

  script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

  script.onload = initSupabase;

  document.head.appendChild(script);

});
