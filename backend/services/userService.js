const prisma = require('./prisma');
const bcrypt = require('bcryptjs');

const UserService = {
  findById: async (id) => {
    if (!id) return null;
    return prisma.user.findUnique({
      where: { id },
      include: { addresses: true }
    });
  },

  findByEmail: async (email) => {
    if (!email) return null;
    return prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { addresses: true }
    });
  },

  findByResetToken: async (token) => {
    return prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() }
      }
    });
  },

  findByVerificationOtp: async (otp) => {
    return prisma.user.findFirst({
      where: {
        verificationOtp: otp,
        verificationOtpExpires: { gt: new Date() }
      }
    });
  },

  create: async (data) => {
    const rawPassword = data.password || '';
    let hashedPassword = rawPassword;
    if (rawPassword && !rawPassword.startsWith('$2')) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(rawPassword, salt);
    }

    const { addresses, cartItems, wishlistItems, ...rest } = data;

    return prisma.user.create({
      data: {
        ...rest,
        password: hashedPassword,
        passwordHash: hashedPassword,
        addresses: addresses ? {
          create: addresses
        } : undefined
      },
      include: { addresses: true }
    });
  },

  update: async (id, data) => {
    if (data.password && !data.password.startsWith('$2')) {
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(data.password, salt);
      data.passwordHash = data.password;
    }

    const { addresses, cartItems, wishlistItems, ...rest } = data;

    return prisma.user.update({
      where: { id },
      data: rest,
      include: { addresses: true }
    });
  },

  delete: async (id) => {
    return prisma.user.delete({
      where: { id }
    });
  },

  findMany: async (where = {}, options = {}) => {
    return prisma.user.findMany({
      where,
      orderBy: options.sort ? options.sort : { createdAt: 'desc' },
      take: options.limit,
      skip: options.skip,
      include: { addresses: true }
    });
  },

  count: async (where = {}) => {
    return prisma.user.count({ where });
  },

  incrementLoginAttempts: async (id, currentAttempts) => {
    const nextAttempts = (currentAttempts || 0) + 1;
    const data = { loginAttempts: nextAttempts };
    if (nextAttempts >= 5) {
      data.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min lock
    }
    return prisma.user.update({
      where: { id },
      data
    });
  },

  resetLoginAttempts: async (id) => {
    return prisma.user.update({
      where: { id },
      data: {
        loginAttempts: 0,
        lockUntil: null
      }
    });
  },

  // Address sub-resource managers
  addAddress: async (userId, addressData) => {
    // If setting as default, mark others as false
    if (addressData.isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false }
      });
    }
    return prisma.address.create({
      data: {
        ...addressData,
        userId
      }
    });
  },

  updateAddress: async (userId, addressId, addressData) => {
    if (addressData.isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false }
      });
    }
    return prisma.address.update({
      where: { id: addressId },
      data: addressData
    });
  },

  deleteAddress: async (addressId) => {
    return prisma.address.delete({
      where: { id: addressId }
    });
  }
};

module.exports = UserService;
