<?php

namespace vortex_v\chat_widget;

trait ChatConfig
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

    /**
     * Например
     * [
     *  'position' => 'fixed'
     * ]
     * @var array
     */
    public array $css;

    public bool $draggable;

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
        ];
    }

    public function getParams(): array
    {
        $params = [
            'config' => [],
            'session' => $this->session,
        ];
        foreach (self::varsForConfig() as $var){
            if ($this->$var){
                $params['config'][$var] = $this->$var;
            }
        }
        return $params;
    }
}