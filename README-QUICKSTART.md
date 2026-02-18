# HR Platform CRM - Quick Start Guide

Enterprise HR & CRM Platform with separated API and Web architecture.

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Node.js 18+ installed
- Yarn installed (`npm install -g yarn`)
- Git installed

### 1. Install Dependencies
```bash
# From root directory
yarn install
```

This installs dependencies for:
- NestJS API (`apps/api`)
- Next.js Web (`apps/web`)
- All shared packages (`packages/*`)

### 2. Setup Environment Variables

**API (.env already created):**
```bash
# File: apps/api/.env
# Already configured with database credentials
# No changes needed for local development
```

**Web (.env.local already exists):**
```bash
# File: apps/web/.env.local
# Already configured with API URL
# No changes needed for local development
```

### 3. Run the Application

**Option A: Two Terminals (Recommended)**

Terminal 1 - Start API:
```bash
cd apps/api
yarn dev
```
✅ API running on http://localhost:4000

Terminal 2 - Start Web:
```bash
cd apps/web
yarn dev
```
✅ Web running on http://localhost:3000

**Option B: Use PM2 (Alternative)**
```bash
# Install PM2 globally
npm install -g pm2

# From root directory
pm2 start apps/api/dist/main.js --name api
pm2 start apps/web --name web -- dev

# View logs
pm2 logs

# Stop all
pm2 stop all
```

### 4. Test the Application

1. **Visit:** http://localhost:3000/register
2. **Create Account:**
   - Email: your@email.com
   - Password: Password123!
   - First Name: Your Name
   - Company: Your Company
3. **Submit** → Should redirect to dashboard
4. **Verify:** Your name appears in top-right corner
5. **Logout:** Click profile menu → Sign Out
6. **Login Again:** Should work!

### 5. View API Documentation

Visit http://localhost:4000/api/docs to see Swagger UI with all endpoints.

---

## 📖 Full Documentation

- **[Testing Guide](TESTING-GUIDE.md)** - Complete testing checklist
- **[Architecture Summary](API-WEB-SEPARATION-SUMMARY.md)** - Full implementation details
- **[API Documentation](http://localhost:4000/api/docs)** - Interactive Swagger docs (when API is running)

---

## 🏗️ Project Structure

```
CRM-repo/
├── apps/
│   ├── api/          # NestJS Backend (Port 4000)
│   └── web/          # Next.js Frontend (Port 3000)
├── packages/
│   ├── shared/       # Shared types & enums
│   ├── validation/   # Zod schemas
│   ├── testing/      # Test utilities
│   └── database/     # Prisma client
└── Documentation files...
```

---

## 🔧 Useful Commands

### Development
```bash
# Start API in dev mode
cd apps/api && yarn dev

# Start Web in dev mode
cd apps/web && yarn dev

# Run both (if configured in root package.json)
yarn dev
```

### Building
```bash
# Build API
cd apps/api && yarn build

# Build Web
cd apps/web && yarn build
```

### Database
```bash
# Generate Prisma client
cd packages/database && yarn prisma generate

# Run migrations
cd packages/database && yarn prisma migrate dev

# Open Prisma Studio
cd packages/database && yarn prisma studio
```

### Testing
```bash
# Run API tests
cd apps/api && yarn test

# Run API e2e tests
cd apps/api && yarn test:e2e

# Run Web tests
cd apps/web && yarn test
```

---

## 🌐 URLs (When Running)

| Service | URL | Description |
|---------|-----|-------------|
| **Web App** | http://localhost:3000 | Next.js frontend |
| **API** | http://localhost:4000 | NestJS backend |
| **Swagger** | http://localhost:4000/api/docs | API documentation |
| **Health** | http://localhost:4000/api/v1/health | Health check |

---

## 🆘 Troubleshooting

### API Won't Start
- ✅ Check `apps/api/.env` exists
- ✅ Verify database connection in `.env`
- ✅ Run `yarn install` in root

### Web Won't Start
- ✅ Check `apps/web/.env.local` exists
- ✅ Verify `NEXT_PUBLIC_API_URL` is set
- ✅ Run `yarn install` in root

### Can't Login/Register
- ✅ Verify API is running on port 4000
- ✅ Check browser DevTools Network tab for errors
- ✅ Visit http://localhost:4000/api/v1/health to test API

### Tokens Not Persisting
- ✅ Check browser cookies (DevTools → Application → Cookies)
- ✅ Check localStorage (DevTools → Application → Local Storage)
- ✅ Clear all storage and try again

---

## 📝 Default Accounts

No default accounts. You must register a new account on first use.

**First User:**
- Will be created as `COMPANY_ADMIN`
- Will create a new company
- Will have full access to all features

---

## 🔐 Security Notes

**For Development:**
- JWT secrets are in `.env` files (DO NOT COMMIT)
- Database credentials are in `.env` files (DO NOT COMMIT)
- CORS allows localhost only

**For Production:**
- Use environment variables, not `.env` files
- Use strong, randomly generated JWT secrets
- Configure CORS for your production domain only
- Enable HTTPS
- Use secure database credentials

---

## 🎯 What's Next?

After getting the app running:

1. ✅ Read the [Testing Guide](TESTING-GUIDE.md)
2. ✅ Explore the [API Documentation](http://localhost:4000/api/docs)
3. ✅ Read the [Architecture Summary](API-WEB-SEPARATION-SUMMARY.md)
4. ✅ Start building new features!

---

## 💡 Tips

- **Use Swagger UI** for testing API endpoints interactively
- **Check Network Tab** in DevTools to see API requests
- **View Console** for any frontend errors
- **Read Logs** in terminal for backend errors
- **Use Postman** or similar for advanced API testing

---

## 📞 Support

For issues or questions:
1. Check the [Testing Guide](TESTING-GUIDE.md)
2. Check the [Architecture Summary](API-WEB-SEPARATION-SUMMARY.md)
3. Review API docs at http://localhost:4000/api/docs
4. Check terminal logs for errors

---

**Happy Coding! 🚀**

Built with ❤️ using NestJS, Next.js, Prisma, and TypeScript
