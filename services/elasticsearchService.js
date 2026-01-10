import { getElasticsearchClient, initializeElasticsearchIndex } from '../config/elasticsearch.js';
import { ProductRepository } from '../repositories/productRepository.js';
import { ProductImageRepository } from '../repositories/productImageRepository.js';
import { CategoryRepository } from '../repositories/categoryRepository.js';

const INDEX_NAME = process.env.ELASTICSEARCH_INDEX || 'products';

export class ElasticsearchService {
  constructor() {
    this.client = getElasticsearchClient();
    this.productRepository = new ProductRepository();
    this.productImageRepository = new ProductImageRepository();
    this.categoryRepository = new CategoryRepository();
  }

  // Indexer un produit
  async indexProduct(productId) {
    try {
      const product = await this.productRepository.findById(productId);
      if (!product) {
        throw new Error('Produit introuvable');
      }

      const images = await this.productImageRepository.findByProductId(productId);
      const category = product.categoryId 
        ? await this.categoryRepository.findById(product.categoryId)
        : null;

      // Préparer les données pour Elasticsearch
      const document = {
        id: product.id,
        name: product.name,
        description: product.description,
        technicalSpecs: typeof product.technicalSpecs === 'object' 
          ? JSON.stringify(product.technicalSpecs) 
          : product.technicalSpecs || '',
        priceHt: product.priceHt,
        priceTtc: product.priceTtc,
        tva: product.tva,
        stock: product.stock,
        priority: product.priority,
        status: product.status,
        slug: product.slug,
        categoryId: product.categoryId || null,
        categoryName: category?.name || null,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        images: images.map(img => ({
          url: img.url,
          alt: img.alt || '',
          isPrimary: img.isPrimary || false,
          order: img.order || 0
        }))
      };

      // Elasticsearch v8 : utiliser 'document' pour indexer un document
      await this.client.index({
        index: INDEX_NAME,
        id: product.id.toString(),
        document: document
      });

      // Rafraîchir l'index pour que les documents soient immédiatement disponibles
      await this.client.indices.refresh({ index: INDEX_NAME });

      return true;
    } catch (error) {
      console.error(`❌ Error indexing product ${productId}:`, error.message);
      throw error;
    }
  }

  // Supprimer un produit de l'index
  async deleteProduct(productId) {
    try {
      await this.client.delete({
        index: INDEX_NAME,
        id: productId.toString()
      });
      return true;
    } catch (error) {
      // Si le document n'existe pas, ce n'est pas une erreur critique
      if (error.statusCode === 404) {
        return true;
      }
      console.error(`❌ Error deleting product ${productId} from index:`, error.message);
      throw error;
    }
  }

