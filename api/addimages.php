<?php
$current_dir = __DIR__;
$product_json = json_decode(file_get_contents('php://input'), true)['value'];

$file_path = $current_dir . '/../data/visualcontent.csv';

$file = fopen($file_path, 'a');

if ($file) {
    $csv_row = array(
        $product_json['id'] ?? '',
        $product_json['name'] ?? '',
        $product_json['description'] ?? '',
        $product_json['short_name'] ?? '',
        $product_json['file_type'] ?? '',
        $product_json['css_class'] ?? '',
        $product_json['product_id'] ?? '',
    );

    fputcsv($file, $csv_row, ',', '"');
    fclose($file);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Unable to open file']);
}
?>
