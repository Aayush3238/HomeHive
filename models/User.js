const { prisma } = require('../db');

const mapUserRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    _id: row.id,
    id: row.id,
    firstname: row.firstname,
    lastname: row.lastname,
    email: row.email,
    password: row.password,
    role: row.role,
    googleId: row.googleId,
    avatar: row.avatar,
    publicKey: row.publicKey,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

const mapHomeRow = (row) => ({
  _id: row.id,
  id: row.id,
  address: {
    houseNo: row.houseNo,
    city: row.city,
    district: row.district,
    state: row.state,
    country: row.country,
    formattedAddress: row.formattedAddress,
  },
  location: {
    type: 'Point',
    coordinates: [row.longitude, row.latitude],
  },
  price: row.price,
  homeImage: row.homeImage,
  description: row.description,
  owner: row.ownerId,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

class User {
  constructor(data) {
    this.firstname = data.firstname;
    this.lastname = data.lastname;
    this.email = data.email;
    this.password = data.password;
    this.role = data.role;
    this.googleId = data.googleId;
    this.avatar = data.avatar;
    this.publicKey = data.publicKey;
  }

  async save() {
    const user = await prisma.user.create({
      data: {
        firstname: this.firstname,
        lastname: this.lastname,
        email: this.email,
        password: this.password || null,
        role: this.role || null,
        googleId: this.googleId || null,
        avatar: this.avatar || null,
        publicKey: this.publicKey || null,
      },
    });

    return mapUserRow(user);
  }

  static async findOne(filter) {
    if (filter.email) {
      const user = await prisma.user.findUnique({
        where: {
          email: filter.email,
        },
      });
      return mapUserRow(user);
    }

    return null;
  }

  static async findByGoogleId(googleId) {
    const user = await prisma.user.findUnique({
      where: { googleId },
    });
    return mapUserRow(user);
  }

  static async findById(id) {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    return mapUserRow(user);
  }

  static async updateRole(userId, role) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });
    return mapUserRow(user);
  }

  static async addFavourite(userId, homeId) {
    await prisma.userFavourite.upsert({
      where: {
        userId_homeId: {
          userId,
          homeId,
        },
      },
      create: {
        userId,
        homeId,
      },
      update: {},
    });
  }

  static async findFavouritesByUserId(userId) {
    const favourites = await prisma.userFavourite.findMany({
      where: { userId },
      include: {
        home: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return favourites.map((item) => mapHomeRow(item.home));
  }

  static async updatePublicKey(userId, publicKey) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { publicKey },
    });

    return mapUserRow(user);
  }
}

module.exports = User;
