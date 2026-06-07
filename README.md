# Life Manager

Life Manager is a session-based web application designed to help you organize your life. Track your goals by skill, manage sub-goals on a timeline, handle daily tasks, and maintain your bucket list. Everything is kept locally, and you can easily export or import your data as JSON.

## Key Features

- **Dashboard**: Get a quick overview of your life, stats, and upcoming tasks.
- **Goals Tracking**: Organize your goals by skill and break them down into actionable sub-goals.
- **Task Management**: Keep track of daily and upcoming tasks with due dates.
- **Bucket List**: Maintain a list of things you want to experience or achieve.
- **Calendar View**: Visualize your tasks and goals on a monthly timeline.
- **Skills Tracking**: Monitor the skills you're developing and associate goals with them.
- **Data Export/Import**: Full control over your data with JSON export and import capabilities.
- **Offline First**: Session-based local storage ensures your data is yours and always available.

## Tech Stack

This project is built using a modern React ecosystem:

- **Framework**: React 19 with TanStack Start
- **Routing**: TanStack Router
- **State Management**: TanStack React Query & Local Context
- **Styling**: TailwindCSS 4
- **UI Components**: Radix UI primitives with shadcn/ui-inspired design
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Package Manager**: Bun

## Getting Started

### Prerequisites

Ensure you have [Bun](https://bun.sh/) installed on your machine.

### Installation

1. Clone the repository
2. Install dependencies using Bun:

```bash
bun install
```

### Development

Start the development server with Hot Module Replacement (HMR):

```bash
bun run dev
```

The app will be available at `http://localhost:5173` (or the port specified by Vite).

### Building for Production

Build the application for production:

```bash
bun run build
```

To preview the production build locally:

```bash
bun run preview
```

## Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run build:dev` - Build in development mode
- `bun run preview` - Preview production build
- `bun run lint` - Run ESLint
- `bun run format` - Format code with Prettier
