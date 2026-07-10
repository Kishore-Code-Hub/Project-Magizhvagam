const prisma = require('../services/prisma');
const { deleteFromCloudinary } = require('../services/cloudinary');
const fs = require('fs');
const path = require('path');

const DEFAULT_PRODUCT_IMAGE = '/assets/images/default-product.webp';

// RegExp Escape utility to prevent ReDoS and RegExp injection
const escapeRegex = (string) => string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

// Helper to safely delete local product images
const deleteLocalProductImage = (publicId) => {
  if (!publicId) return;
  let localPath = path.join(__dirname, '../../assets/images/products', publicId);
  if (fs.existsSync(localPath)) {
    try {
      fs.unlinkSync(localPath);
      return;
    } catch (err) {
      console.error(`Error deleting file ${localPath}:`, err);
    }
  }
  localPath = path.join(__dirname, '../../uploads/products', publicId);
  if (fs.existsSync(localPath)) {
    try {
      fs.unlinkSync(localPath);
    } catch (err) {
      console.error(`Error deleting file ${localPath}:`, err);
    }
  }
};

const normalizeProductDoc = (product) => {
  if (!product) return null;
  const doc = { ...product };
  
  // Format specifications
  doc.specifications = {
    material: product.material || '',
    dimensions: product.dimensions || '',
    weight: product.weight || '',
    color: product.color || ''
  };

  // Keep compatibility fields
  doc._id = product.id;

  // Format category
  if (product.category) {
    doc.category = {
      _id: product.category.id,
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug
    };
  }

  // Format images
  if (product.images) {
    doc.images = product.images.map((img) => ({
      url: img.url || DEFAULT_PRODUCT_IMAGE,
      publicId: img.publicId
    }));
  }

  if (!doc.images || !doc.images.length) {
    doc.images = [{ url: DEFAULT_PRODUCT_IMAGE, publicId: null }];
  }

  return doc;
};

