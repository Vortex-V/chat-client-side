<?php
/**
 * @var array $config
 * @var array $session
 */

// TODO временно, должно передаваться в widget
$config = $config ?? [
        'css' => [
            'position' => 'fixed',
        ],
        'onLoad' => [
            [
                'function' => 'setDraggable',
            ],
            [
                'function' => 'toggleOpen',
                'args' => false,
            ],
            [
                'function' => 'test',
            ],
        ]
    ];
$session = $session ?? [
        'userId' => 2,
        'roomId' => 1,
        'displayName' => 'Guest',
    ]
?>
<div id="chat" class="main d-flex flex-column"
     data-config='<?= json_encode($config) ?>'
     data-session='<?= json_encode($session) ?>'>
    <div id="chat-top-panel" class="d-flex justify-content-center align-content-center">
        <div class="chat-svg chat-arrow-svg"></div>
    </div>
    <div class="chat-message-input-region d-flex">
        <div class="d-flex justify-content-center">
            <div class="chat-svg chat-plus-svg"></div>
        </div>
        <div class="message-input-parent d-flex justify-content-center position-relative mx-2 flex-fill">
            <textarea id="chat-message-textarea" placeholder="Ваше сообщение..."></textarea>
            <div id="chat-textarea-height" class="position-absolute formatted-message-text">
                <div></div>
            </div>
        </div>
        <div class="d-flex justify-content-center">
            <div id="chat-send-message" class="chat-svg chat-send-message-svg"></div>
        </div>
    </div>
    <div class="d-flex p-2 position-relative scrollable">
        <div id="chat-messages-list" class="list d-flex flex-column align-content-center w-100">
            <div class="chat-message justify-content-end d-flex"><!--FROM ME-->
                <div class="message-left-col"></div>
                <div class="d-flex flex-column flex-fill mx-1 message-center-col">
                    <div class="d-flex flex-wrap message-head"></div>
                    <div class="mt-1 message-body formatted-message-text">
                        <div>К дождю.</div>
                    </div>
                </div>
                <div class="d-flex flex-column justify-content-between message-right-col">
                    <div class="my-message">Я</div>
                    <div class="d-flex align-self-end message-timestamp">9:01</div>
                </div>
            </div>
            <div class="chat-message system-message text-center"><!--SYSTEM-->
                Товарищ Соловьёв Илья проснулся!
            </div>
            <div class="chat-message d-flex"><!--DEFAULT & MENTION-->
                <div class="message-left-col">
                    <img src="../assets/files/users_default_avatars/User%20avatar.png" alt="User">
                </div>
                <div class="d-flex flex-column flex-fill mx-1 message-center-col">
                    <div class="d-flex flex-wrap message-head">
                        Товарищ Николай
                        <div class="text-end w-100">
                            ответ <span class="message-mention">@Товарищ Виталий</span>
                        </div>
                    </div>
                    <div class="mt-1 message-body formatted-message-text">
                        <div>
                            Благодарю Вас, коллега. Рад, что работаю с такими Людьми!
                        </div>
                    </div>
                </div>
                <div class="d-flex flex-column message-right-col">
                    <div class="d-flex align-self-end message-timestamp">9:00</div>
                </div>
            </div>
            <div class="chat-message justify-content-end d-flex"><!--FROM ME & FILE-->
                <div class="message-left-col"></div>
                <div class="d-flex flex-column flex-fill mx-1 message-center-col">
                    <div class="d-flex flex-wrap message-head"></div>
                    <div class="message-attached-file">
                        file_2 | Совершенно секретно
                    </div>
                    <div class="mt-1 message-body formatted-message-text">
                        <div>Товарищ, прикрепляю файл, содержащий важную для повестки дня информацию.
                        </div>
                    </div>
                </div>
                <div class="d-flex flex-column justify-content-between message-right-col">
                    <div class="my-message">Я</div>
                    <div class="d-flex align-self-end message-timestamp">9:01</div>
                </div>
            </div>
            <div class="chat-message justify-content-end d-flex"><!--FROM ME-->
                <div class="message-left-col"></div>
                <div class="d-flex flex-column flex-fill mx-1 message-center-col">
                    <div class="d-flex flex-wrap message-head"></div>
                    <div class="mt-1 message-body formatted-message-text">
                        <div>Доброе утро, товарищ! Сегодня и вправду отличный день, чтобы Lorem ipsum dolor, sit
                            amet
                            consectetur adipisicing
                            elit. Dolorem reiciendis neque corporis dicta, odio natus necessitatibus eaque ipsam
                            nesciunt et esse modi
                            consequatur eligendi illo, voluptas velit ullam ipsa molestias.
                        </div>
                    </div>
                </div>
                <div class="d-flex flex-column justify-content-between message-right-col">
                    <div class="my-message d-flex justify-content-center align-items-center">Я</div>
                    <div class="d-flex align-self-end message-timestamp">9:01</div>
                </div>
            </div>
            <div class="chat-message d-flex"><!--DEFAULT-->
                <div class="message-left-col">
                    <img src="../assets/files/users_default_avatars/User%20avatar.png" alt="User">
                </div>
                <div class="d-flex flex-column flex-fill mx-1 message-center-col">
                    <div class="d-flex flex-wrap message-head">
                        Товарищ Николай
                    </div>
                    <div class="mt-1 message-body formatted-message-text">
                        <div>
                            Доброе утро, товарищи! Сегодя отличный день, чтобы Lorem ipsum dolor, sit amet
                            consectetur
                            adipisicing
                            elit. Dolorem reiciendis neque corporis dicta, odio natus necessitatibus eaque ipsam
                            nesciunt et
                            esse modi
                            consequatur eligendi illo, voluptas velit ullam ipsa molestias.
                        </div>
                    </div>
                </div>
                <div class="d-flex flex-column message-right-col">
                    <div class="message-timestamp">9:00</div>
                </div>
            </div>
        </div>
        <ul id="chat-message-contextmenu" class="menu py-2 px-0 m-0 position-absolute" style="display: none">
            <li class="py-2 px-4">Ответить</li>
            <li class="py-2 px-4">Ответить пользователю</li>
            <li class="py-2 px-4">Переслать</li>
        </ul>
    </div>
</div>
