<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type");

require_once '../backend/models/productmodels.php';

$productModel = new ProductModels();

$method = $_SERVER['REQUEST_METHOD'];
$type = isset($_GET['type']) ? $_GET['type'] : 'product';

try {
    switch ($method) {
        case 'GET':
            if ($type === 'product') {
                $query = isset($_GET['query']) ? $_GET['query'] : '';
                $sortBy = isset($_GET['sort']) ? $_GET['sort'] : null;
                $minPrice = isset($_GET['min_price']) ? floatval($_GET['min_price']) : null;
                $maxPrice = isset($_GET['max_price']) ? floatval($_GET['max_price']) : null;
                $minRating = isset($_GET['min_rating']) ? floatval($_GET['min_rating']) : null;
                
                if (!empty($query) || $sortBy || $minPrice || $maxPrice || $minRating) {
                    $products = $productModel->searchProductsWithFilters($query, $sortBy, $minPrice, $maxPrice, $minRating);
                } else {
                    $products = $productModel->getProductObjects();
                }
                
                $result = [];
                foreach ($products as $product) {
                    $result[] = [
                        'id' => $product->getProductProperty('id'),
                        'name' => $product->getProductProperty('name'),
                        'description' => $product->getProductProperty('description'),
                        'average_rating' => $product->getProductProperty('average_rating'),
                        'price' => $product->getProductProperty('price'),
                        'num_reviews' => $product->getProductProperty('num_reviews'),
                        'pokemon' => $product->getProductProperty('pokemon'),
                        'location' => $product->getProductProperty('location')
                    ];
                }
                
                echo json_encode($result);
                
            } elseif ($type === 'image') {
                $stmt = Connection::getInstance()->getConnection()->query("SELECT * FROM visual_content");
                $images = $stmt->fetchAll();
                
                echo json_encode($images);
                
            } elseif ($type === 'similar') {
                $query = isset($_GET['query']) ? $_GET['query'] : '';
                $similarProducts = $productModel->getSimilarProducts($query);

                $result = [];
                foreach ($similarProducts as $product) {
                    $result[] = [
                        'id' => $product->getProductProperty('id'),
                        'name' => $product->getProductProperty('name'),
                        'description' => $product->getProductProperty('description'),
                        'average_rating' => $product->getProductProperty('average_rating'),
                        'price' => $product->getProductProperty('price'),
                        'num_reviews' => $product->getProductProperty('num_reviews')
                    ];
                }
                
                echo json_encode($result);
                
            } elseif ($type === 'recommended') {
                $productId = isset($_GET['product_id']) ? intval($_GET['product_id']) : 0;
                
                if ($productId > 0) {
                    $recommendedProducts = $productModel->getRecommendedProducts($productId);

                    $result = [];
                    foreach ($recommendedProducts as $product) {
                        $result[] = [
                            'id' => $product->getProductProperty('id'),
                            'name' => $product->getProductProperty('name'),
                            'description' => $product->getProductProperty('description'),
                            'average_rating' => $product->getProductProperty('average_rating'),
                            'price' => $product->getProductProperty('price'),
                            'num_reviews' => $product->getProductProperty('num_reviews')
                        ];
                    }
                    
                    echo json_encode($result);
                } else {
                    http_response_code(400);
                    echo json_encode(["error" => "Invalid product ID"]);
                }
            } elseif ($type === 'search_history') {
                $userId = $data['user_id'] ?? 1;
                
                if ($userId > 0) {
                    $searchHistory = $productModel->getSearchHistory($userId);
                    
                    echo json_encode($searchHistory);
                } else {
                    http_response_code(400);
                    echo json_encode(["error" => "Invalid user ID"]);
                }
            } else {
                throw new Exception("Invalid type parameter");
            }
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (!$data) {
                $data = $_POST;
            }
            
            if ($type === 'product') {
                if (isset($data['value'])) {
                    $productData = $data['value'];
                    
                    $productId = $productModel->addProduct([
                        'name' => $productData['name'],
                        'description' => $productData['description'],
                        'average_rating' => $productData['average_rating'] ?? 0,
                        'price' => $productData['price'],
                        'num_reviews' => $productData['num_reviews'] ?? 0,
                        'pokemon' => $productData['pokemon'] ?? "",
                        'location' => $productData['location'] ?? ""
                    ]);
                    
                    if ($productId) {
                        echo json_encode(["success" => true, "id" => $productId]);
                    } else {
                        http_response_code(500);
                        echo json_encode(["error" => "Failed to add product"]);
                    }
                } else {
                    http_response_code(400);
                    echo json_encode(["error" => "Invalid data format"]);
                }
            } elseif ($type === 'image') {
                if (isset($data['value'])) {
                    $imageData = $data['value'];
                    
                    $imageId = $productModel->addVisualContent($imageData);
                    
                    if ($imageId) {
                        echo json_encode(["success" => true, "id" => $imageId]);
                    } else {
                        http_response_code(500);
                        echo json_encode(["error" => "Failed to add image"]);
                    }
                } else {
                    http_response_code(400);
                    echo json_encode(["error" => "Invalid data format"]);
                }
            } elseif ($type === 'search') {
                $query = $data['query'] ?? '';
                $userId = $data['user_id'] ?? 1;
                
                if (!empty($query)) {
                    $productModel->saveSearchQuery($userId, $query);
                    echo json_encode(["success" => true]);
                } else {
                    http_response_code(400);
                    echo json_encode(["error" => "No search query provided"]);
                }
            } elseif ($type === 'cart') {
                $productId = $data['product_id'] ?? 0;
                $quantity = $data['quantity'] ?? 1;
                $userId = 1;
                
                if ($productId > 0) {
                    $success = $productModel->addToCart($userId, $productId, $quantity);
                    
                    if ($success) {
                        echo json_encode(["success" => true]);
                    } else {
                        http_response_code(500);
                        echo json_encode(["error" => "Failed to add item to cart"]);
                    }
                } else {
                    http_response_code(400);
                    echo json_encode(["error" => "Invalid product ID"]);
                }
            } elseif ($type === 'cart_items') {
                $userId = $data['user_id'] ?? 1;
                
                if ($userId > 0) {
                    $cartItems = $productModel->getCartItems($userId);
                    
                    echo json_encode($cartItems);
                } else {
                    http_response_code(400);
                    echo json_encode(["error" => "Invalid user ID"]);
                }
            } else {
                http_response_code(400);
                echo json_encode(["error" => "Invalid type parameter"]);
            }
            break;
            
        case 'PUT':
            $data = json_decode(file_get_contents("php://input"), true);
            
            if ($type === 'product') {
                $productId = $data['id'] ?? 0;
                
                if ($productId > 0) {
                    $success = $productModel->updateProduct($productId, [
                        'name' => $data['name'],
                        'description' => $data['description'],
                        'average_rating' => $data['average_rating'] ?? 0,
                        'price' => $data['price'],
                        'num_reviews' => $data['num_reviews'] ?? 0,
                        'pokemon' => $data['pokemon'] ?? null,
                        'location' => $data['location'] ?? null
                    ]);
                    
                    if ($success) {
                        echo json_encode(["success" => true]);
                    } else {
                        http_response_code(500);
                        echo json_encode(["error" => "Failed to update product"]);
                    }
                } else {
                    http_response_code(400);
                    echo json_encode(["error" => "Invalid product ID"]);
                }
            } else {
                http_response_code(400);
                echo json_encode(["error" => "Invalid type parameter"]);
            }
            break;
            
        case 'DELETE':
            if ($type === 'product') {
                $productId = $_GET['id'] ?? 0;
                
                if ($productId > 0) {
                    $success = $productModel->deleteProduct($productId);
                    
                    if ($success) {
                        echo json_encode(["success" => true]);
                    } else {
                        http_response_code(500);
                        echo json_encode(["error" => "Failed to delete product"]);
                    }
                } else {
                    http_response_code(400);
                    echo json_encode(["error" => "Invalid product ID"]);
                }
            } elseif ($type === 'cart') {
                $cartItemId = $_GET['item_id'] ?? 0;
                $userId = 1;
                
                if ($cartItemId > 0) {
                    $success = $productModel->removeFromCart($userId, $cartItemId);
                    
                    if ($success) {
                        echo json_encode(["success" => true]);
                    } else {
                        http_response_code(500);
                        echo json_encode(["error" => "Failed to remove item from cart"]);
                    }
                } else {
                    http_response_code(400);
                    echo json_encode(["error" => "Invalid cart item ID"]);
                }
            } else {
                http_response_code(400);
                echo json_encode(["error" => "Invalid type parameter"]);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(["error" => "Method not allowed"]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Failed to process request: " . $e->getMessage()]);
}
?>
