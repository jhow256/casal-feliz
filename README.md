# Couple App — Backend

API REST em Django para o presente de namoro. 💑

## Stack
- Python 3.14 + Django 6 + Django REST Framework
- JWT via `djangorestframework-simplejwt`
- SQLite (banco de dados local)
- Poetry para gerenciar dependências

## Primeiros passos

```bash
# 1. Instalar dependências
poetry install

# 2. Aplicar migrações (cria o db.sqlite3)
poetry run python manage.py migrate

# 3. Criar os usuários do casal
poetry run python manage.py seed_users

# 4. (Opcional) Criar superusuário para o admin
poetry run python manage.py createsuperuser

# 5. Iniciar o servidor
poetry run python manage.py runserver
```

## Endpoints

### Autenticação
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/login/` | Login — retorna access + refresh token |
| POST | `/api/auth/logout/` | Logout — invalida o refresh token |
| POST | `/api/auth/refresh/` | Renova o access token |
| GET  | `/api/auth/me/` | Dados do usuário autenticado |

### Fotos
| Método | Rota | Descrição |
|--------|------|-----------|
| GET  | `/api/photos/` | Lista todas as fotos |
| POST | `/api/photos/` | Faz upload de uma foto (multipart/form-data, campo: `file`) |
| GET  | `/api/photos/<id>/` | Detalhes de uma foto |
| DELETE | `/api/photos/<id>/` | Remove uma foto (somente o dono) |

### Eventos (Agenda)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET  | `/api/events/` | Lista todos os eventos |
| POST | `/api/events/` | Cria um evento (`title`, `date`, `description?`) |
| GET  | `/api/events/<id>/` | Detalhes de um evento |
| PATCH | `/api/events/<id>/` | Atualiza parcialmente (somente o dono) |
| DELETE | `/api/events/<id>/` | Remove um evento (somente o dono) |

## Autenticação nas requisições

Inclua o header em todas as rotas protegidas:

```
Authorization: Bearer <access_token>
```
