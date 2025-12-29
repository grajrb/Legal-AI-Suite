# Legal AI Suite - Implementation Status & Next.js Migration Plan

## Executive Summary
Current: React + Vite + Chakra UI + FastAPI + SQLite  
Target: Next.js 14 + TypeScript + Tailwind + Framer Motion + FastAPI + Postgres/SQLite

---

## 1. IMPLEMENTATION STATUS (Current Codebase)

### ✅ Backend API (FastAPI) - Implemented

**Authentication (3/3 endpoints)**
- ✅ POST /api/auth/register - Working with JWT + Argon2
- ✅ POST /api/auth/login - Working with role-based tokens
- ✅ GET /api/auth/me - User profile fetch

**Documents (6/7 endpoints)**
- ✅ POST /api/upload - PDF upload with OCR extraction
- ✅ POST /api/chat - Q&A with 5-question demo limit
- ✅ GET /api/documents/{id} - Fetch document metadata
- ✅ DELETE /api/documents/{id} - Admin-only deletion
- ✅ POST /api/documents/{id}/extract - Stub (queues processing)
- ✅ GET /api/documents/{id}/summary - Stub (returns empty)
- ✅ GET /api/documents/{id}/clauses - Stub (returns empty)
- ✅ GET /api/documents/{id}/facts - Stub (returns empty)
- ❌ GET /api/documents/{id}/download-summary - Missing PDF export

**Dashboards (3/3 endpoints)**
- ✅ GET /api/stats - Admin/Lawyer/Paralegal stats (mock data)
- ✅ GET /api/matters - List matters by user
- ✅ POST /api/matters - Create matter
- ✅ GET /api/paralegal-tasks - Upload queue + OCR failures

**Multi-tenant (Stubs - 5/5 endpoints)**
- ✅ POST /api/firms - Create firm (stub, no persistence)
- ✅ POST /api/firms/{id}/invite - Invite user (stub)
- ✅ POST /api/clients - Create client (stub)
- ✅ GET /api/clients - List clients (stub, returns empty)
- ✅ POST /api/folders - Create folder (stub)

**Templates (3/3 endpoints)**
- ✅ GET /api/templates - List templates (SQLite-backed)
- ✅ POST /api/templates - Create template (admin)
- ✅ PUT /api/templates/{id} - Update template (stub, no versioning)

**Audit & Billing (3/3 endpoints)**
- ✅ GET /api/audit - Admin-only audit logs
- ✅ POST /api/billing/webhook/razorpay - Webhook receiver (stub)
- ✅ POST /api/billing/webhook/stripe - Webhook receiver (stub)

**Admin Assistant (1/1 endpoint)**
- ✅ POST /api/assistant/query - Structured analytics (stub)

**Health (1/1 endpoint)**
- ✅ GET /api/health - Health check

**Total: 32/33 endpoints implemented** (1 missing: PDF export)

---

### ✅ Frontend (React + Vite) - Implemented

**Pages (10/10)**
- ✅ LandingPage - Hero + features + demo CTA
- ✅ LoginPage - Signup/Login with Chakra tabs
- ✅ AdminDashboard - Stats + charts (Chart.js) + activity
- ✅ LawyerDashboard - Matters + documents requiring review
- ✅ ParalegalDashboard - Upload queue + OCR failures
- ✅ ClientsPage - List + create clients
- ✅ MattersPage - List + create matters
- ✅ FoldersPage - Create folders under matters
- ✅ TemplatesPage - List + create templates (admin)
- ✅ AdminAssistant - Query structured analytics

**Components (7/7)**
- ✅ Navbar - Role-based links + logout
- ✅ Card - Reusable wrapper
- ✅ StatCard - Dashboard metric with trend
- ✅ EmptyState - Placeholder UI
- ✅ LoadingSpinner - Loading indicator
- ✅ ProtectedRoute - RBAC enforcement
- ✅ DemoSection - Upload + 5Q limit + 30-min window

**Routing (10/10 routes)**
- ✅ / - Landing
- ✅ /login - Auth
- ✅ /dashboard/admin - Admin (protected)
- ✅ /dashboard/lawyer - Lawyer (protected)
- ✅ /dashboard/paralegal - Paralegal (protected)
- ✅ /clients - All roles
- ✅ /matters - Admin/Lawyer
- ✅ /folders - All roles
- ✅ /templates - Admin/Lawyer
- ✅ /admin/assistant - Admin only

