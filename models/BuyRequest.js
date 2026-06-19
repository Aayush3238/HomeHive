const { prisma } = require('../db');

const mapBuyRequestRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    _id: row.id,
    id: row.id,
    home: row.home,
    buyer: row.buyer,
    owner: row.owner,
    offeredPrice: Number(row.offered_price),
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

class BuyRequest {
  constructor(data) {
    this.home = data.home;
    this.buyer = data.buyer;
    this.owner = data.owner;
    this.offeredPrice = data.offeredPrice;
    this.message = data.message;
  }

  async save() {
    const buyRequest = await prisma.buyRequest.create({
      data: {
        homeId: this.home,
        buyerId: this.buyer,
        ownerId: this.owner,
        offeredPrice: this.offeredPrice,
        message: this.message,
      },
    });

    return mapBuyRequestRow({
      ...buyRequest,
      home: buyRequest.homeId,
      buyer: buyRequest.buyerId,
      owner: buyRequest.ownerId,
    });
  }

  static async findById(id) {
    const buyRequest = await prisma.buyRequest.findUnique({
      where: { id },
    });

    if (!buyRequest) {
      return null;
    }

    return mapBuyRequestRow({
      ...buyRequest,
      home: buyRequest.homeId,
      buyer: buyRequest.buyerId,
      owner: buyRequest.ownerId,
    });
  }

  static async findByOwnerWithRelations(ownerId) {
    const buyRequests = await prisma.buyRequest.findMany({
      where: { ownerId },
      include: {
        home: true,
        buyer: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return buyRequests.map((item) => ({
      _id: item.id,
      id: item.id,
      offeredPrice: Number(item.offeredPrice),
      message: item.message,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      home: {
        _id: item.home.id,
        id: item.home.id,
        address: {
          houseNo: item.home.houseNo,
          city: item.home.city,
          district: item.home.district,
          state: item.home.state,
          country: item.home.country,
          postcode: item.home.postcode,
          formattedAddress: item.home.formattedAddress,
        },
        location: {
          type: 'Point',
          coordinates: [item.home.longitude, item.home.latitude],
        },
        price: item.home.price,
        homeImage: item.home.homeImage,
        description: item.home.description,
        owner: item.home.ownerId,
      },
      buyer: {
        _id: item.buyer.id,
        id: item.buyer.id,
        firstname: item.buyer.firstname,
        lastname: item.buyer.lastname,
        email: item.buyer.email,
        role: item.buyer.role,
      },
    }));
  }

  static async updateStatus(id, ownerId, status) {
    const buyRequest = await prisma.buyRequest.findFirst({
      where: {
        id,
        ownerId,
      },
    });

    if (!buyRequest) {
      return null;
    }

    const updatedBuyRequest = await prisma.buyRequest.update({
      where: { id: buyRequest.id },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    return mapBuyRequestRow({
      ...updatedBuyRequest,
      home: updatedBuyRequest.homeId,
      buyer: updatedBuyRequest.buyerId,
      owner: updatedBuyRequest.ownerId,
    });
  }
}

module.exports = BuyRequest;
