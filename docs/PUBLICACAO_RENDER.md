# Publicação do DataMind no Render

O `render.yaml` cria um serviço Node no menor plano pago (0.5 CPU / 512 MB), uma única instância e disco persistente de 1 GB em `/var/data`. O workspace Hobby basta. Não selecionar upgrade de workspace Pro.

## Configuração

- Build: `npm ci --include=dev && npm run build`.
- Inicialização: `npm start`; saúde: `/api/health`.
- Node 22.19.0, `NODE_ENV=production`, `DATA_DIR=/var/data`.
- Render fornece `RENDER_EXTERNAL_URL` automaticamente. Um domínio próprio exige `PUBLIC_URL=https://dominio`.
- `SETUP_TOKEN` é gerado pelo Blueprint e protege a criação do único administrador. Em Environment do serviço, copie esse valor diretamente para o campo de ativação do campus no primeiro acesso. Escolha pessoalmente sua senha. Não compartilhe esse código com alunos.
- Depois da ativação, alunos usam **Criar conta**. Cadastro aberto concede somente acesso de aluno.
- Narração Gemini: configure `GEMINI_API_KEY` como variável privada no Render ou entre como administrador no campus e salve a chave no servidor. Não use prefixo `VITE_`. Voz do navegador funciona sem chave. A configuração privada local não é enviada no Git.

## Dados e custos

Contas, hashes de senha, cadernos e progresso ficam em `/var/data/campus-accounts.json`. Chaves salvas pela interface ficam em `/var/data/api-keys.json`; áudios em `/var/data/audio`. O serviço continua usando escrita atômica e serializada em um único processo, adequada ao piloto pequeno. Não criar segunda instância ou outro processo gravando o mesmo arquivo. A expansão para várias turmas requer banco transacional e revisão de autenticação.

Sessões ficam em memória: um deploy/reinício pede novo login, preservando estudos. Cookies usam Secure em produção, HttpOnly e SameSite=Strict; escritas aceitam somente a origem HTTPS configurada. O primeiro administrador exige código privado. A autenticação processa duas operações simultâneas para limitar memória e enfileira a turma; acessos bem-sucedidos não gastam o limite de falhas do proxy.

Áudios do curso são reutilizados no disco e entre alunos. O cache identifica texto, modelo e voz: conteúdo novo gera uma versão nova. Até duas gerações diferentes ocorrem simultaneamente; pedidos iguais compartilham a geração. Não há gravação de texto livre ou de anotações no cache. APIs de voz têm cobrança separada da hospedagem. Não houve chamada faturável nos testes.

Referência de preços consultada em 06/10/2026: computação US$ 7/mês + disco de 1 GB US$ 0,25/mês, além de eventuais excedentes de tráfego e APIs. Confira o valor exibido no painel antes da contratação. Fontes: [preços](https://render.com/pricing), [discos e snapshots](https://render.com/docs/disks), [Blueprint](https://render.com/docs/blueprint-spec).

## Operação

O disco do Render tem snapshots automáticos. Preserve também backup privado externo do arquivo de contas antes de mudanças grandes e valide a recuperação; cadernos podem ser exportados individualmente no campus. Não coloque backups no Git, em `public`, em `dist` ou em links públicos. Não altere/remova o disco ao atualizar o código.

Esta publicação começa com contas novas; dados e chaves do computador não são importados automaticamente. E-mails são identificadores sem confirmação de propriedade. Recuperação de alunos usa link gerado pelo administrador; não há envio automático de e-mail. Mantenha a senha de administrador no seu gerenciador de senhas: recuperação administrativa exige intervenção privada do responsável pelo servidor.

O material da aula é servido como conteúdo público; login protege contas, cadernos, progresso e uso de API. Não tratar os arquivos da aula como um acervo confidencial.
