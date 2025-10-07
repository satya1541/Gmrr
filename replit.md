# ToxiShield-X IoT Monitoring System

## Overview

ToxiShield-X is a real-time IoT monitoring system for tracking environmental sensor data from multiple devices. It provides a web-based dashboard for monitoring device status, viewing real-time data, and managing device configurations. The project aims to deliver a robust, scalable, and user-friendly platform for IoT device management and environmental data visualization, with a business vision to offer comprehensive environmental monitoring solutions and expand into various IoT sectors.

## Recent Changes

**October 6, 2025** - Comprehensive Glassmorphic Design System:
- Implemented complete glassmorphic design system across entire application
- Enhanced CSS with glassmorphic utilities: glass, glass-card, glass-button, glass-input, glass-dialog, glass-header
- Updated all UI components (Card, Button, Input, Badge, Select, Dialog) with glassmorphic variants
- Transformed custom dialogs (Error, Success, Confirmation) with glassmorphic effects
- Applied glassmorphic design to all pages (Dashboard, History, Admin, Not Found)
- Enhanced Header and Footer with glassmorphic styling
- Updated DeviceCard, ChartModal, and all interactive components
- Full light/dark mode support with optimized glassmorphic effects for both themes
- Design features: semi-transparent backgrounds, backdrop blur, subtle borders, layered depth, smooth transitions

**October 6, 2025** - Database Migration:
- Migrated from JSON-based `raw_data` column to dedicated `alcohol_level` (int) and `alert_status` (varchar) columns for better performance and data integrity
- Successfully migrated 358 existing records
- Removed `raw_data` column from database schema and MySQL database
- Excel exports now use dedicated columns while maintaining privacy (no Owner ID or MAC Address exposure)
- Alert status thresholds: Normal (<1700), Moderate Drunk (1700-2499), Completely Drunk (≥2500)

## User Preferences

Preferred communication style: Simple, everyday language.
UI Preferences: Tour control buttons hidden.
Admin Interface: Removed Danger Zone card, compacted Manage Cleanup card.

## System Architecture

The application follows a full-stack architecture with clear separation between frontend and backend components, emphasizing real-time data flow and a modern UI/UX.

### Frontend Architecture
- **Framework**: React 18 with TypeScript.
- **UI/UX Decisions**:
    - Animated Welcome Screen: Colorful "Welcome!" animation with particle effects, letter-by-letter scaling, background waves, and smooth transitions. Displays once per session for 7 seconds.
    - Comprehensive Glassmorphic Design System: Semi-transparent backgrounds with backdrop blur effects, subtle borders, layered depth, and smooth transitions across all components.
    - Modern card designs with glassmorphic effects, rounded corners, and subtle shadows.
    - Color-coded status indicators with meaningful icons.
    - Glassmorphic buttons with hover effects and gradient overlays.
    - Custom confirmation dialogs with glassmorphic styling and center-screen positioning.
    - Professional color scheme with blue/purple gradients for actions and red for danger zones.
    - Full light/dark mode support optimized for glassmorphic effects.
    - Responsive design for dashboard and admin pages, utilizing adaptive grid layouts and mobile-friendly components.
    - Branding badge "Powered by Clino Health Innovation", clickable and redirects to https://www.clinohealthinnovation.com/.
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
    - Automatic sequential device ID assignment: System automatically ensures new devices get sequential IDs without gaps, eliminating the need for manual ID counter resets.
    - Data cleanup system with manual and scheduled options for historical data, specifically designed to delete ALL device data every 2 days at 12:00 AM IST.
    - History page with pagination, date filtering, and Excel export functionality.
    - Smart data parsing to extract sensor values from various message formats.
    - Session-based visitor tracking: Unique session tracking (30-minute window) preventing duplicate entries while allowing revisit tracking.
    - Enhanced browser visualization: Real browser logos displayed in visitor activity.
    - Real-time visitor updates via WebSocket, showing visits in Indian Standard Time.
    - Visitor data management: "Clear All" button to remove previous visitor logs.
    - Clickable IP Address Lookup: Interactive IP addresses in visitor lists opening detailed popups with geolocation, ISP, security indicators, and network information via server-side proxy.
    - Secure PIN Authentication: Database-stored admin PIN with secure server-side verification.
    - Clickable GMR Logo: Header GMR logo redirects to https://www.gmrgroup.in/ in a new tab.

### Key Components
- **Device Management**: Registration, status updates (auto-online on creation/update).
- **Data Ingestion**: Sensor data stored in MySQL.
- **UI Components**: Device cards, dashboard, admin panel, analytics.

## External Dependencies

### Core Dependencies
- **drizzle-orm**: Type-safe ORM.
- **@tanstack/react-query**: Server state management.
- **wouter**: React router.
- **ws**: WebSocket implementation for Node.js.

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives.
- **tailwindcss**: Utility-first CSS framework.
- **lucide-react**: Icon library.
- **recharts**: Data visualization components.

### Integrated Services
- **MQTT Brokers**: Real MQTT connections to multiple brokers (e.g., 98.130.28.156:8084, broker.hivemq.com) for live data.
- **MySQL Database**: External database at 98.130.6.200 for data persistence.