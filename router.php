<?php
//faccio il parsing della richiesta
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

/* Instrado le richieste nella forma ^/api/# verso i file .php corrispondenti
 * saranno poi questi file a generare una risposta .json, per cui il router
 * non invia file al client */
if (preg_match('#^/api/#', $uri)) {
    $file = __DIR__ . '/backend' . $uri . '.php';
    if (file_exists($file)) {
        require $file;
    } else {
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'API endpoint non trovato']);
    }
    return true;
}

//verifico il realpath per evitare attacchi di file traversal
$base = realpath($_SERVER['DOCUMENT_ROOT']);
$requested = realpath($base . '/' . ltrim($uri, '/'));
if ($requested === false || strpos($requested, $base) !== 0) {
    http_response_code(404);
    echo "File non trovato";
    return true;
}
//restituisco il file se esiste nella directory del server
if (is_file($requested)) {
    return false;
}

/* Se non ho ne' instradato verso un file .php differente, ne' restituito altri
 * file statici, restituisco index.html */
include $_SERVER['DOCUMENT_ROOT'] . '/index.html';
return true;
