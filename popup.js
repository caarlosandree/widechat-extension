// 🔐 Funções de criptografia
// Função para derivar a chave a partir da senha usando PBKDF2 e salt
async function getKeyFromPassword(password, salt = "widechat") {
  const enc = new TextEncoder(); // Cria um codificador para converter texto em Array de bytes
  const keyMaterial = await crypto.subtle.importKey(
    "raw", // Tipo de chave (raw: chave simples)
    enc.encode(password), // Converte a senha em bytes
    { name: "PBKDF2" }, // Algoritmo de derivação da chave
    false, // A chave não será exportável
    ["deriveKey"] // Usamos a chave para derivação
  );

  // Deriva a chave com o algoritmo PBKDF2 usando salt e hash SHA-256
  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(salt), // Salt usado para a derivação
      iterations: 100000, // Número de iterações (quanto mais, mais seguro)
      hash: "SHA-256" // Hash usado para a derivação
    },
    keyMaterial, // A chave materializada a partir da senha
    { name: "AES-GCM", length: 256 }, // A chave derivada será usada para AES-GCM com 256 bits
    false, // A chave não será exportável
    ["encrypt", "decrypt"] // Definindo que a chave será usada para encriptação e decriptação
  );
}

// Função para criptografar um texto com a senha
async function encrypt(text, password) {
  const key = await getKeyFromPassword(password); // Obtém a chave derivada da senha
  const enc = new TextEncoder(); // Codificador para texto em bytes
  const iv = crypto.getRandomValues(new Uint8Array(12)); // Gera um vetor de inicialização (IV) aleatório de 12 bytes
  const encoded = enc.encode(text); // Converte o texto em bytes

  // Criptografa o texto com a chave derivada e o IV
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv }, // Usa AES-GCM com o IV
    key, // Chave de criptografia
    encoded // Dados a serem criptografados
  );

  const encryptedBytes = new Uint8Array(ciphertext); // Converte o texto criptografado em Array de bytes
  const combined = new Uint8Array(iv.byteLength + encryptedBytes.byteLength); // Combina o IV e o texto criptografado
  combined.set(iv); // Adiciona o IV no começo
  combined.set(encryptedBytes, iv.byteLength); // Adiciona o texto criptografado após o IV
  return btoa(String.fromCharCode(...combined)); // Codifica o Array combinado em Base64
}

// Função para descriptografar um texto criptografado
async function decrypt(cipherBase64, password) {
  try {
    // Decodifica o texto Base64 para Uint8Array
    const data = Uint8Array.from(atob(cipherBase64), c => c.charCodeAt(0));
    const iv = data.slice(0, 12); // Extrai o IV dos primeiros 12 bytes
    const ciphertext = data.slice(12); // O restante é o texto criptografado
    const key = await getKeyFromPassword(password); // Obtém a chave derivada da senha

    // Descriptografa os dados com a chave e IV
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );
    return new TextDecoder().decode(decrypted); // Converte os dados descriptografados de volta para texto
  } catch (err) {
    console.error("Erro ao descriptografar senha:", err); // Em caso de erro
    return null; // Retorna null em caso de erro
  }
}

