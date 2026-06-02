# Requirements Document

## Introduction

O **Couple App** é uma aplicação web personalizada criada como presente para um casal. A aplicação permite que dois usuários autenticados compartilhem memórias por meio de um carrossel de fotos, gerenciem compromissos juntos em uma agenda de casal, e naveguem entre as seções por meio de uma barra de navegação dedicada.

O backend é construído com Django (Python) usando SQLite como banco de dados para armazenar usuários, eventos e metadados das fotos. O frontend é desenvolvido em React, consumindo a API REST do Django.

---

## Glossary

- **Sistema**: O Couple App como um todo (frontend React + backend Django).
- **API**: A interface REST fornecida pelo backend Django.
- **Usuário**: Uma pessoa autenticada no sistema.
- **Casal**: O par de usuários cadastrados que compartilham a aplicação.
- **Carrossel**: Componente visual que exibe fotos em sequência rotativa.
- **Foto**: Imagem enviada por um usuário para exibição no carrossel.
- **Evento**: Um compromisso ou data especial cadastrado na agenda do casal.
- **Token**: Credencial de autenticação JWT retornada pelo backend após login bem-sucedido.
- **Navbar**: Barra de navegação presente em todas as telas autenticadas, com links para cada seção.

---

## Requirements

### Requirement 1: Autenticação de Usuários

**User Story:** Como usuário do casal, quero me autenticar na aplicação com meu e-mail e senha, para que eu possa acessar o conteúdo compartilhado de forma segura.

#### Acceptance Criteria

1. THE Sistema SHALL exibir uma tela de login com campos de e-mail e senha antes de qualquer acesso às seções protegidas.
2. WHEN o usuário submete credenciais válidas (e-mail cadastrado e senha correta), THE API SHALL retornar um Token de autenticação JWT com tempo de expiração definido (ex: 60 minutos) e um refresh token para renovação silenciosa.
3. WHEN o usuário submete credenciais inválidas (e-mail não cadastrado ou senha incorreta), THE API SHALL retornar HTTP 401 com mensagem genérica "Credenciais inválidas" sem especificar qual campo está incorreto.
4. WHILE o usuário está autenticado, THE Sistema SHALL armazenar o Token no localStorage e incluí-lo como Bearer Token no header Authorization de todas as requisições à API.
5. WHEN o usuário aciona o botão de logout, THE Sistema SHALL apagar o Token e o refresh token do localStorage e redirecionar para /login em até 500ms.
6. IF o Token expirar e o refresh token também estiver expirado, THEN THE Sistema SHALL redirecionar para /login e exibir o toast "Sua sessão expirou. Faça login novamente."
7. THE API SHALL armazenar senhas usando o algoritmo PBKDF2 do Django (ou bcrypt via django-bcrypt) com no mínimo 12 rounds, nunca em texto plano.
8. WHEN o usuário tenta submeter o formulário de login com campos em branco, THE Sistema SHALL exibir mensagens de validação inline sem realizar chamada à API.

---

### Requirement 2: Carrossel de Fotos

**User Story:** Como usuário do casal, quero enviar e visualizar fotos em um carrossel, para que possamos reviver memórias juntos de forma bonita.

#### Acceptance Criteria

1. WHILE o usuário está autenticado, THE Sistema SHALL exibir a seção do carrossel acessível pela Navbar na rota /carousel.
2. WHEN o usuário seleciona um arquivo JPEG, PNG ou WebP com tamanho ≤ 10 MB e confirma o upload, THE API SHALL armazenar o arquivo no sistema de arquivos do servidor e registrar no banco de dados: nome original, caminho relativo, data e hora UTC do upload e ID do usuário responsável.
3. IF o MIME type detectado do arquivo enviado não for image/jpeg, image/png ou image/webp, THEN THE API SHALL retornar HTTP 400 com body {"error": "Formato de arquivo não suportado. Use JPEG, PNG ou WebP."}.
4. IF o tamanho do arquivo enviado exceder 10 MB (10485760 bytes), THEN THE API SHALL retornar HTTP 400 com body {"error": "Arquivo excede o limite máximo de 10 MB."}.
5. WHEN a rota /carousel é carregada, THE Sistema SHALL exibir um indicador de loading enquanto busca as fotos via GET /api/photos/ e renderizá-las em ordem crescente de data de upload.
6. IF não houver fotos cadastradas, THEN THE Sistema SHALL exibir a mensagem "Nenhuma foto ainda. Que tal adicionar a primeira memória?" no lugar do carrossel.
7. THE Carrossel SHALL exibir botões "Anterior" e "Próximo" que navegam ciclicamente entre as fotos (da última para a primeira e vice-versa).
8. IF o Carrossel contiver mais de uma foto E o usuário não interagir por 5 segundos, THEN THE Sistema SHALL avançar automaticamente para a próxima foto de forma circular.
9. WHEN o usuário autenticado clica no botão de exclusão de uma Foto que ele próprio fez upload, THE API SHALL retornar HTTP 204 e remover o arquivo do servidor e o registro do banco de dados.
10. IF o usuário tenta excluir uma Foto que não foi enviada por ele, THEN THE API SHALL retornar HTTP 403 Forbidden.

