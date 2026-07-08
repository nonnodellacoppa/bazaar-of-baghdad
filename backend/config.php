<?php
require_once __DIR__ . '/../vendor/autoload.php';
define('JWT_SECRET', 'password_di_innegabile_sicurezza');
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
//  Configurazione e connessione al database
function getDB(): PDO {
  static $pdo = null;
  if ($pdo === null) {
    $dbPath = __DIR__ . '/../database/bazaar.db';
    $pdo = new PDO("sqlite:$dbPath");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->exec('PRAGMA foreign_keys = ON');
  }
  return $pdo;
}

// Inizializzazione tabelle
function initializeDatabase(): void {
  $pdo = getDB();
  $schema = file_get_contents(__DIR__ . '/../database/schema.sql');
  $pdo->exec($schema);
}

initializeDatabase();

function authenticate(): array {
  $headers = getallheaders();
  if (!isset($headers['Authorization'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Token mancante']);
    exit;
  }
  $authHeader = $headers['Authorization'];
  $token = str_replace('Bearer ', '', $authHeader);

  try {
    $decoded = JWT::decode($token, new Key(JWT_SECRET, 'HS256'));
    return (array) $decoded;
  } 
  catch (Exception $e) {
    http_response_code(401);
    echo json_encode(['error' => 'Token non valido o scaduto']);
    exit;
  }
}
