<?php
$current_dir = __DIR__;
$product_json = json_decode(file_get_contents('php://input'), true)['value'];

$file_path = $current_dir . '/../data/product.csv';

$file = fopen($file_path, 'a');

if ($file) {
    $csv_row = array (
        (int) $product_json['id'] ?? '',
        (string) $product_json['name'] ?? '',
        (string) $product_json['description'] ?? '',
        (float) $product_json['average_rating'] ?? '',
        (float) $product_json['price'] ?? '',
        (int) $product_json['num_reviews'] ?? '',
        (string) $product_json['pokemon'] ?? '',
        (string) $product_json['location'] ?? '',
    );

    fputcsv($file, $csv_row);

    fclose($file);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Unable to open file']);
}
?>
