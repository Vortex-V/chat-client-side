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

    public string $apiUrl;

    const UPDATE_MANUALLY = 0;
    const UPDATE_AUTOMATICALLY = 1;
    public int $update;

    /**
     * Например
     * [
     *  'position' => 'fixed'
     * ]
     * @var array
     */
    public array $css;

    public bool $draggable;

    public bool $foldable;

    /**
     * При выполнении JS запишет объект чата в window
     * @var bool
     */
    public bool $dev;

    public static function varsForConfig(): array
    {
        return [
            'dev',
            'apiUrl',
            'css',
            'draggable',
            'foldable',
        ];
    }

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

    public function getParams(): array
    {
        $params = [
            'config' => [],
            'session' => $this->session,
        ];
        foreach (self::varsForConfig() as $var) {
            if (isset($this->$var)) {
                $params['config'][$var] = $this->$var;
            }
        }
        return $params;
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