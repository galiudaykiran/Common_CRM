# Common_CRM — Multi-Tenant Business & Shop Management Platform

A modern, production-grade Multi-Tenant Retail & CRM Management Platform built with **Spring Boot 3 (Java 21)** and **React 19 (TypeScript + Vite)**.

---

## 🌟 Key Features

- **Multi-Tenant Architecture**: Strict tenant isolation across Platform Admins, Shop Holders/Owners, and Store Staff.
- **Role-Based Access Control (RBAC)**: Fine-grained security for `PLATFORM_ADMIN`, `SHOP_OWNER`, `STORE_MANAGER`, `CASHIER`, `SALES_ASSOCIATE`, and `INVENTORY_CLERK`.
- **Shop Holder & Employee Operations**:
  - Employee lifecycle management (salaries, phone, addresses, role permissions).
  - Dedicated Shop-scoped employee login with custom Store IDs (e.g. `NAG_11`).
  - View hierarchy safeguards preventing staff from accessing store management dashboards, tax settings, or employee directories.
- **Inventory & Stock Management**:
  - Double-entry stock movement ledger with immutable transaction tracking.
  - Valuation summary (cost and retail), low-stock reorder alerts, and shrinkage adjustments.
  - Multi-category product catalog with EAN/UPC barcode support.
- **Barcode & EAN Scanner Suite**:
  - **Live Camera Scanner**: Green laser targeting overlay with Web Audio API POS register chime.
  - **Wireless Mobile Scanner Bridge (QR Sync)**: Scan a QR code on your PC to turn any smartphone into a high-speed wireless barcode scanner gun with zero app downloads.
  - **Native Hardware Compatibility**: Seamless HID keyboard wedge mode for wireless 2.4GHz / Bluetooth handheld barcode guns.

---

## 🛠️ Technology Stack

### Backend
- **Framework**: Spring Boot 3.3.5 / Java 21
- **Database**: MySQL 8.0 & Hibernate 6 Spatial
- **Security**: Spring Security 6 with stateless JWT authentication
- **Caching & Async**: Redis & Apache Kafka support
- **API Documentation**: OpenAPI 3 / Swagger UI (`/swagger-ui.html`)

### Frontend
- **Framework**: React 19 with TypeScript
- **Bundler**: Vite
- **Icons**: Lucide React
- **Scanning**: HTML5-QRCode with Web Audio API

---

## 🚀 Getting Started

### 1. Prerequisites
- Java 21 (JDK)
- Node.js 20+ & npm
- MySQL 8.0 running on `localhost:3306`

### 2. Backend Setup
```bash
cd backend
mvn clean install -DskipTests
mvn spring-boot:run
```
Backend runs on `http://localhost:8080`.

### 3. Frontend Setup
```bash
cd webapp
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.
