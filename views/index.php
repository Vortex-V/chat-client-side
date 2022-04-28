<?php
/**
 * @var array $config
 * @var array $session
 */
?>
<div id="chat" class="flex-column <?php if ($config['draggable'] || $config['foldable']) echo 'closed'; ?>"
     data-config='<?= json_encode($config) ?>'
     data-session='<?= json_encode($session) ?>'
     style="display: none">
    <div id="chat-top-panel" class="justify-content-center align-content-center" style="display: none">
        <div class="chat-svg chat-arrow-svg"></div>
    </div>
    <div class="chat-message-input-region d-flex">
        <div class="d-flex justify-content-center">
            <div class="chat-svg chat-plus-svg"></div>
        </div>
        <div class="d-flex justify-content-center position-relative mx-2 flex-fill">
            <textarea id="chat-message-textarea" placeholder="Ваше сообщение..."></textarea>
            <div id="chat-textarea-height" class="position-absolute formatted-message-text">
                <div></div>
            </div>
        </div>
        <div class="d-flex justify-content-center">
            <div id="chat-send-message" class="chat-svg chat-send-message-svg"></div>
        </div>
    </div>
    <div id="chat-message-additional" class="d-flex flex-column px-4" style="display: none">
        <div id="chat-message-additional-file" class="my-1" style="display: none"></div>
        <div id="chat-message-additional-reply" class="my-1" style="display: none"></div>
        <div id="chat-message-additional-mention" class="my-1" style="display: none"></div>
    </div>
    <div class="d-flex p-2 scrollable">
        <div id="chat-messages-list" class="list d-flex flex-column align-content-center w-100">
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
        </div>
        <ul id="chat-message-contextmenu" class="menu py-2 px-0 m-0 position-fixed" style="display: none">
            <li id="chat-message-reply" class="py-2 px-4">Ответить</li>
        </ul>
    </div>
</div>
