import express from 'express';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import multer from 'multer';
import cors from 'cors';

// 在文件顶部声明一次这些变量
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 设置服务器
const app = express();
// eslint-disable-next-line no-undef
const PORT = process.env.PORT || 3001;

// 创建数据库连接
const dbPath = join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// 创建用户表和新增的订单表、商品表
db.serialize(() => {
  // 用户表
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 商品表 - 盲盒商品
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      total_quantity INTEGER NOT NULL,
      remaining_quantity INTEGER NOT NULL,
      cover_image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // 子商品表 - 盲盒内的具体商品
  db.run(`
    CREATE TABLE IF NOT EXISTS sub_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      image_url TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      remaining_quantity INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    )
  `);

  // 订单表 - 用户的购买记录
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      buyer_id INTEGER NOT NULL,
      seller_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      sub_product_id INTEGER NOT NULL,
      sub_product_name TEXT NOT NULL,
      sub_product_image TEXT NOT NULL,
      price REAL NOT NULL,
      purchase_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (buyer_id) REFERENCES users (id),
      FOREIGN KEY (seller_id) REFERENCES users (id),
      FOREIGN KEY (product_id) REFERENCES products (id),
      FOREIGN KEY (sub_product_id) REFERENCES sub_products (id)
    )
  `);

  // 社区帖子表
  db.run(`
    CREATE TABLE IF NOT EXISTS community_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);
});

// 创建uploads目录（如果不存在）
const uploadsDir = join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = file.originalname.split('.').pop();
    cb(null, `product-${uniqueSuffix}.${fileExtension}`);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 只允许图片文件
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 限制5MB
  }
});

// 中间件
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// 提供静态文件访问（图片访问）
app.use('/uploads', express.static(join(__dirname, 'uploads')));


// 注册API
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  
  // 基本验证
  if (!username || !email || !password) {
    return res.status(400).json({ error: '所有字段都是必填的' });
  }
  
  try {
    // 加密密码
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // 插入用户数据
    db.run(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword],
      function(err) {
        if (err) {
          // 检查是否是唯一性约束错误
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: '用户名或邮箱已被使用' });
          }
          return res.status(500).json({ error: '注册失败' });
        }
        
        res.status(201).json({ 
          message: '注册成功', 
          userId: this.lastID 
        });
      }
    );
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 登录API
app.post('/api/login', (req, res) => {
  const { username, password: inputPassword } = req.body;  // 重命名输入的密码
  
  // 基本验证
  if (!username || !inputPassword) {
    return res.status(400).json({ error: '用户名和密码都是必填的' });
  }
  
  // 查找用户
  db.get(
    'SELECT * FROM users WHERE username = ?',
    [username],
    async (err, user) => {
      if (err) {
        console.error('数据库查询错误:', err);
        return res.status(500).json({ error: '登录失败' });
      }
      
      if (!user) {
        return res.status(401).json({ error: '用户名或密码不正确' });
      }
      
      // 验证密码
      try {
        const match = await bcrypt.compare(inputPassword, user.password);  // 使用重命名的密码
        if (!match) {
          return res.status(401).json({ error: '用户名或密码不正确' });
        }
        
        // 返回用户信息(不包含密码)
        // eslint-disable-next-line no-unused-vars
        const { password, ...userInfo } = user;  // 现在不会有冲突
        res.json({ 
          message: '登录成功', 
          user: userInfo 
        });
      } catch (error) {
        console.error('密码验证错误:', error);
        res.status(500).json({ error: '服务器错误' });
      }
    }
  );
});

// 获取用户信息
app.get('/api/user/:userId', (req, res) => {
  const userId = req.params.userId;
  
  db.get(
    'SELECT id, username, email, created_at FROM users WHERE id = ?',
    [userId],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: '获取用户信息失败' });
      }
      
      if (!user) {
        return res.status(404).json({ error: '用户不存在' });
      }
      
      res.json(user);
    }
  );
});