// @desc    Get all products with filters, search, and sorting
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const { 
      search, category, minPrice, maxPrice, 
      material, color, occasion, sort, page = 1, limit = 12,
      ids, select, isFeatured, rating, availability, discount, newArrivals
    } = req.query;

    const where = {};

    const cleanString = (val) => (typeof val === 'string' ? val.trim() : '');

    const searchVal = cleanString(search);
    const categoryVal = cleanString(category);
    const materialVal = cleanString(material);
    const colorVal = cleanString(color);
    const occasionVal = cleanString(occasion);
    const sortVal = cleanString(sort);
    const idsVal = cleanString(ids);
    const selectVal = cleanString(select);
    const isFeaturedVal = cleanString(isFeatured);
    const ratingVal = cleanString(rating);
    const availabilityVal = cleanString(availability);
    const discountVal = cleanString(discount);
    const newArrivalsVal = cleanString(newArrivals);

    if (isFeaturedVal === 'true') {
      where.isFeatured = true;
    } else if (isFeaturedVal === 'false') {
      where.isFeatured = false;
    }

    if (ratingVal) {
      const numRating = Number(ratingVal);
      if (Number.isFinite(numRating)) {
        where.averageRating = { gte: numRating };
      }
    }

    if (availabilityVal === 'inStock') {
      where.stock = { gt: 0 };
    } else if (availabilityVal === 'outOfStock') {
      where.stock = 0;
    }

    if (discountVal === 'true') {
      where.discountPrice = { not: null, gt: 0 };
    }

    if (newArrivalsVal === 'true') {
      where.tags = { hasSome: ['new', 'new-arrival'] };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 12);

    if (idsVal) {
      const idArray = idsVal.split(',').map(id => id.trim()).filter(Boolean);
      if (idArray.length > 0) {
        where.id = { in: idArray };
      }
    }

    if (searchVal) {
      where.OR = [
        { name: { contains: searchVal, mode: 'insensitive' } },
        { description: { contains: searchVal, mode: 'insensitive' } },
        { tags: { has: searchVal } }
      ];
    }

    if (categoryVal) {
      const cat = await prisma.category.findFirst({
        where: {
          OR: [
            { slug: categoryVal },
            { name: categoryVal },
            { id: categoryVal }
          ]
        }
      });
      if (cat) {
        where.categoryId = cat.id;
      }
    }

    const minP = minPrice !== undefined && minPrice !== '' ? Number(minPrice) : NaN;
    const maxP = maxPrice !== undefined && maxPrice !== '' ? Number(maxPrice) : NaN;
    if (Number.isFinite(minP) || Number.isFinite(maxP)) {
      where.price = {};
      if (Number.isFinite(minP)) where.price.gte = minP;
      if (Number.isFinite(maxP)) where.price.lte = maxP;
    }

    if (materialVal) {
      where.material = { contains: materialVal, mode: 'insensitive' };
    }
    if (colorVal) {
      where.color = { contains: colorVal, mode: 'insensitive' };
    }
    if (occasionVal) {
      where.tags = { has: occasionVal };
    }

    let sortQuery = { createdAt: 'desc' };
    if (sortVal) {
      switch (sortVal) {
        case 'priceLowHigh':
          sortQuery = { price: 'asc' };
          break;
        case 'priceHighLow':
          sortQuery = { price: 'desc' };
          break;
        case 'oldest':
          sortQuery = { createdAt: 'asc' };
          break;
        case 'highestRated':
          sortQuery = { averageRating: 'desc' };
          break;
        case 'bestSelling':
          sortQuery = { totalReviews: 'desc' };
          break;
        case 'mostPopular':
          sortQuery = { averageRating: 'desc' };
          break;
        case 'alphabetical':
          sortQuery = { name: 'asc' };
          break;
        case 'newest':
        default:
          sortQuery = { createdAt: 'desc' };
          break;
      }
    }

    const count = await prisma.product.count({ where });

    const products = await prisma.product.findMany({
      where,
      orderBy: sortQuery,
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      include: {
        images: true,
        category: true
      }
    });

    res.status(200).json({
      success: true,
      count,
      page: pageNum,
      pages: Math.ceil(count / limitNum),
      products: products.map(normalizeProductDoc)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: `Error fetching products: ${error.message}` });
  }
};

// @desc    Get a single product detail with reviews & related products
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { images: true, category: true }
    });
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    let related = [];
    if (product.categoryId) {
      const catMatches = await prisma.product.findMany({
        where: {
          categoryId: product.categoryId,
          NOT: { id: product.id }
        },
        include: { images: true, category: true },
        take: 8
      });

      let tagMatches = [];
      if (product.tags && product.tags.length > 0) {
        tagMatches = await prisma.product.findMany({
          where: {
            tags: { hasSome: product.tags },
            NOT: {
              id: { in: [product.id, ...catMatches.map(p => p.id)] }
            }
          },
          include: { images: true, category: true },
          take: 8 - catMatches.length
        });
      }
      related = [...catMatches, ...tagMatches];
    }

    res.status(200).json({
      success: true,
      product: normalizeProductDoc(product),
      reviews: [],
      related: related.map(normalizeProductDoc)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: `Error fetching product: ${error.message}` });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private (Admin Only)
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, discountPrice, stock, category, specifications, tags, isFeatured } = req.body;

    if (!name || !description || !price || !category) {
      return res.status(400).json({ success: false, error: 'Please provide name, description, price and category' });
    }

    const primaryImg = req.processedImages ? req.processedImages.find(img => img.fieldName === 'primaryImage') : null;
    const secondaryImg = req.processedImages ? req.processedImages.find(img => img.fieldName === 'secondaryImage') : null;
    const galleryImgs = req.processedImages ? req.processedImages.filter(img => img.fieldName === 'galleryImages') : [];

    const images = [];
    if (primaryImg) {
      images.push({ url: primaryImg.url, publicId: primaryImg.publicId });
    }
    if (secondaryImg) {
      images.push({ url: secondaryImg.url, publicId: secondaryImg.publicId });
    }
    galleryImgs.forEach(img => {
      images.push({ url: img.url, publicId: img.publicId });
    });

    if (images.length === 0) {
      images.push({ url: '/assets/images/default-product.webp', publicId: null });
    }

    const specs = specifications ? (typeof specifications === 'string' ? JSON.parse(specifications) : specifications) : {};
    const productTags = tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [];

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: Number(price),
        discountPrice: discountPrice ? Number(discountPrice) : null,
        stock: Number(stock) || 0,
        categoryId: category,
        imageFolder: req.imageFolder,
        material: specs.material || '',
        dimensions: specs.dimensions || '',
        weight: specs.weight || '',
        color: specs.color || '',
        tags: productTags,
        isFeatured: isFeatured === 'true' || isFeatured === true,
        images: {
          create: images
        }
      },
      include: { images: true, category: true }
    });

    res.status(201).json({ success: true, message: 'Product created successfully!', product: normalizeProductDoc(product) });
  } catch (error) {
    res.status(500).json({ success: false, error: `Product creation error: ${error.message}` });
  }
};

