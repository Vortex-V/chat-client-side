<?php

namespace vortex_v\chat_widget;

class Chat
{
    /**
     * [
     *  'userId' => 1,
     *  'roomId' => 1
     * ]
     * @var array
     */
    public array $session;

    /**
     * Например
     * [
     *  'position' => 'fixed'
     * ]
     * @var array
     */
    public array $css;

    public bool $draggable;

    public bool $dev;

    public function __construct($config = null)
    {
        if (isset($config)) {
            $vars = get_class_vars(self::class);
            foreach ($config as $item => $value) {
                $bool = array_key_exists($item, $vars);
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
        return json_encode($this);
    }

    /**
     * @return array
     */
    public function toArray(): array
    {
        $config = get_object_vars($this);
        $session = $config['session'];
        unset($config['session']);
        return compact('config', 'session');
    }


    public static function widget($config = null)
    {
        $chat = (new self($config ?? null))->toArray();
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