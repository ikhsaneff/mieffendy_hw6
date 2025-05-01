<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE");
header("Access-Control-Allow-Headers: Content-Type");

require_once '../backend/models/productmodels.php';

$product_model = new ProductModels();
$userId = 1;

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $cartItems = $product_model->getCartItems($userId);
        
        $total = 0;
        foreach ($cartItems as &$item) {
            $item['subtotal'] = $item['price'] * $item['quantity'];
            $total += $item['subtotal'];
            
            $image = $product_model->getVisualObject($item['product_id'], "featured-image");
            $item['image'] = $image ? $image->getHTML() : '<img src="images/no-image.svg" alt="No Image" class="featured-image">';
        }
        
        echo json_encode([
            'items' => $cartItems,
            'total' => $total,
            'count' => count($cartItems)
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to fetch cart data: " . $e->getMessage()]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!$data) {
        $data = $_POST;
    }
    
    $action = $data['action'] ?? '';
    
    if ($action === 'add') {
        $productId = $data['product_id'] ?? 0;
        $quantity = $data['quantity'] ?? 1;
        
        if ($productId > 0) {
            try {
                $success = $product_model->addToCart($userId, $productId, $quantity);
                
                if ($success) {
                    $cartItems = $product_model->getCartItems($userId);
                    echo json_encode([
                        'success' => true,
                        'message' => 'Item added to cart',
                        'count' => count($cartItems)
                    ]);
                } else {
                    http_response_code(500);
                    echo json_encode(["error" => "Failed to add item to cart"]);
                }
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(["error" => "Error: " . $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Invalid product ID"]);
        }
    } elseif ($action === 'checkout') {
        try {
            $orderId = $product_model->checkout($userId);
            
            if ($orderId) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Order placed successfully',
                    'order_id' => $orderId
                ]);
            } else {
                http_response_code(400);
                echo json_encode(["error" => "No items in cart or checkout failed"]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => "Error during checkout: " . $e->getMessage()]);
        }
    } elseif ($action === 'update') {
        $itemId = $data['item_id'] ?? 0;
        $quantity = $data['quantity'] ?? 1;
        
        if ($itemId > 0 && $quantity > 0) {
            try {
                $success = $product_model->updateCartItem($userId, $itemId, $quantity);
                
                if ($success) {
                    echo json_encode([
                        'success' => true,
                        'message' => 'Cart item updated',
                    ]);
                } else {
                    http_response_code(500);
                    echo json_encode(["error" => "Failed to update cart item"]);
                }
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(["error" => "Error: " . $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Invalid item ID or quantity"]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["error" => "Invalid action"]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $itemId = $_GET['item_id'] ?? 0;
    
    if ($itemId > 0) {
        try {
            $success = $product_model->removeFromCart($userId, $itemId);
            
            if ($success) {
                $cartItems = $product_model->getCartItems($userId);
                echo json_encode([
                    'success' => true,
                    'message' => 'Item removed from cart',
                    'count' => count($cartItems)
                ]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Failed to remove item from cart"]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => "Error: " . $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["error" => "Invalid cart item ID"]);
    }
} else {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
}
?>