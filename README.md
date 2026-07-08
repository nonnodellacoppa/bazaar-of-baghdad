# Bazaar of Baghdad
il programma è un sito di compravendita per carte di Magic the Gathering, con client e server separati e scambio di messaggi tramite JWT. Come database è stato scelto SQLite per la sua semplicità di configurazione. Il sito non serve direttamente le immagini delle carte, utilizzando invece link opzionali a scryfall per risparmiare memoria su disco. Un file php fa da router, rispondendo direttamente a richieste di file statici e instradando le richieste nel formato /api/pagina al file corrispondente, che invierà una risposta sotto forma di JSON Web Token. La pratica di cybersicurezza standard di salvare gli hash delle password piuttosto che le stesse è stata applicata al progetto, le password degli utenti già create sono scritte di seguito

## Prerequisiti
**PHP** : stable 8.5.7
    - pdo_sqlite
    - openssl
**Composer** : 2.10.2

## Installazione e avvio
Prima del primo avvio del server va eseguito il comando
```
composer install
```
Per far partire il server:
```
php -S localhost:8000 -t public router.php
```

Il database è già popolato, gli utenti carlo, caterina, giacomino, andrea e francesco hanno tutti la medesima password: password123, userprova ha come password userprova 
