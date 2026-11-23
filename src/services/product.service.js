import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { StockMovement } from '../models/StockMovement.js';
import { Sale } from '../models/Sale.js';

export async function createProduct(data, userId) {
  const existing = await Product.findOne({ sku: data.sku.toUpperCase(), isDeleted: false });
  if (existing) {
    throw Object.assign(new Error(`SKU "${data.sku}" already exists`), { statusCode: 409 });
  }

  const product = await Product.create({
    ...data,
    sku: data.sku.toUpperCase(),
    category: data.category?.trim() || undefined,
    brand: data.brand?.trim() || undefined,
    color: data.color?.trim() || undefined,
    description: data.description?.trim() || undefined,
    createdBy: new mongoose.Types.ObjectId(userId),
  });

  if (data.currentStock > 0) {
    await StockMovement.create({
      product: product._id,
      movementType: 'opening_stock',
      quantity: data.currentStock,
      previousStock: 0,
      newStock: data.currentStock,
      reason: 'Opening stock',
      createdBy: new mongoose.Types.ObjectId(userId),
    });
  }

  return product;
}

export async function getProducts(filters) {
  const {
    search,
    status,
    category,
    brand,
    unit,
    minPrice,
    maxPrice,
    sortBy,
    sortOrder = 'desc',
    page = 1,
    pageSize = 20,
  } = filters;

  const query = { isDeleted: false };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
    ];
  }

  if (status === 'low_stock') {
    query.$expr = { $lte: ['$currentStock', '$minStockThreshold'] };
    query.currentStock = { $gt: 0 };
  } else if (status === 'out_of_stock') {
    query.currentStock = { $lte: 0 };
  } else if (status === 'in_stock') {
    query.$expr = { $gt: ['$currentStock', '$minStockThreshold'] };
  } else if (status === 'active') {
    query.status = 'active';
  } else if (status === 'inactive') {
    query.status = { $in: ['inactive', 'archived'] };
  } else if (status === 'archived') {
    query.status = 'archived';
  }

  if (category) query.category = category;
  if (brand) query.brand = { $regex: brand, $options: 'i' };
  if (unit) query.unit = unit;

  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceQuery = {};
    if (minPrice !== undefined && !isNaN(minPrice)) priceQuery.$gte = minPrice;
    if (maxPrice !== undefined && !isNaN(maxPrice)) priceQuery.$lte = maxPrice;
    if (Object.keys(priceQuery).length > 0) query.sellingPrice = priceQuery;
  }

  const sortOptions = {};
  const allowedSortFields = ['name', 'sellingPrice', 'purchaseCost', 'currentStock', 'createdAt'];
  if (sortBy && allowedSortFields.includes(sortBy)) {
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
  } else {
    sortOptions.createdAt = -1;
  }

  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .sort(sortOptions)
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean();

  const productIds = products.map((p) => p._id);
  const productsWithSales = productIds.length
    ? await Sale.distinct('items.product', { 'items.product': { $in: productIds } })
    : [];
  const productsWithSalesSet = new Set(productsWithSales.map((id) => String(id)));
  const productsWithHistory = products.map((product) => ({
    ...product,
    hasSalesHistory: productsWithSalesSet.has(String(product._id)),
  }));

  return {
    products: productsWithHistory,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function getProductById(id) {
  const product = await Product.findOne({ _id: id, isDeleted: false });
  if (!product) {
    throw Object.assign(new Error('Product not found'), { statusCode: 404 });
  }
  return product;
}

export async function updateProduct(id, data, userId) {
  const product = await Product.findOne({ _id: id, isDeleted: false });
  if (!product) {
    throw Object.assign(new Error('Product not found'), { statusCode: 404 });
  }

  if (data.sku && data.sku.toUpperCase() !== product.sku) {
    const dup = await Product.findOne({ sku: data.sku.toUpperCase(), isDeleted: false, _id: { $ne: id } });
    if (dup) {
      throw Object.assign(new Error(`SKU "${data.sku}" already exists`), { statusCode: 409 });
    }
  }

  const prevStock = product.currentStock;
  const newStock = data.currentStock !== undefined ? data.currentStock : prevStock;

  Object.assign(product, {
    ...data,
    category: data.category?.trim() || undefined,
    brand: data.brand?.trim() || undefined,
    color: data.color?.trim() || undefined,
    description: data.description?.trim() || undefined,
  });
  if (data.sku) product.sku = data.sku.toUpperCase();
  await product.save();

  if (data.currentStock !== undefined && data.currentStock !== prevStock) {
    const diff = data.currentStock - prevStock;
    await StockMovement.create({
      product: product._id,
      movementType: 'stock_adjustment',
      quantity: diff,
      previousStock: prevStock,
      newStock,
      reason: 'Manual stock adjustment',
      createdBy: new mongoose.Types.ObjectId(userId),
    });
  }

  return product;
}

export async function deleteProduct(id) {
  const product = await Product.findOne({ _id: id, isDeleted: false });
  if (!product) {
    throw Object.assign(new Error('Product not found'), { statusCode: 404 });
  }

  const usedInSale = await Sale.findOne({ 'items.product': new mongoose.Types.ObjectId(id) });
  if (usedInSale) {
    throw Object.assign(
      new Error('Cannot delete product that has been sold. Deactivate it instead.'),
      { statusCode: 409 }
    );
  }

  product.isDeleted = true;
  product.status = 'archived';
  await product.save();
}

export async function searchProducts(query) {
  return Product.find({
    isDeleted: false,
    status: 'active',
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { sku: { $regex: query, $options: 'i' } },
      { brand: { $regex: query, $options: 'i' } },
    ],
  })
    .select('_id name sku sellingPrice currentStock unit brand color')
    .limit(20)
    .lean();
}

export async function getLowStockProducts() {
  return Product.find({
    isDeleted: false,
    status: 'active',
    $expr: { $lte: ['$currentStock', '$minStockThreshold'] },
  })
    .select('name sku currentStock minStockThreshold unit')
    .lean();
}
