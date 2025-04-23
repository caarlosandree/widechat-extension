# WideChat Agent Monitor

## Visão Geral

O WideChat Agent Monitor é uma extensão para navegadores Chrome que visa garantir a segurança e a eficiência das sessões de agentes na plataforma WideChat. Ele monitora as abas do navegador e realiza o logout automático do agente caso a aba do WideChat seja fechada ou o navegador seja encerrado. Além disso, a versão 2.0 introduz a funcionalidade de configurar dinamicamente o domínio da instância WideChat, tornando a extensão compatível com diferentes empresas que utilizam a plataforma.

## Funcionalidades Principais

* **Logout Automático:** Desloga automaticamente o agente do WideChat quando a aba do agente é fechada.
* **Logout ao Fechar o Navegador:** Garante que a sessão do agente seja encerrada ao fechar a janela do navegador.
* **Configuração de Domínio Dinâmica:** Permite que o usuário insira o domínio específico da sua instância WideChat (ex: `suamarca.widechat.com.br`), tornando a extensão compatível com diferentes subdomínios.
* **Persistência do Domínio:** O domínio configurado é armazenado localmente para uso futuro.
* **Notificações de Erro:** Exibe notificações caso ocorra algum problema ao tentar realizar o logout.
* **Logout Manual:** Oferece um botão no popup para realizar o logout da sessão manualmente.
* **Limpeza de Credenciais:** Permite remover as credenciais (token, e-mail, senha e domínio) armazenadas localmente.
* **Interface Intuitiva:** Uma interface de popup simples para login e gerenciamento das configurações.
* **Temas Claro e Escuro:** Suporte para alternar entre temas claro e escuro para melhor experiência visual.

## Como Usar

1.  **Instalação:**
    * Baixe os arquivos da extensão (`popup.html`, `popup.js`, `background.js`, `content.js`, `styles.css`, `theme.css`, `theme.js`, `icon.png`, e o `manifest.json`).
    * Abra o Chrome e navegue até `chrome://extensions/`.
    * Ative o "Modo de desenvolvedor" no canto superior direito.
    * Clique em "Carregar sem compactação" no canto superior esquerdo e selecione a pasta com os arquivos da extensão.

2.  **Configuração do Domínio (Primeiro Uso ou Troca de Instância):**
    * Clique no ícone da extensão na barra de ferramentas do Chrome.
    * Na seção inicial, insira o domínio da sua instância WideChat no campo "Domínio WideChat" (ex: `suamarca.widechat.com.br`).

3.  **Login:**
    * Insira seu e-mail e senha nos campos correspondentes.
    * Clique no botão "Login".
    * Após o login bem-sucedido, a interface mudará para a seção de logout, exibindo o e-mail do usuário logado.

4.  **Logout Manual:**
    * Na seção de logout, clique no botão "Logout Manual" para encerrar sua sessão no WideChat.

5.  **Limpar Credenciais:**
    * Na seção de logout, clique no botão "Limpar Credenciais" para remover todas as informações de login e o domínio armazenados pela extensão. Isso fará com que a tela de login seja exibida novamente.

## Funcionamento Interno

* **`popup.html`:** Define a estrutura da interface do popup, incluindo o formulário de login, a seção de logout e o campo para inserir o domínio.
* **`popup.js`:** Contém a lógica para interagir com a interface do popup, realizar o login, o logout manual, limpar as credenciais e armazenar/recuperar o domínio. Ele também gerencia a exibição das seções de login e logout.
* **`background.js`:** Monitora eventos do navegador, como fechamento de abas e janelas, e realiza o logout automático do WideChat utilizando o token de autenticação armazenado e o domínio configurado. Também lida com a mensagem enviada pelo `content.js` ao fechar a página.
* **`content.js`:** Injeta um script na página do agente WideChat para detectar o evento `beforeunload` (antes de fechar a página) e envia uma mensagem para o `background.js` para iniciar o processo de logout.
* **`styles.css`:** Define a estilização geral do popup.
* **`theme.css` e `theme.js`:** Implementam a funcionalidade de alternância entre temas claro e escuro.
* **`icon.png`:** O ícone da extensão.
* **`manifest.json`:** Contém as informações e permissões da extensão.

## Permissões Solicitadas

* `storage`: Permite que a extensão armazene dados localmente (token de autenticação, e-mail, senha criptografada e domínio).
* `tabs`: Permite que a extensão monitore e interaja com as abas do navegador para detectar o fechamento da aba do agente WideChat.
* `background`: Permite que um script seja executado em segundo plano para monitorar os eventos do navegador mesmo quando o popup não está aberto.
* `notifications`: Permite que a extensão exiba notificações ao usuário, por exemplo, em caso de falha no logout.
* `host_permissions`: Permite que a extensão faça requisições HTTP para qualquer subdomínio de `widechat.com.br` para realizar o login e o logout.
