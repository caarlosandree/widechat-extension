// 🔐 Funções de criptografia
// Função para derivar a chave a partir da senha usando PBKDF2 e salt
async function getKeyFromPassword(password, salt = "widechat") {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]);
  return await crypto.subtle.deriveKey({ name: "PBKDF2", salt: enc.encode(salt), iterations: 100000, hash: "SHA-256" }, keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

// Função para criptografar um texto com a senha
async function encrypt(text, password) {
  const key = await getKeyFromPassword(password);
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = enc.encode(text);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const encryptedBytes = new Uint8Array(ciphertext);
  const combined = new Uint8Array(iv.byteLength + encryptedBytes.byteLength);
  combined.set(iv);
  combined.set(encryptedBytes, iv.byteLength);
  return btoa(String.fromCharCode(...combined));
}

// Função para descriptografar um texto criptografado
async function decrypt(cipherBase64, password) {
  try {
    const data = Uint8Array.from(atob(cipherBase64), c => c.charCodeAt(0));
    const iv = data.slice(0, 12);
    const ciphertext = data.slice(12);
    const key = await getKeyFromPassword(password);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.error("Erro ao descriptografar senha:", err);
    return null;
  }
}

// Função para validar o token
async function validateToken(token, domain) {
  try {
    const apiUrl = `https://${domain}/api/v4/auth/me`;
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` }
    });
    return response.status === 200;
  } catch (err) {
    console.error("Erro ao tentar validar o token:", err);
    return false;
  }
}

// Função para renovar o token
async function renewToken(email, password, domain) {
  try {
    const apiUrl = `https://${domain}/api/v4/auth/login`;
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password: password })
    });
    const data = await response.json();
    if (data.token) {
      await chrome.storage.local.set({ token: data.token, isLoggedIn: true });
      console.log("Token renovado com sucesso.");
      return data.token;
    } else {
      console.error("Erro ao renovar o token.");
      return null;
    }
  } catch (err) {
    console.error("Erro ao renovar o token:", err);
    return null;
  }
}

async function attemptAutoLoginAndTokenRenewal(domain) {
  const { savedEmail, savedPassword, token } = await chrome.storage.local.get(['savedEmail', 'savedPassword', 'token']);
  const decryptedPassword = savedEmail && savedPassword ? await decrypt(savedPassword, savedEmail) : null;

  if (token && savedEmail && domain && !(await validateToken(token, domain))) {
    if (savedEmail && decryptedPassword) {
      const newToken = await renewToken(savedEmail, decryptedPassword, domain);
      if (newToken) {
        await chrome.storage.local.set({ token: newToken });
        document.getElementById("userEmail").textContent = `${savedEmail}`;
        document.getElementById("loginForm").style.display = "none";
        document.getElementById("logoutSection").style.display = "block";
        return true; // Indica sucesso na renovação
      } else {
        alert("Não foi possível renovar o token.");
      }
    }
    return false; // Falha na renovação ou sem credenciais para renovar
  }

  const { isLoggedIn } = await chrome.storage.local.get(['isLoggedIn']);
  if (!isLoggedIn && savedEmail && decryptedPassword && domain) {
    try {
      const apiUrl = `https://${domain}/api/v4/auth/login`;
      const autoResponse = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: savedEmail, password: decryptedPassword })
      });
      const autoData = await autoResponse.json();
      if (autoData.token) {
        await chrome.storage.local.set({ token: autoData.token, isLoggedIn: true, savedEmail: savedEmail, savedDomain: domain }); // Salva o domínio
        document.getElementById("userEmail").textContent = `${savedEmail}`;
        document.getElementById("loginForm").style.display = "none";
        document.getElementById("logoutSection").style.display = "block";
        return true; // Indica sucesso no login automático
      }
    } catch (err) {
      console.error("Erro no login automático:", err);
    }
  }
  return false; // Falha no login automático
}

