# ToxiShield-X IoT Monitoring System

## Overview

ToxiShield-X is a real-time IoT monitoring system designed to track environmental sensor data from multiple devices. The application provides a web-based dashboard for monitoring device status, viewing real-time data, and managing device configurations. It features a modern React frontend with a Node.js/Express backend, utilizing WebSocket connections for real-time updates and PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (July 30, 2025)

✅ **Hard Delete Device Implementation (July 30, 2025)**: Changed device deletion from soft delete to hard delete based on user request:
- Modified DatabaseStorage.deleteDevice() to use actual DELETE SQL instead of setting isActive = false
- Updated MemStorage.deleteDevice() to completely remove devices from memory
- Removed isActive filtering from getDevices() and getDeviceByDeviceId() methods
- Enhanced delete endpoint to broadcast deletion updates to WebSocket clients
- Devices are now permanently removed from database when deleted from frontend
- Verified test12345 device completely removed from database

## Previous Changes (July 30, 2025)

✅ **Compact Data Cleanup Management (July 30, 2025)**: Redesigned the Data Cleanup Management section with a modern, compact layout:
- Split section into two side-by-side cards for better space utilization
- Enhanced visual icons with color-coded status indicators (Clock, RefreshCw, Database, Calendar)
- Compact 2x2 grid layout for cleanup status information
- Modern gradient buttons with improved hover effects
- Streamlined Danger Zone card with better visual hierarchy
- Reduced vertical space usage while maintaining all functionality

✅ **Enhanced Admin Panel Access UI (July 30, 2025)**: Completely redesigned PIN protection interface with stunning visual effects:
- Beautiful gradient backgrounds with animated floating elements
- Authentic CHIPL healthcare logo with medical cross and protective hands (replacing generic icons)
- Enhanced PIN input field with visual dot indicators that fill as you type
- Modern card design with gradient borders and glass morphism effects
- Floating Key and Zap icons with bounce animations
- Professional teal/emerald/cyan gradient color scheme matching CHIPL x GMR healthcare branding
- White background circle to showcase the colorful CHIPL logo properly
- Applied consistent CHIPL branding throughout admin interface (header and PIN protection)

✅ **Modern UI/UX Redesign (July 30, 2025)**: Completely redesigned admin panel with premium visual aesthetics and improved user experience:
- Enhanced header with gradient icons and improved typography
- Modern card designs with rounded corners, shadows, and gradient backgrounds
- Beautiful color-coded status indicators with meaningful icons (CheckCircle2, AlertCircle, XCircle)
- Gradient buttons with hover effects and improved spacing
- Enhanced empty states with engaging call-to-action designs
- Custom confirmation dialogs with center-screen positioning and modern styling
- Professional color scheme with blue/purple gradients for actions and red gradients for danger zones
- Improved visual hierarchy with better spacing and typography
- Added contextual icons throughout the interface (Shield, Database, Activity, Clock)

✅ **Fixed React Hooks Violations (July 30, 2025)**: Resolved critical white screen issue after PIN authentication by restructuring admin component to separate PIN protection from main content, ensuring hooks are always called in the same order and preventing conditional hook usage that violated React's Rules of Hooks.

✅ **4-Digit PIN Protection for Admin Panel (July 30, 2025)**: Added secure PIN-based authentication to the admin page. Features include:
- Clean PIN entry interface with 4-digit numeric input
- Auto-submission when 4 digits are entered (no button click needed)
- Failed attempt tracking with automatic lockout after 3 attempts
- 30-second lockout period for security
- Beautiful security-themed UI with shield icons
- Database storage for PIN configuration
- Only authenticated users can access device management and cleanup features
- Current PIN is "1541" (stored in database)

✅ **Custom Confirmation Dialogs (July 30, 2025)**: Replaced browser's default confirm() dialogs with beautiful custom popups featuring center-screen positioning, gradient styling, warning icons for destructive actions, and consistent design language matching the application's modern aesthetic.

## Previous Changes (July 28, 2025)

✅ **Admin UI Enhancement (July 28, 2025)**: 
- Updated admin table to display "Device Name" instead of "Device ID" in header and main column for better user experience
- Device names (like "Sensor Node 1") are now prominently displayed with device IDs shown as secondary information on mobile devices
- Converted device edit form from inline to modal dialog that appears in center of screen
- Edit button now opens popup dialog instead of requiring scrolling to bottom of page
- Modal dialog has responsive design and auto-closes after successful save operation

