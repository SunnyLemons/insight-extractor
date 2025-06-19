# InsightExtractor

## Overview
InsightExtractor is an AI-powered project management and insight tracking application designed to help teams capture, triage, and transform user feedback and observations into actionable insights.

## Features
- AI-powered insight generation and triage
- Contextual action recommendations
- Project and insight management
- Detailed action tracking and prioritization
- Intelligent scoring and analysis

## Tech Stack
- Frontend: React with TypeScript
- Backend: Node.js with Express
- Database: MongoDB
- AI Services: Anthropic Claude 3 Haiku

## Prerequisites
- Node.js (v16+)
- npm or Yarn
- MongoDB
- Anthropic API Key

## Installation

### Clone the Repository
```bash
git clone https://github.com/yourusername/InsightExtractor.git
cd InsightExtractor
```

### Backend Setup
```bash
cd server
npm install
# Create a .env file with your configuration
npm run dev
```

### Frontend Setup
```bash
cd client
npm install
npm start
```

## Environment Variables
Create `.env` files in both `server` and `client` directories with:
- `MONGODB_URI`
- `ANTHROPIC_API_KEY`
- Other necessary configuration

## Running Tests
```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

## Deployment
- Frontend can be deployed on Netlify/Vercel
- Backend on Heroku/DigitalOcean
- MongoDB Atlas for database hosting

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License
Distributed under the MIT License.

## Contact
Your Name - your.email@example.com

Project Link: [https://github.com/yourusername/InsightExtractor](https://github.com/yourusername/InsightExtractor) 