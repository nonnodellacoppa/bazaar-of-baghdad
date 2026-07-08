<?php
require_once __DIR__ . '/../config.php';
header('Content-Type: application/json');
$pdo = getDB();
// Accetto solo POST come metodo
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'Metodo non consentito']);
  exit;
}

//ottengo le informazioni di registrazione
$data = json_decode(file_get_contents('php://input'), true);
if (!$data || empty($data['username']) || empty($data['password'])) {
  http_response_code(400);
  echo json_encode(['error' => 'Username e password obbligatori']);
  exit;
}

$username = trim($data['username']);
$password = $data['password'];
//se non viene inserita un e-mail, il campo vuoto viene sostituito con null per prevenire errori causati dal vincolo UNIQUE del campo email
$email = isset($data['email']) && trim($data['email']) !== '' ? trim($data['email']) : null;

// Verifico che l'username non esista già
$stmt = $pdo->prepare('SELECT id FROM users WHERE username = ?');
$stmt->execute([$username]);
if ($stmt->fetch()) {
  http_response_code(409); // Conflict
  echo json_encode(['error' => 'Username già in uso']);
  exit;
}

// Hash della password
$hash = password_hash($password, PASSWORD_DEFAULT);

$stmt = $pdo->prepare('INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)');
$stmt->execute([$username, $hash, $email]);

$userId = $pdo->lastInsertId();

// Genero un token JWT per loggare l'utente (senza chiedere un login dopo la registrazione)
$payload = [
  'sub' => $userId,
  'username' => $username,
  'iat' => time(),
  'exp' => time() + 3600
];
$jwt = \Firebase\JWT\JWT::encode($payload, JWT_SECRET, 'HS256');

echo json_encode([
  'message' => 'Registrazione completata',
  'token' => $jwt,
  'user' => [
    'id' => $userId,
    'username' => $username
  ]
]);
