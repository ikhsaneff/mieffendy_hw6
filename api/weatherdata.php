<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");

require_once '../backend/models/productmodels.php';

define('POKEAPI_URL', 'https://pokeapi.co/api/v2/pokemon/');
define('WEATHERAPI_URL', 'https://api.openweathermap.org/data/2.5/weather');

$lines = file('../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

foreach ($lines as $line) {
    if (strpos(trim($line), '#') === 0) {
        continue;
    }
    list($name, $value) = explode('=', $line, 2);
    putenv(sprintf('%s=%s', trim($name), trim($value)));
}

if (getenv('WEATHERAPI_KEY') === false) {
    http_response_code(500);
    echo json_encode(["error" => "WEATHERAPI_KEY not set in environment variables"]);
    exit;
} else {
    define('WEATHERAPI_KEY', getenv('WEATHERAPI_KEY'));
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $loc = isset($_GET['loc']) ? $_GET['loc'] : null;
    
    try {
        $weatherData = null;
        if ($loc && WEATHERAPI_KEY) {
            $city = urlencode($loc);
            $url = WEATHERAPI_URL . "?q={$city}&appid=" . WEATHERAPI_KEY . "&units=imperial";
            
            $contextOptions = [
                "http" => [
                    "method" => "GET",
                    "header" => "User-Agent: PHP\r\n"
                ]
            ];
            $context = stream_context_create($contextOptions);
            $response = @file_get_contents($url, false, $context);
        
            if ($response === FALSE) {
                return null;
            }
            $weatherData = json_decode($response, true);
        }

        echo json_encode($weatherData);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to fetch data: " . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
}