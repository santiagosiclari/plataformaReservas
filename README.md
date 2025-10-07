# 🏟️ PlataformaReservas
![status](https://img.shields.io/badge/status-in_development-yellow)

A full-stack sports court booking platform that allows players to find nearby venues, check availability, and make reservations online.  
Owners and administrators can manage venues, schedules, and pricing through an integrated management dashboard.

---

## 🚀 Overview

**PlataformaReservas** is a web application designed to digitalize the process of booking sports facilities (tennis, paddle, soccer, etc.).  
It offers a seamless experience both for **players**, who can search and book instantly, and for **venue owners**, who can manage courts, schedules, and bookings efficiently.

---

## ⚙️ Tech Stack

### 🧩 Backend – FastAPI
- **FastAPI** for building a high-performance REST API.
- **SQLAlchemy ORM** for database interaction.
- **Alembic** for migrations.
- **PostgreSQL** as the main relational database.
- **JWT Authentication** for secure user login and session handling.
- **Pydantic** for data validation and schema management.
- **Uvicorn** for ASGI server deployment.
- **CORS Middleware** for frontend integration.

### 💻 Frontend – React + TypeScript
- **React** with **Vite** for fast development and hot-reload.
- **React Router** for client-side navigation.
- **MUI (Material-UI)** for the component library and consistent design.
- **Axios** for API requests.
- **Context API** for authentication and global state.
- **Responsive CSS** and dark/light mode theme toggle.

### ☁️ Deployment
- **Frontend:** Netlify  
- **Backend:** Render  
- **Database:** Render PostgreSQL

## 🚀 Live Demo & Access

- **Frontend (Netlify):** [https://plataformareserva.netlify.app](https://plataformareserva.netlify.app)
- **Backend (Render):** [https://plataformareservas.onrender.com/api/v1](https://plataformareservas.onrender.com/api/v1)

You can explore the app as:
- **Player:** create an account and start booking courts.
- **Owner/Admin:** log in to access venue management and statistics dashboards.

  ## 📚 API Documentation

The backend API is fully documented using **FastAPI's interactive documentation**.

- **Swagger UI:** [https://plataformareservas.onrender.com/docs](https://plataformareservas.onrender.com/docs)
- **ReDoc:** [https://plataformareservas.onrender.com/redoc](https://plataformareservas.onrender.com/redoc)

### Available Endpoints

| Endpoint | Method | Description |
|-----------|--------|-------------|
| `/api/v1/auth/login` | POST | Authenticate user and return JWT token |
| `/api/v1/auth/me` | GET | Retrieve current authenticated user |
| `/api/v1/venues` | GET / POST | List or create venues |
| `/api/v1/venues/{id}` | GET | Get venue details |
| `/api/v1/bookings` | GET / POST | List or create bookings |
| `/api/v1/bookings/{id}` | PATCH / DELETE | Update or cancel a booking |
| `/api/v1/admin/stats` | GET | Retrieve admin statistics |

The documentation is auto-generated from **Pydantic models** and **path operations** defined in the FastAPI backend, ensuring consistency and easy maintenance.

---

## 💡 What We Learned

Throughout the development of PlataformaReservas we learned to:
- Design and implement **RESTful APIs** with FastAPI and SQLAlchemy.
- Manage **database migrations** and schema evolution with Alembic.
- Handle **authentication and authorization** using JWT.
- Integrate a **React frontend** with a FastAPI backend using CORS policies.
- Build **responsive UI/UX** with MUI and theming.
- Structure a project in a **modular and maintainable way** (services, models, routes).
- Deploy a full-stack app using modern **cloud platforms (Render, Netlify)**.
- Debug and manage **asynchronous communication** between backend and frontend.

---

## 👥 Target Audience

- **Players:** who want to find and book available sports courts quickly and securely.  
- **Venue Owners:** who need an intuitive admin panel to manage courts, schedules, prices, and bookings.  
- **Administrators:** who oversee the system’s usage, statistics, and data management.

---

## 🧠 Key Features

- 🔐 **Authentication** (Sign up / Login / Logout)
- 🏟️ **Venue and Court Management** (for owners/admins)
- 📅 **Availability Scheduling** with time slots
- 💸 **Dynamic Pricing** per court and time range
- 📍 **Map-based Search** for courts near a location
- 📊 **Admin Statistics Dashboard**
- 🌗 **Light/Dark Theme** toggle
- 📱 **Responsive Design** for mobile and desktop
- 📨 **Email Notifications** for booking confirmations (via FastAPI service)

---

## 📁 Project Structure

PlataformaReservas/
├── backend/
│ ├── app/
│ │ ├── domains/ # Core modules: bookings, venues, users, schedules, pricing
│ │ ├── shared/ # Shared logic, enums, and utils
│ │ ├── main.py # FastAPI app entry point
│ │ └── database.py # Database connection and Base
│ └── alembic/ # Migrations folder
│
└── frontend/
├── src/
│ ├── api/ # API service layer (Axios)
│ ├── auth/ # AuthContext and hooks
│ ├── components/ # Reusable components
│ ├── pages/ # Main pages (Home, Booking, Admin, etc.)
│ ├── app/ # Theme configuration
│ └── main.tsx # Entry point

## 🌿 Git Workflow

We followed a **branch-per-feature** workflow to keep development organized and traceable:

## 📜 License

This project is licensed under the MIT License.
It allows anyone to freely use, modify, and distribute the software — as long as the original license and copyright notice are included.
This encourages open collaboration and educational use.

## 🧩 Installation & Setup
#1️⃣ Clone the repository
    git clone https://github.com/yourusername/plataformareservas.git
    cd plataformareservas
# 2️⃣ Backend setup
  cd backend
  python -m venv .venv
  source .venv/bin/activate
  pip install -r requirements.txt
  alembic upgrade head
  uvicorn app.main:app --reload
# 3️⃣ Frontend setup
  cd frontend
  npm install
  npm run dev

## 💬 Author

Developed by:
🧑‍💻 Santiago Siclari
📍 Buenos Aires, Argentina
💼 Software Engineer & Designer
🌐 LinkedIn: www.linkedin.com/in/santiago-siclari
 • GitHub: https://github.com/santiagosiclari
