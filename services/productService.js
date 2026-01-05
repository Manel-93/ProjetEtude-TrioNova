import { ProductRepository } from '../repositories/productRepository.js';
import { ProductImageRepository } from '../repositories/productImageRepository.js';
import { CategoryRepository } from '../repositories/categoryRepository.js';

export class ProductService {
  constructor() {
    this.productRepository = new ProductRepository();
    this.productImageRepository = new ProductImageRepository();
    this.categoryRepository = new CategoryRepository();
  }

  async getAllProducts(filters, pagination) {
    const result = await this.productRepository.findAll(filters, pagination);
    
    const productsWithImages = await Promise.all(
      result.data.map(async (product) => {
        const images = await this.productImageRepository.findByProductId(product.id);
        return {
          ...product,
          images
        };
      })
    );
    
    return {
      ...result,
      data: productsWithImages
    };
  }

  async getProductBySlug(slug) {
    const product = await this.productRepository.findBySlug(slug);
    if (!product) {
      throw new Error('Produit introuvable');
    }
    
    const images = await this.productImageRepository.findByProductId(product.id);
    const category = product.categoryId 
      ? await this.categoryRepository.findById(product.categoryId)
      : null;
    
    return {
      ...product,
      images,
      category
    };
  }

  async getProductById(id) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new Error('Produit introuvable');
    }
    
    const images = await this.productImageRepository.findByProductId(product.id);
    const category = product.categoryId 
      ? await this.categoryRepository.findById(product.categoryId)
      : null;
    
    return {
      ...product,
      images,
      category
    };
  }

  async createProduct(productData) {
    const existingProduct = await this.productRepository.findBySlug(productData.slug);
    if (existingProduct) {
      throw new Error('Un produit avec ce slug existe déjà');
    }
    
    if (productData.categoryId) {
      const category = await this.categoryRepository.findById(productData.categoryId);
      if (!category) {
        throw new Error('Catégorie introuvable');
      }
    }
    
    const product = await this.productRepository.create(productData);
    
    if (productData.images && productData.images.length > 0) {
      const imagePromises = productData.images.map((imageData, index) => {
        return this.productImageRepository.create({
          ...imageData,
          productId: product.id,
          isPrimary: index === 0,
          order: index
        });
      });
      await Promise.all(imagePromises);
    }
    
    return await this.getProductById(product.id);
  }

  async updateProduct(id, productData) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new Error('Produit introuvable');
    }
    
    if (productData.slug && productData.slug !== product.slug) {
      const existingProduct = await this.productRepository.findBySlug(productData.slug);
      if (existingProduct) {
        throw new Error('Un produit avec ce slug existe déjà');
      }
    }
    
    if (productData.categoryId) {
      const category = await this.categoryRepository.findById(productData.categoryId);
      if (!category) {
        throw new Error('Catégorie introuvable');
      }
    }
    
    const updatedProduct = await this.productRepository.update(id, productData);
    return await this.getProductById(updatedProduct.id);
  }

  async deleteProduct(id) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new Error('Produit introuvable');
    }
    
    await this.productImageRepository.deleteByProductId(id);
    await this.productRepository.delete(id);
    
    return { message: 'Produit supprimé avec succès' };
  }

  // === GESTION DES IMAGES (CORRIGÉE) ===
  
  async addProductImage(productId, imageData) {
    // Conversion explicite pour éviter les bugs de type MySQL (Number) vs URL (String)
    const pId = Number(productId);
    
    const product = await this.productRepository.findById(pId);
    if (!product) {
      throw new Error('Produit introuvable');
    }
    
    const existingImages = await this.productImageRepository.findByProductId(pId);
    const isPrimary = existingImages.length === 0;
    
    const image = await this.productImageRepository.create({
      ...imageData,
      productId: pId,
      isPrimary,
      order: existingImages.length
    });
    
    return image;
  }

  async updateProductImage(imageId, imageData) {
    const image = await this.productImageRepository.findById(imageId);
    if (!image) {
      throw new Error('Image introuvable');
    }
    
    return await this.productImageRepository.update(imageId, imageData);
  }

  async setPrimaryImage(productId, imageId) {
    // CORRECTION : Conversion des IDs pour la comparaison
    const pId = Number(productId);

    const product = await this.productRepository.findById(pId);
    if (!product) {
      throw new Error('Produit introuvable');
    }
    
    const image = await this.productImageRepository.findById(imageId);
    
    // CORRECTION : On compare des Numbers (Number vs Number)
    if (!image || Number(image.productId) !== pId) {
      throw new Error('Image introuvable');
    }
    
    return await this.productImageRepository.setPrimary(pId, imageId);
  }

  async deleteProductImage(imageId) {
    const image = await this.productImageRepository.findById(imageId);
    if (!image) {
      throw new Error('Image introuvable');
    }
    
    await this.productImageRepository.delete(imageId);
    return { message: 'Image supprimée avec succès' };
  }
}