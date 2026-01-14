# SocialToast DMS - Frontend App

A Progressive Web App (PWA) for a Document Management System with secure and scalable document storage on the cloud.

## Tech Stack

- **Framework**: Next.js 16+ (App Router)
- **Styling**: Tailwind CSS v4 + DaisyUI
- **Language**: TypeScript
- **PWA**: next-pwa

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
src/
├── app/           # Next.js App Router pages
├── components/    # Reusable UI components
├── lib/           # Utility functions and helpers
├── hooks/         # Custom React hooks
├── types/         # TypeScript type definitions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## PWA Features

This app is configured as a Progressive Web App with:
- Service worker for offline support (production only)
- Web app manifest for installability
- Optimized caching strategies

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [DaisyUI Components](https://daisyui.com/components/)
