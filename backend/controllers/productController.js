const Product = require('../models/Product');
const Category = require('../models/Category');
const Review = require('../models/Review');
const Setting = require('../models/Setting');
const { deleteFromCloudinary } = require('../services/cloudinary');
const fs = require('fs');
const path = require('path');

// RegExp Escape utility to prevent ReDoS and RegExp injection
const escapeRegex = (string) => string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

const DEFAULT_PRODUCT_IMAGE = '/assets/images/default-product.webp';

const normalizeProductDoc = (product) => {
  const doc = product.toObject ? product.toObject() : { ...product };
  if (!doc.images || !doc.images.length) {
    doc.images = [{ url: DEFAULT_PRODUCT_IMAGE, publicId: null }];
  } else {
    doc.images = doc.images.map((img) => ({
      ...img,
      url: img && img.url && String(img.url).trim() ? img.url : DEFAULT_PRODUCT_IMAGE
    }));
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
      ids
    } = req.query;

    const query = {};

    // Filter by specific product IDs
    if (ids) {
      const idArray = ids.split(',').map(id => id.trim()).filter(id => id.match(/^[0-9a-fA-F]{24}$/));
      if (idArray.length > 0) {
        query._id = { $in: idArray };
      }
    }

    // Search filter
    if (search) {
      const cleanSearch = escapeRegex(search);
      query.$or = [
        { name: { $regex: cleanSearch, $options: 'i' } },
        { description: { $regex: cleanSearch, $options: 'i' } },
        { tags: { $in: [new RegExp(cleanSearch, 'i')] } }
      ];
    }

    // Category filter
    if (category) {
      // Find category by slug or ID
      const cat = await Category.findOne({ $or: [{ slug: category }, { name: category }] });
      if (cat) {
        query.category = cat._id;
      } else if (category.match(/^[0-9a-fA-F]{24}$/)) {
        query.category = category;
      }
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Specification filters
    if (material) {
      query['specifications.material'] = { $regex: escapeRegex(material), $options: 'i' };
    }
    if (color) {
      query['specifications.color'] = { $regex: escapeRegex(color), $options: 'i' };
    }
    if (occasion) {
      query.tags = { $in: [new RegExp(escapeRegex(occasion), 'i')] };
    }

    // Sorting configurations
    let sortQuery = { createdAt: -1 }; // default newest
    if (sort) {
      switch (sort) {
        case 'priceLowHigh':
          sortQuery = { price: 1 };
          break;
        case 'priceHighLow':
          sortQuery = { price: -1 };
          break;
        case 'bestSelling':
          // Sort by bestseller flag first, then reviews
          sortQuery = { totalReviews: -1, averageRating: -1 };
          break;
        case 'mostPopular':
          sortQuery = { averageRating: -1, totalReviews: -1 };
          break;
        case 'newest':
        default:
          sortQuery = { createdAt: -1 };
          break;
      }
    }

    const count = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sortQuery)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    res.status(200).json({
      success: true,
      count,
      page: Number(page),
      pages: Math.ceil(count / Number(limit)),
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
    const product = await Product.findById(req.params.id).populate('category', 'name slug');
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    let related = [];
    if (product.category && product.category._id) {
      related = await Product.find({
        category: product.category._id,
        _id: { $ne: product._id }
      }).limit(4);
    }

    // Fetch product reviews
    const reviews = await Review.find({ productId: product._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      product: normalizeProductDoc(product),
      reviews,
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
    const { name, description, price, discountPrice, stock, category, specifications, tags } = req.body;

    if (!name || !description || !price || !category) {
      return res.status(400).json({ success: false, error: 'Please provide name, description, price and category' });
    }

    // req.processedImages is populated by uploadMiddleware
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

    const product = await Product.create({
      name,
      description,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : null,
      stock: Number(stock) || 0,
      category,
      images,
      specifications: specs,
      tags: productTags
    });

    res.status(201).json({ success: true, message: 'Product created successfully!', product });
  } catch (error) {
    res.status(500).json({ success: false, error: `Product creation error: ${error.message}` });
  }
};

// @desc    Update a product details, supporting reordering & additions
// @route   PUT /api/products/:id
// @access  Private (Admin Only)
exports.updateProduct = async (req, res) => {
  try {
    const { name, description, price, discountPrice, stock, category, specifications, tags, existingImages } = req.body;
    
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = Number(price);
    if (discountPrice !== undefined) product.discountPrice = discountPrice ? Number(discountPrice) : null;
    if (stock !== undefined) product.stock = Number(stock);
    if (category) product.category = category;

    if (specifications) {
      product.specifications = typeof specifications === 'string' ? JSON.parse(specifications) : specifications;
    }
    if (tags) {
      product.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    }

    // Parse existingImages from client
    let parsedExistingImages = [];
    if (existingImages) {
      parsedExistingImages = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
    }

    // New uploaded images processed by uploadMiddleware
    const newPrimary = req.processedImages ? req.processedImages.find(img => img.fieldName === 'primaryImage') : null;
    const newSecondary = req.processedImages ? req.processedImages.find(img => img.fieldName === 'secondaryImage') : null;
    const newGallery = req.processedImages ? req.processedImages.filter(img => img.fieldName === 'galleryImages') : [];

    // Determine final primary image
    let finalPrimary = null;
    if (newPrimary) {
      finalPrimary = { url: newPrimary.url, publicId: newPrimary.publicId };
    } else {
      const existingPrimary = parsedExistingImages.find(img => img.role === 'primary');
      if (existingPrimary) {
        finalPrimary = { url: existingPrimary.url, publicId: existingPrimary.publicId };
      }
    }

    // Determine final secondary image
    let finalSecondary = null;
    if (newSecondary) {
      finalSecondary = { url: newSecondary.url, publicId: newSecondary.publicId };
    } else {
      const existingSecondary = parsedExistingImages.find(img => img.role === 'secondary');
      if (existingSecondary) {
        finalSecondary = { url: existingSecondary.url, publicId: existingSecondary.publicId };
      }
    }

    // Determine final gallery images
    const finalGallery = [];
    // Keep existing gallery images in the order they were sent
    const existingGalleries = parsedExistingImages.filter(img => img.role === 'gallery');
    existingGalleries.forEach(img => {
      finalGallery.push({ url: img.url, publicId: img.publicId });
    });
    // Append new gallery images
    newGallery.forEach(img => {
      finalGallery.push({ url: img.url, publicId: img.publicId });
    });

    // Construct final images array
    const finalImages = [];
    if (finalPrimary) finalImages.push(finalPrimary);
    if (finalSecondary) finalImages.push(finalSecondary);
    finalImages.push(...finalGallery);

    // If final images is empty, fall back to default product image
    if (finalImages.length === 0) {
      finalImages.push({ url: '/assets/images/default-product.webp', publicId: null });
    }

    // Identify images that were deleted to clean up storage
    const oldImages = product.images || [];
    const finalUrls = finalImages.map(img => img.url);
    const imagesToDelete = oldImages.filter(img => !finalUrls.includes(img.url));

    for (const img of imagesToDelete) {
      if (img.publicId) {
        if (img.publicId.endsWith('.webp')) {
          const localPath = path.join(__dirname, '../../uploads/products', img.publicId);
          if (fs.existsSync(localPath)) {
            try {
              fs.unlinkSync(localPath);
            } catch (err) {
              console.error(`Error deleting file ${localPath}:`, err);
            }
          }
        } else {
          try {
            await deleteFromCloudinary(img.publicId);
          } catch (err) {
            console.error(`Error deleting from Cloudinary ${img.publicId}:`, err);
          }
        }
      }
    }

    product.images = finalImages;

    await product.save();
    res.status(200).json({ success: true, message: 'Product updated successfully!', product });
  } catch (error) {
    res.status(500).json({ success: false, error: `Product update error: ${error.message}` });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (Admin Only)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Delete all attached images
    for (const img of product.images) {
      if (img.publicId) {
        if (img.publicId.endsWith('.webp')) {
          const localPath = path.join(__dirname, '../../uploads/products', img.publicId);
          if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
        } else {
          await deleteFromCloudinary(img.publicId);
        }
      }
    }

    await Product.findByIdAndDelete(req.params.id);
    
    // Also clear references in Homepage setting if selected
    const homepageSetting = await Setting.findOne({ key: 'homepage' });
    if (homepageSetting) {
      const v = homepageSetting.value;
      const cleanList = (list) => list.filter(id => id.toString() !== req.params.id);
      v.featuredProductIds = cleanList(v.featuredProductIds);
      v.bestSellerProductIds = cleanList(v.bestSellerProductIds);
      v.newArrivalProductIds = cleanList(v.newArrivalProductIds);
      v.trendingProductIds = cleanList(v.trendingProductIds);
      v.recommendedProductIds = cleanList(v.recommendedProductIds);
      homepageSetting.markModified('value');
      await homepageSetting.save();
    }

    res.status(200).json({ success: true, message: 'Product deleted from system.' });
  } catch (error) {
    res.status(500).json({ success: false, error: `Product deletion error: ${error.message}` });
  }
};

// @desc    Add review & compute product average rating
// @route   POST /api/products/:id/reviews
// @access  Public
exports.createReview = async (req, res) => {
  try {
    const { name, rating, comment } = req.body;
    const productId = req.params.id;

    if (!name || !rating) {
      return res.status(400).json({ success: false, error: 'Please provide name and rating' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const review = await Review.create({
      productId,
      name,
      rating: Number(rating),
      comment: comment || ''
    });

    // Update product review aggregates
    const allReviews = await Review.find({ productId });
    const count = allReviews.length;
    const avg = allReviews.reduce((sum, rev) => sum + rev.rating, 0) / count;

    product.totalReviews = count;
    product.averageRating = Math.round(avg * 10) / 10;
    await product.save();

    res.status(201).json({ success: true, message: 'Review submitted successfully!', review });
  } catch (error) {
    res.status(500).json({ success: false, error: `Review error: ${error.message}` });
  }
};

// @desc    Get all categories list
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({});
    res.status(200).json({ success: true, categories });
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
    const category = await Category.create({
      name,
      image: image || '/assets/images/default-category.webp',
      slug
    });

    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, error: `Category creation error: ${error.message}` });
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private (Admin Only)
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }
    await Category.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: `Category deletion error: ${error.message}` });
  }
};

