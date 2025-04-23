// 🔑 Função para obter o token de autenticação armazenado
async function getToken() {
  const { token } = await chrome.storage.local.get(["token"]);
  if (!token) {
    console.warn("Token não encontrado.");
    return null;
  }
  return token;
}

// 🚪 Função para deslogar do WideChat usando o token de autenticação
async function logoutWideChat(token) {
  if (token) {
    try {
      const response = await fetch("https://wideintelbras.widechat.com.br/api/v4/auth/logout?type=all", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        console.log("WideChat deslogado.");
      } else {
        console.error("Erro ao deslogar WideChat:", response.status);
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon.png",
          title: "Erro ao deslogar",
          message: "Houve um problema ao deslogar do WideChat.",
        });
      }
    } catch (error) {
      console.error("Erro ao deslogar WideChat:", error);
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon.png",
        title: "Erro ao deslogar",
        message: "Falha ao tentar se desconectar do WideChat.",
      });
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