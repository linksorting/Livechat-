// import { Server } from "socket.io";
// import { verifyToken } from "../utils/tokens.js";
// import User from "../models/User.js";
// import {
//   registerAgent,
//   unregisterAgent,
//   registerVisitor,
//   unregisterVisitor
// } from "../realtime/registry.js";

// export function configureSocket(server) {
//   const io = new Server(server, {
//     cors: {
//       origin: "*",
//       methods: ["GET", "POST", "PATCH"]
//     }
//   });

//   io.use(async (socket, next) => {
//     try {
//       const token = socket.handshake.auth?.token;
//       const visitorToken = socket.handshake.auth?.visitorToken;
//       const workspaceId = socket.handshake.auth?.workspaceId;

//       if (token) {
//         const decoded = verifyToken(token);
//         const user = await User.findById(decoded.sub);
//         if (!user) return next(new Error("Unauthorized"));
//         socket.data.user = user;
//         socket.data.workspaceId = String(user.workspace);
//         return next();
//       }

//       if (visitorToken && workspaceId) {
//         socket.data.visitorToken = visitorToken;
//         socket.data.workspaceId = String(workspaceId);
//         return next();
//       }

//       return next(new Error("Unauthorized"));
//     } catch (error) {
//       return next(new Error("Unauthorized"));
//     }
//   });

//   io.on("connection", (socket) => {
//     const workspaceRoom = `workspace:${socket.data.workspaceId}`;
//     socket.join(workspaceRoom);

//     if (socket.data.user) {
//       const user = socket.data.user;
//       registerAgent(user._id, socket.id);
//       socket.join(`user:${user._id.toString()}`);
//       io.to(workspaceRoom).emit("agent:presence", {
//         userId: user._id,
//         status: user.status,
//         name: user.name
//       });
//     }

//     if (socket.data.visitorToken) {
//       registerVisitor(socket.data.visitorToken, socket.id);
//       socket.join(`visitor:${socket.data.visitorToken}`);
//     }

//     socket.on("conversation:join", ({ conversationId }) => {
//       socket.join(`conversation:${conversationId}`);
//       socket.emit("conversation:joined", { conversationId });
//     });

//     socket.on("conversation:leave", ({ conversationId }) => {
//       socket.leave(`conversation:${conversationId}`);
//     });

//     socket.on("conversation:typing", ({ conversationId, isTyping = true, actor }) => {
//       socket.to(`conversation:${conversationId}`).emit("conversation:typing", {
//         conversationId,
//         isTyping,
//         actor
//       });
//     });

//     socket.on("conversation:read", ({ conversationId, actor }) => {
//       socket.to(`conversation:${conversationId}`).emit("conversation:read", {
//         conversationId,
//         actor,
//         readAt: new Date().toISOString()
//       });
//     });

//     socket.on("disconnect", () => {
//       if (socket.data.user) {
//         unregisterAgent(socket.data.user._id, socket.id);
//         io.to(workspaceRoom).emit("agent:presence", {
//           userId: socket.data.user._id,
//           status: "offline",
//           name: socket.data.user.name
//         });
//       }
//       if (socket.data.visitorToken) {
//         unregisterVisitor(socket.data.visitorToken, socket.id);
//       }
//     });
//   });

//   return io;
// }


import { Server } from "socket.io";
import { verifyToken } from "../utils/tokens.js";
import User from "../models/User.js";
import {
  registerAgent,
  unregisterAgent,
  registerVisitor,
  unregisterVisitor
} from "../realtime/registry.js";

export function configureSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PATCH"]
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const visitorToken = socket.handshake.auth?.visitorToken;
      const workspaceId = socket.handshake.auth?.workspaceId;

      if (token) {
        const decoded = verifyToken(token);
        const user = await User.findById(decoded.sub);
        if (!user) return next(new Error("Unauthorized"));
        socket.data.user = user;
        socket.data.workspaceId = String(user.workspace);
        return next();
      }

      if (visitorToken && workspaceId) {
        socket.data.visitorToken = visitorToken;
        socket.data.workspaceId = String(workspaceId);
        return next();
      }

      return next(new Error("Unauthorized"));
    } catch (error) {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);
    
    const workspaceRoom = `workspace:${socket.data.workspaceId}`;
    socket.join(workspaceRoom);

    if (socket.data.user) {
      const user = socket.data.user;
      registerAgent(user._id, socket.id);
      socket.join(`user:${user._id.toString()}`);
      io.to(workspaceRoom).emit("agent:presence", {
        userId: user._id,
        status: user.status,
        name: user.name
      });
    }

    if (socket.data.visitorToken) {
      registerVisitor(socket.data.visitorToken, socket.id);
      socket.join(`visitor:${socket.data.visitorToken}`);
    }

    // ✅ FIXED: Website chat conversation join
    socket.on("conversation:join", ({ conversationId }) => {
      const room = `conversation:${conversationId}`;
      socket.join(room);
      console.log(`✅ Visitor joined: ${room} (socket: ${socket.id})`);
      socket.emit("conversation:joined", { conversationId });
    });

    // ✅ NEW: Handle agent replies to website conversations
    socket.on("agent:reply", ({ conversationId, message }) => {
      console.log(`📨 Agent reply to ${conversationId}:`, message);
      
      const room = `conversation:${conversationId}`;
      io.to(room).emit('agentReply', {
        _id: `agent-${Date.now()}`,
        conversationId,
        senderType: 'agent',
        senderName: socket.data.user?.name || 'Agent',
        content: message,
        type: 'text',
        createdAt: new Date().toISOString()
      });
    });

    socket.on("conversation:leave", ({ conversationId }) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on("conversation:typing", ({ conversationId, isTyping = true, actor }) => {
      socket.to(`conversation:${conversationId}`).emit("conversation:typing", {
        conversationId,
        isTyping,
        actor
      });
    });

    socket.on("conversation:read", ({ conversationId, actor }) => {
      socket.to(`conversation:${conversationId}`).emit("conversation:read", {
        conversationId,
        actor,
        readAt: new Date().toISOString()
      });
    });

    socket.on("disconnect", () => {
      console.log("🔌 Socket disconnected:", socket.id);
      if (socket.data.user) {
        unregisterAgent(socket.data.user._id, socket.id);
        io.to(workspaceRoom).emit("agent:presence", {
          userId: socket.data.user._id,
          status: "offline",
          name: socket.data.user.name
        });
      }
      if (socket.data.visitorToken) {
        unregisterVisitor(socket.data.visitorToken, socket.id);
      }
    });
  });

  return io;
}