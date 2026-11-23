import mongoose from 'mongoose';
import { CustomerReturn } from '../models/CustomerReturn.js';
import { Sale } from '../models/Sale.js';
import { Product } from '../models/Product.js';
import { StockMovement } from '../models/StockMovement.js';

function generateReturnNumber() {
  const timestamp = Date.now().toString().slice(-6);
  const rand = Math.floor(100 + Math.random() * 900);
  return `RET-${timestamp}${rand}`;
}

export async function createReturn(data, userId) {
  const sale = await Sale.findById(data.originalSale);
  if (!sale) {
    throw Object.assign(new Error('Original sale not found'), { statusCode: 404 });
  }

  const existingReturns = await CustomerReturn.find({
    originalSale: sale._id,
    status: { $ne: 'rejected' },
  });

  const previouslyReturnedMap = new Map();
  for (const ret of existingReturns) {
    for (const item of ret.items) {
      const prodId = item.product.toString();
      const curr = previouslyReturnedMap.get(prodId) || 0;
      previouslyReturnedMap.set(prodId, curr + item.quantity);
    }
  }

  let totalRefund = 0;
  const returnItems = [];

  for (const item of data.items) {
    const saleItem = sale.items.find(
      (si) => si.product.toString() === item.product || si._id?.toString() === item.saleItem
    );

    if (!saleItem) {
      throw Object.assign(
        new Error(`Product ${item.product} was not part of original invoice ${sale.invoiceNumber}`),
        { statusCode: 400 }
      );
    }

    const previouslyReturned = previouslyReturnedMap.get(item.product) || 0;
    const maxReturnable = saleItem.quantity - previouslyReturned;

    if (item.quantity > maxReturnable) {
      throw Object.assign(
        new Error(
          `Cannot return ${item.quantity} of "${saleItem.productName}". Max returnable: ${maxReturnable} (Sold: ${saleItem.quantity}, Already returned: ${previouslyReturned})`
        ),
        { statusCode: 400 }
      );
    }

    totalRefund += item.quantity * item.unitPrice;

    returnItems.push({
      saleItem: (saleItem._id || saleItem.product),
      product: new mongoose.Types.ObjectId(item.product),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      returnReason: item.returnReason || 'Customer return',
      condition: item.condition,
    });
  }

  totalRefund = parseFloat(totalRefund.toFixed(2));
  const returnNumber = generateReturnNumber();

  const returnDoc = await CustomerReturn.create({
    returnNumber,
    originalSale: sale._id,
    customer: sale.customer || (data.customer ? new mongoose.Types.ObjectId(data.customer) : undefined),
    returnDate: data.returnDate ? new Date(data.returnDate) : new Date(),
    items: returnItems,
    totalRefund,
    refundMethod: data.refundMethod || sale.paymentMethod || 'cash',
    refundStatus: data.refundStatus || 'completed',
    status: data.status || 'completed',
    notes: data.notes,
    createdBy: new mongoose.Types.ObjectId(userId),
    approvedBy: new mongoose.Types.ObjectId(userId),
  });

  for (const item of returnItems) {
    if (item.condition === 'resellable') {
      const product = await Product.findById(item.product);
      if (product) {
        const prevStock = product.currentStock;
        const newStock = prevStock + item.quantity;
        await Product.findByIdAndUpdate(item.product, { $inc: { currentStock: item.quantity } });
        await StockMovement.create({
          product: product._id,
          movementType: 'customer_return',
          quantity: item.quantity,
          previousStock: prevStock,
          newStock,
          referenceType: 'CustomerReturn',
          referenceId: returnDoc._id,
          reason: `Customer return: ${returnNumber} (${item.returnReason})`,
          createdBy: new mongoose.Types.ObjectId(userId),
        });
      }
    } else if (item.condition === 'damaged') {
      const product = await Product.findById(item.product);
      if (product) {
        await StockMovement.create({
          product: product._id,
          movementType: 'damaged',
          quantity: 0,
          previousStock: product.currentStock,
          newStock: product.currentStock,
          referenceType: 'CustomerReturn',
          referenceId: returnDoc._id,
          reason: `Customer return damaged item: ${returnNumber} (${item.returnReason})`,
          createdBy: new mongoose.Types.ObjectId(userId),
        });
      }
    }
  }

  const totalItemsSold = sale.items.reduce((acc, curr) => acc + curr.quantity, 0);
  let totalItemsReturnedSoFar = 0;

  for (const si of sale.items) {
    const prodId = si.product.toString();
    const prev = previouslyReturnedMap.get(prodId) || 0;
    const newlyReturned = data.items.find((i) => i.product === prodId)?.quantity || 0;
    totalItemsReturnedSoFar += prev + newlyReturned;
  }

  if (totalItemsReturnedSoFar >= totalItemsSold) {
    await Sale.findByIdAndUpdate(sale._id, { status: 'returned' });
  }

  return CustomerReturn.findById(returnDoc._id)
    .populate('originalSale')
    .populate('customer')
    .populate('items.product')
    .populate('createdBy', 'name email role');
}

