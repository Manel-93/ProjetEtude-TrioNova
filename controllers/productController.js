import { ProductService } from '../services/productService.js';

export class ProductController {
  constructor() {
    this.productService = new ProductService();
  }

  getAllProducts = async (req, res, next) => {
    try {
      const { page = 1, limit = 20, categoryId, status, search, inStock } = req.query;
      const filters = {};
      if (status) filters.status = status;
      if (categoryId) filters.categoryId = parseInt(categoryId);
      if (search) filters.search = search;
      if (inStock !== undefined) filters.inStock = inStock === 'true';
      
      const result = await this.productService.getAllProducts(filters, { page, limit });
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  getProductBySlug = async (req, res, next) => {
    try {
      const { slug } = req.params;
      const product = await this.productService.getProductBySlug(slug);
      res.status(200).json({
        success: true,
        data: product
      });
    } catch (error) {
      next(error);
    }
  };
}

