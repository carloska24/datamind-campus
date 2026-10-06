# Etapa 2 — Contas de alunos

Implementada em 06/10/2026, preservando o visual original. Escopo: piloto local da Aula 01, com cadastro aberto escolhido pelo usuário. Este avanço não conclui a publicação do campus na internet nem a gestão de várias turmas.

## Como usar

1. Inicie pelo `INICIAR_WINDOWS.bat` ou `npm start` e abra http://127.0.0.1:4173.
2. **Configure seu campus** cria a única conta inicial de administrador. O usuário escolhe nome, e-mail e senha; não existe senha padrão.
3. Depois, **Entrar** e **Criar conta** permitem login e cadastro de alunos. Cadastro público nunca concede administração, mesmo com papel forjado no pedido.
4. O avatar abre **Minha conta**. Para o administrador, abre **Alunos e sua conta**, com lista, progresso, desativação/reativação e recuperação de acesso.
5. O administrador configura as chaves em **Ouvir as aulas**. Alunos usam os provedores configurados sem receber a chave e sem autorização para alterá-la.
6. **Recuperar acesso** gera um link para compartilhar diretamente com o aluno. Vale por uma hora, tem uso único e revoga as sessões anteriores. O aluno escolhe a senha. Não há envio automático de e-mail.
7. **Trazer meu estudo da versão anterior** permite ao administrador importar seu estudo antigo, com confirmação. A importação nunca é automática. O armazenamento antigo permanece preservado no navegador.

`dist/ABRIR.html` mantém o estudo individual no navegador. Contas e áudio por API exigem o servidor. O portátil contém o material público da aula, sem contas, senhas, chaves ou cadernos de outros usuários.

## Persistência e privacidade

Cada conta recebe um identificador gerado pelo servidor. Progresso, anotações e última atividade são lidos e escritos pelo identificador da sessão; identificadores enviados pelo cliente não escolhem outro aluno. O painel recebe nome, e-mail, estado da conta e quantidade de módulos concluídos, sem as anotações.

O salvamento automático tem indicador visível e pedidos serializados. Uma revisão por aluno detecta alterações concorrentes. Conflitos não sobrescrevem o estudo remoto: a interface orienta exportar a cópia atual e recarregar. Falhas de rede mantêm as alterações na tela, com nova tentativa e exportação. A página alerta antes de fechar enquanto existem alterações não salvas.

O cliente identifica a conta que carregou o estudo; o servidor compara essa identificação com a sessão atual. Se outra aba trocar de conta, o pedido antigo é recusado, evitando salvar o caderno de uma pessoa na conta de outra. A identidade enviada nunca escolhe quem será lido ou atualizado.

Endpoints: `GET /api/auth/session`; `POST /api/auth/setup`, `/register`, `/login`, `/logout`, `/reset`; `GET/PUT /api/study`; `GET/POST /api/admin/users`. Os cinco últimos nomes curtos de autenticação pertencem ao prefixo `/api/auth/`. `/api/study` usa a sessão e exige `X-Campus-User` na escrita; `/api/admin/users` exige administrador.

Dados persistem em `.local/campus-accounts.json`, ignorado pelo Git e fora de `dist`. Gravações são serializadas em um único processo Node, com arquivo temporário e renomeação. O proprietário do servidor consegue ler esse arquivo: a privacidade acima é autorização da aplicação, não criptografia das anotações em disco. Faça backup privado de `.local`; não inclua essa pasta em pacotes públicos.

Senhas usam scrypt com salt aleatório (N=131072, r=8, p=1), comparação em tempo constante e mínimo de 12 caracteres. Sessões usam tokens aleatórios de 256 bits, armazenados como hashes na memória do servidor. Cookies são HttpOnly, SameSite=Strict e expiram em 12 horas. Reiniciar encerra sessões, preservando o estudo. Logout e desativação revogam sessões. Escritas verificam Origin/Host, exigem JSON e limitam o corpo. Autenticação tem limite por endereço e de operações simultâneas. Áudio exige login: duas gerações globais e uma por usuário de cada vez.

## Decisões

| Escolha                                | Alternativa                 | Motivo                                                                       |
| -------------------------------------- | --------------------------- | ---------------------------------------------------------------------------- |
| Cadastro aberto de alunos              | Convites                    | Escolha expressa do usuário; administrador criado separadamente.             |
| Aluno e administrador, Aula 01 única   | Professores e várias turmas | Entregar acesso e isolamento reais, com escopo claro.                        |
| Arquivo privado, um processo           | SQLite/banco hospedado      | Piloto sem novas dependências; migrar para banco transacional na hospedagem. |
| Sessões no servidor e cookies HttpOnly | Token no localStorage       | Evitar exposição ao código cliente e permitir revogação.                     |
| Importação manual do estudo antigo     | Atribuição automática       | Evitar misturar dados em computadores compartilhados.                        |
| Recuperação pelo administrador         | E-mail transacional         | Fluxo funcional sem serviço fictício nem envio de mensagens não autorizado.  |

## Limites e próximo passo

E-mail é identificador de login, sem verificação de propriedade. Não há SSO, MFA, cobrança, várias turmas, professor, avaliação formal ou novos cursos nesta etapa. Recuperação pelo painel atende alunos; administrador sem sessão ainda requer um procedimento operacional dedicado. O arquivo não suporta múltiplos processos simultâneos. Cadastro aberto precisa de proteção adicional contra abuso antes de publicação pública.

O servidor permanece em `127.0.0.1`: outros computadores não acessam esse endereço. Para alunos remotos: escolher hospedagem/domínio e preparar HTTPS, cookie Secure, banco transacional, backups, recuperação do administrador, verificação de e-mail e limites de uso/custo de áudio. Nenhuma porta pública foi aberta.

## Verificação

- `npm test`: 25 testes passaram, incluindo corrida do primeiro administrador, papel forjado, isolamento, reinício, conflito, expiração/logout, permissões, origem externa, limite de cadastro, recuperação e desativação.
- `npm run build`: TypeScript e produção passaram.
- Navegador com contas fictícias isoladas: anotação de Ana persistiu após recarregar e conclusão registrou 1/14; Bruno manteve 0/14 e caderno vazio. Painel mostrou ambos corretamente. Aluno não tem campo de chave. Entrada e painel verificados no desktop e em 390px.
- Contas fictícias não foram gravadas no campus real. O administrador real deve ser criado pelo usuário.

Capturas: [primeiro acesso](etapa-2/01-primeiro-acesso.png), [painel fictício](etapa-2/02-painel-admin-contas-ficticias.png), [painel no celular](etapa-2/03-painel-mobile.png), [cadastro no celular](etapa-2/04-cadastro-mobile.png).

Fontes técnicas: [Node.js crypto](https://nodejs.org/docs/latest-v22.x/api/crypto.html), [sessões e cookies OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).
