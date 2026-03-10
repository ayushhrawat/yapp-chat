# Yapp Chat - Modern Real-Time Messaging App

A feature-rich, production-ready chat application with real-time messaging, video/audio calls, media sharing, and AI-powered assistance.

![Features](https://img.shields.io/badge/Real--time-Messaging-blue)
![Video](https://img.shields.io/badge/Video%2FCalls-WebRTC-green)
![Media](https://img.shields.io/badge/Media-Sharing-orange)
![AI](https://img.shields.io/badge/AI-Groq%20Integration-purple)

## ✨ Features

### 💬 Real-Time Messaging
- Instant message delivery via Socket.IO
- MongoDB for message persistence
- Online/offline status indicators
- Typing indicators
- Message read receipts

### 📞 Video & Audio Calls
- HD video calls using Zego Express Engine
- Crystal-clear audio calls
- One-click call initiation
- Call overlay UI
- Auto-answer support

### 📸 Media Sharing
- Share images, videos, and audio files
- 10MB file size limit
- Built-in media preview
- One-click download
- Support for all major formats (JPEG, PNG, MP4, WebM, MP3)

### 🤖 AI Assistant (Groq Integration)
- Type `/ask [question]` to get instant AI answers
- Powered by Llama 3.1-8B (ultra-fast!)
- Shows typing indicators while processing
- AI responses appear as received messages
- Complete conversation history

### 👤 User Profiles
- Clerk authentication
- Profile pictures from Clerk
- Username customization
- Profile details popup
- Avatar display in chats

### 🎨 Modern UI/UX
- Clean, intuitive interface
- Responsive design (mobile-friendly)
- Dark mode support
- Smooth animations
- Professional styling

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account(free tier works)
- Clerk account (free tier works)
- Groq API key (free - included in code)

### Installation

1. **Clone the repository**
```bash
cd yapp-chat
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:
```env
# Clerk Authentication (Get from clerk.com)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_secret_here

# MongoDB Connection (Get from mongodb.com/atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/yapp-chat

# Server Configuration
PORT=3001
VITE_SERVER_URL=http://localhost:3001

# Groq AI (Already included, but you can change it)
VITE_GROQ_API_KEY=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
```

4. **Start the application**
```bash
npm run dev
```

This will start both:
- Frontend (Vite): http://localhost:5173
- Backend server: http://localhost:3001

5. **Open your browser**
Navigate to http://localhost:5173

## 📁 Project Structure

```
yapp-chat/
├── src/
│   ├── components/
│   │   ├── Auth/          # Profile component
│   │   ├── Chat/          # Chat UI components
│   │   ├── Layout/        # Page layouts
│   │   └── VideoCall/     # Video call components
│   ├── contexts/          # React contexts (Auth, Socket, Theme)
│   ├── pages/             # Main pages (ChatPage, etc.)
│   ├── services/          # API clients (MongoDB, Groq AI)
│   ├── config/            # SDK configurations (Zego, Socket)
│   └── main.jsx           # App entry point
├── server/
│   ├── index.js           # Express server setup
│   └── mongodb-server.js  # MongoDB API routes
└── public/                # Static assets
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool & dev server
- **Socket.IO Client** - Real-time communication
- **Clerk** - Authentication
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **Socket.IO** - WebSocket server
- **MongoDB** - Database
- **MongoDB Native Driver** - Database operations

### Services
- **Clerk** - User authentication
- **MongoDB Atlas** - Cloud database
- **Zego Express Engine** - Video/audio calls
- **Groq** - AI inference (Llama 3.1)

## 📚 Key Features Documentation

### Using AI Assistant
Type any of these in chat:
```
/ask What is machine learning?
/ask How do I make pizza?
/ask Explain quantum computing
/ask Write a haiku about coding
```

### Making Video Calls
1. Open a chat conversation
2. Click the video camera icon in the header
3. Wait for the other user to join
4. Enjoy HD video calling!

### Sharing Media
1. Click the paperclip icon (📎)
2. Select image, video, or audio file
3. Preview appears in input area
4. Click send(➤)
5. Download button appears for recipients

## 🔧 Configuration

### Clerk Setup
1. Go to [clerk.com](https://clerk.com)
2. Create free account
3. Create new application
4. Copy publishable key and secret key
5. Add to `.env` file

### MongoDB Setup
1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create free cluster
3. Get connection string
4. Add to `.env` as `MONGODB_URI`

### Groq AI (Optional)
The API key is already included, but if you want to use your own:
1. Go to [groq.com](https://groq.com)
2. Sign up for free account
3. Create API key
4. Update `VITE_GROQ_API_KEY` in `.env`

## 🐛 Troubleshooting

### "Failed to connect to server"
- Make sure backend is running on port 3001
- Check `VITE_SERVER_URL` in `.env`
- Verify MongoDB connection string is correct

### "Clerk authentication failed"
- Verify Clerk keys in `.env` are correct
- Make sure Clerk application is active
- Clear browser cache and cookies

### "Video call not working"
- Check Zego configuration in `src/config/zego.js`
- Ensure both users have camera/microphone permissions
- Verify firewall isn't blocking WebRTC connections

### "AI not responding"
- Check Groq API key is valid
- Verify internet connection
- Check browser console for errors

## 📖 Additional Documentation

Detailed guides available:
- [Groq AI Integration Guide](./GROQ_AI_INTEGRATION.md)
- [Quick Start Guide](./GROQ_QUICKSTART.md)
- [Media Sharing Feature](./MEDIA_SHARING_FEATURE.md)
- [Video Call Setup](./VIDEO_CALL_SETUP.md)
- [Troubleshooting Guide](./TROUBLESHOOTING_SCRIPT.md)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Support

For issues and questions:
- Open an issue on GitHub
- Email: rawatayush412@gmail.com
- Check existing documentation

## 🎯 Roadmap

Future enhancements:
- [ ] Group chats
- [ ] Message reactions (emoji)
- [ ] Voice messages
- [ ] File attachments (documents)
- [ ] Message search
- [ ] Chat export functionality
- [ ] Custom AI personalities
- [ ] End-to-end encryption

## 🙏 Acknowledgments

Built with:
- [Clerk](https://clerk.com) - Authentication
- [MongoDB](https://mongodb.com) - Database
- [Zego](https://zego.im) - Video calls
- [Groq](https://groq.com) - AI inference
- [Socket.IO](https://socket.io) - Real-time communication
- [React](https://react.dev) - UI framework
- [Vite](https://vitejs.dev) - Build tool

---

**Made with ❤️ by Ayush Rawat**

[GitHub](https://github.com/ayushhrawat) • [Email](mailto:rawatayush412@gmail.com)
