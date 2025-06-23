# Project Overview

**OnlyFund** is a full-stack crowdfunding platform that enables users to create, manage, and donate to fundraising campaigns. The application features:

- **User authentication** (including Google OAuth)
- **Fund creation and management** (with image uploads and category filtering)
- **Donation tracking and withdrawal management**
- **User profile management** (including profile image upload)
- **Smart contract integration** for transparency and security (using Hardhat and Solidity)
- **Modern UI/UX** built with Next.js, React, and TailwindCSS
- **Robust backend** with Express.js and PostgreSQL, using Sequelize ORM
- **Containerized deployment** with Docker and Nginx for scalable, production-ready hosting

The project is organized into separate services for the frontend, backend, smart contract development, and database, all orchestrated via Docker Compose for easy setup and deployment.

## Group & Project Information

- **Group:** 9
- **Members:**
  - Ngô Phúc Dương - 23520350
  - Nguyễn Thị Trúc Ly - 23520908
  - Nguyễn Thành An - 23520019
- **TikTok:** [Link video](https://www.tiktok.com/@violet_8201/video/7519035341513231637)

## Directory Structure

```
NT208.P21.ANTN-TEAM-9/
├── backend/                # Express.js backend
│   ├── Dockerfile
│   └── src/
│       ├── config.js
│       ├── db_helpers.js
│       ├── index.js
│       ├── jwt_helpers.js
│       ├── middleware/
│       │   └── auth.js
│       ├── router.js
│       ├── package.json
│       ├── package-lock.json
│       └── uploads/
├── docker-compose.yml      # Docker container orchestration
├── frontend/               # Next.js frontend
│   ├── Dockerfile
│   ├── index.html
│   └── my-app/
│       ├── assets/
│       ├── contracts/
│       ├── public/
│       ├── src/
│       │   ├── app/
│       │   ├── components/
│       │   └── ...
│       ├── tailwind.config.js
│       ├── tsconfig.json
│       └── ...
├── hardhat/                # Smart contract development
│   ├── artifacts/
│   ├── contracts/
│   ├── scripts/
│   ├── test/
│   ├── typechain-types/
│   ├── hardhat.config.ts
│   └── ...
├── nginx/                  # Nginx reverse proxy
│   ├── Dockerfile
│   ├── default.conf
│   ├── nginx.conf
│   └── ...
├── postgresql/             # PostgreSQL database setup
│   ├── Dockerfile
│   └── init.sql
└── README.md               # Project documentation
```

## Technologies Used

### Frontend
- **Next.js (App Router)** – Modern React framework for SSR/SSG
- **React 19** – Component-based UI
- **TailwindCSS** – Utility-first CSS framework
- **Framer Motion** – Animations and transitions
- **TypeScript** – Type safety for JavaScript

### Backend
- **Node.js & Express.js** – RESTful API server
- **JWT Authentication** – Secure user sessions
- **Middleware & Router structure** – Modular backend code

### Database
- **PostgreSQL** – Relational database
- **Sequelize ORM** – Database interaction

### Smart Contracts
- **Solidity** – Smart contract language
- **Hardhat** – Ethereum development environment

### Proxy
- **Nginx** – Reverse proxy for handling requests

### Deployment
- **Docker & Docker Compose** – Containerized, multi-service orchestration

## Setup and Installation

### Prerequisites
Ensure you have the following installed:
- **Docker** & **Docker Compose**

### Steps to Run the Project
1. Clone the repository:
   ```sh
   git clone https://github.com/anzuukino/NT208.P21.ANTN-TEAM-9
   cd NT208.P21.ANTN-TEAM-9
   ```
2. Start the services using Docker Compose:
   ```sh
   docker-compose up --build
   ```
3. Access the application:
   - `http://localhost:3000`
   - Database: PostgreSQL running inside a container
   - Admin credentials: `admin@example.com` / `testpassword`

## API Endpoints (Backend)

### Authentication & User
- `POST /api/login` - User login
- `POST /api/register` - User registration
- `POST /api/logout` - User logout (clears cookie)
- `GET /api/auth/google` - Google OAuth callback
- `POST /api/oauth` - Get Google OAuth URL
- `GET /api/profile` - Fetch user profile (deprecated, see `/api/user/auth/:uid`)
- `GET /api/user/:uid` - Public user info by user ID
- `GET /api/user/auth/:uid` - Private user info (auth required, only self)
- `GET /api/user` - Get current user UID (auth required)
- `POST /api/edit-profile` - Edit user profile (auth required)
- `POST /api/upload-profile-image` - Upload profile image (auth required)
- `GET /api/check-information` - Check if user profile is complete (auth required)

### Fund Management
- `POST /api/create-fund` - Create a new fund (auth required, image upload)
- `POST /api/update-fund` - Update fund details (auth required)
- `GET /api/fund/:fund_id` - Get fund details by ID (auth required)
- `GET /api/funds/all` - List all funds
- `GET /api/funds/limited` - List limited number of funds (default 9)
- `POST /api/filter-category` - Filter funds by category

### Donations & Withdrawals
- `POST /api/donate` - Make a donation to a fund (auth required)
- `POST /api/withdraw` - Withdraw from a fund (auth required)
- `GET /api/bills` - Get user's bills/transactions (auth required)

### Miscellaneous
- `GET /api/healthcheck` - Check database connection

> **Note:** Most endpoints that modify or access sensitive data require authentication via JWT (cookie-based).

## Contributing
Feel free to open issues or pull requests for improvements!

## License
This project is licensed under [MIT License](LICENSE).

