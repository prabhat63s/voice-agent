# Live Link 
https://voice-agent-topaz.vercel.app/



# Voice Agent

A modern, responsive web application for real-time voice interactions with AI, built with Next.js, NextAuth, and Tailwind CSS.

## Features

- **Voice-based AI Interactions**: Use your microphone to chat with an AI assistant
- **User Authentication**: Secure login/registration with OTP verification
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Speech Synthesis**: AI responses are spoken aloud
- **Session Management**: Persistent user sessions with NextAuth
- **Clean UI**: Modern interface built with Tailwind CSS

##  Tech Stack

- **Framework**: Next.js 15.5.2 with App Router
- **Authentication**: NextAuth.js with credentials provider
- **Database**: MongoDB with Mongoose ODM
- **Styling**: Tailwind CSS 4
- **UI Components**: React Icons, Sonner toasts
- **Security**: bcryptjs for password hashing
- **Email**: Nodemailer for OTP verification

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/prabhat63s/voice-agent
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   NEXTAUTH_SECRET=your_secret_key
   NEXTAUTH_URL=http://localhost:3000
   NEXT_PUBLIC_API_URL=http://localhost:5000

   OPENAI_API_KEY=sk-proj-YR

   
   # SMTP Configuration for OTP emails
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   EMAIL_FROM="Your App <your_email@gmail.com>"
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/     # NextAuth authentication
│   │   ├── register/route.ts       # User registration
│   │   ├── send-otp/route.ts       # OTP sending endpoint
│   │   ├── agent/route.ts          # Web Search API
│   │   ├── realtime-session/route.ts # STS API
│   │   └── verify-otp/route.ts     # OTP verification
│   ├── chat/                       # Voice chat interface
│   ├── login/                      # Login page
│   ├── register/                   # Registration pages
│   ├── globals.css                 # Global styles
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Homepage
│   └── providers.tsx               # Session provider
├── components/
│   └── LogoutButton.tsx            # Logout component
├── lib/
│   └── mongoose.ts                 # Database connection
└── models/
    ├── Otp.ts                      # OTP model
    └── User.ts                     # User model
```

## 🔑 Authentication Flow

1. **Registration**:
   - User enters email and password
   - Password validation (8+ chars, uppercase, lowercase, number, special char)
   - OTP sent to email via SMTP
   - OTP verification before account creation

2. **Login**:
   - Credentials authentication with NextAuth
   - Session management with JWT tokens

## 🎤 Voice Chat Features

- Text-to-Text
- **Speech-to-Speech**: AI responses are spoken aloud

## 🎨 UI/UX Features

- **Responsive Design**: Adapts to mobile and desktop
- **Toast Notifications**: User feedback with Sonner


## 🔒 Security Features

- Password hashing with bcryptjs
- OTP expiration (10 minutes)
- Input validation on client and server
- Secure session management
- Environment variable protection

## 📱 Browser Compatibility

- Chrome/Edge: Full support (recommended)
- Firefox: Full support
- Safari: Limited speech recognition support
- Mobile browsers: Supported with microphone permissions