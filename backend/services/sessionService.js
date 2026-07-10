const prisma = require('./prisma');

const SessionService = {
  create: async (data) => {
    return prisma.userSession.create({
      data
    });
  },

  findUnique: async (refreshToken) => {
    return prisma.userSession.findUnique({
      where: { refreshToken }
    });
  },

  findMany: async (where = {}, orderBy = { lastActivity: 'desc' }) => {
    return prisma.userSession.findMany({
      where,
      orderBy
    });
  },

  delete: async (refreshToken) => {
    return prisma.userSession.delete({
      where: { refreshToken }
    });
  },

  deleteByIdAndUser: async (id, userId) => {
    return prisma.userSession.deleteMany({
      where: { id, userId }
    });
  },

  deleteMany: async (where) => {
    return prisma.userSession.deleteMany({
      where
    });
  }
};

module.exports = SessionService;