// 获取用户的商品列表
app.get('/api/user/:userId/products', (req, res) => {
  const userId = req.params.userId;
  
  db.all(
    'SELECT * FROM products WHERE user_id = ? ORDER BY created_at DESC',
    [userId],
    (err, products) => {
      if (err) {
        console.error('获取用户商品错误:', err);
        return res.status(500).json({ error: '获取用户商品失败' });
      }
      
      res.json(products);
    }
  );
});

// 创建盲盒商品（包含子商品）
app.post('/api/products', (req, res) => {
  const { user_id, name, description, price, sub_products, cover_image } = req.body;
  
  console.log('接收到的创建盲盒数据:', req.body);
  
  // 验证必填字段
  if (!user_id) {
    return res.status(400).json({ error: '用户ID是必填的' });
  }
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: '盲盒名称是必填的' });
  }
  if (!description || description.trim() === '') {
    return res.status(400).json({ error: '盲盒描述是必填的' });
  }
  if (!price || isNaN(price) || price <= 0) {
    return res.status(400).json({ error: '价格必须是大于0的数字' });
  }
  if (!sub_products || !Array.isArray(sub_products) || sub_products.length === 0) {
    return res.status(400).json({ error: '子商品列表不能为空' });
  }
  if (sub_products.length < 2 || sub_products.length > 10) {
    return res.status(400).json({ error: '子商品数量必须在2-10个之间' });
  }

  // 计算总数量（所有子商品数量的总和）
  let total_quantity = 0;
  
  // 验证每个子商品并计算总数量
  for (let i = 0; i < sub_products.length; i++) {
    const subProduct = sub_products[i];
    if (!subProduct.name || subProduct.name.trim() === '') {
      return res.status(400).json({ error: `第${i+1}个子商品的名称是必填的` });
    }
    if (!subProduct.image_url || subProduct.image_url.trim() === '') {
      return res.status(400).json({ error: `第${i+1}个子商品的图片是必填的` });
    }
    if (!subProduct.quantity || isNaN(subProduct.quantity) || subProduct.quantity <= 0) {
      return res.status(400).json({ error: `第${i+1}个子商品的数量必须是大于0的数字` });
    }
    total_quantity += parseInt(subProduct.quantity);
  }

  console.log('计算得出的总数量:', total_quantity);
  console.log('封面图片:', cover_image || '未设置封面图片');

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // 插入主商品
    db.run(
      'INSERT INTO products (user_id, name, description, price, total_quantity, remaining_quantity, cover_image) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [user_id, name.trim(), description.trim(), parseFloat(price), total_quantity, total_quantity, cover_image && cover_image.trim() ? cover_image.trim() : null],
      function(err) {
        if (err) {
          console.error('添加商品错误:', err);
          db.run('ROLLBACK');
          return res.status(500).json({ error: '添加商品失败: ' + err.message });
        }
        
        const productId = this.lastID;
        console.log('主商品创建成功，ID:', productId);
        
        // 插入子商品
        const insertSubProduct = db.prepare(
          'INSERT INTO sub_products (product_id, name, image_url, quantity, remaining_quantity) VALUES (?, ?, ?, ?, ?)'
        );
        
        let completed = 0;
        let hasError = false;
        
        sub_products.forEach((subProduct, index) => {
          const quantity = parseInt(subProduct.quantity);
          insertSubProduct.run(
            [productId, subProduct.name.trim(), subProduct.image_url.trim(), quantity, quantity],
            function(err) {
              if (err && !hasError) {
                hasError = true;
                console.error(`添加第${index+1}个子商品错误:`, err);
                db.run('ROLLBACK');
                insertSubProduct.finalize();
                return res.status(500).json({ error: `添加第${index+1}个子商品失败: ` + err.message });
              }
              
              completed++;
              if (completed === sub_products.length && !hasError) {
                insertSubProduct.finalize();
                db.run('COMMIT');
                console.log('盲盒创建完成，包含', sub_products.length, '个子商品');
                res.status(201).json({ 
                  message: '盲盒创建成功', 
                  productId: productId,
                  totalQuantity: total_quantity
                });
              }
            }
          );
        });
      }
    );
  });
});