export async function getReturns(filters) {
  const { search, status, startDate, endDate, page = 1, pageSize = 20 } = filters;
  const query = {};

  if (status) query.status = status;

  if (startDate || endDate) {
    query.returnDate = {};
    if (startDate) query.returnDate.$gte = new Date(startDate);
    if (endDate) query.returnDate.$lte = new Date(endDate);
  }

  if (search) {
    const matchingSales = await Sale.find({
      $or: [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
      ],
    }).select('_id');

    query.$or = [
      { returnNumber: { $regex: search, $options: 'i' } },
      { refundMethod: { $regex: search, $options: 'i' } },
      { notes: { $regex: search, $options: 'i' } },
      { originalSale: { $in: matchingSales.map((s) => s._id) } },
    ];
  }

  const total = await CustomerReturn.countDocuments(query);
  const returns = await CustomerReturn.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .populate('originalSale', 'invoiceNumber customerName invoiceDate grandTotal paymentMethod')
    .populate('customer', 'name phone email')
    .populate('items.product', 'name sku unit sellingPrice')
    .populate('createdBy', 'name')
    .lean();

  return {
    returns,
    pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
  };
}

export async function getReturnById(id) {
  const ret = await CustomerReturn.findById(id)
    .populate('originalSale')
    .populate('customer')
    .populate('items.product')
    .populate('createdBy', 'name email role')
    .populate('approvedBy', 'name');

  if (!ret) {
    throw Object.assign(new Error('Return record not found'), { statusCode: 404 });
  }
  return ret;
}

export async function getReturnableSaleInfo(saleIdentifier) {
  const isObjectId = mongoose.Types.ObjectId.isValid(saleIdentifier);
  const sale = await Sale.findOne(
    isObjectId
      ? { $or: [{ _id: saleIdentifier }, { invoiceNumber: saleIdentifier.trim().toUpperCase() }] }
      : { invoiceNumber: saleIdentifier.trim().toUpperCase() }
  ).populate('customer');

  if (!sale) {
    throw Object.assign(new Error(`Sale invoice "${saleIdentifier}" not found`), { statusCode: 404 });
  }

  const previousReturns = await CustomerReturn.find({
    originalSale: sale._id,
    status: { $ne: 'rejected' },
  });

  const previouslyReturnedMap = new Map();
  for (const ret of previousReturns) {
    for (const item of ret.items) {
      const prodId = item.product.toString();
      const curr = previouslyReturnedMap.get(prodId) || 0;
      previouslyReturnedMap.set(prodId, curr + item.quantity);
    }
  }

  const returnableItems = sale.items.map((item) => {
    const prodId = item.product.toString();
    const previouslyReturned = previouslyReturnedMap.get(prodId) || 0;
    const returnableQuantity = Math.max(0, item.quantity - previouslyReturned);
    return {
      saleItemId: item._id || item.product,
      productId: item.product,
      productName: item.productName,
      sku: item.sku,
      unit: item.unit,
      unitPrice: item.unitPrice,
      soldQuantity: item.quantity,
      previouslyReturned,
      returnableQuantity,
      discount: item.discount,
      lineTotal: item.lineTotal,
    };
  });

  return {
    sale: {
      _id: sale._id,
      invoiceNumber: sale.invoiceNumber,
      invoiceDate: sale.invoiceDate,
      customerName: sale.customerName,
      customer: sale.customer,
      grandTotal: sale.grandTotal,
      paymentMethod: sale.paymentMethod,
      status: sale.status,
    },
    items: returnableItems,
    isFullyReturned: returnableItems.every((i) => i.returnableQuantity === 0),
  };
}

export async function getReturnStats() {
  const [totals, resellableRestocked] = await Promise.all([
    CustomerReturn.aggregate([
      { $match: { status: { $ne: 'rejected' } } },
      {
        $group: {
          _id: null,
          totalReturns: { $sum: 1 },
          totalRefundAmount: { $sum: '$totalRefund' },
          totalItemsReturned: { $sum: { $size: '$items' } },
        },
      },
    ]),
    CustomerReturn.aggregate([
      { $match: { status: { $ne: 'rejected' } } },
      { $unwind: '$items' },
      { $match: { 'items.condition': 'resellable' } },
      { $group: { _id: null, totalRestockedQty: { $sum: '$items.quantity' } } },
    ]),
  ]);

  const completedCount = await CustomerReturn.countDocuments({ status: 'completed' });
  const pendingCount = await CustomerReturn.countDocuments({ status: { $in: ['draft', 'approved'] } });

  return {
    totalReturns: totals[0]?.totalReturns || 0,
    totalRefundAmount: totals[0]?.totalRefundAmount || 0,
    totalItemsReturned: totals[0]?.totalItemsReturned || 0,
    resellableRestockedQty: resellableRestocked[0]?.totalRestockedQty || 0,
    completedCount,
    pendingCount,
  };
}

export async function updateReturnStatus(id, data, userId) {
  const ret = await CustomerReturn.findById(id);
  if (!ret) {
    throw Object.assign(new Error('Return not found'), { statusCode: 404 });
  }

  ret.status = data.status;
  if (data.refundStatus) ret.refundStatus = data.refundStatus;
  if (data.notes) ret.notes = data.notes;
  if (data.status === 'approved' || data.status === 'completed') {
    ret.approvedBy = new mongoose.Types.ObjectId(userId);
  }

  await ret.save();
  return ret;
}
