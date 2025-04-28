<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");

require_once '../backend/models/productmodels.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $type = isset($_GET['type']) ? $_GET['type'] : 'product';

    try {
        if ($type === 'product') {
            $data = parseCSV('../data/product.csv');
        } elseif ($type === 'image') {
            $data = parseCSV('../data/visualcontent.csv');
        } else {
            throw new Exception("Invalid type parameter");
        }

        echo json_encode($data);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to fetch data: " . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
}

function parseCSV($filePath) {
    if (!file_exists($filePath)) {
        throw new Exception("File not found: $filePath");
    }

    $csvData = array_map(function($line) {
        return str_getcsv($line, ",", '"', "\\");
    }, file($filePath));
    $headers = array_shift($csvData);
    $result = [];

    foreach ($csvData as $row) {
        $rowData = array_combine($headers, $row);
        foreach ($rowData as $key => $value) {
            $rowData[$key] = convertType($value);
        }
        $result[] = $rowData;
    }

    return $result;
}

function convertType($value) {
    if (is_numeric($value)) {
        return strpos($value, '.') !== false ? (float) $value : (int) $value;
    } elseif (strtolower($value) === 'true' || strtolower($value) === 'false') {
        return strtolower($value) === 'true';
    } elseif ($value === '') {
        return null;
    }
    return $value;
}
?>