// 获取商品详情（包含子商品信息）
app.get('/api/products/:productId/details', (req, res) => {
  const productId = req.params.productId;
  
  // 获取主商品信息
  db.get(
    `SELECT p.*, u.username as seller_username 
     FROM products p 
     JOIN users u ON p.user_id = u.id 
     WHERE p.id = ?`,
    [productId],
    (err, product) => {
      if (err) {
        console.error('获取商品详情错误:', err);
        return res.status(500).json({ error: '获取商品详情失败' });
      }
      
      if (!product) {
        return res.status(404).json({ error: '商品不存在' });
      }
      
      // 获取子商品信息
      db.all(
        'SELECT * FROM sub_products WHERE product_id = ? ORDER BY id',
        [productId],
        (subErr, subProducts) => {
          if (subErr) {
            console.error('获取子商品错误:', subErr);
            return res.status(500).json({ error: '获取子商品失败' });
          }
          
          res.json({
            ...product,
            sub_products: subProducts
          });
        }
      );
    }
  );
});

// 购买盲盒（随机获得子商品）
app.post('/api/orders', (req, res) => {
  const { buyer_id, seller_id, product_id, price } = req.body;
  
  console.log('接收到的订单数据:', req.body); // 调试日志
  
  if (!buyer_id || !seller_id || !product_id || !price) {
    console.error('订单数据验证失败:', { buyer_id, seller_id, product_id, price });
    return res.status(400).json({ error: '所有字段都是必填的' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // 检查商品是否还有库存
    db.get(
      'SELECT remaining_quantity, name FROM products WHERE id = ?',
      [product_id],
      (err, product) => {
        if (err) {
          console.error('查询商品失败:', err);
          db.run('ROLLBACK');
          return res.status(500).json({ error: '查询商品失败' });
        }
        
        if (!product) {
          db.run('ROLLBACK');
          return res.status(404).json({ error: '商品不存在' });
        }
        
        if (product.remaining_quantity <= 0) {
          db.run('ROLLBACK');
          return res.status(400).json({ error: '商品已售完' });
        }
        
        console.log('商品库存检查通过，剩余数量:', product.remaining_quantity);
        
        // 获取有库存的子商品
        db.all(
          'SELECT * FROM sub_products WHERE product_id = ? AND remaining_quantity > 0',
          [product_id],
          (subErr, availableSubProducts) => {
            if (subErr) {
              console.error('查询子商品失败:', subErr);
              db.run('ROLLBACK');
              return res.status(500).json({ error: '查询子商品失败' });
            }
            
            if (availableSubProducts.length === 0) {
              console.error('没有可用的子商品');
              db.run('ROLLBACK');
              return res.status(400).json({ error: '没有可用的子商品' });
            }
            
            console.log('可用子商品数量:', availableSubProducts.length);
            
            // 根据剩余数量构建权重数组
            let weightedOptions = [];
            availableSubProducts.forEach(subProduct => {
              for (let i = 0; i < subProduct.remaining_quantity; i++) {
                weightedOptions.push(subProduct);
              }
            });
            
            // 随机选择
            const randomIndex = Math.floor(Math.random() * weightedOptions.length);
            const selectedSubProduct = weightedOptions[randomIndex];
            
            console.log('选中的子商品:', selectedSubProduct.name);
            
            // 创建订单
            db.run(
              'INSERT INTO orders (buyer_id, seller_id, product_id, sub_product_id, sub_product_name, sub_product_image, price) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [buyer_id, seller_id, product_id, selectedSubProduct.id, selectedSubProduct.name, selectedSubProduct.image_url, parseFloat(price)],
              function(orderErr) {
                if (orderErr) {
                  console.error('创建订单失败:', orderErr);
                  db.run('ROLLBACK');
                  return res.status(500).json({ error: '创建订单失败: ' + orderErr.message });
                }
                
                const orderId = this.lastID;
                console.log('订单创建成功，ID:', orderId);
                
                // 减少子商品库存
                db.run(
                  'UPDATE sub_products SET remaining_quantity = remaining_quantity - 1 WHERE id = ?',
                  [selectedSubProduct.id],
                  (updateSubErr) => {
                    if (updateSubErr) {
                      console.error('更新子商品库存失败:', updateSubErr);
                      db.run('ROLLBACK');
                      return res.status(500).json({ error: '更新子商品库存失败' });
                    }
                    
                    // 减少主商品库存
                    db.run(
                      'UPDATE products SET remaining_quantity = remaining_quantity - 1 WHERE id = ?',
                      [product_id],
                      (updateErr) => {
                        if (updateErr) {
                          console.error('更新商品库存失败:', updateErr);
                          db.run('ROLLBACK');
                          return res.status(500).json({ error: '更新商品库存失败' });
                        }
                        
                        db.run('COMMIT');
                        console.log('购买流程完成');
                        res.status(201).json({ 
                          message: '购买成功',
                          orderId: orderId,
                          reward: {
                            name: selectedSubProduct.name,
                            image: selectedSubProduct.image_url
                          }
                        });
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  });
});

// 获取用户订单列表
app.get('/api/user/:userId/orders', (req, res) => {
  const userId = req.params.userId;  
  
  console.log('查询用户订单，用户ID:', userId);
  
  db.all(
    `SELECT 
       o.id as order_id,
       o.buyer_id,
       o.seller_id,
       o.product_id,
       o.sub_product_name,
       o.sub_product_image,
       o.price,
       o.purchase_time,
       u.username as seller_username,
       p.name as product_name
     FROM orders o 
     JOIN users u ON o.seller_id = u.id 
     JOIN products p ON o.product_id = p.id
     WHERE o.buyer_id = ? 
     ORDER BY o.purchase_time DESC`,
    [userId],
    (err, orders) => {
      if (err) {
        console.error('获取订单列表错误:', err);
        return res.status(500).json({ error: '获取订单列表失败' });
      }
      
      console.log('查询到的订单数量:', orders.length);
      
      res.json(orders);
    }
  );
});

// 社区相关API
// 获取社区帖子列表
app.get('/api/community/posts', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  db.all(
    `SELECT cp.*, u.username 
     FROM community_posts cp 
     JOIN users u ON cp.user_id = u.id 
     ORDER BY cp.created_at DESC 
     LIMIT ? OFFSET ?`,
    [limit, offset],
    (err, posts) => {
      if (err) {
        return res.status(500).json({ error: '获取帖子列表失败' });
      }
      
      // 获取总数用于分页
      db.get(
        'SELECT COUNT(*) as total FROM community_posts',
        [],
        (countErr, countResult) => {
          if (countErr) {
            return res.status(500).json({ error: '获取帖子总数失败' });
          }
          
          res.json({
            posts,
            pagination: {
              current_page: page,
              total_items: countResult.total,
              items_per_page: limit,
              total_pages: Math.ceil(countResult.total / limit)
            }
          });
        }
      );
    }
  );
});

// 创建社区帖子
app.post('/api/community/posts', (req, res) => {
  const { user_id, content, image_url } = req.body;
  
  if (!user_id || !content) {
    return res.status(400).json({ error: '用户ID和内容是必填的' });
  }

  db.run(
    'INSERT INTO community_posts (user_id, content, image_url) VALUES (?, ?, ?)',
    [user_id, content, image_url || null],
    function(err) {
      if (err) {
        console.error('创建帖子错误:', err);
        return res.status(500).json({ error: '创建帖子失败' });
      }
      
      res.status(201).json({
        message: '帖子创建成功',
        post_id: this.lastID
      });
    }
  );
});

// 删除商品API
app.delete('/api/products/:productId', (req, res) => {
  const productId = req.params.productId;
  const { user_id } = req.body;
  
  if (!user_id) {
    return res.status(400).json({ error: '用户ID是必需的' });
  }
  
  // 首先验证商品是否属于该用户
  db.get(
    'SELECT * FROM products WHERE id = ? AND user_id = ?',
    [productId, user_id],
    (err, product) => {
      if (err) {
        console.error('查询商品错误:', err);
        return res.status(500).json({ error: '查询商品失败' });
      }
      
      if (!product) {
        return res.status(404).json({ error: '商品不存在或无权限删除' });
      }
      
      // 删除商品
      db.run(
        'DELETE FROM products WHERE id = ? AND user_id = ?',
        [productId, user_id],
        function(err) {
          if (err) {
            console.error('删除商品错误:', err);
            return res.status(500).json({ error: '删除商品失败' });
          }
          
          if (this.changes === 0) {
            return res.status(404).json({ error: '商品不存在' });
          }
          
          res.json({ 
            message: '商品删除成功',
            deletedProductId: productId
          });
        }
      );
    }
  );
});

// 获取所有商品列表（用于首页展示）
app.get('/api/products', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search || '';
  const offset = (page - 1) * limit;

  // 构建搜索条件
  let whereClause = '';
  let queryParams = [];
  let countParams = [];

  if (search.trim()) {
    whereClause = 'WHERE (p.name LIKE ? OR p.description LIKE ? OR u.username LIKE ?)';
    const searchPattern = `%${search.trim()}%`;
    queryParams = [searchPattern, searchPattern, searchPattern, limit, offset];
    countParams = [searchPattern, searchPattern, searchPattern];
  } else {
    queryParams = [limit, offset];
  }

  // 获取商品及其发布者信息
  const query = `
    SELECT p.*, u.username as seller_username 
    FROM products p 
    JOIN users u ON p.user_id = u.id 
    ${whereClause}
    ORDER BY p.created_at DESC 
    LIMIT ? OFFSET ?
  `;

  db.all(query, queryParams, (err, products) => {
    if (err) {
      console.error('获取商品列表错误:', err);
      return res.status(500).json({ error: '获取商品列表失败' });
    }
    
    // 获取总数用于分页
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM products p 
      JOIN users u ON p.user_id = u.id 
      ${whereClause}
    `;
    
    db.get(countQuery, countParams, (countErr, countResult) => {
      if (countErr) {
        console.error('获取商品总数错误:', countErr);
        return res.status(500).json({ error: '获取商品总数失败' });
      }
      
      res.json({
        products,
        pagination: {
          current_page: page,
          total_items: countResult.total,
          items_per_page: limit,
          total_pages: Math.ceil(countResult.total / limit)
        },
        search_term: search.trim()
      });
    });
  });
});

// 根据ID获取商品详情
app.get('/api/products/:productId', (req, res) => {
  const productId = req.params.productId;
  
  db.get(
    `SELECT p.*, u.username as seller_username 
     FROM products p 
     JOIN users u ON p.user_id = u.id 
     WHERE p.id = ?`,
    [productId],
    (err, product) => {
      if (err) {
        console.error('获取商品详情错误:', err);
        return res.status(500).json({ error: '获取商品详情失败' });
      }
      
      if (!product) {
        return res.status(404).json({ error: '商品不存在' });
      }
      
      res.json(product);
    }
  );
});

// 图片上传API
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      message: '图片上传成功',
      imageUrl: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('图片上传错误:', error);
    res.status(500).json({ error: '图片上传失败' });
  }
});

// 删除图片API
app.delete('/api/upload/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = join(uploadsDir, filename);
  
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error('删除图片错误:', err);
      return res.status(500).json({ error: '删除图片失败' });
    }
    
    res.json({ message: '图片删除成功' });
  });
});

// 获取所有上传的图片列表
app.get('/api/images', (req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      console.error('读取图片目录错误:', err);
      return res.status(500).json({ error: '获取图片列表失败' });
    }
    
    // 只返回图片文件
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(file)
    );
    
    const images = imageFiles.map(filename => ({
      filename,
      url: `/uploads/${filename}`
    }));
    
    res.json(images);
  });
});



// 提供前端静态文件
app.use(express.static(join(dirname(__dirname), 'dist')));

// 处理所有前端路由 - 一定要放在所有API路由之后
app.get('*', (req, res) => {
  res.sendFile(join(dirname(__dirname), 'dist', 'index.html'));
});


// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

export default app;