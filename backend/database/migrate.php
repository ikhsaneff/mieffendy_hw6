<?php
require_once 'Connection.php';

class DatabaseMigration {
    private $conn;
    
    public function __construct() {
        $this->conn = Connection::getInstance()->getConnection();
    }
    
    public function createTables() {
        try {
            $this->conn->exec("
                CREATE TABLE IF NOT EXISTS products (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    description TEXT NOT NULL,
                    average_rating FLOAT DEFAULT 0,
                    price DECIMAL(10, 2) NOT NULL,
                    num_reviews INT DEFAULT 0,
                    pokemon VARCHAR(255) DEFAULT NULL,
                    location VARCHAR(255) DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ");
            
            $this->conn->exec("
                CREATE TABLE IF NOT EXISTS visual_content (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    description TEXT NOT NULL,
                    short_name VARCHAR(255) NOT NULL,
                    file_type VARCHAR(50) NOT NULL,
                    css_class VARCHAR(50) NOT NULL,
                    product_id INT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
                )
            ");
            
            $this->conn->exec("
                CREATE TABLE IF NOT EXISTS reviews (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    product_id INT NOT NULL,
                    review TEXT NOT NULL,
                    user_name VARCHAR(255) DEFAULT 'John Doe',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
                )
            ");
            
            $this->conn->exec("
                CREATE TABLE IF NOT EXISTS cart_items (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT DEFAULT 1, /* placeholder for future user implementation */
                    product_id INT NOT NULL,
                    quantity INT NOT NULL DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
                )
            ");
            
            $this->conn->exec("
                CREATE TABLE IF NOT EXISTS orders (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT DEFAULT 1, /* placeholder for future user implementation */
                    total_amount DECIMAL(10, 2) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ");
            
            $this->conn->exec("
                CREATE TABLE IF NOT EXISTS order_items (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    order_id INT NOT NULL,
                    product_id INT NOT NULL,
                    quantity INT NOT NULL DEFAULT 1,
                    price DECIMAL(10, 2) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
                )
            ");
            
            $this->conn->exec("
                CREATE TABLE IF NOT EXISTS search_history (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT DEFAULT 1, /* placeholder for future user implementation */
                    query VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ");
            
            echo "All tables created successfully\n";
        } catch (PDOException $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            echo "Error creating tables: " . $e->getMessage() . "\n";
            die();
        }
    }
    
    public function migrateProductData() {
        try {
            $productFile = fopen(__DIR__ . '/../../data/product.csv', 'r');
            
            fgetcsv($productFile, 0, ',', '"', '\\');
            
            $stmt = $this->conn->prepare("
                INSERT INTO products (id, name, description, average_rating, price, num_reviews, pokemon, location) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            while (($row = fgetcsv($productFile, 0, ',', '"', '\\')) !== false) {
                if (count($row) >= 8) {
                    $stmt->execute([
                        $row[0],  // id
                        $row[1],  // name
                        $row[2],  // description
                        $row[3],  // average_rating
                        $row[4],  // price
                        $row[5],  // num_reviews
                        $row[6],  // pokemon
                        $row[7]   // location
                    ]);
                }
            }
            
            fclose($productFile);
            echo "Product data migrated successfully\n";
        } catch (PDOException $e) {
            echo "Error migrating product data: " . $e->getMessage() . "\n";
        }
    }
    
    public function migrateVisualContentData() {
        try {
            $visualFile = fopen(__DIR__ . '/../../data/visualcontent.csv', 'r');
            
            fgetcsv($visualFile, 0, ',', '"', '\\');
            
            $stmt = $this->conn->prepare("
                INSERT INTO visual_content (id, name, description, short_name, file_type, css_class, product_id) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            
            while (($row = fgetcsv($visualFile, 0, ',', '"', '\\')) !== false) {
                if (count($row) >= 7) {
                    $stmt->execute([
                        $row[0],  // id
                        $row[1],  // name
                        $row[2],  // description
                        $row[3],  // short_name
                        $row[4],  // file_type
                        $row[5],  // css_class
                        $row[6]   // product_id
                    ]);
                }
            }
            
            fclose($visualFile);
            echo "Visual content data migrated successfully\n";
        } catch (PDOException $e) {
            echo "Error migrating visual content data: " . $e->getMessage() . "\n";
        }
    }
    
    public function run() {
        $this->createTables();
        $this->migrateProductData();
        $this->migrateVisualContentData();
    }
}
?>