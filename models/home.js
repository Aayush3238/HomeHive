const { prisma } = require('../db');

const mapHomeRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    _id: row.id,
    id: row.id,
    address: {
      houseNo: row.houseNo,
      city: row.city,
      district: row.district,
      state: row.state,
      country: row.country,
      postcode: row.postcode,
      formattedAddress: row.formattedAddress,
    },
    location: {
      type: 'Point',
      coordinates: [row.longitude, row.latitude],
    },
    price: row.price,
    homeImage: row.homeImage,
    description: row.description,
    propertyType: row.propertyType,
    owner: row.ownerId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

class Home {
  constructor(data) {
    this.address = data.address;
    this.location = data.location;
    this.price = data.price;
    this.homeImage = data.homeImage;
    this.description = data.description;
    this.propertyType = data.propertyType;
    this.owner = data.owner;
  }

  async save() {
    const home = await prisma.home.create({
      data: {
        houseNo: this.address.houseNo,
        city: this.address.city,
        district: this.address.district || null,
        state: this.address.state,
        country: this.address.country,
        postcode: this.address.postcode || null,
        formattedAddress: this.address.formattedAddress,
        latitude: this.location.coordinates[1] || 0,
        longitude: this.location.coordinates[0] || 0,
        price: this.price,
        homeImage: this.homeImage,
        description: this.description,
        propertyType: this.propertyType,
        ownerId: this.owner,
      },
    });

    return mapHomeRow(home);
  }

  static async find(filter = {}) {
    if (filter.owner) {
      const homes = await prisma.home.findMany({
        where: {
          ownerId: filter.owner,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return homes.map(mapHomeRow);
    }

    const homes = await prisma.home.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return homes.map(mapHomeRow);
  }

  static async findById(id) {
    const home = await prisma.home.findUnique({
      where: { id },
    });
    return mapHomeRow(home);
  }

  static async findOne(filter) {
    if (filter._id && filter.owner) {
      const home = await prisma.home.findFirst({
        where: {
          id: filter._id,
          ownerId: filter.owner,
        },
      });
      return mapHomeRow(home);
    }

    return null;
  }

  static async findOneAndDelete(filter) {
    const home = await prisma.home.findFirst({
      where: {
        id: filter._id,
        ownerId: filter.owner,
      },
    });

    if (!home) {
      return null;
    }

    await prisma.home.delete({
      where: {
        id: home.id,
      },
    });

    return mapHomeRow(home);
  }

  static async findOneAndUpdate(filter, updateData) {
    const home = await prisma.home.findFirst({
      where: {
        id: filter._id,
        ownerId: filter.owner,
      },
    });

    if (!home) {
      return null;
    }

    const updatedHome = await prisma.home.update({
      where: {
        id: home.id,
      },
      data: {
        houseNo: updateData.address.houseNo,
        city: updateData.address.city,
        district: updateData.address.district || null,
        state: updateData.address.state,
        country: updateData.address.country,
        postcode: updateData.address.postcode || null,
        formattedAddress: updateData.address.formattedAddress,
        price: updateData.price,
        description: updateData.description,
        propertyType: updateData.propertyType,
        ...(Object.prototype.hasOwnProperty.call(updateData, 'homeImage')
          ? { homeImage: updateData.homeImage }
          : {}),
        updatedAt: new Date(),
      },
    });

    return mapHomeRow(updatedHome);
  }
}

module.exports = Home;