  // Recherche avancée
  async search(queryParams) {
    const {
      q = '', // Texte de recherche
      minPrice,
      maxPrice,
      categoryId,
      inStock,
      sortBy = 'priority', // priority, price_asc, price_desc, newest, stock
      page = 1,
      limit = 20
    } = queryParams;

    const from = (page - 1) * limit;

    // Construire la requête bool
    const must = [];
    const filter = [];

    // Recherche texte sur name, description, technicalSpecs
    if (q && q.trim()) {
      must.push({
        multi_match: {
          query: q,
          fields: ['name^3', 'description^2', 'technicalSpecs'],
          type: 'best_fields',
          fuzziness: 'AUTO',
          operator: 'or'
        }
      });
    }

    // Filtres
    filter.push({ term: { status: 'active' } });

    if (minPrice !== undefined || maxPrice !== undefined) {
      const range = {};
      if (minPrice !== undefined) range.gte = parseFloat(minPrice);
      if (maxPrice !== undefined) range.lte = parseFloat(maxPrice);
      filter.push({ range: { priceTtc: range } });
    }

    if (categoryId) {
      filter.push({ term: { categoryId: parseInt(categoryId) } });
    }

    if (inStock !== undefined) {
      if (inStock === 'true' || inStock === true) {
        filter.push({ range: { stock: { gt: 0 } } });
      } else {
        filter.push({ term: { stock: 0 } });
      }
    }

    // Tri
    let sort = [];
    switch (sortBy) {
      case 'price_asc':
        sort = [{ priceTtc: { order: 'asc' } }, { priority: { order: 'desc' } }];
        break;
      case 'price_desc':
        sort = [{ priceTtc: { order: 'desc' } }, { priority: { order: 'desc' } }];
        break;
      case 'newest':
        sort = [{ createdAt: { order: 'desc' } }, { priority: { order: 'desc' } }];
        break;
      case 'stock':
        // Produits en stock en premier, puis triés par priorité
        sort = [
          { 
            _script: {
              type: 'number',
              script: {
                source: "doc['stock'].value > 0 ? 0 : 1"
              },
              order: 'asc'
            }
          },
          { priority: { order: 'desc' } },
          { priceTtc: { order: 'asc' } }
        ];
        break;
      case 'priority':
      default:
        // Par défaut : priorité décroissante, puis produits en stock, puis prix
        sort = [
          { priority: { order: 'desc' } },
          {
            _script: {
              type: 'number',
              script: {
                source: "doc['stock'].value > 0 ? 0 : 1"
              },
              order: 'asc'
            }
          },
          { priceTtc: { order: 'asc' } }
        ];
        break;
    }

    try {
      const searchBody = {
        query: {
          bool: {
            must: must.length > 0 ? must : [{ match_all: {} }],
            filter
          }
        },
        sort,
        from,
        size: parseInt(limit),
        _source: [
          'id', 'name', 'description', 'technicalSpecs', 'priceHt', 
          'priceTtc', 'tva', 'stock', 'priority', 'status', 'slug', 
          'categoryId', 'categoryName', 'createdAt', 'updatedAt', 'images'
        ]
      };

      const startTime = Date.now();
      // Elasticsearch v8 : utiliser body pour la requête complète
      const response = await this.client.search({
        index: INDEX_NAME,
        body: searchBody
      });
      const duration = Date.now() - startTime;

      // Formater les résultats (Elasticsearch v8 retourne response.hits directement)
      const hits = response.hits || {};
      const hitList = hits.hits || [];
      const totalObj = hits.total || {};
      // Gérer les deux formats possibles : { value: X } ou directement X
      const totalValue = typeof totalObj === 'object' && totalObj.value !== undefined 
        ? totalObj.value 
        : (typeof totalObj === 'number' ? totalObj : 0);
      
      const products = hitList.map(hit => {
        const source = hit._source || {};
        return {
          ...source,
          score: hit._score || 0,
          technicalSpecs: source.technicalSpecs 
            ? (typeof source.technicalSpecs === 'string' 
                ? JSON.parse(source.technicalSpecs) 
                : source.technicalSpecs)
            : {}
        };
      });

      return {
        data: products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalValue,
          totalPages: Math.ceil(totalValue / limit)
        },
        meta: {
          query: q,
          filters: {
            minPrice,
            maxPrice,
            categoryId,
            inStock
          },
          sortBy,
          duration: `${duration}ms`
        }
      };
    } catch (error) {
      console.error('❌ Elasticsearch search error:', error.message);
      
      // Vérifier si c'est une erreur de connexion
      if (error.message.includes('ECONNREFUSED') || 
          error.message.includes('other side closed') ||
          error.message.includes('connect ECONNREFUSED')) {
        const elasticsearchError = new Error('Elasticsearch n\'est pas disponible. Veuillez démarrer Elasticsearch ou désactiver la recherche avancée.');
        elasticsearchError.statusCode = 503;
        elasticsearchError.name = 'ServiceUnavailable';
        throw elasticsearchError;
      }
      
      throw error;
    }
  }

  // Réindexer tous les produits (utile pour la migration initiale)
  async reindexAllProducts() {
    try {
      console.log('🔄 Starting full product reindexing...');
      
      let page = 1;
      let limit = 100;
      let processed = 0;
      let hasMore = true;
      
      while (hasMore) {
        const result = await this.productRepository.findAll({}, { page, limit });
        
        if (result.data.length === 0) {
          hasMore = false;
          break;
        }
        
        // Indexer les produits par batch
        const indexPromises = result.data.map(product => 
          this.indexProduct(product.id).catch(err => {
            console.error(`⚠️  Failed to index product ${product.id}:`, err.message);
            return null;
          })
        );
        
        await Promise.all(indexPromises);
        processed += result.data.length;
        
        if (processed % 100 === 0) {
          console.log(`  Processed ${processed} products...`);
        }
        
        // Vérifier s'il y a plus de produits
        if (result.data.length < limit) {
          hasMore = false;
        } else {
          page++;
        }
      }
      
      console.log(`✅ Reindexing complete: ${processed} products indexed`);
      return { message: `Réindexation terminée : ${processed} produits indexés` };
    } catch (error) {
      console.error('❌ Reindexing error:', error.message);
      throw error;
    }
  }
}

