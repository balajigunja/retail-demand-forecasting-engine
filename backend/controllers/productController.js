
const mongoose = require("mongoose");
const Product = require("../models/Product");

// GET /api/products
exports.getProducts = async (req, res) => {
  try {
    const { search, category, sort } = req.query;

    const filter = {};

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    if (category) {
      filter.category = category;
    }

    let query = Product.find(filter);

    if (sort === "price") {
      query = query.sort({ price: 1 });
    } else if (sort === "-price") {
      query = query.sort({ price: -1 });
    } else {
      query = query.sort({ createdAt: -1 });
    }

    const products = await query;

    res.status(200).json({
      count: products.length,
      products
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

// GET /api/products/:id
exports.getProductById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ product });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch product" });
  }
};

// POST /api/products
exports.createProduct = async (req, res) => {
  try {
    const { name, sku, category, price, stock, reorderLevel } = req.body;

    const product = await Product.create({
      name,
      sku,
      category,
      price,
      stock,
      reorderLevel
    });

    res.status(201).json({
      message: "Product created successfully",
      product
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "A product with this SKU already exists"
      });
    }

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        message: error.message
      });
    }

    res.status(500).json({ message: "Failed to create product" });
  }
};

// PUT /api/products/:id
exports.updateProduct = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const allowedFields = [
      "name",
      "sku",
      "category",
      "price",
      "stock",
      "reorderLevel"
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.sku) {
      updates.sku = updates.sku.toUpperCase().trim();
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true
      }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      message: "Product updated successfully",
      product
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "A product with this SKU already exists"
      });
    }

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Failed to update product" });
  }
};

// DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      message: "Product deleted successfully",
      product
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete product" });
  }
};
