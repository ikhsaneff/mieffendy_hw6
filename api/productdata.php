<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once '../backend/models/productmodels.php';

$product_model = new ProductModels();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $id = isset($_GET['id']) ? $_GET['id'] : null;
    
    try {
        $product = $product_model->getProductObjects($id);
        $image = $product_model->getVisualObject($id, "main-image");
        
        if (is_object($product)) {
            $productData = productToArray($product, $image);
            
            $reviews = $product_model->getReviews($id);
            $productData['reviews'] = $reviews;
            
            echo json_encode($productData);
            exit;
        } else {
            http_response_code(404);
            echo json_encode(["error" => "Product not found"]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to fetch data: " . $e->getMessage()]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!$data) {
        $data = $_POST;
    }
    
    $productId = $data['productId'] ?? null;
    $review = $data['review'] ?? null;
    
    if ($productId && $review) {
        try {
            $reviewId = $product_model->addReview($productId, $review);
            
            if ($reviewId) {
                echo json_encode([
                    "success" => true,
                    "review" => [
                        "id" => $reviewId,
                        "product_id" => $productId,
                        "review" => $review,
                        "user_name" => "John Doe"
                    ]
                ]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Failed to add review"]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => "Error: " . $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["error" => "Missing required fields"]);
    }
} else {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
}

function productToArray($product, $image) {
    return [
        "image" => $image->getHTML(),
        "name" => $product->getProductProperty("name"),
        "description" => $product->getProductProperty("description"),
        "average_rating" => $product->getRatingStars(),
        "price" => $product->getProductProperty("price"),
        "num_reviews" => $product->getProductProperty("num_reviews"),
        "pokemon" => $product->getProductProperty("pokemon"),
        "location" => $product->getProductProperty("location"),
    ];
}
?>
