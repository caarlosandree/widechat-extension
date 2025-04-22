window.onbeforeunload = function (event) {
    // Envia uma mensagem para o background.js para tentar fazer o logout
    chrome.runtime.sendMessage({ action: "check_and_logout" });
};

// Aqui ele joga o evento antes de fechar o navegador.