// @desc    Update a product details
// @route   PUT /api/products/:id
// @access  Private (Admin Only)
exports.updateProduct = async (req, res) => {
  try {
    const { name, description, price, discountPrice, stock, category, specifications, tags, existingImages, isFeatured } = req.body;
    
    let product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { images: true }
    });
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const specs = specifications ? (typeof specifications === 'string' ? JSON.parse(specifications) : specifications) : null;
    const productTags = tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : null;

    let parsedExistingImages = [];
    if (existingImages) {
      parsedExistingImages = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
    }

    const newPrimary = req.processedImages ? req.processedImages.find(img => img.fieldName === 'primaryImage') : null;
    const newSecondary = req.processedImages ? req.processedImages.find(img => img.fieldName === 'secondaryImage') : null;
    const newGallery = req.processedImages ? req.processedImages.filter(img => img.fieldName === 'galleryImages') : [];

    let finalPrimary = null;
    if (newPrimary) {
      finalPrimary = { url: newPrimary.url, publicId: newPrimary.publicId };
    } else {
      const existingPrimary = parsedExistingImages.find(img => img.role === 'primary');
      if (existingPrimary) {
        finalPrimary = { url: existingPrimary.url, publicId: existingPrimary.publicId };
      }
    }

    let finalSecondary = null;
    if (newSecondary) {
      finalSecondary = { url: newSecondary.url, publicId: newSecondary.publicId };
    } else {
      const existingSecondary = parsedExistingImages.find(img => img.role === 'secondary');
      if (existingSecondary) {
        finalSecondary = { url: existingSecondary.url, publicId: existingSecondary.publicId };
      }
    }

    const finalGallery = [];
    const existingGalleries = parsedExistingImages.filter(img => img.role === 'gallery');
    existingGalleries.forEach(img => {
      finalGallery.push({ url: img.url, publicId: img.publicId });
    });
    newGallery.forEach(img => {
      finalGallery.push({ url: img.url, publicId: img.publicId });
    });

    const finalImages = [];
    if (finalPrimary) finalImages.push(finalPrimary);
    if (finalSecondary) finalImages.push(finalSecondary);
    finalImages.push(...finalGallery);

    if (finalImages.length === 0) {
      finalImages.push({ url: '/assets/images/default-product.webp', publicId: null });
    }

    // Clean up deleted images
    const oldImages = product.images || [];
    const finalUrls = finalImages.map(img => img.url);
    const imagesToDelete = oldImages.filter(img => !finalUrls.includes(img.url));

    for (const img of imagesToDelete) {
      if (img.publicId) {
        if (img.publicId.endsWith('.webp')) {
          deleteLocalProductImage(img.publicId);
        } else {
          try {
            await deleteFromCloudinary(img.publicId);
          } catch (err) {
            console.error(`Error deleting from Cloudinary ${img.publicId}:`, err);
          }
        }
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.productImage.deleteMany({
        where: { productId: product.id }
      });

      await tx.product.update({
        where: { id: product.id },
        data: {
          name: name || undefined,
          description: description || undefined,
          price: price !== undefined ? Number(price) : undefined,
          discountPrice: discountPrice !== undefined ? (discountPrice ? Number(discountPrice) : null) : undefined,
          stock: stock !== undefined ? Number(stock) : undefined,
          categoryId: category || undefined,
          imageFolder: req.imageFolder || undefined,
          isFeatured: isFeatured !== undefined ? (isFeatured === 'true' || isFeatured === true) : undefined,
          material: specs ? (specs.material || '') : undefined,
          dimensions: specs ? (specs.dimensions || '') : undefined,
          weight: specs ? (specs.weight || '') : undefined,
          color: specs ? (specs.color || '') : undefined,
          tags: productTags ? productTags : undefined,
          images: {
            create: finalImages
          }
        }
      });
    });

    const updatedProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: { images: true, category: true }
    });

    res.status(200).json({ success: true, message: 'Product updated successfully!', product: normalizeProductDoc(updatedProduct) });
  } catch (error) {
    res.status(500).json({ success: false, error: `Product update error: ${error.message}` });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (Admin Only)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { images: true }
    });
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    for (const img of product.images) {
      if (img.publicId) {
        if (img.publicId.endsWith('.webp')) {
          deleteLocalProductImage(img.publicId);
        } else {
          try {
            await deleteFromCloudinary(img.publicId);
          } catch (err) {}
        }
      }
    }

    if (product.imageFolder) {
      const productDir = path.join(__dirname, '../../assets/images/products', product.imageFolder);
      if (fs.existsSync(productDir)) {
        try {
          fs.rmSync(productDir, { recursive: true, force: true });
        } catch (err) {
          console.error(`Error deleting product directory ${productDir}:`, err);
        }
      }
    } else {
      const productDir = path.join(__dirname, '../../uploads/products', product.id);
      if (fs.existsSync(productDir)) {
        try {
          fs.rmSync(productDir, { recursive: true, force: true });
        } catch (err) {
          console.error(`Error deleting legacy product directory ${productDir}:`, err);
        }
      }
    }

    await prisma.product.delete({
      where: { id: req.params.id }
    });
    
    const homepageSetting = await prisma.setting.findUnique({ where: { key: 'homepage' } });
    if (homepageSetting && homepageSetting.value) {
      const v = typeof homepageSetting.value === 'string' ? JSON.parse(homepageSetting.value) : homepageSetting.value;
      const cleanList = (list) => (list || []).filter(id => id !== req.params.id);
      v.featuredProductIds = cleanList(v.featuredProductIds);
      v.bestSellerProductIds = cleanList(v.bestSellerProductIds);
      v.newArrivalProductIds = cleanList(v.newArrivalProductIds);
      v.trendingProductIds = cleanList(v.trendingProductIds);
      v.recommendedProductIds = cleanList(v.recommendedProductIds);

      await prisma.setting.update({
        where: { key: 'homepage' },
        data: { value: v }
      });
    }

    res.status(200).json({ success: true, message: 'Product deleted from system.' });
  } catch (error) {
    res.status(500).json({ success: false, error: `Product deletion error: ${error.message}` });
  }
};

