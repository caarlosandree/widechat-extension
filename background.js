// 🔑 Função para obter o token de autenticação armazenado
async function getToken() {
  // Obtém o token armazenado localmente pelo Chrome (se houver)
  const { token } = await chrome.storage.local.get(["token"]);
  return token; // Retorna o token encontrado
}

// 🚪 Função para deslogar do WideChat usando o token de autenticação
async function logoutWideChat(token) {
  if (token) { // Verifica se existe um token válido
    try {
      // Faz a requisição de logout para a API do WideChat
      const response = await fetch("https://wideintelbras.widechat.com.br/api/v4/auth/logout?type=all", {
        method: "GET", // Método GET para o logout
        headers: { Authorization: `Bearer ${token}` } // Envia o token no cabeçalho
      });

      if (response.ok) { // Se a resposta for bem-sucedida
        console.log("WideChat deslogado."); // Loga o sucesso
      } else {
        console.error("Erro ao deslogar WideChat:", response.status); // Caso contrário, loga o erro
      }
    } catch (error) {
      console.error("Erro ao deslogar WideChat:", error); // Se houver erro na requisição
    }
  }
}

// 🔍 Função para verificar se a URL de uma aba corresponde à de um agente do WideChat
function isAgentTab(url) {
  // Verifica se a URL corresponde ao padrão de agente do WideChat
  return url && /^https:\/\/.*\.widechat\.com\.br\/user\/agent/.test(url);
}

// ⚠️ Função para verificar se a aba do agente ainda está aberta e fazer o logout se não estiver
async function checkAgentTabAndLogoutIfClosed() {
  // Obtém todas as abas abertas
  const tabs = await chrome.tabs.query({});
  
  // Verifica se existe uma aba com a URL de agente ainda aberta
  const agentTabStillOpen = tabs.some(tab => isAgentTab(tab.url));
  
  // Se nenhuma aba de agente estiver aberta
  if (!agentTabStillOpen) {
    const token = await getToken(); // Obtém o token armazenado
    await logoutWideChat(token); // Faz o logout do WideChat usando o token
  }
}

// 📉 Quando uma aba é removida, chama a função para verificar se a aba do agente foi fechada
chrome.tabs.onRemoved.addListener(checkAgentTabAndLogoutIfClosed);

// 🔄 Quando uma aba é atualizada (incluindo mudanças de URL ou navegação para fora do agente)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Se a aba for totalmente carregada ou a URL mudar
  if (changeInfo.status === "complete" || changeInfo.url) {
    checkAgentTabAndLogoutIfClosed(); // Verifica se a aba do agente foi fechada
  }
});

// 🪟 Quando uma janela inteira for removida (fechada), verifica se as abas de agente foram fechadas
chrome.windows.onRemoved.addListener(() => {
  checkAgentTabAndLogoutIfClosed(); // Verifica as abas abertas e faz o logout se necessário
});

// 🔄 Quando o navegador for reiniciado, executa a verificação e faz logout se necessário
chrome.runtime.onStartup.addListener(() => {
  // Opcional: você pode forçar o logout aqui também, caso o navegador tenha sido reiniciado
  checkAgentTabAndLogoutIfClosed(); // Verifica e faz logout caso não haja abas de agente abertas
});