# AI eBook Creator

> Create, edit, and export polished eBooks with AI-assisted writing tools.

AI eBook Creator is a full-stack web application for turning an idea into a structured eBook. Generate an outline, write and organize chapters in a Markdown editor, add a cover, preview the finished book, and export it as a PDF or DOCX file.

## Live application

- **Frontend:** [ai-ebook-creator-chi.vercel.app](https://ai-ebook-creator-chi.vercel.app)
- **Backend API:** [ai-ebookcreator-4d0s.onrender.com](https://ai-ebookcreator-4d0s.onrender.com)
- **API health check:** [/api/health](https://ai-ebookcreator-4d0s.onrender.com/api/health)

> The backend may take a short time to wake up on the first request when running on a sleeping Render instance.

## Features

- **AI-assisted writing**
  - Generate a complete book outline from a topic, audience, tone, and desired length.
  - Generate chapter drafts with Gemini.
  - Continue refining content in the built-in Markdown editor.
- **Book workspace**
  - Create, edit, reorder, and delete chapters.
  - Manage book title, subtitle, author, description, genre, and metadata.
  - Preview rendered Markdown before exporting.
- **Professional exports**
  - Export books to PDF.
  - Export books to DOCX.
  - Add custom cover images.
  - Store covers locally during development or in Cloudinary when configured.
- **Authentication and account management**
  - Register and sign in with email and password.
  - JWT-based protected API routes.
  - Update profile details from the account page.
- **Responsive interface**
  - React single-page application with protected and public routes.
  - Responsive dashboard, editor, reader, landing, and legal pages.
  - Toast notifications, confirmation dialogs, loading states, and error handling.

## Tech stack

### Frontend

- React 18
- Vite
- React Router
- Axios
- Tailwind CSS
- CodeMirror Markdown editor
- React Markdown with GFM and sanitization
- Lucide React icons

### Backend

- Node.js
- Express
- MongoDB with Mongoose
- JWT authentication
- bcryptjs password hashing
- Google Gemini API
- PDFKit
- docx
- Multer
- Cloudinary (optional)

## Project structure

```text
.
├── Backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Auth, uploads, and error handling
│   ├── models/          # Mongoose models
│   ├── routes/          # REST API routes
│   ├── services/        # AI, PDF, DOCX, and storage services
│   ├── uploads/         # Local cover storage during development
│   ├── app.js           # Express application
│   └── server.js        # Database connection and server startup
├── Frontend/
│   ├── public/
│   └── src/
│       ├── components/  # Shared UI and editor components
│       ├── context/     # Auth and toast contexts
│       ├── lib/         # API client and utilities
│       ├── pages/       # Application pages
│       └── services/    # API service modules
└── README.md
```

## Requirements

- Node.js 18 or newer
- npm 9 or newer
- MongoDB, either:
  - A local MongoDB server, or
  - A MongoDB Atlas cluster
- A Google Gemini API key for AI generation
- Cloudinary credentials only if cloud cover storage is desired

## Local development

### 1. Clone the repository

```bash
git clone https://github.com/surajcodes82/Ai-ebookCreator.git
cd Ai-ebookCreator
```

### 2. Configure the backend

```bash
cd Backend
npm install
copy .env.example .env
```

On macOS or Linux, use:

```bash
cp .env.example .env
```

Edit `Backend/.env` and set at least:

```env
MONGO_URI=mongodb://127.0.0.1:27017/ai-ebook-creator
JWT_SECRET=replace-this-with-a-long-random-secret
GEMINI_API_KEY=your-gemini-api-key
```

Start the backend:

```bash
npm run dev
```

The API runs at `http://localhost:5000`.

### 3. Configure and start the frontend

Open a second terminal:

```bash
cd Frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

The Vite development proxy forwards `/api` and `/uploads` requests to the backend. To use a different backend locally:

```bash
VITE_API_PROXY=http://localhost:5000 npm run dev
```

On Windows PowerShell:

```powershell
$env:VITE_API_PROXY="http://localhost:5000"
npm run dev
```

## Environment variables

Backend variables are documented in [Backend/.env.example](./Backend/.env.example).

| Variable | Required | Description |
| --- | --- | --- |
| `MONGO_URI` | Production | MongoDB connection string |
| `JWT_SECRET` | Recommended | Secret used to sign authentication tokens |
| `JWT_EXPIRES_IN` | No | JWT lifetime, such as `7d` |
| `GEMINI_API_KEY` | For AI | Google Gemini API key |
| `GEMINI_MODEL` | No | Gemini model override; defaults to `gemini-2.5-flash` |
| `PORT` | No | Backend port; defaults to `5000` |
| `CLIENT_URL` | Production | Comma-separated list of allowed frontend origins |
| `CLOUDINARY_CLOUD_NAME` | No | Enables Cloudinary cover storage when all Cloudinary values are set |
| `CLOUDINARY_API_KEY` | No | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | No | Cloudinary API secret |

Never commit `Backend/.env` or any file containing real credentials. The repository ignores environment files by default.

## API overview

All book, AI, upload, and profile endpoints require a valid JWT in the `Authorization` header:

```text
Authorization: Bearer <token>
```

### Public endpoints

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Health and service configuration check |
| `POST` | `/api/auth/register` | Create an account |
| `POST` | `/api/auth/login` | Sign in |
| `GET` | `/uploads/<filename>` | Serve locally stored cover images |

### Authenticated endpoints

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/auth/me` | Get the current user |
| `GET` | `/api/users/profile` | Get profile details |
| `PUT` | `/api/users/profile` | Update profile details |
| `GET` | `/api/books` | List the current user's books |
| `POST` | `/api/books` | Create a book |
| `GET` | `/api/books/:id` | Get a book |
| `PUT` | `/api/books/:id` | Update a book |
| `DELETE` | `/api/books/:id` | Delete a book |
| `POST` | `/api/books/:bookId/chapters` | Add a chapter |
| `PUT` | `/api/books/:bookId/chapters/reorder` | Reorder chapters |
| `PUT` | `/api/books/:bookId/chapters/:chapterId` | Update a chapter |
| `DELETE` | `/api/books/:bookId/chapters/:chapterId` | Delete a chapter |
| `POST` | `/api/ai/generate-outline` | Generate an outline with Gemini |
| `POST` | `/api/ai/generate-chapter` | Generate a chapter with Gemini |
| `POST` | `/api/upload/cover` | Upload a book cover |
| `GET` | `/api/books/:id/export/pdf` | Download a PDF export |
| `GET` | `/api/books/:id/export/docx` | Download a DOCX export |

## Production deployment

### Backend on Render

1. Create a Render Web Service from the `Backend` directory.
2. Set the build command to:

   ```bash
   npm install
   ```

3. Set the start command to:

   ```bash
   npm start
   ```

4. Add the backend environment variables from the table above.
5. Set `CLIENT_URL` to the exact Vercel frontend origin, for example:

   ```env
   CLIENT_URL=https://ai-ebook-creator-chi.vercel.app
   ```

### Frontend on Vercel

1. Create a Vercel project from the repository.
2. Set the project root to `Frontend`.
3. Use:

   ```bash
   npm run build
   ```

4. Set the output directory to `dist`.
5. Optionally set `VITE_API_URL` to the deployed backend URL:

   ```env
   VITE_API_URL=https://ai-ebookcreator-4d0s.onrender.com
   ```

The frontend includes the deployed backend as its production fallback, but setting `VITE_API_URL` explicitly is recommended for environment-specific deployments.

## Available scripts

### Backend

Run these commands from `Backend/`:

| Command | Description |
| --- | --- |
| `npm start` | Start the production server |
| `npm run dev` | Start the server with nodemon |

### Frontend

Run these commands from `Frontend/`:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build |
| `npm run preview` | Preview the production build locally |

## Troubleshooting

### `401 Unauthorized` during login

The account must exist in the MongoDB database used by the deployed backend. An account created against a local MongoDB instance will not automatically exist in production. Register again through the deployed frontend or point `MONGO_URI` at the intended database.

### CORS errors

Set `CLIENT_URL` on the backend to the exact frontend origin, without a trailing slash:

```env
CLIENT_URL=https://ai-ebook-creator-chi.vercel.app
```

Redeploy or restart the backend after changing environment variables.

### AI generation returns `503`

Set `GEMINI_API_KEY` on the backend and restart the service. Confirm the key is valid and that the configured Gemini model is available to your account.

### Covers are not persistent in production

Without Cloudinary configuration, covers are stored on the server filesystem. Ephemeral hosting environments may remove local files during redeploys or restarts. Configure Cloudinary for persistent production storage.

## Security notes

- Keep all secrets in environment variables.
- Use a long, unique `JWT_SECRET` in production.
- Do not expose `GEMINI_API_KEY`, MongoDB credentials, or Cloudinary secrets in frontend code.
- Restrict `CLIENT_URL` to trusted frontend origins.
- Rotate any credential that has accidentally been exposed.

## Contributing

1. Create a feature branch.
2. Make focused changes that preserve the existing API and UX.
3. Run `npm run build` from `Frontend/`.
4. Test the affected backend routes locally.
5. Open a pull request with a clear description of the change.

## License

No license has been declared for this repository yet. Contact the repository owner before redistributing or using the project commercially.

## Author

Built by [Suraj](https://github.com/surajcodes82).