// @desc    Get all categories list
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({});
    const mapped = categories.map(c => ({
      ...c,
      _id: c.id
    }));
    res.status(200).json({ success: true, categories: mapped });
  } catch (error) {
    res.status(500).json({ success: false, error: `Error fetching categories: ${error.message}` });
  }
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private (Admin Only)
exports.createCategory = async (req, res) => {
  try {
    const { name, image } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Category name is required' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const category = await prisma.category.create({
      data: {
        name,
        image: image || '/assets/images/default-category.webp',
        slug
      }
    });

    res.status(201).json({ success: true, category: { ...category, _id: category.id } });
  } catch (error) {
    res.status(500).json({ success: false, error: `Category creation error: ${error.message}` });
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private (Admin Only)
exports.deleteCategory = async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id }
    });
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }
    await prisma.category.delete({
      where: { id: req.params.id }
    });
    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: `Category deletion error: ${error.message}` });
  }
};

// @desc    Update a category
// @route   PUT /api/products/categories/:id
// @access  Private (Admin Only)
exports.updateCategory = async (req, res) => {
  try {
    const { name, image } = req.body;
    let category = await prisma.category.findUnique({
      where: { id: req.params.id }
    });
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    const data = {};
    if (name !== undefined) {
      data.name = name;
      data.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (image !== undefined) {
      data.image = image;
    }

    const updatedCategory = await prisma.category.update({
      where: { id: req.params.id },
      data
    });

    res.status(200).json({ success: true, category: { ...updatedCategory, _id: updatedCategory.id } });
  } catch (error) {
    res.status(500).json({ success: false, error: `Category update error: ${error.message}` });
  }
};


// @desc    Duplicate a product
// @route   POST /api/products/duplicate/:id
// @access  Private (Admin Only)
exports.duplicateProduct = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { images: true }
    });
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const clonedProduct = await prisma.product.create({
      data: {
        name: `${product.name} - Copy`,
        description: product.description,
        price: product.price,
        discountPrice: product.discountPrice,
        stock: 0,
        categoryId: product.categoryId,
        material: product.material,
        dimensions: product.dimensions,
        weight: product.weight,
        color: product.color,
        tags: product.tags,
        isFeatured: false,
        images: {
          create: product.images.map(img => ({ url: img.url, publicId: null }))
        }
      },
      include: { images: true, category: true }
    });

    res.status(201).json({ success: true, message: 'Product duplicated successfully!', product: normalizeProductDoc(clonedProduct) });
  } catch (error) {
    res.status(500).json({ success: false, error: `Product duplication error: ${error.message}` });
  }
};

