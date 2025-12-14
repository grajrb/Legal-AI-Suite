# Legal AI Suite - India's Best Legal AI Assistant

A comprehensive legal tech platform featuring AI-powered document analysis, contract review, and intelligent legal insights designed for Indian law firms.

## Features

- **Smart Document Analysis**: AI-powered analysis of legal documents with instant summaries
- **Risk Detection**: Automatically identify risky clauses and potential legal issues
- **Multi-Role Dashboard**: Separate dashboards for Admin, Lawyers, and Paralegals
- **PDF Upload & Chat**: Upload documents and ask questions (5-question limit for demo)
- **Session Management**: Track user sessions and chat history
- **Secure Authentication**: Role-based access control

## Tech Stack

- **Backend**: FastAPI, Python 3.11+
- **Frontend**: React 18, Vite, Tailwind CSS
- **Database**: SQLite (default), Supabase (configured for future use)
- **APIs**: OpenAI (configured for future use)

## Project Structure

```
Legal-AI-Suite/
├── server/                 # FastAPI backend
│   ├── main.py            # Main application
│   ├── legal_ai.db        # SQLite database (auto-created)
│   └── uploads/           # PDF uploads directory
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── context/       # Auth context
│   │   └── services/      # API services
│   └── package.json
├── pyproject.toml         # Python dependencies
├── .env                   # Environment variables
└── README.md             # This file
```

## Installation & Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm or yarn

### Backend Setup

1. **Navigate to project root**:
   ```bash
   cd d:\Projects\Legal-AI-Suite
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   ```

3. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   # OR using pyproject.toml:
   pip install -e .
   ```

   Or install individually:
   ```bash
   pip install fastapi uvicorn pypdf2 python-jose python-multipart python-dotenv
   ```

4. **Configure environment** (optional):
   - Copy `.env.example` to `.env`
   - Update settings as needed (Supabase URL, OpenAI key, etc.)

### Frontend Setup

1. **Navigate to client directory**:
   ```bash
   cd client
   ```

2. **Install Node dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment** (optional):
   - Copy `.env.example` to `.env`
   - Update API URL if needed

## Running the Application

### Option 1: Manual Terminal (Two Terminals)

**Terminal 1 - Backend**:
```bash
cd d:\Projects\Legal-AI-Suite
.venv\Scripts\activate
python -m uvicorn server.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 - Frontend**:
```bash
cd d:\Projects\Legal-AI-Suite\client
npm run dev
```

### Option 2: Using Batch Script

Create `run.bat` in project root:
```batch
@echo off
start "Backend Server" cmd /k "cd server && ..\\.venv\\Scripts\\python -m uvicorn main:app --host 0.0.0.0 --port 8000"
start "Frontend Dev Server" cmd /k "cd client && npm run dev"
```

Run: `run.bat`

### Option 3: Using npm scripts (if configured)

Add to `client/package.json` scripts:
```json
"dev:all": "concurrently \"npm run dev\" \"python -m uvicorn server.main:app --host 0.0.0.0 --port 8000\""
```

## Accessing the Application

Once both servers are running:

- **Frontend**: http://localhost:5000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs (Swagger UI)
- **Alternative API Docs**: http://localhost:8000/redoc (ReDoc)

## Using the Application

### Landing Page
1. Go to http://localhost:5000
2. See features and demo section
3. Click "Try Demo" or "Sign In to Dashboard"

### Demo Section (No Auth Required)
1. Upload a PDF file
2. View auto-generated summary
3. Ask up to 5 questions about the document
4. Demo resets per session

### Login (Role-Based)
1. Click "Sign In to Dashboard"
2. Use email containing:
   - `admin` → Admin Dashboard
   - `lawyer` → Lawyer Dashboard
   - `para` → Paralegal Dashboard

Examples:
- admin@company.com
- john.lawyer@law.com
- sarah.paralegal@legal.org

### Dashboards
- **Admin**: View statistics and system overview
- **Lawyer**: View active matters and recent documents
- **Paralegal**: View upload queue and OCR failures

## API Endpoints

### Public Endpoints
- `POST /api/upload` - Upload and analyze PDF
- `POST /api/chat` - Ask questions about document
- `GET /api/health` - Health check
- `POST /api/login` - User login (mock)

### Dashboard Endpoints
- `GET /api/stats` - Statistics (Admin)
- `GET /api/matters` - Matters list (Lawyer)
- `GET /api/paralegal-tasks` - Tasks (Paralegal)

## Database

### SQLite (Current)
- **Location**: `server/legal_ai.db`
- **Auto-created** on first run
- **Tables**:
  - `documents`: Stores uploaded PDF metadata and content
  - `chat_sessions`: Tracks question limits and sessions

### Supabase (Configured for Future Use)
- Add `SUPABASE_URL` and `SUPABASE_KEY` to `.env`
- Set `USE_SUPABASE=true` to enable
- Update `DATABASE_TYPE=supabase` in `.env`

## Environment Variables

See `.env.example` for all available options:

```
DATABASE_TYPE=sqlite
UPLOAD_DIR=server/uploads
USE_SUPABASE=false
SUPABASE_URL=
SUPABASE_KEY=
OPENAI_API_KEY=
```

## Development

### Backend Development
- Server reloads on code changes (`--reload` flag)
- API docs available at `/docs`
- Database auto-initializes on startup

### Frontend Development
- Vite provides fast HMR (Hot Module Replacement)
- Tailwind CSS configured
- Axios configured with interceptors for auth

## Building for Production

### Backend
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 server.main:app
```

### Frontend
```bash
cd client
npm run build
# Output in client/dist/
```

## Troubleshooting

### Backend won't start
- Check Python version: `python --version` (needs 3.11+)
- Check port 8000 is available: `netstat -ano | findstr :8000`
- Check all dependencies installed: `pip list`

### Frontend won't start
- Clear node_modules: `rm -r node_modules && npm install`
- Clear npm cache: `npm cache clean --force`
- Check Node version: `node --version` (needs 18+)

### API calls failing
- Check both servers are running
- Check CORS: Should allow `*` in development
- Check API URL in frontend `.env`: Should be `http://localhost:8000`
- Check browser console for errors

### Database issues
- Database is auto-created, delete to reset: `rm server/legal_ai.db`
- Check write permissions in `server/` directory

## Future Features

- [ ] OpenAI integration for real AI responses
- [ ] User authentication with JWT tokens
- [ ] Supabase database migration
- [ ] Document tagging and classification
- [ ] Advanced search functionality
- [ ] Export features (PDF, Excel)
- [ ] Analytics and reporting
- [ ] Multi-language support

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@legalaai.com or open an issue on GitHub.

---

**Last Updated**: December 14, 2025

For the current implementation status, see [STATUS.md](STATUS.md)
