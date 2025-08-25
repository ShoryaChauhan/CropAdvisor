# Overview

CropAdviser is a smart farming application that provides personalized crop recommendations based on location and soil type. The application helps farmers make informed decisions by combining local weather data with agricultural insights, offering specific guidance on irrigation, fertilization, and pest control for optimal crop yields.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom theme variables and responsive design
- **State Management**: TanStack Query for server state and caching
- **Routing**: Wouter for client-side routing
- **Component Structure**: Modular components including CropCard, LocationSelector, and WeatherCard

## Backend Architecture
- **Runtime**: Node.js with Express server
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Session Management**: Express sessions with PostgreSQL storage
- **API Design**: RESTful endpoints with proper error handling and request logging
- **File Structure**: Separation of concerns with dedicated routes, storage, and database modules

## Data Storage
- **Database**: PostgreSQL with Neon serverless driver
- **Schema Design**: 
  - Users table for authentication and profile data
  - States and soil types for location-based recommendations
  - Crops table with compatibility information
  - Weather data for real-time conditions
  - Crop recommendations with compatibility scoring
- **Migrations**: Drizzle Kit for schema management and migrations
- **Connection Pooling**: Neon serverless pool for efficient database connections

## Authentication & Authorization
- **Provider**: Replit Auth with OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions with connect-pg-simple
- **Security**: HTTP-only cookies with secure settings and CSRF protection
- **User Management**: Automatic user creation and profile management
- **Protected Routes**: Middleware-based authentication checks for API endpoints

## Key Features
- **Location-Based Recommendations**: State and soil type selection for personalized advice
- **Weather Integration**: Real-time weather data display with forecast information
- **Crop Compatibility Scoring**: Algorithm-based matching of crops to soil types
- **Agricultural Guidance**: Detailed recommendations for irrigation, fertilization, and pest control
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Database Initialization**: Automatic seeding of states, soil types, and crop data

# External Dependencies

## Authentication Services
- **Replit Auth**: OpenID Connect provider for user authentication and authorization
- **OpenID Client**: Passport strategy for handling OAuth flows and token management

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database operations and schema management
- **Connect PG Simple**: PostgreSQL session store for Express sessions

## UI Framework & Styling
- **Radix UI**: Unstyled, accessible UI primitives for complex components
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide Icons**: Icon library for consistent visual elements
- **Class Variance Authority**: Utility for creating component variants

## Development Tools
- **Vite**: Fast build tool with HMR and TypeScript support
- **TanStack Query**: Server state management and caching solution
- **React Hook Form**: Form validation and state management
- **Zod**: Schema validation for type-safe data handling

## Runtime Dependencies
- **Express**: Web application framework for API endpoints
- **WebSocket**: Real-time connection support via ws library
- **Date-fns**: Date manipulation and formatting utilities
- **Memoizee**: Function memoization for performance optimization