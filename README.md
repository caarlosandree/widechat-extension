# WideChat Agent Monitor
A extensão WideChat Agent Monitor foi desenvolvida para monitorar as abas do WideChat e realizar logout automático do agente quando a aba ou o navegador for fechado, garantindo a segurança e a eficiência do gerenciamento de sessões.

Funcionalidades
Logout Automático: Quando a aba do WideChat ou o navegador é fechado, a extensão realiza automaticamente o logout do agente.

Login Automático: A extensão tenta realizar o login automaticamente ao ser carregada, usando credenciais salvas de forma segura.

Gerenciamento de Sessões: A extensão oferece a opção de login e logout manual através de uma interface de popup.

Armazenamento Seguro: As credenciais do usuário são armazenadas de forma criptografada localmente no navegador utilizando a API crypto do JavaScript.

Instalação
Como instalar a extensão localmente (Modo Desenvolvedor)
Abra o Chrome e vá para a URL chrome://extensions/.

Ative o Modo de Desenvolvedor (localizado no canto superior direito).

Clique em "Carregar sem compactação" e selecione a pasta da extensão no seu sistema local.

A extensão será carregada e estará pronta para uso no navegador.

Publicação na Chrome Web Store
Empacote os arquivos da extensão em um arquivo ZIP.

Crie uma conta de desenvolvedor na Chrome Web Store Developer Dashboard.

Faça o upload do arquivo ZIP da sua extensão.

Preencha as informações sobre a extensão (nome, descrição, ícone, etc.).

Clique em Publicar para disponibilizar a extensão para os usuários.

Como Usar
Login Manual:

Abra a interface da extensão clicando no ícone da extensão na barra de ferramentas do navegador.

Insira seu E-mail e Senha para fazer login.

A extensão irá criptografar suas credenciais e armazená-las localmente de forma segura.

Logout Manual:

Se você estiver logado, a interface permitirá fazer logout manualmente da sua conta no WideChat.

Logout Automático:

A extensão monitora as abas abertas. Se a aba do WideChat for fechada ou o navegador for fechado, o logout será realizado automaticamente.

Estrutura de Arquivos
manifest.json: Arquivo de configuração da extensão.

background.js: Lógica principal que gerencia a execução em segundo plano, incluindo o monitoramento das abas.

popup.html: Interface de popup para login e logout.

content.js: Script que interage com a página do WideChat (se aplicável).

icon.png: Ícone da extensão.

README.md: Documento com informações sobre a extensão.

Como Funciona
Criptografia de Senha
A senha do usuário é criptografada antes de ser armazenada. O processo utiliza a API de criptografia do navegador para garantir que as credenciais não sejam salvas em texto simples.

Algoritmo: AES-GCM

Função de Derivação: PBKDF2 com salt e SHA-256

Armazenamento: Local Storage, com a senha criptografada

Login Automático
A extensão tenta realizar o login automaticamente assim que o navegador for iniciado, desde que as credenciais estejam salvas no armazenamento local.

Logout Automático
Quando o navegador ou a aba do WideChat for fechada, a extensão faz o logout do agente para evitar que a sessão permaneça ativa.

Problemas Conhecidos
Login não funciona: Certifique-se de que você tenha inserido as credenciais corretas e de que o servidor WideChat esteja acessível.

Desconexão inesperada: Se o navegador for fechado de forma abrupta, pode ocorrer uma desconexão que exigirá o login manual novamente.

Licença
Este projeto está licenciado por CARLOS ANDRÉ SABINO.
