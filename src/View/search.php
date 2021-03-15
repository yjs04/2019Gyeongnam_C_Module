<!-- content-->
<div id="content">
    <!-- h2 : search word -->
    <h2 id="search_word">검색페이지</h2>
    <!-- search content -->
    <div id="search_content">
        <div id="search_result_music_box">
            <p class="search_box_title">음악</p>
            <div class="search_result" id="search_music_result">
                
            </div>
        </div>
        <?php if(isset($_SESSION['user'])):?>
        <div id="search_result_playlist_box">
            <p class="search_box_title">플레이리스트</p>
            <div class="search_result" id="search_list_result">
            </div>
        </div>
        <?php endif;?>
    </div>
</div>
<!-- endcontent-->