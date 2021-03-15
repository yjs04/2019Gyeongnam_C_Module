<?php

namespace Base\Controller;

use Base\App\{DB,Lib};

class PlaylistController{

    // playlistget
    function playlistget(){
        $result = false;
        if(isset($_SESSION['user'])){
            $sql = "SELECT * FROM playlists WHERE maker = ?";
            $result = DB::fetchAll($sql,[$_SESSION['user']->user_id]);
            foreach($result as $key => $v){
                $v->list = explode(",",$v->list);
            }
        }
        echo json_encode($result);
    }

    // playlistadd
    function playlistAdd(){
        header("Content-Type","application/json");
        extract($_POST);
        $result = false;
        if(isset($_SESSION['user'])){
            $sql = "INSERT INTO playlists(`maker`,`list`,`name`) VALUES(?,?,?)";
            $result = DB::query($sql,[$_SESSION['user']->user_id,$list,$name]);
        }
        echo json_encode($result);
    }

    // playlistupdate
    function playlistUpdate(){
        header("Content-Type","application/json");
        extract($_POST);
        $result = false;
        if(isset($_SESSION['user'])){
            $check = DB::fetch("SELECT * FROM playlists WHERE id = ?",[$id]);
            if($check !== false) $result = DB::query("UPDATE `playlists` SET `list` = ? WHERE id = ?",[$list,$id]);
        }
        echo json_encode($result);
    }

    // playlistremove
    function playlistRemove(){
        header("Content-Type","application/json");
        extract($_POST);
        $result = false;
        if(isset($_SESSION['user'])){
            $check = DB::fetch("SELECT * FROM playlists WHERE id = ?",[$id]);
            if($check !== false) $result = DB::query("DELETE FROM playlists WHERE id = ?",[$id]);
        }
        echo json_encode($result);
    }
}