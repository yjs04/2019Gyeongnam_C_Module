<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>부산 국제 뮤직 페스티벌</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="fontAwesome/css/font-awesome.min.css">
    <script src="js/jquery-3.3.1.js"></script>
    <script src="js/script.js"></script>
</head>
<body>
    <div id="back"></div>
    <div id="wrap">
        <input type="checkbox" id="login_check">
        <div id="login_box">
            <h2 id="login_title">Login</h2>
            <label for="login_check" id="login_out"></label>
            <div id="login_form">
                <div class="login_area">
                    <label for="login_id">ID</label>
                    <input type="text" class="login_input" id="login_id" placeholder="ID를 입력해주세요">
                </div>
                <div class="login_area">
                    <label for="login_password">Password</label>
                    <input type="password" class="login_input" id="login_password" placeholder="Password를 입력해주세요">
                </div>
                <button id="login_button">Login</button>
            </div>
        </div>
        <header>
            <div id="logo"><a data-href="index.html" class="link"><img src="image/logo.jpg" height="100px" alt="Logo"></a></div>
            <nav>
                <a class="nav_ul link" id="nav_home" data-href="index">Home</a>
                <a class="nav_ul link" id="nav_library" data-href="library">Library</a>
                <a class="nav_ul link" id="nav_queue" data-href="queue">Queue</a>
                <?php if(isset($_SESSION['user'])):?>
                <label class="nav_ul" id="logout">Logout</label>
                <?php else:?>
                <label class="nav_ul" for="login_check" id="login">Login</label>
                <?php endif;?>
            </nav>
            <form id="search">
                <input type="text" id="search_input" placeholder="검색할 단어를 입력해주세요" autocomplete="off">
                <button id="search_button"><i class="fa fa-search" id="search_icon"></i></button>
            </form>
        </header>