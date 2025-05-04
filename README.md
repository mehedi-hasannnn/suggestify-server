# Suggestify Server

This is the **backend** of the Suggestify platform — a product recommendation and query system where users can ask for alternatives to products, provide suggestions, and interact with others’ queries and recommendations.

## 🔧 Technologies Used

- Node.js
- Express.js
- MongoDB with Mongoose
- Firebase Admin SDK
- JSON Web Token (JWT)
- CORS
- dotenv

## 📁 Project Structure

suggestify-server/
│
├── routes/
│ ├── auth.routes.js
│ ├── queries.routes.js
│ ├── recommendations.routes.js
│
├── controllers/
│ ├── auth.controller.js
│ ├── queries.controller.js
│ ├── recommendations.controller.js
│
├── models/
│ ├── Query.js
│ ├── Recommendation.js
│
├── middlewares/
│ ├── verifyToken.js
│
├── .env
├── index.js
├── package.json


## 🔐 Environment Variables


## 🚀 Features

- 🔐 JWT Token Authentication (Email/Password and Google Sign-In)
- 📬 Add/Update/Delete Queries
- ✅ Add/Delete Recommendations with auto increment/decrement of count
- 👁 View Queries and Recommendations
- 🔍 Search Queries by Product Name
- 🛡 Secure Private Routes with JWT verification
- 📅 Timestamp stored with each query and recommendation

## 🧪 API Endpoints

### Auth

- `POST /jwt`: Create JWT token
- `POST /verify-token`: Verifies the user's token

### Queries

- `POST /queries` — Add a new query
- `GET /queries` — Get all queries
- `GET /queries/:id` — Get query details
- `GET /queries/user/:email` — Get queries by a user
- `PATCH /queries/:id` — Update query
- `DELETE /queries/:id` — Delete query

### Recommendations

- `POST /recommendations` — Add a recommendation
- `GET /recommendations/query/:id` — Get recommendations for a query
- `GET /recommendations/user/:email` — Get recommendations by a user
- `GET /recommendations/for-me/:email` — Get recommendations received for a user’s queries
- `DELETE /recommendations/:id` — Delete recommendation

## 📦 NPM Packages Used

- express
- cors
- cookie-parser
- dotenv
- jsonwebtoken
- firebase-admin

## 🏁 Running the Server

```bash
npm install
npm run start
