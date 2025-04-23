// 🔑 Função para obter o token de autenticação e o domínio armazenados
async function getAuthInfo() {
  return await chrome.storage.local.get(["token", "savedDomain"]);
}

// 🚪 Função para deslogar do WideChat usando o token de autenticação e o domínio
async function logoutWideChat(token, domain) {
  if (token && domain) {
    try {
      const logoutUrl = `https://${domain}/api/v4/auth/logout?type=all`;
      const response = await fetch(logoutUrl, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        console.log("WideChat deslogado de:", domain);
      } else {
        console.error("Erro ao deslogar WideChat de:", domain, response.status);
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon.png",
          title: "Erro ao deslogar",
          message: `Houve um problema ao deslogar do WideChat em ${domain}.`,
        });
      }
    } catch (error) {
      console.error("Erro ao deslogar WideChat de:", domain, error);
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon.png",
        title: "Erro ao deslogar",
        message: `Falha ao tentar se desconectar do WideChat em ${domain}.`,
      });
    }
  } else {
    console.warn("Token ou domínio não encontrado para deslogar.");
  }
}

// 🔍 Função para verificar se a URL de uma aba corresponde à de um agente do WideChat
function isAgentTab(url) {
  // Verifica se a URL corresponde ao padrão de agente do WideChat
  return url && /^https:\/\/.*\.widechat\.com\.br\/user\/agent/.test(url);
}

// ⚠️ Função para verificar se a aba do agente ainda está aberta e fazer o logout se não estiver
async function checkAgentTabAndLogoutIfClosed() {
  const { token, savedDomain } = await getAuthInfo();
  if (savedDomain) {
    // Obtém todas as abas abertas
    const tabs = await chrome.tabs.query({});

    // Verifica se existe uma aba com a URL de agente ainda aberta
    const agentTabStillOpen = tabs.some(tab => isAgentTab(tab.url));

    // Se nenhuma aba de agente estiver aberta
    if (!agentTabStillOpen) {
      await logoutWideChat(token, savedDomain); // Faz o logout do WideChat usando o token e o domínio
    }
  } else {
    console.warn("Domínio não configurado. Impossível realizar logout automático.");
  }
}

// 🚪 Função para deslogar ao fechar o navegador (recebe mensagem do content.js)
chrome.runtime.onMessage.addListener(
  async function(request, sender, sendResponse) {
    if (request.action === "check_and_logout") {
      console.log("Evento beforeunload detectado. Tentando logout...");
      const { token, savedDomain } = await getAuthInfo();
      if (token && savedDomain) {
        await logoutWideChat(token, savedDomain);
      } else {
        console.log("Nenhum token ou domínio salvo para logout ao fechar.");
      }
    }
  }
);

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