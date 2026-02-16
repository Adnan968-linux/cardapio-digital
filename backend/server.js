const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const multer = require('multer');
const sharp = require('sharp');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Garantir que a pasta de uploads existe
const uploadDir = path.join(__dirname, '../public/uploads');
fs.ensureDirSync(uploadDir);

// Configuração do Multer para upload de fotos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Gerar nome único para o arquivo
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'foto-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    // Aceitar apenas imagens
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Apenas imagens são permitidas!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

// ============================================
// ROTAS DA API
// ============================================

// Rota de teste
app.get('/api/test', (req, res) => {
    res.json({ 
        success: true, 
        message: '✅ API funcionando!',
        uploads: '/uploads/'
    });
});

// Rota do cardápio
app.get('/api/cardapio', (req, res) => {
    const query = `
        SELECT 
            c.id as cat_id, 
            c.nome as cat_nome,
            c.slug,
            i.id, 
            i.nome, 
            i.descricao, 
            i.preco, 
            i.badge, 
            i.destaque,
            i.foto,
            i.foto_nome
        FROM categorias c
        LEFT JOIN itens i ON c.id = i.categoria_id
        ORDER BY c.id, i.destaque DESC, i.id DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro:', err);
            return res.status(500).json({ success: false, error: err.message });
        }

        // Organizar por categoria
        const categorias = {};
        
        results.forEach(row => {
            if (!categorias[row.cat_id]) {
                categorias[row.cat_id] = {
                    id: row.cat_id,
                    nome: row.cat_nome,
                    slug: row.slug,
                    itens: []
                };
            }
            
            if (row.id) {
                categorias[row.cat_id].itens.push({
                    id: row.id,
                    nome: row.nome,
                    descricao: row.descricao,
                    preco: parseFloat(row.preco),
                    badge: row.badge,
                    destaque: row.destaque === 1,
                    foto: row.foto
                });
            }
        });

        res.json({ 
            success: true, 
            data: Object.values(categorias) 
        });
    });
});

// Rota de login
app.post('/api/login', (req, res) => {
    const { usuario, senha } = req.body;
    
    db.query(
        'SELECT * FROM admin WHERE usuario = ? AND senha = ?',
        [usuario, senha],
        (err, results) => {
            if (err) return res.status(500).json({ success: false });
            if (results.length > 0) {
                res.json({ success: true, message: 'Login OK' });
            } else {
                res.status(401).json({ success: false, message: 'Usuário/senha inválidos' });
            }
        }
    );
});

// Rota para upload de foto (apenas upload)
app.post('/api/upload', upload.single('foto'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'Nenhuma foto enviada' 
            });
        }

        // Processar imagem com Sharp (redimensionar)
        const fotoPath = path.join(uploadDir, req.file.filename);
        const fotoProcessada = path.join(uploadDir, 'proc-' + req.file.filename);

        sharp(fotoPath)
            .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toFile(fotoProcessada)
            .then(() => {
                // Substituir original pela processada
                fs.unlinkSync(fotoPath);
                fs.renameSync(fotoProcessada, fotoPath);

                res.json({ 
                    success: true, 
                    message: 'Upload realizado com sucesso!',
                    foto: `/uploads/${req.file.filename}`,
                    foto_nome: req.file.originalname
                });
            })
            .catch(err => {
                console.error('Erro ao processar imagem:', err);
                res.status(500).json({ 
                    success: false, 
                    message: 'Erro ao processar imagem' 
                });
            });

    } catch (error) {
        console.error('Erro no upload:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno no servidor' 
        });
    }
});

// Rota para adicionar item com foto
app.post('/api/admin/itens', (req, res) => {
    const { categoria_id, nome, descricao, preco, badge, destaque, foto, foto_nome } = req.body;
    
    if (!categoria_id || !nome || !descricao || !preco) {
        return res.status(400).json({ 
            success: false, 
            message: 'Campos obrigatórios: categoria_id, nome, descricao, preco' 
        });
    }

    const query = `
        INSERT INTO itens 
        (categoria_id, nome, descricao, preco, badge, destaque, foto, foto_nome) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.query(
        query,
        [categoria_id, nome, descricao, preco, badge || null, destaque || false, foto || null, foto_nome || null],
        (err, result) => {
            if (err) {
                console.error('Erro ao adicionar:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Erro ao adicionar item' 
                });
            }
            
            res.json({ 
                success: true, 
                message: 'Item adicionado com sucesso!',
                id: result.insertId 
            });
        }
    );
});

// Rota para atualizar item
app.put('/api/admin/itens/:id', (req, res) => {
    const { id } = req.params;
    const { nome, descricao, preco, badge, destaque, foto, foto_nome } = req.body;
    
    const query = `
        UPDATE itens 
        SET nome = ?, descricao = ?, preco = ?, badge = ?, destaque = ?, foto = ?, foto_nome = ?
        WHERE id = ?
    `;
    
    db.query(
        query,
        [nome, descricao, preco, badge, destaque, foto, foto_nome, id],
        (err, result) => {
            if (err) {
                console.error('Erro ao atualizar:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Erro ao atualizar item' 
                });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Item não encontrado' 
                });
            }
            
            res.json({ 
                success: true, 
                message: 'Item atualizado com sucesso!' 
            });
        }
    );
});

// Rota para deletar item
app.delete('/api/admin/itens/:id', (req, res) => {
    const { id } = req.params;
    
    // Primeiro buscar a foto para deletar o arquivo
    db.query('SELECT foto FROM itens WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ success: false });
        
        if (results.length > 0 && results[0].foto) {
            // Deletar arquivo da foto
            const fotoPath = path.join(__dirname, '../public', results[0].foto);
            fs.unlink(fotoPath).catch(() => {});
        }
        
        // Deletar do banco
        db.query('DELETE FROM itens WHERE id = ?', [id], (err, result) => {
            if (err) return res.status(500).json({ success: false });
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Item não encontrado' 
                });
            }
            
            res.json({ 
                success: true, 
                message: 'Item deletado com sucesso!' 
            });
        });
    });
});

// Rota para estatísticas
app.get('/api/admin/estatisticas', (req, res) => {
    const query = `
        SELECT 
            c.nome as categoria,
            COUNT(i.id) as total
        FROM categorias c
        LEFT JOIN itens i ON c.id = i.categoria_id
        GROUP BY c.id, c.nome
    `;
    
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, data: results });
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 SERVIDOR INICIADO COM SUCESSO!');
    console.log('='.repeat(60));
    console.log(`📌 URL: http://localhost:${PORT}`);
    console.log(`📁 Uploads: /public/uploads/`);
    console.log(`🔧 API: http://localhost:${PORT}/api/test`);
    console.log('='.repeat(60) + '\n');
});