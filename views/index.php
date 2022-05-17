<?php
/**
 * @var array $config
 * @var array $session
 * @var string $apiUrl
 */
?>
<div id="chat"
    <?php
    if (isset($config['draggable']) && $config['draggable'] ||
        isset($config['foldable']) && $config['foldable']
    ) {
        echo 'class="closed"';
    }
    ?>
     data-config='<?= json_encode($config) ?>'
     data-session='<?= json_encode($session) ?>'
     data-api-url='<?= $apiUrl ?>'
     style="display: none">
    <div id="chat-top-panel" class="justify-content-center align-items-center" style="display: none">
        <svg width="12" height="4" viewBox="0 0 12 4" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L6 3L11 1" stroke="#1E591E" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    </div>
    <div id="chat-wrapper" class="d-flex flex-column position-relative">
        <div class="chat-message-input-region d-flex align-items-center px-2 py-1">
            <div class="d-flex align-items-center px-1">
                <div class="chat-svg chat-plus-svg"></div>
            </div>
            <div class="d-flex justify-content-center position-relative flex-fill">
                <textarea id="chat-message-textarea" placeholder="Ваше сообщение..."></textarea>
                <div id="chat-textarea-height" class="position-absolute formatted-message-text">
                    <div></div>
                </div>
            </div>
            <div id="chat-send-message" class="d-flex align-items-center px-1">
                <svg width="16" height="14" viewBox="0 0 16 14" fill="var(--gray)"
                     xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd"
                          d="M15.6935 7.41109C15.7843 7.37234 15.8618 7.30778 15.9163 7.22542C15.9707 7.14307 15.9999 7.04653 16 6.94779C16.0001 6.84904 15.9713 6.75242 15.917 6.66991C15.8628 6.58741 15.7855 6.52264 15.6948 6.48363L1.17383 0.23665L1.17312 0.235936L0.7225 0.041257C0.637113 0.00442461 0.543206 -0.0080889 0.451153 0.00509856C0.359099 0.018286 0.272483 0.0566614 0.20087 0.115985C0.129258 0.17531 0.0754368 0.253274 0.0453523 0.341266C0.0152677 0.429258 0.0100906 0.523853 0.0303926 0.614603L0.136741 1.09275L0.136025 1.09489L1.42421 6.92751L0.119805 12.7565L0.119801 12.7594L0.0121223 13.2372C-0.00810421 13.3278 -0.00294345 13.4222 0.0270363 13.5101C0.057016 13.5979 0.110653 13.6758 0.182042 13.7351C0.253431 13.7945 0.339804 13.8329 0.431655 13.8463C0.523506 13.8597 0.617273 13.8475 0.702634 13.8111L15.6935 7.41109ZM13.0374 7.44806L14.2145 6.9453L13.0388 6.43927L2.34594 6.4244L2.43314 6.81905C2.44919 6.89143 2.44909 6.96645 2.43284 7.03878L2.34454 7.43319L13.0374 7.44806Z"/>
                </svg>
            </div>
        </div>
        <div id="chat-message-additional" class="d-flex flex-column px-4" style="display: none">
            <div id="chat-message-additional-file" class="my-1" style="display: none"></div>
            <div id="chat-message-additional-reply" class="my-1" style="display: none"></div>
            <div id="chat-message-additional-mention" class="my-1" style="display: none"></div>
        </div>
        <div class="p-2 scrollable">
            <div id="chat-messages-list" class="d-flex flex-column align-content-center w-100">
           <!--     <div class="chat-message justify-content-end d-flex">
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
                </div>-->
            </div>
        </div>
        <div id="chat-users-list-side" class="position-absolute"></div>
    </div>
    <div id="chat-bottom-panel" class="d-flex justify-content-between align-items-center user-select-none p-2">
        <div id="chat-show-users-list" class="d-flex align-items-center px-1" title="Показать участников">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="var(--gray)"
                 style="display: none"
                 viewBox="-2 -2 20 20">
                <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="var(--gray)"
                 viewBox="0 0 16 16">
                <path d="M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-5 6s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H1zM11 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5zm.5 2.5a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1h-4zm2 3a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1h-2zm0 3a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1h-2z"/>
            </svg>
        </div>
        <div id="chat-update-messages" class="align-items-center px-1" style="display: none">
            <span class="small mr-1">Обновить</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="var(--gray)" viewBox="0 0 16 16">
                <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/>
                <path fill-rule="evenodd"
                      d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/>
            </svg>
        </div>
    </div>
    <ul id="chat-contextmenu" class="chat-context-menu py-2 px-0 m-0 position-fixed" style="display: none"></ul>
</div>