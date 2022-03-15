<?php
require_once __DIR__ . '/vendor/' . 'autoload.php';
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat</title>
    <link rel="stylesheet" href="/assets/css/bootstrap-reboot.min.css">
    <link rel="stylesheet" href="/assets/css/bootstrap-utilities.min.css">
    <link rel="stylesheet" href="/assets/css/style.css">
</head>

<body>
<?php
require 'views/index.php';
?>
<script src="https://code.jquery.com/jquery-3.6.0.min.js"
        integrity="sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4=" crossorigin="anonymous"></script>
<script src="https://code.jquery.com/ui/1.12.1/jquery-ui.min.js"></script>
<script src="/assets/js/javascript.js"></script>
</body>

</html>