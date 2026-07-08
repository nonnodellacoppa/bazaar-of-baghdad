<?php
require_once __DIR__ . '/../config.php';
header('Content-Type: application/json');
$pdo = getDB();

// Recupera ultimi acquisti
$stmt = $pdo->prepare('
  SELECT t.id, t.price, t.purchase_date,
    c.name AS card_name, c.image_url,
    buyer.username AS buyer_username,
    seller.username AS seller_username
  FROM transactions t
  JOIN cards c ON t.card_id = c.id
  JOIN users buyer ON t.buyer_id = buyer.id
  JOIN users seller ON c.seller_id = seller.id
  ORDER BY t.purchase_date DESC
  LIMIT 20
');
$stmt->execute();
$purchases = $stmt->fetchAll();

echo json_encode([
    'message' => 'benvenuto nel Bazaar di Baghdad',
    'purchases' => $purchases
]);
