<?php
require_once __DIR__ . '/../config.php';
header('Content-Type: application/json');
$pdo = getDB();

$user = authenticate();  

$stmt = $pdo->prepare('SELECT id, username, email, balance FROM users WHERE id = ?');
$stmt->execute([$user['sub']]);
$userData = $stmt->fetch();

if (!$userData) {
  http_response_code(404);
  echo json_encode(['error' => 'Utente non trovato']);
  exit;
}

echo json_encode(['user' => $userData]);
