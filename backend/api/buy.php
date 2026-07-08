<?php
require_once __DIR__ . '/../config.php';
header('Content-Type: application/json');
$pdo = getDB();

// Richiede autenticazione per qualsiasi operazione
$user = authenticate();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
  // Visualizzazione carte disponibili all'acquisto
  $stmt = $pdo->prepare('
    SELECT c.id, c.name, c.set_name, c.condition, c.price, c.description, c.image_url, c.status, u.username AS seller_username
    FROM cards c
    JOIN users u ON c.seller_id = u.id
    WHERE c.status = ?
    ORDER BY c.id DESC
  ');
  $stmt->execute(['available']);
  $cards = $stmt->fetchAll();

  echo json_encode(['cards' => $cards]);
}

elseif ($method === 'POST') {
    // Acquisto di una carta
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data || empty($data['card_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID carta mancante']);
        exit;
    }

    $cardId = (int) $data['card_id'];
    $buyerId = $user['sub']; // dall'autenticazione

    try {
        $pdo->beginTransaction();

        // Legge la carta con blocco (SQLite: la transazione serializza l'accesso)
        $stmt = $pdo->prepare('SELECT * FROM cards WHERE id = ?');
        $stmt->execute([$cardId]);
        $card = $stmt->fetch();

        if (!$card) {
            $pdo->rollBack();
            http_response_code(404);
            echo json_encode(['error' => 'Carta non trovata']);
            exit;
        }

        if ($card['status'] !== 'available') {
            $pdo->rollBack();
            http_response_code(409);
            echo json_encode(['error' => 'Carta non più disponibile']);
            exit;
        }

        // Impedisci al venditore di comprare la propria carta
        if ($card['seller_id'] == $buyerId) {
            $pdo->rollBack();
            http_response_code(403);
            echo json_encode(['error' => 'Non puoi acquistare la tua stessa carta']);
            exit;
        }

        // Legge il saldo del compratore
        $stmt = $pdo->prepare('SELECT balance FROM users WHERE id = ?');
        $stmt->execute([$buyerId]);
        $buyer = $stmt->fetch();

        if ($buyer['balance'] < $card['price']) {
            $pdo->rollBack();
            http_response_code(402);
            echo json_encode(['error' => 'Saldo insufficiente']);
            exit;
        }

        // Trasferimento fondi
        $stmt = $pdo->prepare('UPDATE users SET balance = balance - ? WHERE id = ?');
        $stmt->execute([$card['price'], $buyerId]);

        $stmt = $pdo->prepare('UPDATE users SET balance = balance + ? WHERE id = ?');
        $stmt->execute([$card['price'], $card['seller_id']]);

        // Aggiorna stato carta
        $stmt = $pdo->prepare("UPDATE cards SET status = 'sold' WHERE id = ?");
        $stmt->execute([$cardId]);

        // Registra la transazione
        $stmt = $pdo->prepare('INSERT INTO transactions (buyer_id, card_id, price) VALUES (?, ?, ?)');
        $stmt->execute([$buyerId, $cardId, $card['price']]);

        $pdo->commit();

        // Recupera il nuovo saldo del compratore per aggiornare il frontend
        $stmt = $pdo->prepare('SELECT balance FROM users WHERE id = ?');
        $stmt->execute([$buyerId]);
        $newBalance = $stmt->fetchColumn();

        echo json_encode([
            'message' => 'Acquisto completato con successo',
            'new_balance' => $newBalance
        ]);

    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Errore durante l\'acquisto']);
    }

}
 else {
    http_response_code(405);
    echo json_encode(['error' => 'Metodo non consentito']);
}
