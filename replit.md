# ToxiShield-X IoT Monitoring System

## Overview

ToxiShield-X is a real-time IoT monitoring system designed to track environmental sensor data from multiple devices. It provides a web-based dashboard for monitoring device status, viewing real-time data, and managing device configurations. The project aims to deliver a robust, scalable, and user-friendly platform for IoT device management and environmental data visualization.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Bug Fixes and Improvements (August 2025)

### Comprehensive Bug Resolution & Feature Enhancement Completed (August 7, 2025)
- **Animated Welcome Screen**: Implemented colorful letter-by-letter "Welcome!" animation with particle explosion effects, background color waves, and smooth transitions. Shows once per browser session with 7-second duration
- **WebSocket Connection Fixes**: Resolved WebSocket URL construction issues causing "undefined" port errors, improved connection reliability with proper host detection
- **Accessibility Compliance**: Added missing DialogDescription components to all Dialog modals for full accessibility compliance
- **Error Handling Improvements**: Enhanced global error handling with comprehensive unhandled promise rejection management, improved WebSocket connection error handling, PIN verification network errors, export functionality errors, MQTT client operation errors, and visitor tracking error details
- **Race Condition Fixes**: Resolved device data fetching race conditions using Promise.all, improved async operation handling to prevent unhandled promise rejections
- **Memory Leak Prevention**: Added cleanup function for session tracking interval, implemented comprehensive global unhandled promise rejection handlers
- **Null Safety Improvements**: Added null checks for IP lookup data, enhanced MQTT message parsing, improved device card data parsing
- **Code Quality**: Removed console.log statements, cleaned up dead code, improved error message consistency, updated browserslist database
- **Build Stability**: All TypeScript compilation passes, build process completes successfully, application runs without runtime exceptions
- **System Status**: Application confirmed running smoothly without console errors or warnings

## System Architecture

The application follows a full-stack architecture with clear separation between frontend and backend components, emphasizing real-time data flow and a modern UI/UX.

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI/UX Decisions**:
    - **Animated Welcome Screen**: Colorful "Welcome!" animation with particle effects, letter-by-letter scaling, background waves, and smooth transitions. Displays once per session for 7 seconds using Montserrat font and HSL rainbow colors.
    - Modern card designs with rounded corners, shadows, and gradient backgrounds.
    - Color-coded status indicators with meaningful icons.
    - Gradient buttons with hover effects.
    - Custom confirmation dialogs with center-screen positioning.
    - Professional color scheme with blue/purple gradients for actions and red for danger zones.
    - Responsive design for dashboard and admin pages, utilizing adaptive grid layouts and mobile-friendly components.
    - Branding badge "Powered by Clino Health Innovation" for compliance, clickable and redirects to https://www.clinohealthinnovation.com/.
- **Components**: Radix UI with shadcn/ui styling, Tailwind CSS for theming.
- **State Management**: TanStack Query for server state.
- **Routing**: Wouter for client-side routing.
- **Build Tool**: Vite.

### Backend Architecture
- **Runtime**: Node.js with Express.js framework.
- **Language**: TypeScript with ES modules.
- **API Pattern**: RESTful APIs with real-time WebSocket support.
- **Real-time Communication**: Custom WebSocket implementation for device updates and sensor data broadcasts, with automatic reconnection.
- **Data Flow**: Implemented MQTT Broker → Server MQTT Client → Database → WebSocket → Frontend pipeline for real-time data.
- **Data Layer**:
    - **ORM**: Drizzle ORM for type-safe operations.
    - **Database**: MySQL.
    - **Schema**: Defined in `shared/schema.ts` with Zod validation.
    - **Storage**: DatabaseStorage class with MySQL integration and MemStorage fallback.
- **Feature Specifications**:
    - Real-time device monitoring with status indicators and sensor data display.
    - Comprehensive admin panel for device management (create, edit, delete), including PIN protection and configuration.
    - Data cleanup system with manual and scheduled options for historical data.
    - History page with pagination, date filtering, and Excel export functionality.
    - Smart data parsing to extract sensor values from various message formats.
    - **Session-based visitor tracking**: Unique session tracking that registers each visitor once per session (30-minute window), preventing duplicate entries while allowing revisit tracking.
    - **Enhanced browser visualization**: Real browser logos (Chrome, Firefox, Edge, Safari, Mobile Chrome) displayed in visitor activity with proper aspect ratio maintenance.
    - **Real-time visitor updates**: WebSocket-powered instant visitor activity updates without page refresh, showing visits in Indian Standard Time.
    - **Visitor data management**: Clear All button in visitor activity section to remove all previous visitor logs from database, positioned left of refresh button.
    - **Clickable IP Address Lookup**: Interactive IP addresses in visitor lists that open detailed popup dialogs with comprehensive geolocation, ISP, security indicators, and network information. Uses server-side proxy for reliable data fetching and IST time formatting.
    - **Secure PIN Authentication**: Database-stored admin PIN with secure server-side verification. PIN is stored in gmr_db MySQL database in admin_settings table and verified via secure API endpoint, preventing frontend exposure and browser console access.
    - **Clickable GMR Logo**: Header GMR logo is clickable and redirects to https://www.gmrgroup.in/ in a new tab with clean hover effects, no focus ring, proper security attributes and accessibility features.

### Key Components
- **Device Management**: Registration, status updates (auto-online on creation/update).
- **Data Ingestion**: Sensor data stored in MySQL.
- **UI Components**: Device cards, dashboard, admin panel, analytics.

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database driver (note: mentioned as PostgreSQL, but MySQL is used).
- **drizzle-orm**: Type-safe ORM.
- **@tanstack/react-query**: Server state management.
- **wouter**: React router.
- **ws**: WebSocket implementation for Node.js.

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives.
- **tailwindcss**: Utility-first CSS framework.
- **lucide-react**: Icon library.
- **recharts**: Data visualization components.

### Development Dependencies
- **vite**: Build tool and development server.
- **tsx**: TypeScript execution for Node.js.
- **esbuild**: JavaScript bundler for production builds.

### Integrated Services
- **MQTT Brokers**: Real MQTT connections to multiple brokers (e.g., 98.130.28.156:8084, broker.hivemq.com) for live data.
- **MySQL Database**: External database at 98.130.6.200 for data persistence.