// 🧠 Lógica principal
document.addEventListener("DOMContentLoaded", async () => {
  const loginForm = document.getElementById("loginForm");
  const logoutSection = document.getElementById("logoutSection");
  const domainInputSection = document.getElementById("domainInputSection");
  const domainInput = document.getElementById("domain");
  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");

  const { isLoggedIn, savedEmail: initialSavedEmail, savedDomain } = await chrome.storage.local.get(['isLoggedIn', 'savedEmail', 'savedDomain']);

  // Define o estado inicial da interface
  if (isLoggedIn && initialSavedEmail && savedDomain) {
    document.getElementById("userEmail").textContent = `${initialSavedEmail}`;
    loginForm.style.display = "none";
    domainInputSection.style.display = "none";
    logoutSection.style.display = "block";
  } else {
    loginForm.style.display = "block";
    domainInputSection.style.display = "block";
    logoutSection.style.display = "none";
    if (savedDomain) {
      domainInput.value = savedDomain;
    }
    await attemptAutoLoginAndTokenRenewal(savedDomain);
  }

  // Login - Clique no botão
  document.getElementById("loginBtn").addEventListener("click", async () => {
    await login();
  });

  // Login - Pressionar ENTER
  document.getElementById("password").addEventListener("keypress", async (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      await login();
    }
  });

  //Mostrar a Senha ao Clicar no Ícone (👁️)
  document.getElementById('togglePassword').addEventListener('click', function() {
    const passwordField = document.getElementById('password');
    const type = passwordField.type === 'password' ? 'text' : 'password';
    passwordField.type = type;
    this.textContent = type === 'password' ? '👁️' : '🙈';
  });

  // Logout
  document.getElementById("logoutBtn").addEventListener("click", async () => {
    const { token, savedDomain } = await chrome.storage.local.get(['token', 'savedDomain']);

    if (!token || !savedDomain) {
      alert("Nenhum token ou domínio salvo. Impossível deslogar completamente.");
      return;
    }

    const loadingLogout = document.getElementById("loadingLogout");
    const statusMessageLogout = document.getElementById("statusMessageLogout");
    const loginForm = document.getElementById("loginForm");
    const domainInputSection = document.getElementById("domainInputSection");
    const logoutSection = document.getElementById("logoutSection");

    statusMessageLogout.classList.add('hidden');
    loadingLogout.classList.remove('hidden');

    try {
      const apiUrl = `https://${savedDomain}/api/v4/auth/logout?type=all`;
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        await chrome.storage.local.set({ isLoggedIn: false, token: null, savedEmail: null, savedPassword: null, savedDomain: null }); // Limpa o domínio também
        loginForm.style.display = "block";
        domainInputSection.style.display = "block";
        logoutSection.style.display = "none";
        alert("Logout realizado com sucesso.");
      } else {
        alert("Erro ao deslogar.");
      }
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      alert("Erro ao conectar com o servidor.");
    } finally {
      loadingLogout.classList.add('hidden');
    }
  });

  // Limpar credenciais
  document.getElementById("clearBtn").addEventListener("click", async () => {
    await chrome.storage.local.remove(['token', 'isLoggedIn', 'savedEmail', 'savedPassword', 'savedDomain']); // Limpa o domínio também
    loginForm.style.display = "block";
    domainInputSection.style.display = "block";
    logoutSection.style.display = "none";
    alert("Credenciais removidas.");
  });

  // ✨ Animação de entrada para os cards ✨
  document.querySelectorAll(".card").forEach((card, i) => {
    setTimeout(() => {
      card.classList.add("visible");
    }, 100 * i);
  });
});

// Função de login extraída para ser reutilizada
async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const domain = document.getElementById("domain").value.trim(); // Captura o domínio
  const loading = document.getElementById('loadingLogin');
  const statusMessage = document.getElementById('statusMessage');
  const loginForm = document.getElementById('loginForm');
  const domainInputSection = document.getElementById("domainInputSection");
  const logoutSection = document.getElementById('logoutSection');

  statusMessage.classList.add('hidden');
  loading.classList.remove('hidden');

  if (!email || !password || !domain) {
    alert("Preencha todos os campos, incluindo o domínio.");
    loading.classList.add('hidden');
    return;
  }

  try {
    const apiUrl = `https://${domain}/api/v4/auth/login`;
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password: password })
    });
    const data = await response.json();

    if (data.token) {
      const encryptedPassword = await encrypt(password, email);
      await chrome.storage.local.set({ token: data.token, isLoggedIn: true, savedEmail: email, savedPassword: encryptedPassword, savedDomain: domain }); // Salva o domínio
      loginForm.classList.add('hidden');
      domainInputSection.classList.add('hidden');
      logoutSection.classList.remove('hidden');
      document.getElementById("userEmail").textContent = `${email}`;
      alert("Login realizado com sucesso.");
      location.reload(); // Reativado para forçar a atualização da interface
    } else {
      statusMessage.classList.remove('hidden');
      statusMessage.textContent = "Erro no login. Verifique suas credenciais e o domínio.";
      alert("Erro no login. Verifique suas credenciais e o domínio.");
    }
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    statusMessage.classList.remove('hidden');
    statusMessage.textContent = "Erro ao conectar com o servidor. Verifique o domínio.";
    alert("Erro ao conectar com o servidor. Verifique o domínio.");
  } finally {
    loading.classList.add('hidden');
  }
}

// Função simulada de autenticação (para referência, não usada no fluxo principal)
async function authenticateUser(email, password) {
  const isAuthenticated = email === 'user@example.com' && password === 'password123';
  if (isAuthenticated) {
    document.getElementById('userEmail').textContent = email;
  }
  return isAuthenticated;
}