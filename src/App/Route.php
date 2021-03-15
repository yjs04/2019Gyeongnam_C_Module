<?php

namespace Base\App;

class Route{
    private static $action = [];
    public static function route(){
        $path = explode("?",$_SERVER['REQUEST_URI'])[0];
        foreach(self::$action as $act){
            $url = preg_replace("/\//","\/",$act[0]);
            $url = preg_replace("/\{([^{}]+)\}/","([^\/]+)",$url);
            if(preg_match("/^{$url}$/",$path,$result)){
                unset($result[0]);
                $urlAction = explode("@",$act[1]);
                $controllerClass = "\\Base\\Controller\\{$urlAction[0]}";
                $controller = new $controllerClass();
                $controller->{$urlAction[1]}(...$result);
                return;
            }
        }
        echo "404 NOTFOUND";
    }

    public static function __callStatic($name,$args){
        $method = strtolower($_SERVER['REQUEST_METHOD']);
        if($method == $name) self::$action[] = $args;
    }
}