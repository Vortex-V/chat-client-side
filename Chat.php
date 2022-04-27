<?php

namespace vortex_v\chat_widget;

class Chat
{
    use ChatConfig;

    public function __construct($config = null)
    {
        if (isset($config)) {
            $vars = get_class_vars(self::class);
            foreach ($config as $item => $value) {
                if (array_key_exists($item, $vars)) {
                    $this->$item = $value;
                }
            }
        }
    }

    /**
     * @return string
     */
    public function __toString()
    {
        return json_encode($this->getParams());
    }

    public static function widget($config = null)
    {
        $chat = (new static($config ?? null))->getParams();
        ob_start();
        //ob_implicit_flush(false);
        extract($chat);
        require 'views/index.php';
        return ob_get_clean();
    }

    /**
     * На случай если проект очень неудобно лежит в vendor :)
     * @return string
     */
    public static function getPath(): string
    {
        return __DIR__;
    }
}