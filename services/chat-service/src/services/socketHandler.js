/**
 * Socket.IO handler for real-time chat
 */

function socketHandler(io, logger) {
  io.on('connection', (socket) => {
    logger.info('User connected to chat', { socketId: socket.id });

    // Join user to their personal room
    socket.on('join', (data) => {
      const { userId } = data;
      socket.join(`user_${userId}`);
      logger.info('User joined room', { userId, socketId: socket.id });
    });

    // Handle chat messages
    socket.on('message', (data) => {
      const { message, userId, conversationId } = data;
      
      logger.info('Message received', { userId, conversationId, messageLength: message.length });

      // Echo message back to user (in real implementation, this would process with AI)
      const response = {
        id: Date.now().toString(),
        message: `Echo: ${message}`,
        timestamp: new Date().toISOString(),
        type: 'ai',
        conversationId
      };

      socket.emit('message', response);
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
      const { userId, conversationId, isTyping } = data;
      socket.to(`conversation_${conversationId}`).emit('typing', {
        userId,
        isTyping
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info('User disconnected from chat', { socketId: socket.id });
    });
  });
}

module.exports = socketHandler;
