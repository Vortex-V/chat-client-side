<?php

namespace vortex_v\chat_widget;

use Error;

class Chat
{
    /**
     * [
     *  'userId' => 1,
     *  'roomId' => 1
     * ]
     * @var array
     */
    public $session;

    /**
     * @var string
     */
    public $apiUrl;

    /**
     * @var int
     */
    public $getMessagesLimit;

    /**
     * @var array|int
     */
    public $updateMessages;
    const UPDATE_MANUALLY = 'manually'; // default
    const UPDATE_AUTOMATICALLY = 'automatically';

    /**
     * Например
     * [
     *  'position' => 'fixed'
     * ]
     * @var array
     */
    public $css;

    /**
     * @var bool
     */
    public $draggable;

    /**
     * @var bool
     */
    public $foldable;

    /**
     * При выполнении JS запишет объект чата в window
     * @var bool
     */
    public $dev;

    public static function varsForConfig(): array
    {
        return [
            'dev',
            'headers', // TODO
            'getMessagesLimit',
            'updateMessages',
            'css',
            'draggable',
            'foldable',
        ];
    }

    public function __construct($config)
    {
        if (isset($config['apiUrl']) && isset($config['session'])){
            $this->apiUrl = $config['apiUrl'];
            $this->session = $config['session'];
        } else {
            throw new Error('Параметры apiUrl и session обязательны', 500);
        }
        if (isset($config['config'])) {
            $vars = self::varsForConfig();
            foreach ($config['config'] as $item => $value) {
                if (is_int(array_search($item, $vars))) {
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
            'apiUrl' => $this->apiUrl,
        ];
        foreach (self::varsForConfig() as $var) {
            if (isset($this->$var)) {
                $params['config'][$var] = $this->$var;
            }
        }
        return $params;
    }

    public static function widget($config)
    {
        ob_start();
        //ob_implicit_flush(false);
        extract((new static($config))->getParams());
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