# Node.js Authentication Service

A RESTful authentication service built with **Node.js, Express.js, and MongoDB**.

This project provides user authentication and account management features, using JWT-based authentication and password hashing.

## Features

- User registration and login
- JWT-based authentication
- Access and refresh token handling
- Password hashing with bcrypt
- Email/verification code workflows
- Password reset functionality
- Protected routes and authentication middleware
- User management endpoints
- Role-based access control

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Token (JWT)
- bcrypt

## Project Structure

```text
src/
├── v1/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   └── utils/
├── app.js
└── server.js
```

*The exact structure may vary depending on the implemented modules.*

## Installation

```bash
git clone https://github.com/Agony-snt/nodejs-auth-service.git
cd nodejs-auth-service
npm install
```

Create a `.env` file and configure the required environment variables based on the project configuration.

## Run the Project

```bash
npm run dev
```

For production:

```bash
npm start
```

## Purpose

This project was developed to practice backend development, REST API design, authentication flows, database modeling, and secure password handling.
