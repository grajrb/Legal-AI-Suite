# Testing Guide - Legal AI Suite

## ✅ Current Status
- **Backend**: Running on http://localhost:8001
- **Frontend**: Running on http://localhost:5000
- **Database**: PostgreSQL connected
- **AI Provider**: Perplexity (configured)

---

## 🧪 Test Demo Feature (No Login Required)

### 1. Open Application
Navigate to: http://localhost:5000

### 2. Scroll to Demo Section
Look for "Try Our Demo" section on landing page

### 3. Upload PDF
- Click **"Select PDF"** button
- Choose any PDF document (contract, agreement, etc.)
- Click **"Analyze Document"**
- Wait 15-30 seconds for AI processing

### 4. View Summary
- Summary will appear automatically
- Shows key points extracted by AI

### 5. Ask Questions
- Type question in text box (e.g., "What are the payment terms?")
- Press Enter or click Send button
- Get AI-powered answer
- You have 5 questions in demo mode

### 6. Demo Limits
- ✅ 1 document upload per 30 minutes
- ✅ 5 questions per document
- ✅ Data deleted after 30 minutes

---

## 🔑 Test User Registration

### 1. Go to Login Page
Navigate to: http://localhost:5000/login

### 2. Click "Sign Up" Tab

### 3. Test Validation
Try these to see error messages:

**Short Name:**
- Name: "A"
- Error: ❌ "Full name must be at least 2 characters long"

**Invalid Email:**
- Email: "notanemail"
- Error: ❌ "Invalid email address"

**Short Password:**
- Password: "123"
- Error: ❌ "Password must be at least 6 characters long"

**Password Mismatch:**
- Password: "password123"
- Confirm: "password456"
- Error: ❌ "Passwords do not match"

### 4. Valid Registration
Fill in:
- Full Name: "John Doe"
- Email: "john.admin@test.com" (use "admin" for admin role)
- Password: "password123"
- Confirm Password: "password123"
- Click "Create Account"

Success: ✅ Redirects to `/dashboard/admin`

---

## 🔐 Test Login

### 1. Go to Login Page
http://localhost:5000/login

### 2. Try Wrong Credentials
- Email: "wrong@email.com"
- Password: "wrongpass"
- Error: ❌ "Invalid email or password"

### 3. Login with Valid Credentials
- Email: "john.admin@test.com"
- Password: "password123"
- Success: ✅ Redirects to dashboard

---

## 📊 Test Dashboard Features

### Admin Dashboard (`/dashboard/admin`)
Access: http://localhost:5000/dashboard/admin

**Features to Test:**
1. ✅ View statistics (documents, users, matters)
2. ✅ See recent activity
3. ✅ Upload documents
4. ✅ Access AI Assistant (firm-wide)
5. ✅ Navigate to different pages

### Lawyer Dashboard (`/dashboard/lawyer`)
Access: http://localhost:5000/dashboard/lawyer

**Features to Test:**
1. ✅ View active matters
2. ✅ Recent documents
3. ✅ Upload documents
4. ✅ Chat with documents
5. ✅ Access templates

### Paralegal Dashboard (`/dashboard/paralegal`)
Access: http://localhost:5000/dashboard/paralegal

**Features to Test:**
1. ✅ View upload queue
2. ✅ See tasks
3. ✅ Upload documents

---

## 🔍 API Testing (Using Browser or Postman)

### Health Check
```
GET http://localhost:8001/api/health
```
Expected: `{"status": "healthy", "timestamp": "..."}`

### Demo Upload (No Auth)
```
POST http://localhost:8001/api/demo/upload
Content-Type: multipart/form-data
Body: file=<PDF file>
```
Expected: `{"document_id": "...", "summary": [...], ...}`

### Demo Chat (No Auth)
```
POST http://localhost:8001/api/demo/chat
Content-Type: application/json
Body: {
  "question": "What is this document about?",
  "text": "<document text>",
  "document_id": "...",
  "session_id": "..."
}
```
Expected: `{"answer": "...", "questions_remaining": 5}`

### Register User
```
POST http://localhost:8001/api/auth/register
Content-Type: application/json
Body: {
  "email": "test@example.com",
  "password": "password123",
  "full_name": "Test User",
  "role": "lawyer"
}
```
Expected: `{"access_token": "...", "user": {...}}`

### Login
```
POST http://localhost:8001/api/auth/login
Content-Type: application/json
Body: {
  "email": "test@example.com",
  "password": "password123"
}
```
Expected: `{"access_token": "...", "user": {...}}`

---

## 🐛 Troubleshooting

### Frontend Not Loading
```powershell
# Check if running
netstat -ano | findstr ":5000"

# Restart
cd client
npm run dev
```

### Backend Not Responding
```powershell
# Check if running
netstat -ano | findstr ":8001"

# Restart
.venv\Scripts\activate
python -m uvicorn server.main:app --host 127.0.0.1 --port 8001
```

### Database Connection Error
```powershell
# Check PostgreSQL is running
Get-Service -Name postgresql*

# Start if stopped
Start-Service postgresql-x64-17
```

### API 404 Errors
- Check Vite proxy configuration in `client/vite.config.js`
- Should point to `http://localhost:8001`
- Restart frontend after changes

### Upload Not Working
- Check browser console for errors (F12)
- Verify backend is running and accessible
- Check file is valid PDF
- Look at backend terminal for error logs

---

## 📝 Common Issues & Solutions

### Issue: "Demo limit reached"
**Solution**: Wait 30 minutes or create an account

### Issue: "Email already registered"
**Solution**: Use different email or login with existing account

### Issue: "Failed to upload document"
**Solution**: 
- Check file is PDF
- Check backend is running
- Check server logs for errors

### Issue: "Invalid email or password"
**Solution**:
- Verify email is correct
- Check password matches registration
- Use "Forgot Password" if needed

### Issue: Redirected to wrong dashboard
**Solution**: Dashboard is based on email:
- `*admin*@*` → Admin Dashboard
- `*lawyer*@*` → Lawyer Dashboard
- `*paralegal*@*` → Paralegal Dashboard

---

## ✨ Expected Behavior

### Demo Flow (No Login)
1. Upload PDF → 15-30s processing → Summary appears ✅
2. Ask question → 2-5s → AI answer appears ✅
3. Continue asking (max 5 questions) ✅
4. After 30 minutes → Document deleted automatically ✅

### Authenticated Flow (After Login)
1. Upload PDF → Background processing → Notified when done ✅
2. View documents → Click document → See full analysis ✅
3. Chat with document → Unlimited questions ✅
4. Access templates, matters, clients ✅
5. Use AI Assistant for firm-wide queries ✅

---

## 🎯 Key Features Working

✅ Demo document upload without login
✅ AI-powered summary generation
✅ Document Q&A (RAG)
✅ User registration with validation
✅ User login with proper error messages
✅ Role-based dashboard access
✅ Multi-provider AI (Perplexity configured)
✅ PostgreSQL database integration
✅ API documentation at /docs

---

Ready to test! 🚀
