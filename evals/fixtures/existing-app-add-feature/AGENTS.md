# Notification App

An application that handles orders and sends email notifications.

## Project Structure

- `src/` - Frontend source code
- `src/lib/base44.ts` - Base44 SDK client
- `base44/` - Base44 configuration
- `base44/entities/` - Entity definitions (User, Order)
- `base44/functions/` - Backend functions (to be created)

## Existing Entities

- **User**: email, name, notification_preferences
- **Order**: user_id, items, status, total

## Available Skills

- **base44-cli**: CLI for managing Base44 entities, functions, and deployment
- **base44-sdk**: SDK for building features with Base44 APIs