✅ **Complete Data Cleanup System (July 28, 2025)**: Added "Clear All Device Data" button in admin panel for complete database cleanup alongside existing scheduled cleanup. Implemented proper warning UI with danger zone styling for destructive operations. Both manual cleanup (for old records) and complete data removal are now available.

✅ **Project Migration Completed (July 28, 2025)**: Successfully migrated ToxiShield-X IoT monitoring system from Replit Agent to standard Replit environment. Fixed cleanup scheduler timing configuration to user's preferred 2-day interval for both cleanup execution and data retention. All project dependencies verified and working correctly.

✅ **Enhanced Admin Panel with Cleanup Management (July 28, 2025)**: Added comprehensive data cleanup management section to admin page with real-time status display, manual cleanup trigger button, and detailed configuration information. Users can now manually trigger cleanup operations and monitor automatic scheduler status.

## Previous Changes (July 23-24, 2025)

✅ **Fixed Device Connectivity Issue**: Devices now automatically show as "online" status when created or updated, eliminating the offline issue during device configuration.

✅ **Real-time WebSocket Broadcasting**: Implemented proper WebSocket message broadcasting following the documented architecture pattern (MQTT → Database → WebSocket → Frontend).

✅ **Enhanced Device Management**: 
- Device creation automatically sets status to "online" with current timestamp
- Device updates trigger immediate status change to "online" 
- Real-time WebSocket notifications sent to all connected clients
- Frontend dashboard properly handles live device status updates

✅ **Architecture Compliance**: Implementation now follows the documented IoT monitoring architecture with proper real-time data flow and WebSocket integration.

✅ **Full MQTT Pipeline Implementation**: Successfully implemented the complete **MQTT Broker → Server MQTT Client → MySQL Database → WebSocket → Frontend** data flow:
- Real MQTT connections established to multiple brokers (98.130.28.156:8084, broker.hivemq.com)
- Live MQTT messages being received and processed from actual IoT devices
- Real-time data storage in MySQL database with proper device status management
- WebSocket broadcasting of live device updates and sensor data
- Frontend receiving authentic real-time IoT data instead of mock data

