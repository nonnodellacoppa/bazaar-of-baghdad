<?php
require_once __DIR__ . '/../config.php';
use Firebase\JWT\JWT;
$pdo = getDB();

header('Content-Type: application/json');

// Accetta solo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'Metodo non consentito']);
  exit;
}

// Legge i dati JSON dal corpo della richiesta
$data = json_decode(file_get_contents('php://input'), true);
if (!$data || empty($data['username']) || empty($data['password'])) {
  http_response_code(400);
  echo json_encode(['error' => 'Username e password sono obbligatori']);
  exit;
}

$username = $data['username'];
$password = $data['password'];

// Cerca l'utente nel database
$stmt = $pdo->prepare('SELECT * FROM users WHERE username = ?');
$stmt->execute([$username]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
  http_response_code(401);
  echo json_encode(['error' => 'Credenziali non valide']);
  exit;
}

// Credenziali corrette, genera JWT
$payload = [
  'sub' => $user['id'],
  'username' => $user['username'],
  'iat' => time(),
  'exp' => time() + 3600
];

$jwt = JWT::encode($payload, JWT_SECRET, 'HS256');

echo json_encode([
  'message' => 'Login effettuato con successo',
  'token' => $jwt,
  'user' => [
    'id' => $user['id'],
    'username' => $user['username'],
    'balance' => $user['balance']
  ]
]);
