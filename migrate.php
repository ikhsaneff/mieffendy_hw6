<?php
echo "==================================================\n";
echo "UA Campus Store Database Migration Tool\n";
echo "==================================================\n\n";

$requiredPhpVersion = '7.4.0';
if (version_compare(PHP_VERSION, $requiredPhpVersion, '<')) {
    echo "ERROR: This script requires PHP version $requiredPhpVersion or higher.\n";
    echo "       Your PHP version: " . PHP_VERSION . "\n";
    exit(1);
}

if (!file_exists('.env')) {
    echo "ERROR: .env file not found in the project root directory.\n";
    echo "       Please create a .env file with your database credentials:\n\n";
    echo "       DB_HOST=localhost\n";
    echo "       DB_NAME=your_database_name\n";
    echo "       DB_USER=your_database_user\n";
    echo "       DB_PASSWORD=your_database_password\n";
    echo "       WEATHERAPI_KEY=your_weather_api_key  # Optional\n";
    exit(1);
}

if (!file_exists('data/product.csv') || !file_exists('data/visualcontent.csv')) {
    echo "ERROR: Required CSV data files not found in the data directory.\n";
    echo "       Make sure 'data/product.csv' and 'data/visualcontent.csv' exist.\n";
    exit(1);
}

require_once 'backend/database/migrate.php';

try {
    echo "Starting database migration...\n\n";
    
    $migration = new DatabaseMigration();
    
    $migration->run();
    
    echo "\nDatabase migration completed successfully!\n";
    echo "==================================================\n";
    echo "You can now set up your web server to point to this database\n";
    echo "and access the UA Campus Store website.\n";
    
} catch (Exception $e) {
    echo "\nERROR: Migration failed with message: " . $e->getMessage() . "\n";
    exit(1);
}
?>