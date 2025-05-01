<?php

require_once __DIR__ . '/../database/Connection.php';
require_once 'productclass.php';
require_once 'visualclass.php';

class ProductModels {
    private $db;
    
    function __construct() {
        $this->db = Connection::getInstance()->getConnection();
    }
    
    function getProductObjects(array|int|null $ids = null) {
        try {
            if ($ids === null) {
                $stmt = $this->db->prepare("SELECT * FROM products ORDER BY id");
                $stmt->execute();
                $products = [];
                
                while ($row = $stmt->fetch()) {
                    $products[] = new Product(
                        $row['id'],
                        $row['name'],
                        $row['description'],
                        $row['average_rating'],
                        $row['price'],
                        $row['num_reviews'],
                        $row['pokemon'],
                        $row['location']
                    );
                }
                
                return $products;
            }
            
            if (!is_array($ids)) {
                $ids = [$ids];
            }
            
            $placeholders = str_repeat('?,', count($ids) - 1) . '?';
            $stmt = $this->db->prepare("SELECT * FROM products WHERE id IN ($placeholders)");
            $stmt->execute($ids);
            
            $products = [];
            while ($row = $stmt->fetch()) {
                $products[] = new Product(
                    $row['id'],
                    $row['name'],
                    $row['description'],
                    $row['average_rating'],
                    $row['price'],
                    $row['num_reviews'],
                    $row['pokemon'],
                    $row['location']
                );
            }
            
            return count($ids) === 1 ? reset($products) : $products;
            
        } catch (PDOException $e) {
            error_log("Database error in getProductObjects: " . $e->getMessage());
            return [];
        }
    }
    
