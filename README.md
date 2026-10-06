# Circles — social network

Final project for the web application development course: Node.js + Express (MVC), MongoDB,
jQuery/Ajax, Socket.io chat, D3 charts, React islands for HTML5 video & canvas.

## Getting started

Prerequisites: Node.js ≥ 20.11 and a local MongoDB server on `mongodb://127.0.0.1:27017`.

```bash
npm install
cp .env.example .env          # then set JWT_SECRET to a long random string
npm run build                 # builds the React islands into public/dist
npm start                     # http://localhost:3000
```

`.env` settings: `PORT`, `MONGODB_URI` (default `mongodb://127.0.0.1:27017/circles`; the database
name is the last path segment), `JWT_SECRET` (at least 32 random characters) and `UPLOAD_DIR`.

Development (auto-restart server + rebuild islands on change): `npm run dev`.
Lint / format: `npm run lint`, `npm run format`.

## Project structure

| Path              | Role                                                            |
| ----------------- | --------------------------------------------------------------- |
| `src/models`      | Mongoose models — **M** (User, Group, Post, Message)            |
| `src/views`       | EJS page shells — **V**                                         |
| `src/controllers` | Request handlers — **C** (thin: validate → service → presenter) |
| `src/services`    | Domain rules: permissions, visibility, cascades, friendships    |
| `src/presenters`  | Model → JSON shape (hides private fields)                       |
| `src/validators`  | zod schemas for every request                                   |
| `src/routes`      | `pages.js` (HTML) and `api/*` (JSON)                            |
| `src/sockets`     | Socket.io chat + presence                                       |
| `public/js`       | jQuery page scripts, shared libs, D3 charts                     |
| `client/islands`  | React components (video player, canvas doodle) built by Vite    |

## Requirement map

| #   | Requirement                                                       | Where                                                                                                                                                        |
| --- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Node.js + Express                                                 | `src/app.js`, `src/server.js`                                                                                                                                |
| 2   | MongoDB                                                           | `src/config/db.js`, `src/models/*`                                                                                                                           |
| 3   | MVC                                                               | models / views / controllers folders (+ services, presenters)                                                                                                |
| 4   | ≥ 3 models                                                        | User, Group, Post (+ Message)                                                                                                                                |
| 5   | CRUD + list + search per model in the UI                          | Users: `/register`, `/settings`, `/users`, `/users/:id`; Groups: `/groups`, `/groups/:id`; Posts: composer, inline edit/delete, `/me/posts`, `/posts/search` |
| 6   | ≥ 2 multi-parameter searches                                      | People (name, city, gender, age range), Groups (name, category, privacy, min members, mine), Posts (text, author, group, dates, media)                       |
| 7   | Auth + group admins + privacy                                     | JWT cookie auth, `src/services/groupAccess.js`, `src/services/postAccess.js`, membership endpoints                                                           |
| 8   | My posts + feed                                                   | `/me/posts`, `/feed`                                                                                                                                         |
| 10  | Validation & robustness                                           | zod on every route, client rules in `public/js/lib/validation.js`, central `errorHandler`                                                                    |
| 11  | jQuery + Ajax                                                     | every page script under `public/js/pages`, `public/js/lib/api.js`                                                                                            |
| 12  | Video & Canvas (React)                                            | `client/islands/VideoPlayer.jsx`, `client/islands/DoodleCanvas.jsx`                                                                                          |
| 13  | CSS3: text-shadow, transition, columns, @font-face, border-radius | `public/css/base.css`, `layout.css`, `components.css`, `fonts.css`                                                                                           |
| 14  | Chat with Socket.io                                               | `src/sockets/*`, `/chat`                                                                                                                                     |
| 15  | 2 D3 charts from live DB data                                     | `/stats`, `src/services/statsService.js`, `public/js/charts/*`                                                                                               |