// @desc    Bulk delete products
// @route   POST /api/products/bulk-delete
// @access  Private (Admin Only)
exports.bulkDeleteProducts = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'No product IDs provided' });
    }

    const products = await prisma.product.findMany({
      where: { id: { in: ids } },
      include: { images: true }
    });
    
    for (const product of products) {
      for (const img of product.images) {
        if (img.publicId) {
          if (img.publicId.endsWith('.webp')) {
            deleteLocalProductImage(img.publicId);
          } else {
            try {
              await deleteFromCloudinary(img.publicId);
            } catch (e) {}
          }
        }
      }
      if (product.imageFolder) {
        const productDir = path.join(__dirname, '../../assets/images/products', product.imageFolder);
        if (fs.existsSync(productDir)) {
          try {
            fs.rmSync(productDir, { recursive: true, force: true });
          } catch (e) {}
        }
      } else {
        const productDir = path.join(__dirname, '../../uploads/products', product.id);
        if (fs.existsSync(productDir)) {
          try {
            fs.rmSync(productDir, { recursive: true, force: true });
          } catch (e) {}
        }
      }
    }

    await prisma.product.deleteMany({
      where: { id: { in: ids } }
    });

    const homepageSetting = await prisma.setting.findUnique({ where: { key: 'homepage' } });
    if (homepageSetting && homepageSetting.value) {
      const v = typeof homepageSetting.value === 'string' ? JSON.parse(homepageSetting.value) : homepageSetting.value;
      const cleanList = (list) => (list || []).filter(id => !ids.includes(id));
      v.featuredProductIds = cleanList(v.featuredProductIds);
      v.bestSellerProductIds = cleanList(v.bestSellerProductIds);
      v.newArrivalProductIds = cleanList(v.newArrivalProductIds);
      v.trendingProductIds = cleanList(v.trendingProductIds);
      v.recommendedProductIds = cleanList(v.recommendedProductIds);

      await prisma.setting.update({
        where: { key: 'homepage' },
        data: { value: v }
      });
    }

    res.status(200).json({ success: true, message: 'Products deleted successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, error: `Bulk deletion error: ${error.message}` });
  }
};