    function getVisualObject(int $id, string $class) {
        try {
            $stmt = $this->db->prepare("
                SELECT * FROM visual_content 
                WHERE product_id = ? AND css_class = ? 
                LIMIT 1
            ");
            $stmt->execute([$id, $class]);
            
            if ($row = $stmt->fetch()) {
                return new Visual(
                    $row['id'],
                    $row['name'],
                    $row['description'],
                    $row['short_name'],
                    $row['file_type'],
                    $row['css_class'],
                    $row['product_id']
                );
            }
            
            return null;
            
        } catch (PDOException $e) {
            error_log("Database error in getVisualObject: " . $e->getMessage());
            return null;
        }
    }
    
    function searchProduct(string $query) {
        try {
            if (empty($query)) {
                return [];
            }
            
            $stmt = $this->db->prepare("
                SELECT * FROM products 
                WHERE name LIKE ? 
                ORDER BY id
            ");
            $stmt->execute(['%' . $query . '%']);
            
            $results = [];
            while ($row = $stmt->fetch()) {
                $results[] = new Product(
                    $row['id'],
                    $row['name'],
                    $row['description'],
                    $row['average_rating'],
                    $row['price'],
                    $row['num_reviews'],
                    $row['pokemon'],
                    $row['location']
                );
            }
            
            return $results;
            
        } catch (PDOException $e) {
            error_log("Database error in searchProduct: " . $e->getMessage());
            return [];
        }
    }
    
    function getSimilarProducts(string $query) {
        try {
            if (empty($query)) {
                return [];
            }
            
            $stmt = $this->db->prepare("
                SELECT * FROM products 
                WHERE name LIKE ? 
                OR name SOUNDS LIKE ? 
                ORDER BY (name LIKE ?) DESC, name
                LIMIT 5
            ");
            $stmt->execute(['%' . $query . '%', $query, '%' . $query . '%']);
            
            $results = [];
            while ($row = $stmt->fetch()) {
                $results[] = new Product(
                    $row['id'],
                    $row['name'],
                    $row['description'],
                    $row['average_rating'],
                    $row['price'],
                    $row['num_reviews'],
                    $row['pokemon'],
                    $row['location']
                );
            }
            
            return $results;
            
        } catch (PDOException $e) {
            error_log("Database error in getSimilarProducts: " . $e->getMessage());
            return [];
        }
    }
    
    function getRecommendedProducts(int $productId) {
        try {
            $currentProduct = $this->getProductObjects($productId);
            
            if (!$currentProduct) {
                return [];
            }
            
            $currentName = $currentProduct->getProductProperty('name');
            
            $keywords = explode(' ', strtolower($currentName));
            $category = '';
            
            $commonCategories = [
                'tee', 't-shirt', 'shirt', 'shorts', 'crewneck', 'sweatshirt', 
                'hoodie', 'pants', 'cap', 'hat', 'basketball', 'baseball', 
                'football', 'softball', 'jacket', 'socks'
            ];
            
            foreach ($keywords as $word) {
                if (in_array($word, $commonCategories)) {
                    $category = $word;
                    break;
                }
            }
            
            if (empty($category)) {
                $excludeWords = ['arizona', 'wildcats', 'ua', 'the', 'and', 'with'];
                foreach ($keywords as $word) {
                    if (!in_array($word, $excludeWords) && strlen($word) > 2) {
                        $category = $word;
                        break;
                    }
                }
            }
            
            $stmt = $this->db->prepare("
                SELECT * FROM products 
                WHERE id != ? 
                AND (name LIKE ? OR description LIKE ?)
                ORDER BY RAND() 
                LIMIT 5
            ");
            $stmt->execute([$productId, '%' . $category . '%', '%' . $category . '%']);
            
            $recommendations = [];
            while ($row = $stmt->fetch()) {
                $recommendations[] = new Product(
                    $row['id'],
                    $row['name'],
                    $row['description'],
                    $row['average_rating'],
                    $row['price'],
                    $row['num_reviews'],
                    $row['pokemon'],
                    $row['location']
                );
            }
            
            return $recommendations;
            
        } catch (PDOException $e) {
            error_log("Database error in getRecommendedProducts: " . $e->getMessage());
            return [];
        }
    }
    
    function searchProductsWithFilters($query, $sortBy = null, $minPrice = null, $maxPrice = null, $minRating = null) {
        try {
            $params = [];
            $sql = "SELECT * FROM products WHERE 1=1";
            
            if (!empty($query)) {
                $sql .= " AND name LIKE ?";
                $params[] = '%' . $query . '%';
            }
            
            if ($minPrice !== null) {
                $sql .= " AND price >= ?";
                $params[] = $minPrice;
            }
            
            if ($maxPrice !== null) {
                $sql .= " AND price <= ?";
                $params[] = $maxPrice;
            }
            
            if ($minRating !== null) {
                $sql .= " AND average_rating >= ?";
                $params[] = $minRating;
            }
            
            if ($sortBy !== null) {
                switch ($sortBy) {
                    case 'price-lohi':
                        $sql .= " ORDER BY price ASC";
                        break;
                    case 'price-hilo':
                        $sql .= " ORDER BY price DESC";
                        break;
                    case 'rating-hilo':
                        $sql .= " ORDER BY average_rating DESC";
                        break;
                    case 'rating-lohi':
                        $sql .= " ORDER BY average_rating ASC";
                        break;
                    default:
                        $sql .= " ORDER BY id ASC";
                }
            } else {
                $sql .= " ORDER BY id ASC";
            }
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            
            $results = [];
            while ($row = $stmt->fetch()) {
                $results[] = new Product(
                    $row['id'],
                    $row['name'],
                    $row['description'],
                    $row['average_rating'],
                    $row['price'],
                    $row['num_reviews'],
                    $row['pokemon'],
                    $row['location']
                );
            }
            
            return $results;
            
        } catch (PDOException $e) {
            error_log("Database error in searchProductsWithFilters: " . $e->getMessage());
            return [];
        }
    }
    
    function addProduct($productData) {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO products (name, description, average_rating, price, num_reviews, pokemon, location) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $productData['name'],
                $productData['description'],
                $productData['average_rating'],
                $productData['price'],
                $productData['num_reviews'],
                $productData['pokemon'],
                $productData['location']
            ]);
            
            return $this->db->lastInsertId();
            
        } catch (PDOException $e) {
            error_log("Database error in addProduct: " . $e->getMessage());
            return false;
        }
    }
    
    function addVisualContent($visualData) {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO visual_content (name, description, short_name, file_type, css_class, product_id) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $visualData['name'],
                $visualData['description'],
                $visualData['short_name'],
                $visualData['file_type'],
                $visualData['css_class'],
                $visualData['product_id']
            ]);
            
