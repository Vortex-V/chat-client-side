# Chat widget

## Подключение к проекту
```sh
composer require vortex-v/chat-client-side;
```

## Вызов
```php
echo vortex_v\chat_widget\Chat:widget();
```

## Конфигурация
Функция widget() принимает параметр `$config` - ассоциативный массив со свойствами:

- `apiUrl` - `string`, адрес, на котором размещено  [API](https://github.com/Vortex-V/chat-api);
- `session` - `array`, параметры сесии (userId и roomId)
- `css` - `array||null`, список свойств;
- `draggable` - `bool||null`;
- `foldable` - `bool||null`;

> `apiUrl` и `session` обязательны

Примерное представление:
```php
$config = [
     'css' => [
                'right' => 10,
                'bottom' => 10,
                'width' => 330
            ],
    'apiUrl' => 'https://api.chat',
    'draggable' => true||false,
    'session' => [
        'userId' => $_SESSION['chat_user_id'],
        'roomId' => $room->id,
    ]
];
```

## Лицензия

MIT
