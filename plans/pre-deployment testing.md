 Pre-Deployment Testing Checklist

  1. Frontend Build Testing

  I found TypeScript errors during the build        
  process. Here's what to test:

  # Frontend testing commands
  cd expense-tracker-frontend

  # Clean install dependencies
  rm -rf node_modules package-lock.json
  npm install

  # Type checking
  npx tsc --noEmit

  # Production build
  npm run build

  # Preview production build locally
  npm run preview

  2. Backend Production Testing

  # Backend testing commands
  python -m venv venv
  source venv/bin/activate  # or
  .\venv\Scripts\activate on Windows

  # Install dependencies
  pip install -r requirements.txt

  # Test with production-like settings
  uvicorn main:app --host 0.0.0.0 --port 8000       
  --workers 1

  # Test database initialization
  python -c "from database import engine; from      
  models import Base;
  Base.metadata.create_all(engine)"

  3. Environment Variables Testing

  # Test different environment configurations       
  # Check .env files
  cat expense-tracker-frontend/.env

  # Test API_BASE_URL configuration
  export VITE_API_URL=http://localhost:8000
  npm run build

  4. Cross-Browser & Network Testing

  # Test with different base URLs
  export VITE_API_URL=http://127.0.0.1:8000
  npm run build && npm run preview

  # Test with production-like URL
  export VITE_API_URL=https://yourdomain.com        
  npm run build

  5. Database & File System Testing

  # Test database file permissions
  ls -la expense_tracker.db

  # Test file upload paths
  ls -la temp_uploads/

  # Test ML model loading
  python -c "import joblib;
  joblib.load('categoryFinder.pkl')"

  6. Security & Dependencies Testing

  # Check for security vulnerabilities
  npm audit
  pip check

  # Test CORS and authentication
  curl -X OPTIONS
  http://localhost:8000/expenses/

  Common Deployment Issues to Test For:

  1. Environment Variables: API_BASE_URL,
  database paths, secret keys
  2. File Paths: Absolute vs relative paths,        
  case sensitivity
  3. Port Conflicts: Default ports, firewall        
  rules
  4. Database Initialization: Auto-creation,        
  migrations
  5. Static File Serving: React build output,       
  assets
  6. CORS Configuration: Frontend-backend
  communication
  7. Authentication: JWT tokens, cookies,
  session handling