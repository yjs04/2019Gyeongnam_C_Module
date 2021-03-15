<?php

namespace Base\Controller;

use Base\App\{DB,Lib};

class MainController{
    function indexPage(){Lib::view("index");}
    function libraryPage(){Lib::view("library");}
    function queuePage(){Lib::view("queue");}
    function playlistPage(){Lib::view("playlist");}
    function searchPage(){Lib::view("search");}

    function dbset(){
        header("Content-Type","application/json");
        extract($_POST);
        $t = ["musics","users","playlists"];
        $datas = [
            ["idx","name","release","albumName","albumImage","artist","url","lyrics","genre","duration"],
            ["id","password"],
            ["maker","list","name"]
        ];
        $sqls = [
            "INSERT INTO musics(`idx`,`name`,`ReleaseM`,`albumName`,`albumImage`,`artist`,`url`,`lyrics`,`genre`,`duration`) VALUES(?,?,?,?,?,?,?,?,?,?)",
            "INSERT INTO users(`user_id`,`password`,`salt`) VALUES(?,?,?)",
            "INSERT INTO playlists(`maker`,`list`,`name`) VALUES(?,?,?)"
        ];
        $sql = "SELECT * FROM ".$t[$status];
        $result = DB::fetchAll($sql);
        if ($result == []){
            foreach($data as $k => $v){
                $values = [];
                foreach($datas[$status] as $key => $value){
                    $text = "";
                    if($status == 0 && $key == 0){
                        $values[] = (int)$v[$value];
                    }else if($status == 1 && $key == 1){
                        $salt = Lib::randstring(50);
                        $pass = hash("SHA256",$v[$value].$salt);
                        $values[] = $pass;
                        $values[] = $salt;
                    }else if($status == 2 && $key == 1){
                        foreach($v[$value] as $keyword => $w){$text = $text.",".$w;}
                        $text = substr($text,1,strlen($text));
                        $values[] = $text;
                    }else $values[] = $v[$value];
                }
                $result = DB::query($sqls[$status],$values);
            }
        }
        echo json_encode($result);
    }

    // musicget
    function musicget(){
        $sql = "SELECT * FROM musics";
        $result = DB::fetchAll($sql);
        echo json_encode($result);
    }

    // login
    function login(){
        header("Content-Type","application/json");
        extract($_POST);
        $result = false;
        if(!isset($_SESSION['user'])){
            $salt = DB::fetch("SELECT salt FROM users WHERE `user_id` = ?",[$id]);
            if($salt) $salt = $salt->salt;
            $password = hash("SHA256",$password.$salt);
            $sql = "SELECT * FROM users WHERE `user_id` = ? AND `password` = ?";
            $result = DB::fetch($sql,[$id,$password]);
            if($result !== false) $_SESSION['user'] = $result;
        }
        echo json_encode($result);
    }

    // logout
    function logout(){
        $result = false;
        if(isset($_SESSION['user'])){
            unset($_SESSION['user']);
            $result = true;
        }
        echo json_encode($result);
    }

    // search process
    function searchmusicProcess(){
        header("Content-Type","application/json");
        extract($_GET);
        $sql = "SELECT * FROM `musics` WHERE `name` LIKE '%$search_word%' OR `artist` LIKE '%$search_word%' ";
        $result = DB::fetchAll($sql);
        echo json_encode($result);
    }

    // search word
    function searchWord(){
        $result =DB::fetchAll("SELECT `search_word` FROM `search`");
        echo json_encode($result);
    }

    // search input
    function searchwordIn(){
        extract($_GET);
        $list = DB::fetchAll("SELECT `id` FROM `search`");
        if(count($list) >= 5){
            $result = $list[0]->id;
            DB::query("DELETE FROM search WHERE id = ?",[$result]);
        }
        DB::query("INSERT INTO search(`search_word`) VALUE(?)",[$search_word]);

        echo json_encode($result);
    }
}