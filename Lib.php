<?php

namespace Base\App;

class Lib{
    function view($view_path,$data=[]){
        extract($data);
        $view_path = SRC."View/$view_path.php";
        include_once SRC."View/base/header.php";
        include_once $view_path;
        include_once SRC."View/base/footer.php";
    }

    function randstring($strlen){
        do{
            $str = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890";
            $result = "";
            for($i = 0; $i<$strlen;$i++) $result .= $str[rand(0,strlen($str)-1)];
            $sql = "SELECT salt FROM users WHERE salt = ?";
            $check = DB::fetch($sql,[$str]);
        }while($check);
        return $result;
    }

}