**State Management**
- ✅ AuthContext - User + token + login/logout
- ✅ localStorage - Tokens + demo session tracking

**API Integration**
- ✅ Axios client with Bearer token injection
- ✅ Error handling (FastAPI detail format)
- ✅ Role-based endpoint access

---

### ⚠️ Partially Implemented / Stubbed

**Backend**
- ⚠️ Firms/Clients/Folders - Stubs return mock data, no Postgres persistence
- ⚠️ Document extraction pipeline - Queue stub, no real OCR/chunking/embeddings
- ⚠️ Clause extraction - No AI implementation (returns empty)
- ⚠️ Risk scoring - No AI implementation
- ⚠️ Summary generation - Mock bullets only
- ⚠️ RAG chat - Mock responses, no vector search
- ⚠️ Admin assistant - Stub analytics, no structured query engine
- ⚠️ Template versioning - PUT endpoint doesn't increment version
- ⚠️ Billing webhooks - No signature verification

**Frontend**
- ⚠️ Dashboard charts - Mock data, not wired to real analytics
- ⚠️ Document viewer - No UI to view clauses/summary/facts inline
- ⚠️ Matter dashboard - No detailed matter view with docs
- ⚠️ User management - No UI for firm admins to manage users
- ⚠️ Billing page - Not implemented

**Database**
- ⚠️ Postgres schema created but app still uses SQLite
- ⚠️ Multi-tenant isolation - No firm_id scoping in queries
- ⚠️ Embeddings - Placeholder table, no vector operations

---

### ❌ Not Implemented (MVP Gaps)

**Backend**
- ❌ Real OCR pipeline (Tesseract/Azure Form Recognizer)
- ❌ Chunking + embeddings generation
- ❌ Vector DB integration (Pinecone/Weaviate/pgvector)
- ❌ OpenAI/LLM integration for summaries/clauses/chat
- ❌ Prompt library implementation (docs/Prompts.md exists but not used)
- ❌ Background workers (Celery/RQ for async processing)
- ❌ Rate limiting (planned but not enforced)
- ❌ Firm-level scoping in JWT
- ❌ PDF export for summaries
- ❌ Document comparison (out of MVP)
- ❌ Bulk operations (out of MVP)

**Frontend**
- ❌ Document viewer with inline clauses/highlights
- ❌ Matter detail view with document list
- ❌ User management UI (invite users, assign roles)
- ❌ Billing/subscription page
- ❌ Export functionality (download summary PDFs)
- ❌ Filters/search on lists (clients, matters, docs)
- ❌ Pagination on tables
- ❌ Real-time updates (WebSockets)
- ❌ Notifications system
- ❌ Hindi language toggle (planned in MVP)

**AI/RAG**
- ❌ Real LLM integration (OpenAI/Azure OpenAI)
- ❌ Embeddings generation pipeline
- ❌ Vector search implementation
- ❌ Prompt engineering guardrails ("I don't know" behavior)
- ❌ Citation tracking (doc/page references)
- ❌ Confidence scoring
- ❌ Cost tracking (tokens/LLM calls)

**Security & Compliance**
- ❌ Signed URLs for document preview
- ❌ Data encryption at rest (beyond DB defaults)
- ❌ Audit log UI for admins
- ❌ GDPR delete workflow (complete data wipe)
- ❌ SOC2 compliance features

**Demo**
- ✅ 1-document limit (30-min window) - Implemented
- ✅ 5-question limit - Implemented
- ✅ Auto-purge job (every 5 min) - Implemented
- ❌ Demo telemetry/analytics - Not tracked
- ❌ Conversion tracking (demo → signup)

---

## 2. NEXT.JS MIGRATION STRATEGY

### Phase 1: Project Setup (Week 1)

**New Tech Stack**
- Next.js 14.2+ (App Router)
- TypeScript 5+
- Tailwind CSS 3.4+
- Framer Motion 11+
- Shadcn/ui (replaces Chakra UI)
- React Hook Form + Zod
- TanStack Query (React Query) for data fetching
- Zustand for state management
- SQLite (via better-sqlite3 for server-side)
- next-auth for authentication

