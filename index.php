<?php

// Файл тестирования приложения

use vortex_v\chat_widget\Chat;

require_once __DIR__ . '/vendor/' . 'autoload.php';
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat</title>
    <link rel="stylesheet" href="/vendor/npm-asset/bootstrap/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="/assets/css/style.css">
    <link rel="shortcut icon" href="/assets/files/users_default_avatars/User%20avatar-2.svg" type="image/x-icon">
</head>

<body>
<?php
try {
    echo Chat::widget([
        'config' => [
            'css' => [
                'right' => 10,
                'bottom' => 10,
            ],
            'dev' => true,
            'draggable' => true,
            'loadMessagesLimit' => 1000
        ],
        'apiUrl' => 'http://api.chat.local',
        'session' => [
            'userId' => 2,
            'roomId' => 1,
        ]
    ]);
} catch (Throwable $e) {
    var_dump($e);
}
?>
<script src="/vendor/bower-asset/jquery/dist/jquery.min.js"></script>
<script src="/vendor/bower-asset/jquery-ui/jquery-ui.min.js"></script>
<script type="module" src="/assets/js/app.js"></script>
</body>

</html>