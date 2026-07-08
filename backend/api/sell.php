<?php
require_once __DIR__ . '/../config.php';
header('Content-Type: application/json');
$user = authenticate();
$pdo = getDB();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
  // Elenco carte in vendita dell'utente
  $stmt = $pdo->prepare('
    SELECT id, name, set_name, condition, price, description, image_url, status
    FROM cards
    WHERE seller_id = ? AND status = ?
    ORDER BY id DESC
  ');
  $stmt->execute([$user['sub'], 'available']);
  $cards = $stmt->fetchAll();
  echo json_encode(['cards' => $cards]);

} 
elseif ($method === 'POST') {
  $data = json_decode(file_get_contents('php://input'), true);
  if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Dati mancanti']);
    exit;
  }

// Azione: aggiornamento prezzo
if (isset($data['action']) && $data['action'] === 'update_price') {
  if (empty($data['card_id']) || !isset($data['new_price'])) {
    http_response_code(400);
    echo json_encode(['error' => 'card_id e new_price richiesti']);
    exit;
  }
  $cardId = (int) $data['card_id'];
  $newPrice = (float) $data['new_price'];
  if ($newPrice < 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Prezzo non valido']);
    exit;
  }

  $stmt = $pdo->prepare('SELECT * FROM cards WHERE id = ? AND seller_id = ? AND status = ?');
  $stmt->execute([$cardId, $user['sub'], 'available']);
  $card = $stmt->fetch();
  if (!$card) {
    http_response_code(404);
    echo json_encode(['error' => 'Carta non trovata o non modificabile']);
    exit;
  }

  $stmt = $pdo->prepare('UPDATE cards SET price = ? WHERE id = ?');
  $stmt->execute([$newPrice, $cardId]);
  echo json_encode(['message' => 'Prezzo aggiornato', 'card_id' => $cardId, 'new_price' => $newPrice]);
  exit;
}

  // Creazione nuova carta
  $required = ['name', 'price'];
  foreach ($required as $field) {
      if (empty($data[$field])) {
          http_response_code(400);
          echo json_encode(['error' => "Campo '$field' obbligatorio"]);
          exit;
      }
  }

    $name = $data['name'];
    $setName = $data['set_name'] ?? '';
    $condition = $data['condition'] ?? '';
    $price = (float) $data['price'];
    $rating = isset($data['rating']) ? (int) $data['rating'] : 0;
    $description = $data['description'] ?? '';
    $imageUrl = $data['image_url'] ?? null;

    if ($price < 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Prezzo non valido']);
        exit;
    }

    $stmt = $pdo->prepare('INSERT INTO cards (seller_id, name, set_name, condition, price, description, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([$user['sub'], $name, $setName, $condition, $price, $description, $imageUrl]);
    $newCardId = $pdo->lastInsertId();

    echo json_encode([
        'message' => 'Carta messa in vendita con successo',
        'card_id' => $newCardId
    ]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Metodo non consentito']);
}
