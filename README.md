# LiveChat Pro 🚀

A powerful, real-time customer support platform designed for modern web applications. LiveChat Pro allows you to engage with your visitors instantly, manage conversations efficiently, and customize your support experience.

## ✨ Features

- **Real-time Messaging**: Powered by Socket.io for instantaneous communication between agents and visitors.
- **Customizable Widget**: Change colors, greetings, and behavior directly from the dashboard.
- **Unified Inbox**: Manage all your customer conversations in one place with a triage-first interface.
- **Visitor Tracking**: See who's on your site in real-time.
- **Snippet Integration**: Easilly install the chat widget on any website with a single line of code.
- **Auto-Refresh Inbox**: Stay updated with the latest messages without manual refreshing.
- **Copy Feedback**: Visual "Copied!" confirmation when grabbing your integration snippet.

## 🛠️ Tech Stack

### Frontend
- **React / Vite**: For a fast and responsive user interface.
- **Tailwind CSS**: Modern styling with a polished look.
- **TanStack Query**: Robust data fetching and state management.
- **Lucide Icons**: Beautiful, consistent iconography.
- **Socket.io Client**: Real-time event handling.

### Backend
- **Node.js / Express**: Scalable and fast API server.
- **MongoDB / Mongoose**: Flexible document-based data storage.
- **Socket.io**: Real-time WebSocket server.
- **JWT Authentication**: Secure access for agents and admins.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/linksorting/Livechat-.git
   cd Livechat-
   ```

2. **Setup Backend**:
   ```bash
   cd livechat-pro-backend
   npm install
   # Create a .env file based on .env.example
   npm run dev
   ```

3. **Setup Frontend**:
   ```bash
   cd ../livechat-pro-frontend
   npm install
   # Create a .env file if needed
   npm run dev
   ```

## 📦 Widget Integration

To add LiveChat Pro to your website, paste the following snippet before the closing `</body>` tag:

```html
<script>
  window.LiveChatPro = {
    workspace: "your-workspace-slug",
    apiUrl: "http://localhost:5000" // Replace with your production API URL
  };
</script>
<script async src="http://localhost:5000/widget.js"></script>
```

## 📄 License

This project is licensed under the MIT License.
