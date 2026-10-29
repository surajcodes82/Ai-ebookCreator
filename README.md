# AI eBook Creator

A full-stack web application for creating, editing, and exporting eBooks with the help of AI.

AI eBook Creator uses Google Gemini to generate book outlines and chapter drafts. Users can edit their content, organize chapters, preview the final book, and export it as a PDF or DOCX file.

## 🌐 Live Demo

- **Frontend:** [AI eBook Creator](https://ai-ebook-creator-chi.vercel.app)
- **Backend API:** [Backend Server](https://ai-ebookcreator-4d0s.onrender.com)
- **API Health Check:** [Check API Status](https://ai-ebookcreator-4d0s.onrender.com/api/health)

*Note: The backend may take a little time to respond to the first request on Render.*

## ✨ Features

- Generate book outlines and chapter drafts using Google Gemini.
- Create, edit, reorder, and delete chapters.
- Write and format content using the Markdown editor.
- Manage book titles, descriptions, author details, and metadata.
- Preview formatted content before exporting.
- Export eBooks as PDF or DOCX files.
- Add custom cover images.
- Register and log in using email and password.
- Manage user profile details.
- Responsive interface for desktop and mobile devices.

## 🛠️ Tech Stack

**Frontend**
- React.Js
- Vite
- Tailwind CSS

**Backend**
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication

**AI & Storage**
- Google Gemini API
- Cloudinary for persistent cover image storage

**Deployment**
- Vercel — Frontend
- Render — Backend
- MongoDB Atlas — Database

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/surajcodes82/Ai-ebookCreator.git
cd Ai-ebookCreator
```

### 2. Install dependencies

For the backend:

```bash
cd Backend
npm install
```

For the frontend, open a separate terminal:

```bash
cd Frontend
npm install
```



Add Cloudinary credentials if required for persistent cover image storage.

### 4. Run the application

Start the backend:

```bash
npm run dev
```

Start the frontend from the `Frontend` directory:

```bash
npm run dev
```

Open the local URL provided by Vite in your browser.

## 🔒 Security

- JWT-based authentication for protected routes.
- Environment variables for sensitive credentials.
- Configurable CORS for the frontend.
- Never commit API keys or database credentials to GitHub.

## 👨‍💻 Author

**Suraj Kumar**

- GitHub: [surajcodes82](https://github.com/surajcodes82)

---

Built with React, Node.js, MongoDB, and Google Gemini.
