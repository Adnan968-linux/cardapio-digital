-- ============================================
-- BANCO DE DADOS DO CARDÁPIO DIGITAL
-- ============================================

DROP DATABASE IF EXISTS cardapio_db;
CREATE DATABASE cardapio_db;
USE cardapio_db;

-- Tabela de categorias
CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE
);

-- Tabela de itens (COM CAMPO FOTO)
CREATE TABLE itens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    categoria_id INT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10,2) NOT NULL,
    badge VARCHAR(50),
    destaque BOOLEAN DEFAULT FALSE,
    foto VARCHAR(500),  -- URL da foto
    foto_nome VARCHAR(255), -- Nome original do arquivo
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE
);

-- Tabela de admin
CREATE TABLE admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    senha VARCHAR(50) NOT NULL
);

-- Inserir categorias
INSERT INTO categorias (nome, slug) VALUES
('Pratos do Dia', 'pratos-do-dia'),
('Pratos Principais', 'pratos'),
('Bebidas', 'bebidas'),
('Sobremesas', 'sobremesas');

-- Inserir admin
INSERT INTO admin (usuario, senha) VALUES ('admin', 'admin123');

-- Inserir itens de exemplo
INSERT INTO itens (categoria_id, nome, descricao, preco, badge, destaque) VALUES
(1, 'Feijoada Completa', 'Feijoada tradicional com arroz, couve, farofa e laranja', 49.90, 'PRATO DO DIA', true),
(1, 'Filé à Parmegiana', 'Filé mignon empanado com molho de tomate e queijo', 42.90, 'ESPECIAL', false),
(2, 'Batata Frita', 'Porção de batata frita crocante 500g', 25.90, 'PORÇÃO', false),
(2, 'Contrafilé na Chapa', 'Contrafilé grelhado com arroz, feijão e fritas', 38.90, 'GRELHADO', false),
(3, 'Coca-Cola', 'Lata 350ml', 6.90, 'REFRIGERANTE', false),
(3, 'Suco Natural', 'Laranja, limão ou maracujá - 500ml', 12.90, 'SUCO', false),
(4, 'Pudim', 'Pudim de leite condensado com calda de caramelo', 15.90, 'SOBREMESA', false),
(4, 'Brownie', 'Brownie de chocolate com sorvete', 18.90, 'ESPECIAL', true);