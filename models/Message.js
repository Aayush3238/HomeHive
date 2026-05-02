const { prisma } = require('../db');

const mapMessageRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    _id: row.id,
    id: row.id,
    conversation: row.conversation,
    sender: row.sender,
    receiver: row.receiver,
    message: row.message,
    read: row.read,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

class Message {
  constructor(data) {
    this.conversation = data.conversation;
    this.sender = data.sender;
    this.receiver = data.receiver;
    this.message = data.message;
  }

  async save() {
    const message = await prisma.message.create({
      data: {
        conversationId: this.conversation,
        senderId: this.sender,
        receiverId: this.receiver,
        message: this.message,
      },
    });

    return mapMessageRow({
      ...message,
      conversation: message.conversationId,
      sender: message.senderId,
      receiver: message.receiverId,
    });
  }

  static async findByConversationWithSender(conversationId) {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return messages.map((message) => ({
      _id: message.id,
      id: message.id,
      conversation: message.conversationId,
      sender: {
        _id: message.sender.id,
        id: message.sender.id,
        firstname: message.sender.firstname,
        lastname: message.sender.lastname,
      },
      receiver: message.receiverId,
      message: message.message,
      read: message.read,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    }));
  }
}

module.exports = Message;
