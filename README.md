TransitOps is a comprehensive Next.js application designed for fleet and transport operations management. Built with modern web technologies, it provides a robust platform for managing transit operations efficiently.

**Note: This project was developed for the Odoo Hackathon.**

## Project Overview

TransitOps leverages a modern tech stack to deliver a seamless experience:
- **Framework:** [Next.js](https://nextjs.org/) for server-side rendering and routing.
- **Authentication:** [Clerk](https://clerk.dev/) for secure user authentication and management.
- **Database ORM:** [Prisma](https://www.prisma.io/) for type-safe database access.
- **Database:** PostgreSQL for reliable data persistence.
- **Styling:** Tailwind CSS along with Shadcn UI for a responsive and beautiful interface.
- **State Management:** Zustand for efficient client-side state handling.

## Getting Started

### Prerequisites

Make sure you have Node.js and npm (or yarn/pnpm) installed on your system. You will also need a PostgreSQL database instance and a Clerk account for authentication.

### Environment Variables

Create a `.env` file in the root directory and add your necessary environment variables (e.g., Clerk keys, Database URL). You can refer to the existing `.env` file if it contains placeholder values.

### Installation

1. Install the dependencies:

```bash
npm install
```

### Running the Application

To start the development server, run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Available Commands

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint to check for code quality.
- `npm run db:seed`: Seeds the database using Prisma.