---

### Requirement 3: Agenda do Casal

**User Story:** Como usuário do casal, quero registrar e visualizar compromissos e datas especiais, para que possamos planejar e lembrar momentos importantes juntos.

#### Acceptance Criteria

1. WHILE o usuário está autenticado, THE Sistema SHALL exibir a seção de agenda acessível pela Navbar na rota /agenda.
2. WHEN o usuário preenche o título (≤ 100 caracteres), a data (formato YYYY-MM-DD) e opcionalmente uma descrição (≤ 500 caracteres) e confirma o cadastro, THE API SHALL persistir o Evento associado ao ID do usuário autenticado e retornar HTTP 201 com o objeto criado.
3. IF o título ou a data não forem fornecidos, THEN THE API SHALL retornar HTTP 400 com mensagens de erro por campo, ex: {"title": ["Este campo é obrigatório."]}.
4. IF o título exceder 100 caracteres ou a descrição exceder 500 caracteres, THEN THE API SHALL retornar HTTP 400 indicando o campo e o limite violado.
5. WHEN a rota /agenda é carregada, THE Sistema SHALL buscar os Eventos via GET /api/events/ e exibi-los em lista ordenada por data crescente.
6. IF a API retornar erro ao carregar os eventos, THEN THE Sistema SHALL exibir "Não foi possível carregar os compromissos. Tente novamente." com botão de retry.
7. WHEN o usuário confirma a edição de um Evento com dados válidos, THE API SHALL atualizar o registro via PATCH /api/events/{id}/ e retornar HTTP 200 com o objeto atualizado.
8. WHEN o usuário confirma a exclusão de um Evento, THE API SHALL remover o registro via DELETE /api/events/{id}/ e retornar HTTP 204.
9. THE Sistema SHALL aplicar um estilo de destaque (ex: borda colorida ou badge "Hoje") nos Eventos cuja data (campo date) seja igual à data local atual do cliente no momento da renderização.

---

### Requirement 4: Barra de Navegação (Navbar)

**User Story:** Como usuário autenticado, quero uma barra de navegação persistente com acesso a todas as seções, para que eu possa transitar entre elas sem perder o contexto.

#### Acceptance Criteria

1. WHILE o usuário está autenticado, THE Sistema SHALL renderizar o componente Navbar em todas as rotas protegidas da aplicação.
2. THE Navbar SHALL conter dois links de navegação: "Fotos" apontando para /carousel e "Agenda" apontando para /agenda.
3. WHEN o usuário clica em um link da Navbar, THE Sistema SHALL atualizar a URL e renderizar o componente correspondente sem recarregar a página (client-side routing via React Router).
4. THE Navbar SHALL aplicar um estilo visualmente distinto (ex: sublinhado ou cor diferente) ao link da rota atualmente ativa, diferente dos links inativos.
5. WHEN o usuário clica no botão "Sair" na Navbar, THE Sistema SHALL executar o fluxo de logout definido no Requirement 1, Criterion 5.
6. IF o usuário tenta acessar /carousel, /agenda ou qualquer rota protegida sem Token válido no localStorage, THEN THE Sistema SHALL redirecionar para /login antes de renderizar o conteúdo protegido.

---

### Requirement 5: Persistência e Banco de Dados

**User Story:** Como desenvolvedor, quero que o sistema utilize SQLite para persistir dados de usuários e eventos, para que a aplicação funcione sem necessidade de configuração de banco externo.

#### Acceptance Criteria

1. THE API SHALL utilizar SQLite como banco de dados, com o arquivo db.sqlite3 localizado na raiz do projeto Django.
2. THE API SHALL utilizar exclusivamente o sistema de migrações do Django (manage.py makemigrations / migrate) para criar e evoluir o esquema do banco de dados; alterações manuais no arquivo SQLite não são permitidas em desenvolvimento.
3. WHEN o comando python manage.py migrate é executado em um ambiente limpo (sem db.sqlite3), THE Sistema SHALL criar o arquivo db.sqlite3 e aplicar todas as migrações, deixando o banco pronto para uso sem etapas adicionais.
4. THE API SHALL expor as seguintes tabelas principais via modelos Django: users (auth_user do Django), photos (id, user_id, filename, file_path, uploaded_at) e events (id, user_id, title, description, date, created_at, updated_at).
5. IF uma migração falhar durante python manage.py migrate, THEN o comando SHALL retornar código de saída não-zero e exibir a causa do erro no stderr sem corromper o banco existente.
