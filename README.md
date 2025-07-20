# Amazon Product Synthesis Tool

A comprehensive tool for analyzing Amazon products and their competitors using AI to provide actionable insights through LangChain.

## Overview

The Amazon Product Synthesis Tool is a MERN stack application that uses LangChain to analyze product data scraped from Amazon. It provides detailed insights, sentiment analysis, and competitor comparisons to help sellers improve their products and listings.

## Features

- **Product Analysis**: Input any Amazon ASIN to get a comprehensive analysis
- **Competitor Comparison**: Automatically identifies and analyzes competing products
- **Sentiment Analysis**: Visual breakdown of positive and negative aspects
- **Actionable Recommendations**: AI-generated suggestions for improving product listings and features
- **Historical Analysis**: View and compare past analyses
- **Sharing Capabilities**: Share analysis results via link or social media

## Tech Stack

### Frontend

- React.js
- TailwindCSS
- Chart.js
- React Router
- Axios

### Backend

- Node.js
- Express
- MongoDB
- LangChain (for AI analysis)

## Project Structure

```
amazon-product-synthesis/
├── client/                       # Frontend React application
├── server/                       # Backend Node.js/Express application
├── AI_analysis/                  # LangChain integration and analysis scripts
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Python 3.8+ (for LangChain components)

### Installation

#### Frontend (React)

1. Navigate to the frontend directory:

   ```
   cd Frontend
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file in the frontend directory with:

   ```
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. Start the development server:
   ```
   npm start
   ```

#### Backend (Node.js)

1. Navigate to the server directory:

   ```
   cd server
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file in the server directory with:

   ```
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

4. Start the server:
   ```
   npm start
   ```

#### AI Analysis (Python)

1. Navigate to the AI_analysis directory:

   ```
   cd AI_analysis
   ```

2. Install Python dependencies:

   ```
   pip install -r requirements.txt
   ```

3. Configure environment variables for LangChain connectivity

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Register for an account or login
3. Enter an Amazon product ASIN and a relevant keyword on the home page
4. View the comprehensive analysis results

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login an existing user
- `GET /api/auth/me` - Get current user profile

### Analysis

- `POST /api/analysis` - Analyze a product (requires ASIN and keyword)
- `GET /api/analysis` - Get all analyses for the current user
- `GET /api/analysis/:id` - Get a specific analysis by ID

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