            return $this->db->lastInsertId();
            
        } catch (PDOException $e) {
            error_log("Database error in addVisualContent: " . $e->getMessage());
            return false;
        }
    }
    
    function updateProduct($id, $productData) {
        try {
            $stmt = $this->db->prepare("
                UPDATE products 
                SET name = ?, description = ?, average_rating = ?, price = ?, num_reviews = ?, pokemon = ?, location = ? 
                WHERE id = ?
            ");
            
            $stmt->execute([
                $productData['name'],
                $productData['description'],
                $productData['average_rating'],
                $productData['price'],
                $productData['num_reviews'],
                $productData['pokemon'],
                $productData['location'],
                $id
            ]);
            
            return $stmt->rowCount() > 0;
            
        } catch (PDOException $e) {
            error_log("Database error in updateProduct: " . $e->getMessage());
            return false;
        }
    }
    
    function deleteProduct($id) {
        try {
            $stmt = $this->db->prepare("DELETE FROM products WHERE id = ?");
            $stmt->execute([$id]);
            
            return $stmt->rowCount() > 0;
            
        } catch (PDOException $e) {
            error_log("Database error in deleteProduct: " . $e->getMessage());
            return false;
        }
    }
    
    function addReview($productId, $review) {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO reviews (product_id, review) 
                VALUES (?, ?)
            ");
            
            $stmt->execute([$productId, $review]);
            
            return $this->db->lastInsertId();
            
        } catch (PDOException $e) {
            error_log("Database error in addReview: " . $e->getMessage());
            return false;
        }
    }
    
    function getReviews($productId) {
        try {
            $stmt = $this->db->prepare("
                SELECT * FROM reviews 
                WHERE product_id = ? 
                ORDER BY created_at DESC
            ");
            
            $stmt->execute([$productId]);
            
            return $stmt->fetchAll();
            
        } catch (PDOException $e) {
            error_log("Database error in getReviews: " . $e->getMessage());
            return [];
        }
    }
    
    function addToCart($userId, $productId, $quantity = 1) {
        try {
            $checkStmt = $this->db->prepare("
                SELECT * FROM cart_items 
                WHERE user_id = ? AND product_id = ?
            ");
            
            $checkStmt->execute([$userId, $productId]);
            
            if ($row = $checkStmt->fetch()) {
                $updateStmt = $this->db->prepare("
                    UPDATE cart_items 
                    SET quantity = quantity + ? 
                    WHERE user_id = ? AND product_id = ?
                ");
                
                $updateStmt->execute([$quantity, $userId, $productId]);
                return true;
            } else {
                $insertStmt = $this->db->prepare("
                    INSERT INTO cart_items (user_id, product_id, quantity) 
                    VALUES (?, ?, ?)
                ");
                
                $insertStmt->execute([$userId, $productId, $quantity]);
                return true;
            }
            
        } catch (PDOException $e) {
            error_log("Database error in addToCart: " . $e->getMessage());
            return false;
        }
    }
    
    function removeFromCart($userId, $cartItemId) {
        try {
            $stmt = $this->db->prepare("
                DELETE FROM cart_items 
                WHERE id = ? AND user_id = ?
            ");
            
            $stmt->execute([$cartItemId, $userId]);
            
            return $stmt->rowCount() > 0;
            
        } catch (PDOException $e) {
            error_log("Database error in removeFromCart: " . $e->getMessage());
            return false;
        }
    }
    
    function getCartItems($userId) {
        try {
            $stmt = $this->db->prepare("
                SELECT ci.*, p.name, p.price 
                FROM cart_items ci 
                JOIN products p ON ci.product_id = p.id 
                WHERE ci.user_id = ?
            ");
            
            $stmt->execute([$userId]);
            
            return $stmt->fetchAll();
            
        } catch (PDOException $e) {
            error_log("Database error in getCartItems: " . $e->getMessage());
            return [];
        }
    }
    
    function checkout($userId) {
        try {
            $this->db->beginTransaction();
            
            $cartItems = $this->getCartItems($userId);
            
            if (empty($cartItems)) {
                return false;
            }
            
            $totalAmount = 0;
            foreach ($cartItems as $item) {
                $totalAmount += $item['price'] * $item['quantity'];
            }
            
            $orderStmt = $this->db->prepare("
                INSERT INTO orders (user_id, total_amount) 
                VALUES (?, ?)
            ");
            
            $orderStmt->execute([$userId, $totalAmount]);
            $orderId = $this->db->lastInsertId();
            
            $itemStmt = $this->db->prepare("
                INSERT INTO order_items (order_id, product_id, quantity, price) 
                VALUES (?, ?, ?, ?)
            ");
            
            foreach ($cartItems as $item) {
                $itemStmt->execute([
                    $orderId,
                    $item['product_id'],
                    $item['quantity'],
                    $item['price']
                ]);
            }
            
            $clearCartStmt = $this->db->prepare("DELETE FROM cart_items WHERE user_id = ?");
            $clearCartStmt->execute([$userId]);
            
            $this->db->commit();
            
            return $orderId;
            
        } catch (PDOException $e) {
            $this->db->rollBack();
            error_log("Database error in checkout: " . $e->getMessage());
            return false;
        }
    }

    function updateCartItem($userId, $itemId, $quantity) {
        try {
            $stmt = $this->db->prepare("
                UPDATE cart_items 
                SET quantity = ? 
                WHERE id = ? AND user_id = ?
            ");
            
            $stmt->execute([$quantity, $itemId, $userId]);
            
            return $stmt->rowCount() > 0;
            
        } catch (PDOException $e) {
            error_log("Database error in updateCartItem: " . $e->getMessage());
            return false;
        }
    }
    
    function saveSearchQuery($userId, $query) {
        try {
            $historyStmt = $this->db->prepare("
                SELECT * FROM search_history 
                WHERE user_id = ? 
                ORDER BY created_at DESC 
                LIMIT 3
            ");
            
            $historyStmt->execute([$userId]);
            $history = $historyStmt->fetchAll();
            
            foreach ($history as $item) {
                if ($item['query'] === $query) {
                    $updateStmt = $this->db->prepare("
                        UPDATE search_history 
                        SET created_at = CURRENT_TIMESTAMP 
                        WHERE id = ?
                    ");
                    
                    $updateStmt->execute([$item['id']]);
                    return true;
                }
            }
            
            $insertStmt = $this->db->prepare("
                INSERT INTO search_history (user_id, query) 
                VALUES (?, ?)
            ");
            
            $insertStmt->execute([$userId, $query]);
            
            if (count($history) >= 3) {
                $deleteStmt = $this->db->prepare("
                    DELETE FROM search_history 
                    WHERE user_id = ? 
                    ORDER BY created_at ASC 
                    LIMIT 1
                ");
                
                $deleteStmt->execute([$userId]);
            }
            
            return true;
            
        } catch (PDOException $e) {
            error_log("Database error in saveSearchQuery: " . $e->getMessage());
            return false;
        }
    }
    
    function getSearchHistory($userId) {
        try {
            $stmt = $this->db->prepare("
                SELECT query FROM search_history 
                WHERE user_id = ? 
                ORDER BY created_at DESC 
                LIMIT 3
            ");
            
            $stmt->execute([$userId]);
            
            $history = [];
            while ($row = $stmt->fetch()) {
                $history[] = $row['query'];
            }
            
            return $history;
            
        } catch (PDOException $e) {
            error_log("Database error in getSearchHistory: " . $e->getMessage());
            return [];
        }
    }
    
    function notFound() {
        $html = "<div class='not-found'>
                    <h1>404 Not Found</h1>
                    <p>The product you are looking for does not exist.</p>
                    <a href='index.php'>Return to Homepage</a>
                </div>";

        return $html;
    }
}
?>