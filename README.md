# StoryHealer

An AI-powered platform that creates personalized illustrated children's storybooks to help kids overcome their fears.

## Features

- **Personalized Characters**: Upload a photo or describe your child to create their hero character
- **AI-Generated Stories**: 6-page illustrated stories where your child conquers their fears
- **Beautiful Illustrations**: AI-generated children's book style artwork
- **Interactive Editing**: Advanced chatbot to edit stories and illustrations
- **Story Sharing**: Share stories with friends and family
- **PDF Downloads**: Export stories as printable PDFs
- **Google Authentication**: Secure sign-in with Google

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js with Google OAuth
- **AI Integration**: Custom AI service endpoints for LLM and image generation
- **UI Components**: Radix UI, Lucide React icons
- **PDF Generation**: jsPDF

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Google OAuth credentials
- AI service endpoints (LLM, Image Generation, File Upload)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd storyhealer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your database:
   ```bash
   npx prisma migrate dev
   ```

4. Configure environment variables (see Configuration section below)

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Configuration

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/storyhealer"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AI Service URLs
INVOKE_LLM_URL="your-llm-endpoint"
GENERATE_IMAGE_URL="your-image-generation-endpoint"
UPLOAD_FILE_URL="your-file-upload-endpoint"
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)

### AI Services Setup

You'll need to set up three AI service endpoints:

1. **LLM Service** (`INVOKE_LLM_URL`): For story generation and chat
2. **Image Generation** (`GENERATE_IMAGE_URL`): For creating illustrations  
3. **Photo Analysis** (`UPLOAD_FILE_URL`): For analyzing uploaded photos

Each service should accept POST requests with JSON payloads and return appropriate responses.

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   ├── story/             # Story pages
│   └── shared/            # Public story sharing
├── components/            # React components
│   ├── layout/           # Layout components
│   └── story/            # Story-related components
├── lib/                  # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Prisma client
│   └── ai.ts             # AI service integrations
└── types/                # TypeScript type definitions
```

## Database Schema

The application uses these main entities:

- **User**: Authentication and user data
- **Child**: Child profiles with appearance descriptions
- **Story**: Generated stories with metadata
- **StoryPage**: Individual pages with text and illustrations
- **PageConversation**: Chat history for story editing

## API Endpoints

### Authentication
- `GET/POST /api/auth/*` - NextAuth endpoints

### Children
- `GET/POST /api/children` - List/create child profiles

### Stories
- `GET/POST /api/stories` - List/create stories
- `GET/DELETE /api/stories/[id]` - Get/delete specific story
- `POST /api/stories/[id]/illustrations` - Generate illustrations
- `POST /api/stories/[id]/chat` - Story editing chat
- `POST /api/stories/[id]/pdf` - Generate PDF

### Utilities
- `POST /api/analyze-photo` - Analyze uploaded photos

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

### Database Migrations
```bash
npx prisma migrate dev
npx prisma generate
```

## Deployment

The application can be deployed to any platform that supports Next.js:

- Vercel (recommended)
- Netlify
- Railway
- Self-hosted

Make sure to:
1. Set up your production database
2. Configure all environment variables
3. Set up your AI service endpoints
4. Configure Google OAuth for your domain

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.