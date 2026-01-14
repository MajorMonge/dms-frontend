# SocialToast DMS - Frontend App

A Progressive Web App (PWA) for a Document Management System with secure and scalable document storage on the cloud.

## Tech Stack

- **Framework**: Next.js 16+ (App Router)
- **Styling**: Tailwind CSS v4 + DaisyUI
- **Language**: TypeScript
- **State Management**: Nanostores + TanStack React Query v5
- **Animations**: Framer Motion
- **PWA**: next-pwa

## Features

- 📁 File browser with folder navigation
- 🔍 Global search with filters (type, size, date)
- 📤 File uploads with progress tracking
- 🗑️ Trash with restore/permanent delete
- 📊 Storage usage tracking
- ♾️ Infinite scroll pagination
- 🔄 Sorting (name, modified, created, size)
- 📱 Responsive design with mobile drawer
- ⌨️ Keyboard shortcuts (Ctrl+K for search)

## Getting Started

First, copy the environment example and configure your variables:

```bash
cp .env.example .env.local
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:30000/` |
| `NEXT_PUBLIC_MAX_FILE_SIZE_MB` | Max file upload size in MB | `25` |
| `NEXT_PUBLIC_ALLOWED_FILE_TYPES` | Comma-separated allowed file extensions | See `.env.example` |

## Project Structure

```
src/
├── app/           # Next.js App Router pages
│   ├── (auth)/    # Authentication pages (login, register, etc.)
│   └── (main)/    # Main app pages (files, trash, settings)
├── components/    # Reusable UI components
├── hooks/         # Custom React hooks
├── lib/           # Utility functions and API clients
│   ├── api/       # API functions and React Query hooks
│   └── validations/ # Zod validation schemas
├── middleware/    # Auth and route middleware
├── store/         # Nanostores state management
├── styles/        # Global styles (SCSS)
└── types/         # TypeScript type definitions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Deployment

This app is configured for deployment on [Fly.io](https://fly.io). Push to `main` branch triggers automatic deployment via GitHub Actions.

```bash
# Manual deployment
fly deploy
```

## PWA Features

This app is configured as a Progressive Web App with:
- Service worker for offline support (production only)
- Web app manifest for installability
- Optimized caching strategies

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [DaisyUI Components](https://daisyui.com/components/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Nanostores](https://github.com/nanostores/nanostores)
