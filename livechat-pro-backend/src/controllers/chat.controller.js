// // controllers/chat.controller.js
// import Conversation from '../models/Conversation.js';
// import Message from '../models/Message.js';
// import Contact from '../models/Contact.js';
// import Visitor from '../models/Visitor.js';
// import Workspace from '../models/Workspace.js';

// export async function websiteChatMessage(req, res) {
//   try {
//     const { 
//       message, 
//       name, 
//       email, 
//       phone, 
//       orderNumber, 
//       workspaceId,
//       website,
//       conversationId,
//       action = 'send_message'  // ✅ 'start_conversation' ya 'send_message'
//     } = req.body;

//     console.log('📨 Website chat:', { 
//       name, 
//       workspaceId, 
//       action, 
//       message: message.substring(0, 50),
//       conversationId 
//     });

//     let conversation;

//     // ✅ CASE 1: START CONVERSATION (Form submit)
//     if (action === 'start_conversation' || !conversationId) {
//       conversation = await createNewConversation({
//         workspaceId,
//         name,
//         email,
//         phone,
//         orderNumber,
//         website,
//         message: `Welcome ${name}! How can I help you?`
//       });
//     } 
//     // ✅ CASE 2: SEND MESSAGE (Existing conversation)
//     else {
//       conversation = await Conversation.findById(conversationId);
//       if (!conversation) {
//         return res.status(404).json({ 
//           success: false, 
//           error: 'Conversation not found' 
//         });
//       }
//     }

//     // ✅ ALWAYS CREATE MESSAGE
//     const newMessage = await Message.create({
//       workspace: workspaceId,
//       conversation: conversation._id,
//       senderType: action === 'start_conversation' ? 'system' : 'customer',
//       senderName: name || 'Website Visitor',
//       content: message.trim(),
//       messageType: 'text'
//     });

//     // ✅ UPDATE CONVERSATION
//     await Conversation.findByIdAndUpdate(conversation._id, {
//       lastMessagePreview: message.substring(0, 100),
//       lastMessageAt: new Date(),
//       $inc: { unreadCount: 1 }
//     });

//     console.log(`✅ ${action} saved: ${conversation._id} for ${name}`);

//     // ✅ SOCKET EMIT
//     const io = req.app.locals.io;
//     io.to(conversation._id.toString()).emit('newMessage', {
//       _id: newMessage._id,
//       workspace: workspaceId,
//       conversation: conversation._id,
//       senderType: newMessage.senderType,
//       senderName: newMessage.senderName,
//       content: newMessage.content,
//       messageType: newMessage.messageType,
//       createdAt: newMessage.createdAt,
//       isDelivered: true
//     });

//     res.json({
//       success: true,
//       conversationId: conversation._id.toString(),
//       messageId: newMessage._id.toString()
//     });

//   } catch (error) {
//     console.error('❌ Website chat error:', error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// }

// // ✅ NEW CONVERSATION + CONTACT + VISITOR CREATE
// async function createNewConversation({ workspaceId, name, email, phone, orderNumber, website, message }) {
//   const workspace = await Workspace.findById(workspaceId);
//   if (!workspace) throw new Error('Workspace not found');

//   // 1. CREATE CONTACT (Upsert by email/phone)
//   let contact = await Contact.findOne({ 
//     workspace: workspaceId,
//     $or: [{ email }, { phone }]
//   });

//   if (!contact) {
//     contact = await Contact.create({
//       workspace: workspaceId,
//       name: name || 'Website Visitor',
//       email: email || '',
//       phone: phone || '',
//       meta: {
//         referrer: website,
//         firstSeen: new Date()
//       }
//     });
//     console.log(`✅ New Contact: ${contact._id}`);
//   }

//   // 2. CREATE VISITOR
//   const anonymousId = `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
//   const visitor = await Visitor.create({
//     workspace: workspaceId,
//     anonymousId,
//     contact: contact._id,
//     name: name || 'Anonymous visitor',
//     email: email || '',
//     phone: phone || '',
//     orderNumber: orderNumber || '',
//     currentPage: website,
//     referrer: website
//   });
//   console.log(`✅ New Visitor: ${visitor._id}`);

//   // 3. CREATE CONVERSATION
//   const conversation = await Conversation.create({
//     workspace: workspaceId,
//     contact: contact._id,
//     visitor: visitor._id,
//     subject: `Website chat - ${name || 'Visitor'}`,
//     channel: 'website',
//     status: 'open',
//     priority: 'medium',
//     department: 'support',
//     lastMessagePreview: message.substring(0, 100)
//   });

