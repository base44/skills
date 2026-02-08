# Task Manager

A React + Vite application using Base44 for backend services.

## Project Structure

- `src/` - React source code
- `src/components/` - React components
- `src/lib/base44.ts` - Base44 SDK client
- `base44/` - Base44 configuration
- `base44/entities/` - Entity definitions (Task already exists)

## Existing Entities

- **Task**: title, description, status (pending/in_progress/completed), priority, due_date

## Available Skills

- **base44-cli**: CLI for managing Base44 entities, functions, and deployment
- **base44-sdk**: SDK for building features with Base44 APIs (entities, auth, etc.)
