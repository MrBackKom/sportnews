var request = require("request");
var rssSite = require("../rssSite");
var FeedParser = require("feedparser");
var posts = new Array();

var channel = rssSite.channel;

var count = 0;
var fetch = function(feedurl,typeId,expressres){

    console.log('开始请求URL:' + feedurl);
	var req = request(feedurl, {timeout: 10000, pool: false});	
	req.setHeader('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36').setHeader('accept', 'text/html,application/xhtml+xml');
	var feedParser = new FeedParser();

	req.on('error', done);
	req.on("response",function(res){
        console.log("响应开始" + count);
		var stream = this;
		var iconv,
			charset;			
		if(res.statusCode != 200) {
			return this.emit("error",new Error("Bad status code"));
		}

		var contentType = res.headers['content-type'] || '';
		if(contentType.split("charset=").length > 0){
			charset = contentType.split("charset=")[1];
		}else{
			charset = "";
		}
		
		if(!iconv && charset && !/utf-*8/i.test(charset)){
			try {
                iconv = new Iconv(charset, 'utf-8');
                iconv.on('error', done);
                stream = this.pipe(iconv);
            } catch(err) {
                this.emit('error', err);
            }
		}	
		stream.pipe(feedParser)
	});
	feedParser.on('error', done);
    feedParser.on('end', function(err){
        console.log("转换结束"+count);
        count ++;
        expressres.json(posts);
    });
    feedParser.on('readable', function() {
        console.log("转换可读"+count);
        var post;
        while (post = this.read()) {            
            posts.push(post);                          
        }; 
    });
}

function transToPost(post){
    var mPost = new Object({
        title : post.title,
        link : post.link,
        description : post.description,
        pubDate : post.pubDate,
        source : post.source,
        author : post.author,
        typeId : typeId
    });
    return mPost;
}

function done(err){	
	console.log(err)
}

exports.fetchlatestnews = function(expressreq,expressres){  
  var channels = rssSite.channel;  
  channels.forEach(function(e,i){
	    if(e.work != false){
	        fetch(e.link,e.typeId,expressres);
	    }
  });
  
};