// 🧠 Lógica principal
document.addEventListener("DOMContentLoaded", async () => {
  const loginForm = document.getElementById("loginForm"); // Formulário de login
  const logoutSection = document.getElementById("logoutSection"); // Seção de logout

  // Obtém os dados salvos no armazenamento local (email, senha criptografada e estado de login)
  const {
    savedEmail,
    savedPassword,
    isLoggedIn
  } = await chrome.storage.local.get([
    'savedEmail',
    'savedPassword',
    'isLoggedIn'
  ]);

  // 🔐 Tenta descriptografar a senha, se possível
  const decryptedPassword = savedEmail && savedPassword
    ? await decrypt(savedPassword, savedEmail) // Se email e senha existirem, tenta descriptografar
    : null;

  // Login para buscar o TOKEN
  if (!isLoggedIn && savedEmail && decryptedPassword) {
    try {
      const autoResponse = await fetch("https://wideintelbras.widechat.com.br/api/v4/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: savedEmail,
          password: decryptedPassword
        })
      });
      const autoData = await autoResponse.json();

      if (autoData.token) { // Se o login for bem-sucedido, armazena o token
        await chrome.storage.local.set({
          token: autoData.token,
          isLoggedIn: true
        });

        document.getElementById("userEmail").textContent = `Logado como: ${savedEmail}`;
        loginForm.style.display = "none"; // Oculta o formulário de login
        logoutSection.style.display = "block"; // Exibe a seção de logout
        return;
      }
    } catch (err) {
      console.error("Erro no login automático:", err); // Erro no login automático
    }
  }

  // Atualiza interface de acordo com o estado de login
  if (isLoggedIn) {
    loginForm.style.display = "none";
    logoutSection.style.display = "block";
  } else {
    loginForm.style.display = "block";
    logoutSection.style.display = "none";
  }

  // Login
  document.getElementById("loginBtn").addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
  
    const loading = document.getElementById('loadingLogin');
    const statusMessage = document.getElementById('statusMessage');
    const loginForm = document.getElementById('loginForm');
    const logoutSection = document.getElementById('logoutSection');
  
    // Esconde mensagens anteriores e mostra loading
    statusMessage.classList.add('hidden');
    loading.classList.remove('hidden');
  
    if (!email || !password) {
      alert("Preencha todos os campos.");
      loading.classList.add('hidden');
      return;
    }
  
    try {
      const response = await fetch("https://wideintelbras.widechat.com.br/api/v4/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });
      const data = await response.json();
  
      if (data.token) {
        const encryptedPassword = await encrypt(password, email);
  
        await chrome.storage.local.set({
          token: data.token,
          isLoggedIn: true,
          savedEmail: email,
          savedPassword: encryptedPassword
        });

        document.getElementById("userEmail").textContent = `Logado como: ${email}`;
        loginForm.classList.add('hidden');
        logoutSection.classList.remove('hidden');
        alert("Login realizado com sucesso.");
      } else {
        statusMessage.classList.remove('hidden');
        statusMessage.textContent = "Erro no login. Verifique suas credenciais.";
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      statusMessage.classList.remove('hidden');
      statusMessage.textContent = "Erro ao conectar com o servidor.";
    }
  
    // Esconde o loading após o processo
    loading.classList.add('hidden');
    location.reload()

  });
  

// Função simulada de autenticação
async function authenticateUser(email, password) {
  // Exemplo fictício: substitua com a autenticação real
  const isAuthenticated = email === 'user@example.com' && password === 'password123';
  
  if (isAuthenticated) {
    // Atualizar o e-mail do usuário após a autenticação
    document.getElementById('userEmail').textContent = email;
  }
  
  return isAuthenticated;
}

  //Mostrar a Senha ao Clicar no Ícone (👁️)
  document.getElementById('togglePassword').addEventListener('click', function() {
    const passwordField = document.getElementById('password');
    // Alterna o tipo entre 'password' e 'text' para exibir/ocultar a senha
    const type = passwordField.type === 'password' ? 'text' : 'password';
    passwordField.type = type;
    // Alterna o ícone entre o olho fechado e o olho aberto
    this.textContent = type === 'password' ? '👁️' : '🙈';
  });

  // Logout
  document.getElementById("logoutBtn").addEventListener("click", async () => {
    const { token } = await chrome.storage.local.get(['token']); // Obtém o token salvo

    if (!token) {
      alert("Nenhum token salvo para logout.");
      return;
    }

    try {
      const response = await fetch("https://wideintelbras.widechat.com.br/api/v4/auth/logout?type=all", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}` // Passa o token no cabeçalho
        }
      });

      if (response.ok) {
        await chrome.storage.local.set({ isLoggedIn: false }); // Marca o logout
        loginForm.style.display = "block";
        logoutSection.style.display = "none";
        alert("Logout realizado com sucesso.");
      } else {
        alert("Erro ao deslogar.");
      }
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      alert("Erro ao conectar com o servidor.");
    }
  });

  // Limpar credenciais
  document.getElementById("clearBtn").addEventListener("click", async () => {
    await chrome.storage.local.remove(['token', 'isLoggedIn', 'savedEmail', 'savedPassword']); // Limpa as credenciais salvas
    loginForm.style.display = "block";
    logoutSection.style.display = "none";
    alert("Credenciais removidas.");
  });
});