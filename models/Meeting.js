const { prisma } = require('../db');

class Meeting {
  constructor(data) {
    this.buyRequest = data.buyRequest;
    this.participants = data.participants || [];
    this.scheduledDate = data.scheduledDate;
    this.location = data.location;
    this.notes = data.notes;
  }

  async save() {
    const meeting = await prisma.$transaction(async (tx) => {
      const createdMeeting = await tx.meeting.create({
        data: {
          buyRequestId: this.buyRequest,
          scheduledDate: this.scheduledDate,
          location: this.location,
          notes: this.notes || null,
        },
      });

      if (this.participants.length > 0) {
        await tx.meetingParticipant.createMany({
          data: this.participants.map((userId) => ({
            meetingId: createdMeeting.id,
            userId,
          })),
          skipDuplicates: true,
        });
      }

      return createdMeeting;
    });

    return {
      _id: meeting.id,
      id: meeting.id,
      buyRequest: meeting.buyRequestId,
      participants: [...this.participants],
      scheduledDate: meeting.scheduledDate,
      location: meeting.location,
      notes: meeting.notes,
      status: meeting.status,
      createdAt: meeting.createdAt,
      updatedAt: meeting.updatedAt,
    };
  }

  static async findByParticipantWithRelations(userId) {
    const meetings = await prisma.meeting.findMany({
      where: {
        participants: {
          some: {
            userId,
          },
        },
      },
      include: {
        buyRequest: {
          select: {
            id: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
              },
            },
          },
        },
      },
      orderBy: {
        scheduledDate: 'asc',
      },
    });

    return meetings.map((meeting) => ({
      _id: meeting.id,
      id: meeting.id,
      buyRequest: {
        _id: meeting.buyRequest.id,
        id: meeting.buyRequest.id,
      },
      participants: meeting.participants.map((participant) => ({
        _id: participant.user.id,
        id: participant.user.id,
        firstname: participant.user.firstname,
        lastname: participant.user.lastname,
      })),
      scheduledDate: meeting.scheduledDate,
      location: meeting.location,
      notes: meeting.notes,
      status: meeting.status,
      createdAt: meeting.createdAt,
      updatedAt: meeting.updatedAt,
    }));
  }
}

module.exports = Meeting;