// @desc    Bulk update products (stock, category)
// @route   PUT /api/products/bulk-update
// @access  Private (Admin Only)
exports.bulkUpdateProducts = async (req, res) => {
  try {
    const { ids, category, stockAction, stockValue } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'No product IDs provided' });
    }

    const updateFields = {};
    if (category) {
      updateFields.categoryId = category;
    }

    if (stockAction && stockValue !== undefined) {
      const val = Number(stockValue);
      if (stockAction === 'set') {
        await prisma.product.updateMany({
          where: { id: { in: ids } },
          data: { ...updateFields, stock: val }
        });
      } else if (stockAction === 'add') {
        for (const id of ids) {
          const prod = await prisma.product.findUnique({ where: { id } });
          if (prod) {
            await prisma.product.update({
              where: { id },
              data: {
                categoryId: category || undefined,
                stock: prod.stock + val
              }
            });
          }
        }
      } else if (stockAction === 'subtract') {
        for (const id of ids) {
          const prod = await prisma.product.findUnique({ where: { id } });
          if (prod) {
            await prisma.product.update({
              where: { id },
              data: {
                categoryId: category || undefined,
                stock: Math.max(0, prod.stock - val)
              }
            });
          }
        }
      }
    } else if (category) {
      await prisma.product.updateMany({
        where: { id: { in: ids } },
        data: { categoryId: category }
      });
    }

    res.status(200).json({ success: true, message: 'Products updated successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, error: `Bulk update error: ${error.message}` });
  }
};

// @desc    Bulk import products
// @route   POST /api/products/bulk-import
// @access  Private (Admin Only)
exports.bulkImportProducts = async (req, res) => {
  try {
    const { products } = req.body;
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: false, error: 'No products provided for import' });
    }

    const importedProducts = [];

    for (const item of products) {
      let { 
        name, description, price, discountPrice, stock, categoryName,
        material, dimensions, weight, color, tags, images
      } = item;

      if (!name || !price || !categoryName) {
        continue;
      }

      let categoryObj = await prisma.category.findFirst({
        where: { name: { equals: categoryName.trim(), mode: 'insensitive' } }
      });
      if (!categoryObj) {
        const slug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        categoryObj = await prisma.category.create({
          data: {
            name: categoryName.trim(),
            slug,
            image: '/assets/images/default-category.webp'
          }
        });
      }

      let productTags = [];
      if (tags) {
        if (Array.isArray(tags)) {
          productTags = tags;
        } else if (typeof tags === 'string') {
          productTags = tags.split(',').map(t => t.trim()).filter(Boolean);
        }
      }

      let productImages = [];
      if (images) {
        let imageUrls = [];
        if (Array.isArray(images)) {
          imageUrls = images;
        } else if (typeof images === 'string') {
          imageUrls = images.split(',').map(img => img.trim()).filter(Boolean);
        }
        productImages = imageUrls.map(url => ({ url, publicId: null }));
      }
      if (productImages.length === 0) {
        productImages.push({ url: '/assets/images/default-product.webp', publicId: null });
      }

      const newProd = await prisma.product.create({
        data: {
          name: name.trim(),
          description: description || name,
          price: Number(price),
          discountPrice: discountPrice ? Number(discountPrice) : null,
          stock: Number(stock) || 0,
          categoryId: categoryObj.id,
          material: material || '',
          dimensions: dimensions || '',
          weight: weight || '',
          color: color || '',
          tags: productTags,
          images: {
            create: productImages
          }
        }
      });

      importedProducts.push(newProd);
    }

    res.status(201).json({ 
      success: true, 
      message: `Successfully imported ${importedProducts.length} products!`, 
      count: importedProducts.length 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: `Bulk import error: ${error.message}` });
  }
};

// @desc    Toggle product featured flag
// @route   PUT /api/products/:id/featured
// @access  Private (Admin Only)
exports.toggleProductFeatured = async (req, res) => {
  try {
    const { isFeatured } = req.body;
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { isFeatured: !!isFeatured },
      include: { images: true, category: true }
    });
    res.status(200).json({ success: true, message: 'Featured status toggled successfully', product: normalizeProductDoc(product) });
  } catch (error) {
    res.status(500).json({ success: false, error: `Featured toggle error: ${error.message}` });
  }
};
