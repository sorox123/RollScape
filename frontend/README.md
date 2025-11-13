# RollScape Frontend

The Next.js frontend for RollScape.

## Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
frontend/
├── components/      # React components
│   ├── ui/         # shadcn/ui components
│   ├── game/       # Game-specific components
│   └── layout/     # Layout components
├── pages/          # Next.js pages
│   ├── _app.tsx
│   ├── index.tsx
│   └── api/
├── lib/            # Utilities
│   ├── api.ts      # API client
│   └── socket.ts   # Socket.io client
└── styles/         # Global styles
    └── globals.css
```

## Building for Production

```bash
npm run build
npm start
```

## Testing

```bash
npm test
```

## Styling

This project uses:
- **Tailwind CSS** for utility-first styling
- **shadcn/ui** for pre-built components
- **Radix UI** for unstyled, accessible components

## Socket.io Integration

Real-time features use Socket.io for:
- Game state synchronization
- Chat messages
- Turn notifications
- Dice rolls