//   console.log(`✅ New Conversation: ${conversation._id}`);
//   return conversation;
// }

// export async function getConversationMessages(req, res) {
//   try {
//     const { conversationId } = req.params;
    
//     const messages = await Message.find({ 
//       conversation: conversationId 
//     })
//     .sort({ createdAt: 1 })
//     .select('-__v')
//     .lean();

//     res.json({
//       success: true,
//       conversationId,
//       messages,
//       count: messages.length
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// }


// controllers/chat.controller.js
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Contact from '../models/Contact.js';
import Visitor from '../models/Visitor.js';
import Workspace from '../models/Workspace.js';

export async function websiteChatMessage(req, res) {
  try {
    const { 
      message, 
      name, 
      email, 
      phone, 
      orderNumber, 
      workspaceId,
      website,
      conversationId,
      action = 'send_message'
    } = req.body;

    console.log('📨 Website chat:', { 
      name, 
      workspaceId, 
      action, 
      hasConvId: !!conversationId,
      message: message.substring(0, 50)
    });

    let conversation;

    // ✅ CASE 1: START NEW CONVERSATION
    if (action === 'start_conversation' || !conversationId) {
      conversation = await createNewConversation({
        workspaceId,
        name,
        email,
        phone,
        orderNumber,
        website,
        message
      });
    } 
    // ✅ CASE 2: CONTINUE EXISTING CONVERSATION
    else {
      conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return res.status(404).json({ 
          success: false, 
          error: 'Conversation not found' 
        });
      }
    }

    // ✅ CREATE MESSAGE
    const newMessage = await Message.create({
      workspace: workspaceId,
      conversation: conversation._id,
      senderType: 'customer',
      senderName: name || 'Website Visitor',
      content: message.trim(),
      messageType: 'text'
    });

    // ✅ UPDATE CONVERSATION
    await Conversation.findByIdAndUpdate(conversation._id, {
      lastMessagePreview: message.substring(0, 100),
      lastMessageAt: new Date(),
      $inc: { unreadCount: 1 }
    });

    // ✅ FIXED SOCKET EMIT - Correct room name & data structure
    const io = req.app.locals.io;
    const room = `conversation:${conversation._id}`;
    
    const socketData = {
      _id: newMessage._id.toString(),
      conversationId: conversation._id.toString(),
      workspaceId,
      senderType: 'customer',
      senderName: name || 'Website Visitor',
      content: newMessage.content,
      messageType: newMessage.messageType,
      createdAt: newMessage.createdAt.toISOString(),
      isDelivered: true
    };

    console.log(`📤 Emitting to room ${room}:`, socketData);
    io.to(room).emit('newMessage', socketData);

    res.json({
      success: true,
      conversationId: conversation._id.toString(),
      messageId: newMessage._id.toString()
    });

  } catch (error) {
    console.error('❌ Website chat error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// ✅ Helper function (unchanged)
async function createNewConversation({ workspaceId, name, email, phone, orderNumber, website, message }) {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new Error('Workspace not found');

  let contact = await Contact.findOne({ 
    workspace: workspaceId,
    $or: [{ email }, { phone }]
  });

  if (!contact) {
    contact = await Contact.create({
      workspace: workspaceId,
      name: name || 'Website Visitor',
      email: email || '',
      phone: phone || '',
      meta: {
        referrer: website,
        firstSeen: new Date()
      }
    });
  }

  const anonymousId = `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const visitor = await Visitor.create({
    workspace: workspaceId,
    anonymousId,
    contact: contact._id,
    name: name || 'Anonymous visitor',
    email: email || '',
    phone: phone || '',
    orderNumber: orderNumber || '',
    currentPage: website,
    referrer: website
  });

  const conversation = await Conversation.create({
    workspace: workspaceId,
    contact: contact._id,
    visitor: visitor._id,
    subject: `Website chat - ${name || 'Visitor'}`,
    channel: 'website',
    status: 'open',
    priority: 'medium',
    department: 'support',
    lastMessagePreview: message.substring(0, 100)
  });

  return conversation;
}

export async function getConversationMessages(req, res) {
  try {
    const { conversationId } = req.params;
    
    const messages = await Message.find({ 
      conversation: conversationId 
    })
    .sort({ createdAt: 1 })
    .select('-__v')
    .lean();

    res.json({
      success: true,
      conversationId,
      messages,
      count: messages.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}