**Project Structure**
```
legal-ai-next/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (dashboard)/
│   │   ├── admin/
│   │   ├── lawyer/
│   │   └── paralegal/
│   ├── clients/
│   ├── matters/
│   ├── folders/
│   ├── templates/
│   ├── api/
│   │   └── [...proxy to FastAPI]/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/ (shadcn)
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   ├── dashboard/
│   ├── documents/
│   └── shared/
├── lib/
│   ├── db.ts (SQLite)
│   ├── auth.ts
│   ├── utils.ts
│   └── api-client.ts
├── hooks/
│   ├── use-intersection-observer.ts
│   ├── use-scroll-position.ts
│   ├── use-media-query.ts
│   └── use-event-listener.ts
├── types/
└── public/
```

**Advanced UI Features to Implement**

1. **Smooth Scrolling**
```typescript
// app/layout.tsx
<html className="scroll-smooth">
// CSS: scroll-behavior: smooth

// Programmatic smooth scroll
const scrollToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ 
    behavior: 'smooth', 
    block: 'start' 
  })
}
```

2. **Intersection Observer API**
```typescript
// hooks/use-intersection-observer.ts
export function useIntersectionObserver(
  ref: RefObject<Element>,
  options?: IntersectionObserverInit
) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
    }, options)
    
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [ref, options])
  
  return isIntersecting
}

// Usage: Reveal on scroll
const sectionRef = useRef<HTMLDivElement>(null)
const isVisible = useIntersectionObserver(sectionRef, { threshold: 0.3 })

<motion.div
  ref={sectionRef}
  initial={{ opacity: 0, y: 50 }}
  animate={isVisible ? { opacity: 1, y: 0 } : {}}
  transition={{ duration: 0.6 }}
>
```

3. **Lazy Loading Images**
```typescript
// components/shared/LazyImage.tsx
import Image from 'next/image'

export function LazyImage({ src, alt, ...props }) {
  return (
    <Image
      src={src}
      alt={alt}
      loading="lazy"
      placeholder="blur"
      blurDataURL="data:image/svg+xml;base64,..."
      {...props}
    />
  )
}
```

4. **Sticky Navigation with Blur Effect**
```typescript
// components/layout/Navbar.tsx
const [isScrolled, setIsScrolled] = useState(false)

useEffect(() => {
  const handleScroll = () => {
    setIsScrolled(window.scrollY > 20)
  }
  window.addEventListener('scroll', handleScroll, { passive: true })
  return () => window.removeEventListener('scroll', handleScroll)
}, [])

<nav className={cn(
  "fixed top-0 w-full z-50 transition-all duration-300",
  isScrolled 
    ? "bg-white/80 backdrop-blur-md shadow-md" 
    : "bg-transparent"
)}>
```

5. **Event Delegation Pattern**
```typescript
// Example: Tab switching with delegation
const TabContainer = () => {
  const handleTabClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    const tab = target.closest('[data-tab]')
    if (!tab) return
    
    // Blur all tabs
    document.querySelectorAll('[data-tab]').forEach(el => {
      el.classList.remove('active', 'opacity-100')
      el.classList.add('opacity-60')
    })
    
    // Focus clicked tab
    tab.classList.add('active', 'opacity-100')
    tab.classList.remove('opacity-60')
    
    const tabId = tab.getAttribute('data-tab')
    // Show corresponding content
  }
  
  return (
    <div onClick={handleTabClick} className="flex gap-4">
      {tabs.map(tab => (
        <button 
          key={tab.id}
          data-tab={tab.id}
          className="opacity-60 hover:opacity-100 transition"
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
```

6. **DOM Traversal & Event Bubbling**
```typescript
// Prevent event bubbling
const handleCardClick = (e: React.MouseEvent) => {
  e.stopPropagation() // Stops bubbling to parent
}

// Event capturing (top-down)
useEffect(() => {
  const handler = (e: Event) => {
    console.log('Captured at parent')
  }
  element.addEventListener('click', handler, true) // capture phase
  return () => element.removeEventListener('click', handler, true)
}, [])
```

7. **Passing Arguments to Event Handlers**
```typescript
// Method 1: Arrow function
<button onClick={() => handleDelete(item.id)}>

// Method 2: Currying
const handleDelete = (id: string) => (e: React.MouseEvent) => {
  e.preventDefault()
  // Delete logic
}
<button onClick={handleDelete(item.id)}>

// Method 3: Data attributes
<button data-id={item.id} onClick={handleClick}>
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  const id = e.currentTarget.dataset.id
}
```

