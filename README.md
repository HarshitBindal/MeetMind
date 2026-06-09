# MeetMind

AI-powered meeting intelligence — paste a transcript, upload a file, audio, or video, and let AI extract summaries, action items, and key decisions.

---

## Architecture

```
meetmind/
├── frontend/          # React 18 + Vite 5 + Tailwind CSS v3
│   └── src/
│       ├── pages/          # LandingPage, Login, Register, Dashboard, NewMeeting, MeetingDetail
│       ├── components/     # ProtectedRoute
│       ├── context/        # AuthContext (JWT session management)
│       ├── services/       # Axios API client
│       ├── hooks/
│       └── utils/
├── backend/           # Node.js + Express
│   └── src/
│       ├── controllers/    # Auth & Meeting request handlers
│       ├── models/         # Mongoose schemas (User, Meeting)
│       ├── routes/         # API route definitions
│       ├── middleware/     # JWT auth, Multer file upload
│       ├── services/       # AI extraction, transcription, video processing, meeting orchestrator
│       ├── validators/     # Zod request validation schemas
│       ├── config/         # MongoDB connection
│       ├── utils/          # Helper utilities
│       └── uploads/        # Temporary file storage (auto-cleaned)
├── package.json       # Root monorepo scripts (concurrently)
├── render.yaml        # Render Blueprint for one-click backend deployment
└── .env.example       # All required environment variables
```

## Tech Stack

| Layer          | Technology                                                                 |
| -------------- | -------------------------------------------------------------------------- |
| **Frontend**   | React 18, Vite 5, Tailwind CSS v3, React Router v6                        |
| **Backend**    | Node.js, Express, Mongoose 9                                              |
| **Database**   | MongoDB (Atlas)                                                            |
| **AI**         | Google Gemini (`@google/genai`) — extraction + audio transcription          |
| **Media**      | ffmpeg via `@ffmpeg-installer/ffmpeg` + `fluent-ffmpeg` — video → audio    |
| **File Upload**| Multer (text/PDF/audio/video with size limits)                             |
| **Auth**       | JWT + bcrypt                                                               |

## Supported Input Types

| Input Type       | Accepted Formats       | Max Size | Pipeline                              |
| ---------------- | ---------------------- | -------- | ------------------------------------- |
| Pasted Text      | —                      | —        | Text → Gemini → Structured JSON       |
| Transcript File  | `.txt`, `.md`, `.pdf`  | 2 MB     | File → Text Extraction → Gemini       |
| Audio            | `.mp3`, `.wav`, `.m4a`, `.webm` | 25 MB | Audio → Gemini Transcription → Gemini |
| Video            | `.mp4`, `.mov`, `.webm`| 50 MB    | Video → ffmpeg → Audio → Gemini       |

## Getting Started

### Prerequisites

- **Node.js** v20.x (tested with v20.15.0)
- **npm** v10+
- **MongoDB** — local instance or [MongoDB Atlas](https://www.mongodb.com/atlas) connection string
- **Google Gemini API Key** — get one from [Google AI Studio](https://aistudio.google.com/)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/MeetMind.git
cd MeetMind

# 2. Install all dependencies (root + frontend + backend)
npm run install:all
```

### Environment Variables

```bash
# 3. Create the backend .env file
cp .env.example backend/.env
```

Edit `backend/.env` with your values:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>
JWT_SECRET=your_secret_key_here
GEMINI_API_KEY=your_gemini_api_key_here
CLIENT_URL=http://localhost:5173
```

For frontend deployment (Vercel), set as an environment variable:

```env
VITE_API_URL=https://your-backend.onrender.com/api
```

### Running Locally

```bash
# Start both frontend and backend concurrently
npm run dev
```

- **Frontend** → `http://localhost:5173`
- **Backend API** → `http://localhost:5000/api`

## API Endpoints

### Auth
| Method | Endpoint             | Description        |
| ------ | -------------------- | ------------------ |
| POST   | `/api/auth/register` | Create new account |
| POST   | `/api/auth/login`    | Sign in & get JWT  |
| GET    | `/api/auth/me`       | Get current user   |

### Meetings
| Method | Endpoint              | Description                           |
| ------ | --------------------- | ------------------------------------- |
| POST   | `/api/meetings/text`  | Submit pasted transcript              |
| POST   | `/api/meetings/file`  | Upload transcript file (.txt/.md/.pdf)|
| POST   | `/api/meetings/audio` | Upload audio file                     |
| POST   | `/api/meetings/video` | Upload video file                     |
| GET    | `/api/meetings`       | List all meetings (current user)      |
| GET    | `/api/meetings/:id`   | Get meeting details                   |
| PUT    | `/api/meetings/:id`   | Update meeting (edit AI output)       |
| DELETE | `/api/meetings/:id`   | Delete meeting                        |

## Deployment

### Backend (Render)
- Use the included `render.yaml` Blueprint for one-click deployment.
- Ensure `MONGO_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, and `CLIENT_URL` are set in Render environment variables.
- Render's filesystem is ephemeral — uploaded files are processed immediately and cleaned up.

### Frontend (Vercel)
- Connect your GitHub repo and set the root directory to `frontend/`.
- Set `VITE_API_URL` as an environment variable pointing to your Render backend URL.

## License

MIT