// @desc    Duplicate a product
// @route   POST /api/products/duplicate/:id
// @access  Private (Admin Only)
exports.duplicateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const clonedProduct = new Product({
      name: `${product.name} - Copy`,
      description: product.description,
      price: product.price,
      discountPrice: product.discountPrice,
      stock: 0,
      category: product.category,
      images: product.images.map(img => ({ url: img.url, publicId: null })),
      specifications: product.specifications,
      tags: product.tags,
      averageRating: 0,
      totalReviews: 0
    });

    await clonedProduct.save();

    res.status(201).json({ success: true, message: 'Product duplicated successfully!', product: clonedProduct });
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

    const products = await Product.find({ _id: { $in: ids } });
    
    // Delete attached images
    for (const product of products) {
      for (const img of product.images) {
        if (img.publicId) {
          if (img.publicId.endsWith('.webp')) {
            const localPath = path.join(__dirname, '../../uploads/products', img.publicId);
            if (fs.existsSync(localPath)) {
              try {
                fs.unlinkSync(localPath);
              } catch (e) {}
            }
          } else {
            try {
              await deleteFromCloudinary(img.publicId);
            } catch (e) {}
          }
        }
      }
    }

    await Product.deleteMany({ _id: { $in: ids } });

    // Also clear references in homepage settings
    const homepageSetting = await Setting.findOne({ key: 'homepage' });
    if (homepageSetting) {
      const v = homepageSetting.value;
      const cleanList = (list) => list.filter(id => !ids.includes(id.toString()));
      v.featuredProductIds = cleanList(v.featuredProductIds);
      v.bestSellerProductIds = cleanList(v.bestSellerProductIds);
      v.newArrivalProductIds = cleanList(v.newArrivalProductIds);
      v.trendingProductIds = cleanList(v.trendingProductIds);
      v.recommendedProductIds = cleanList(v.recommendedProductIds);
      homepageSetting.markModified('value');
      await homepageSetting.save();
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
      updateFields.category = category;
    }

    if (stockAction && stockValue !== undefined) {
      const val = Number(stockValue);
      if (stockAction === 'set') {
        updateFields.stock = val;
        await Product.updateMany({ _id: { $in: ids } }, { $set: updateFields });
      } else if (stockAction === 'add') {
        const updateObj = { $inc: { stock: val } };
        if (category) updateObj.$set = { category };
        await Product.updateMany({ _id: { $in: ids } }, updateObj);
      } else if (stockAction === 'subtract') {
        const updateObj = { $inc: { stock: -val } };
        if (category) updateObj.$set = { category };
        await Product.updateMany({ _id: { $in: ids } }, updateObj);
        // Correct any potential negative stock
        await Product.updateMany({ _id: { $in: ids }, stock: { $lt: 0 } }, { $set: { stock: 0 } });
      }
    } else if (category) {
      await Product.updateMany({ _id: { $in: ids } }, { $set: updateFields });
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

      // Find or create category
      let categoryObj = await Category.findOne({ name: { $regex: new RegExp(`^${escapeRegex(categoryName.trim())}$`, 'i') } });
      if (!categoryObj) {
        const slug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        categoryObj = await Category.create({
          name: categoryName.trim(),
          slug,
          image: '/assets/images/default-category.webp'
        });
      }

      const specifications = {
        material: material || '',
        dimensions: dimensions || '',
        weight: weight || '',
        color: color || ''
      };

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

      const newProd = new Product({
        name: name.trim(),
        description: description || name,
        price: Number(price),
        discountPrice: discountPrice ? Number(discountPrice) : null,
        stock: Number(stock) || 0,
        category: categoryObj._id,
        images: productImages,
        specifications,
        tags: productTags
      });

      await newProd.save();
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
