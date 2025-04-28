<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");

require_once '../backend/models/productmodels.php';

$product_model = new ProductModels();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $id = isset($_GET['id']) ? $_GET['id'] : null;
    
    try {
        $products = $product_model->getProductObjects($id);
        $image = $product_model->getVisualObject($id, "main-image");
        
        $result = [];

        if (is_object($products)) {
            $productData = productToArray($products, $image);

            echo json_encode($productData);
            exit;
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to fetch data: " . $e->getMessage()]);
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
