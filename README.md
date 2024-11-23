# LitLounge - Server Side

This is the backend repository for the **LitLounge** e-commerce platform, built using Node.js, Express.js, and MongoDB. It provides the server-side logic, API endpoints, and database operations for the application.

---

## Features

- User Authentication with Firebase.
- JWT-based route protection.
- Role-based API access for buyers, sellers, and admins.
- Product management: Add, edit, and delete products.
- User management: Promote users, delete accounts.
- Secure MongoDB connection.

---

## Technology Stack

- **Node.js**  
- **Express.js**  
- **MongoDB**  
- **Cors**  
- **JSON Web Token (JWT)**  

---

## Installation and Setup

### Prerequisites
Ensure you have the following installed:
- Node.js  
- MongoDB  

### Steps to Run Locally

1. **Clone the Repository:**  
   ```bash
   git clone https://github.com/ahnaf4D/LitLounge-server.git
   ```

2. **Install Dependencies:**  
   ```bash
   npm install
   ```

3. **Set Environment Variables:**  
   Create a `.env` file in the root directory with the following variables:
   ```bash
   DB_USER=<your_database_username>
   DB_PASS=<your_database_password>
   JWT_ACCESS_TOKEN_SECRET=<your_jwt_access_token_secret>
   JWT_EXPIRES_IN=<access_token_expiry_time>

   ```

4. **Start the Server:**  
   ```bash
   npm start
   ```

5. **API is Running At:**  
   `http://localhost:3001`

---

## Related Repositories

- **Client Side Repository:**  
  [LitLounge Client Repository](https://github.com/ahnaf4D/LitLounge-client)
