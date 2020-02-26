/**
 *  @file lastfmapi.js
 *  @brief Demonstration of using LastFM API for IceCast server. 
 *  Project home: https://github.com/vajayattila/lastFMApi.git
 *	@author Vajay Attila (vajay.attila@gmail.com)
 *  @copyright MIT License (MIT)
 *  @date 2020.02.22-2020.02.26
 *  @version 1.0.0.1
 */

lastFMApi={
    lastFMApiId: "YOUR LASTFM API ID",
    jsonStatsUrl: "https://YOUR ICECAST SERVER/status-json.xsl", // url to IceCast server's status service
    blankImgSrc: "./img/blank-cover.jpg",
    songInfoRefreshRate: 8000, // Intervall of checking data on IceCast server
    sourceIndex: 0, // index of mountpoint on IceCast server
    lastTrack: null,
    tracks: null,
    album: null,
    release: null,
    cover: null,
    img: null,
    enableCover:false,
    enableArtist:false,
    enableAlbum:false,
    enableRelease:false,
    enableTracks:false,
    setup: function(
        jsonStatsUrl, lastFMApiId, backgroundColor, blankImgSrc, enableCover, 
        enableArtist, enableAlbum, enableRelease, enableTracks
    ){
        lastFMApi.tracks=document.getElementById("tracks"); 
        lastFMApi.album=document.getElementById("album"); 
        lastFMApi.release=document.getElementById("release");
        lastFMApi.cover=document.getElementById("cover");
        lastFMApi.img=document.getElementById("img");
        lastFMApi.artist=document.getElementById("artist");
        lastFMApi.setJSONStatsUrl(jsonStatsUrl);        
        lastFMApi.setCoverEnable(enableCover);
        lastFMApi.setArtistEnable(enableArtist);
        lastFMApi.setAlbumEnable(enableAlbum);     
        lastFMApi.setTracksEnable(enableTracks);  
        lastFMApi.setReleaseEnable(enableRelease); 
        lastFMApi.setLastFMApiId(lastFMApiId);   
        lastFMApi.setBackgroundColor(backgroundColor); 
        lastFMApi.setBlankImgSrc(blankImgSrc);     
        lastFMApi.hideCover();
        lastFMApi.showCover();  
        lastFMApi.hideAlbum();
        lastFMApi.hideTracks();
        lastFMApi.hideRelease();                 
        var xmlhttp = new XMLHttpRequest();
        setInterval(function(){
            xmlhttp.open("GET", lastFMApi.jsonStatsUrl, true);
            xmlhttp.send();  
            xmlhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    var response = JSON.parse(this.responseText);
                    if(Array.isArray(response.icestats.source)){
                        title=response.icestats.source[lastFMApi.sourceIndex].title;
                    }else{
                        title=response.icestats.source.title;                
                    }                    
                    if(title!=lastFMApi.lastTrack){
                        lastFMApi.lastTrack=title;
                        lastFMApi.hideTracks();      
                        lastFMApi.hideArtist();                      
                        if(title.search("-")!=-1){
                            var artist=title.substring(0,title.search("-")).trim().replace("&", "and");
                            var track=title.substring(title.search("-")+1).trim().replace("&", "and");
                            lastFMApi.trackGetInfo(artist, track);
                        }else{
                            lastFMApi.blankCover();
                            lastFMApi.hideAlbum();
                            lastFMApi.hideRelease();                         
                        }
                    }
                }
            }
        },lastFMApi.songInfoRefreshRate);  
    },
    trackGetInfo: function(artist, track){      
        var command=
            "https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key="+
            lastFMApi.lastFMApiId+
            "&artist="+artist+
            "&track="+track+
            "&format=json";
        //debug.innerHTML=command;    
        lastFMApi.setArtist(artist);
        lastFMApi.showArtist();
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("GET", command, true);
        xmlhttp.send();
        xmlhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                //debug.innerHTML=this.responseText;
                var jsondata = JSON.parse(this.responseText);
                lastFMApi.blankCover();
                lastFMApi.hideAlbum();
                lastFMApi.hideRelease();            
                if(
                    jsondata["track"]!==undefined &&
                    jsondata["track"]["album"]!==undefined &&
                    jsondata["track"]["album"]["title"]!==undefined
                ){       
                    var albumtitle=jsondata["track"]["album"]["title"];
                    lastFMApi.setAlbumTilte(albumtitle);
                    var imgsrc=jsondata["track"]["album"]["image"][3]["#text"];
                    lastFMApi.setCover(imgsrc);
                    var mbid=jsondata["track"]["album"]["mbid"];
                    lastFMApi.albumGetInfo(mbid, track, artist, albumtitle);
                    if(imgsrc===undefined || imgsrc==="" || imgsrc===null){
                        lastFMApi.blankCover();                        
                    }
                    lastFMApi.showAlbum();                              
                }
            }    
        }
    },
    albumGetInfo: function(mbid, track, artist, albumtitle){                 
        var debug=document.getElementById("debug");           
        var command="";
        if(mbid!="" && mbid!=undefined){
            command=
                "https://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key="+
                lastFMApi.lastFMApiId+"&mbid="+mbid+"&format=json";
        }else{
            command=
                "https://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key="+
                lastFMApi.lastFMApiId+"&artist="+artist+"&album="+albumtitle+"&format=json";
        }
        var xmlhttp = new XMLHttpRequest();
        //debug.innerHTML=command;        
        xmlhttp.open("GET", command, true);
        xmlhttp.send();
        xmlhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                //debug.innerHTML=this.responseText;
                var jsondata = JSON.parse(this.responseText);
                if(
                    jsondata["album"]!==undefined &&
                    jsondata["album"]["releasedate"]!==undefined
                ){
                    lastFMApi.setRelease(jsondata["album"]["releasedate"]);
                    lastFMApi.showRelease();
                }else{
                    lastFMApi.hideRelease();
                }    
                if(
                    jsondata["album"]!==undefined &&
                    jsondata["album"]["tracks"]!==undefined 
                ){  
                    lastFMApi.tracks.innerHTML="";
                    for (let i = 0; i < jsondata["album"]["tracks"]["track"].length; i++) {
                        var name=jsondata["album"]["tracks"]["track"][i]["name"];
                        if(name.toUpperCase()==track.toUpperCase()){
                            lastFMApi.tracks.innerHTML=
                                lastFMApi.tracks.innerHTML+
                                '<div class="activetrack">'+name+"</div>";
                        }else{
                            lastFMApi.tracks.innerHTML=
                                lastFMApi.tracks.innerHTML+'<div class="track">'+name+"</div>";
                        }
                    }
                    lastFMApi.showTracks();
                }else{
                    lastFMApi.hideTracks();                 
                }        
            }
        }
    },
    hideTracks: function(){
        lastFMApi.tracks.style.display="none";  
    },
    showTracks: function(){
        if(lastFMApi.enableTracks){
            lastFMApi.tracks.style.display="block";
        }          
    },
    hideAlbum:function(){ 
        lastFMApi.album.style.display="none";
    },
    showAlbum:function(){ 
        if(lastFMApi.enableAlbum){
            lastFMApi.album.style.display="block";
        }        
    },
    hideRelease: function(){      
        lastFMApi.release.style.display="none"; 
    },
    showRelease: function(){   
        if(lastFMApi.enableRelease){
            lastFMApi.release.style.display="block"; 
        }
    },
    blankCover: function(){
        lastFMApi.img.src=lastFMApi.blankImgSrc;        
    },
    setCover: function(src){
        lastFMApi.img.src=src;    
    },
    setAlbumTilte: function(albumtitle){
        var album=document.getElementById("album"); 
        album.innerHTML=albumtitle;               
    },
    setRelease:function(release){
        lastFMApi.release.innerHTML=release;
    },
    hideCover:function(){
        lastFMApi.cover.style.display="none"; 
    },
    showCover:function(){
        if(lastFMApi.enableCover==true){
            lastFMApi.cover.style.display="block";
        }        
    },
    setCoverEnable:function(enable){
        lastFMApi.enableCover=enable;
    },
    setArtistEnable: function(enable){
        lastFMApi.enableArtist=enable;
    },
    hideArtist:function(){
        lastFMApi.artist.style.display="none";         
    },
    showArtist:function(){
        if(lastFMApi.enableArtist==true){
            lastFMApi.artist.style.display="block";         
        }
    },
    setArtist:function(artist){
        lastFMApi.artist.innerHTML=artist;
    },
    setAlbumEnable:function(enable){
        lastFMApi.enableAlbum=enable;
    },
    setTracksEnable:function(enable){
        lastFMApi.enableTracks=enable;
    },
    setReleaseEnable:function(enable){
        lastFMApi.enableRelease=enable;
    },
    setJSONStatsUrl:function(jsonStatsUrl){
        lastFMApi.jsonStatsUrl=jsonStatsUrl;
    },
    setLastFMApiId:function(lastFMApiId){
        lastFMApi.lastFMApiId=lastFMApiId;
    },
    setBackgroundColor:function(backgroundColor){
        var body=document.getElementsByTagName("BODY")[0]; 
        body.style.backgroundColor=backgroundColor;
    },
    setBlankImgSrc:function(blankImgSrc){
        if(blankImgSrc.toUpperCase()!="DEFAULT"){
            lastFMApi.blankImgSrc=blankImgSrc;
        }
    }

}