8. **Framer Motion Page Transitions**
```typescript
// app/template.tsx
import { motion } from 'framer-motion'

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {children}
    </motion.div>
  )
}
```

9. **Mobile Optimization**
```typescript
// hooks/use-media-query.ts
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)
  
  useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)
    
    const listener = () => setMatches(media.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [query])
  
  return matches
}

// Usage
const isMobile = useMediaQuery('(max-width: 768px)')

// Touch event handling
const handleTouchStart = (e: React.TouchEvent) => {
  const touch = e.touches[0]
  setStartX(touch.clientX)
}
```

10. **Scroll Reveal Animations**
```typescript
// components/shared/RevealOnScroll.tsx
export function RevealOnScroll({ children, delay = 0 }) {
  const ref = useRef<HTMLDivElement>(null)
  const isVisible = useIntersectionObserver(ref, { threshold: 0.2 })
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  )
}
```

---

### Phase 2: Core Migration (Week 2-3)

**Step 1: Authentication**
- Migrate AuthContext to next-auth
- JWT strategy with refresh tokens
- Protected routes via middleware
- Role-based access control

**Step 2: Pages & Layouts**
- Landing page with scroll animations
- Dashboard layouts with sticky nav
- Protected dashboard pages
- Forms with React Hook Form + Zod

**Step 3: API Integration**
- Proxy API routes to FastAPI backend
- TanStack Query for data fetching
- Optimistic updates
- Error boundaries

**Step 4: State Management**
- Replace Context API with Zustand
- Client-side caching with React Query
- Persistent state (localStorage)

---

### Phase 3: Advanced Features (Week 4)

**UI Enhancements**
- ✅ Smooth scrolling
- ✅ Intersection Observer for reveals
- ✅ Lazy loading images & components
- ✅ Sticky nav with backdrop blur
- ✅ Tab switching with event delegation
- ✅ Mobile-responsive navigation
- ✅ Touch gestures (swipe, pinch)
- ✅ Keyboard navigation
- ✅ Focus management

**Animations**
- Page transitions
- Card hover effects
- Loading skeletons
- Toast notifications
- Modal animations
- List animations (stagger)

**Performance**
- Code splitting
- Route prefetching
- Image optimization
- Bundle analysis

---

## 3. MIGRATION EXECUTION PLAN

### Immediate Actions (This Session)

1. **Create comprehensive status document** (this file)
2. **Set up Next.js project** with all dependencies
3. **Implement advanced UI patterns** (hooks + components)
4. **Migrate landing page** with full animations
5. **Create reusable component library** with Framer Motion

### Next Steps

1. Complete Postgres migration (backend)
2. Implement LLM integration (OpenAI)
3. Build document extraction pipeline
4. Add vector search (Pinecone/pgvector)
5. Implement real analytics

---

## 4. DETAILED CHECKLIST

### Backend Priorities
- [ ] Switch from SQLite to Postgres (DATABASE_URL)
- [ ] Implement firm_id scoping in all queries
- [ ] Add OpenAI integration for summaries/clauses
- [ ] Build chunking + embeddings pipeline
- [ ] Integrate vector DB for RAG
- [ ] Add background workers (Celery/RQ)
- [ ] Implement prompt library from docs/Prompts.md
- [ ] Add PDF export for summaries
- [ ] Rate limiting enforcement
- [ ] Billing webhook signature verification

### Frontend (Next.js) Priorities
- [ ] Project scaffold with TypeScript + Tailwind
- [ ] Authentication with next-auth
- [ ] Landing page with scroll animations
- [ ] Dashboard layouts (3 roles)
- [ ] Document viewer with clauses/highlights
- [ ] Matter detail view
- [ ] User management UI
- [ ] Billing page
- [ ] Mobile-optimized navigation
- [ ] All advanced UI patterns implemented

### AI/RAG Priorities
- [ ] OpenAI API integration
- [ ] Embeddings generation (OpenAI/HuggingFace)
- [ ] Vector DB setup (Pinecone recommended)
- [ ] RAG pipeline implementation
- [ ] Prompt engineering with guardrails
- [ ] Citation tracking
- [ ] Cost monitoring

---

**Want me to proceed with:**
1. Setting up the Next.js project now?
2. Migrating the landing page first with all animations?
3. Creating the advanced UI hooks library?
4. Or backend Postgres migration first?