✅ **WebSocket MQTT Protocol Support**: Added support for WebSocket-based MQTT connections (ws://) for modern IoT brokers, ensuring compatibility with different MQTT implementations and enabling all devices to connect successfully.

✅ **Smart Data Parsing**: Implemented intelligent JSON message parsing that extracts sensor values from multiple field formats ("Index", "alcohol_level", "level", "value"), ensuring real-time charts display authentic IoT sensor data.

✅ **Device 1 Connectivity Fixed (July 23, 2025)**: Resolved MQTT connection issue for Device 1 by ensuring all devices use WebSocket protocol (ws://) instead of regular MQTT. All 4 devices now successfully connect and receive real-time data from IoT sensors.

✅ **Custom Popup Dialogs (July 23, 2025)**: Replaced toast notifications with custom popup dialogs that appear in the center of the screen with better visual design and detailed error messages for different scenarios.

✅ **Sticky Branding Badge (July 23, 2025)**: Added a persistent branding badge in the bottom-right corner showing "Powered by Clino Health Innovation" for compliance with licensing agreements. Badge remains visible across all pages.

✅ **Enhanced Branding Badge Size (July 23, 2025)**: Improved badge visibility by significantly increasing text size from xs to base, expanding padding to px-6 py-3, enlarging logo from h-4 to h-8, and adding more spacing for much better user experience and visibility.

✅ **Real-Time Data Display Fixed (July 23, 2025)**: Resolved critical issue where alcohol values (Index values) were showing as 0 instead of real sensor readings. Frontend now properly parses both 'alcohol_level' (processed data) and 'Index' (raw MQTT data) formats, displaying authentic real-time values like 162, 78, 243, 241 from IoT sensors.

✅ **History Page with Excel Export (July 24, 2025)**: Added comprehensive history page allowing users to view historical sensor data for each device with pagination, date filtering, and Excel export functionality. Users can download complete device data with proper timing and sensor readings in Excel format.

✅ **Navigation Security Update (July 24, 2025)**: Hidden Admin page from main navigation menu for security. Admin functionality is still accessible via direct URL (/admin) but not visible in the main navigation to prevent unauthorized access.

✅ **Automatic Data Cleanup System (July 24, 2025)**: Implemented automatic cleanup scheduler that deletes device data records older than 7 days, running every 7 days. Added cleanup management API endpoints for manual cleanup execution and status monitoring. System ensures database doesn't grow indefinitely with old sensor data while maintaining recent data for analytics.

✅ **Full Responsive Design Implementation (July 24, 2025)**: Completed comprehensive responsive design for both dashboard and admin pages. Features mobile-first approach with adaptive grid layouts, responsive device cards, mobile-friendly admin table with hidden columns on smaller screens, and optimized spacing throughout the application.

✅ **Dashboard Stats Removal (July 24, 2025)**: Removed dashboard statistics cards (Online, Waiting, Offline, Messages) per user request to simplify the interface. Dashboard now focuses solely on device monitoring cards with real-time sensor data display.

✅ **Real-Time Data Broadcasting Fix (July 24, 2025)**: Resolved critical real-time data delay issue by restructuring the MQTT message processing flow. Previously, WebSocket broadcasting was delayed by database operations (3-5 seconds). Now broadcasts sensor data immediately when MQTT messages are received, with database storage happening asynchronously. Real-time updates now display instantly on the dashboard with authentic IoT sensor values.

✅ **Console Logging Cleanup (July 24, 2025)**: Completed comprehensive cleanup of all console.log statements across the entire application for production-ready code. Removed verbose logging from MQTT client, server routes, storage operations, and API request middleware. Application now runs silently without flooding console with debugging messages while maintaining full functionality.

## System Architecture

The application follows a full-stack architecture with clear separation between frontend and backend components:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Framework**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful APIs with real-time WebSocket support
- **Development**: Hot module replacement via Vite integration

## Key Components

### Data Layer
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: MySQL (external database at 98.130.6.200)
- **Schema**: Defined in `shared/schema.ts` with Zod validation using MySQL types
- **Storage Interface**: DatabaseStorage class with MySQL integration and MemStorage fallback

### Database Schema
- **Users**: Basic user management with username/password
- **Devices**: IoT device registration with MQTT configuration
- **Device Data**: Time-series sensor data (temperature, humidity, air quality, CO2)

### Real-time Communication
- **WebSocket**: Custom WebSocket implementation for real-time device updates
- **Message Types**: Device status updates and sensor data broadcasts
- **Connection Management**: Automatic reconnection with exponential backoff

### UI Components
- **Device Cards**: Real-time status indicators with sensor data display
- **Dashboard**: Overview of all devices with status statistics
- **Admin Panel**: Device management and configuration
- **Analytics**: Data visualization with charts and historical trends

## Data Flow

1. **Device Registration**: Devices are registered through the admin panel with MQTT broker details
2. **Data Ingestion**: Sensor data flows through the backend API and is stored in PostgreSQL
3. **Real-time Updates**: WebSocket connections broadcast device status and data changes
4. **Frontend Rendering**: React components consume real-time data via TanStack Query and WebSocket hooks
5. **State Synchronization**: Client state automatically updates based on WebSocket messages

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database driver for Neon
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight React router
- **ws**: WebSocket implementation for Node.js

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **recharts**: Data visualization components

### Development Dependencies
- **vite**: Build tool and development server
- **tsx**: TypeScript execution for Node.js
- **esbuild**: JavaScript bundler for production builds

## Deployment Strategy

### Development
- **Frontend**: Vite dev server with HMR
- **Backend**: tsx with file watching for TypeScript execution
- **Database**: Requires DATABASE_URL environment variable

### Production Build
- **Frontend**: Static files built to `dist/public`
- **Backend**: Bundled with esbuild to `dist/index.js`
- **Deployment**: Single Node.js process serving both API and static files

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **NODE_ENV**: Environment indicator (development/production)
- **Port**: Configurable via environment variables

### Database Migrations
- **Tool**: Drizzle Kit for schema management
- **Command**: `npm run db:push` for schema deployment
- **Location**: Migrations stored in `./migrations` directory

The application is designed to be deployed on platforms supporting Node.js with PostgreSQL databases, with specific optimizations for Replit deployment including cartographer integration and runtime error overlays.