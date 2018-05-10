/**
 * http://usejsdoc.org/
 */
var express = require('express');
var router = express.Router();
var fs = require('fs');
var multer = require('multer');


var formidable = require('formidable');
var dir = require('node-dir');
var mysql = require("./model/mysql");

var multiparty = require('connect-multiparty');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');


var passport = require('passport');

//시간 설정
function getWorldTime(tzOffset) { // 24시간제
	  var now = new Date();
	  var tz = now.getTime() + (now.getTimezoneOffset() * 60000) + (tzOffset * 3600000);
	  now.setTime(tz);


	  var s =
	    leadingZeros(now.getFullYear(), 4) + '-' +
	    leadingZeros(now.getMonth() + 1, 2) + '-' +
	    leadingZeros(now.getDate(), 2) + ' ' +

	    leadingZeros(now.getHours(), 2) + ':' +
	    leadingZeros(now.getMinutes(), 2)// + ':' +
	    //leadingZeros(now.getSeconds(), 2);

	  return s;
}

function leadingZeros(n, digits) {
	  var zero = '';
	  n = n.toString();

	  if (n.length < digits) {
	    for (i = 0; i < digits - n.length; i++)
	      zero += '0';
	  }
	  return zero + n;
	}


/* GET home page. */
router.get('/', function(req, res, next) {
	
	var CP = 0;
	console.log(req.cookies);
	if(req.cookies.auth){
		res.redirect('/adm/index');
	}else{
		res.render('admin/admin', {CP:CP});
	}
});

router.post('/login', passport.authenticate('local', { failureRedirect: '/adm', failureFlash: true }), function(req, res, next) {
	var CP = 0;
	res.redirect('/adm/index');
});


router.get('/contents', ensureAuthenticated, function(req, res, next) {
	var CP = 1;
		mysql.select('select * from bobbyDB.contents order by con_no desc', function (err, data){
			 res.render('admin/contents/contents', { CP : CP, contents : data });	    	
		});
});

router.get('/index', ensureAuthenticated, function(req, res, next) {
	var CP = 0;
		mysql.select('SELECT * from bobbyDB.contents where con_pop = 1 order by con_release desc;', function (err, data){
			 res.render('admin/admin_index', { CP : CP, contents : data });
		});
});


router.get('/contents/insert', function(req, res, next) {
	
	var CP = 1;
	var cate;
	var user;
	mysql.select('select * from bobbyDB.con_cate', function (err, data){
		if(err){
			res.redirect('back');
		}
		
		cate = data;
		
		mysql.select('select * from bobbyDB.user where user_level="2"', function (err, data2){
			if(err){
				res.redirect('back');
			}
			user = data2;

			res.render('admin/contents/insert', {cate : cate, user : user, CP : CP});
			});
		});
    });

router.get('/contents/insertMore', function(req, res, next) {
	
	var CP = 1;
	var cate;
	var user;
	mysql.select('SELECT * FROM bobbyDB.contents where con_category = 7 order by con_no desc', function (err, data){
		if(err){
			res.redirect('back');
		}
		
		cate = data;
		
		mysql.select('select * from bobbyDB.user where user_level="2"', function (err, data2){
			if(err){
				res.redirect('back');
			}
			user = data2;

			res.render('admin/contents/insertMore', {cate : cate, user : user, CP : CP});
			});
		});
    });



router.get('/contents/files/:page', ensureAuthenticated, function(req, res, next){
	var page;
	if (typeof req.params.page == 'undefined'){
		page = 1;
	}
	page = req.params.page;
	var obj = [];
	var start = (page - 1) * 12;
	var end = page * 12 -1;
	
	var dir = __dirname + "/../public/uploads/";
	var files = fs.readdirSync(dir)
	    .map(function(v) {
	        return { name:v,
	                 time:fs.statSync(dir + v).mtime.getTime()
	               }; 
	     })
	     .sort(function(a, b) { return a.time - b.time; })
	     .map(function(v) { return v.name; });
	
	files.reverse();
	for (var i = start; i < end+1; i++){
		obj.push(files[i]);
	}
	var pagination = [];
	var totalPage = Math.ceil(files.length / 12);
	var startPage;
	var lastPage;
	if(page % 5 != 0){ startPage = Math.floor(page/5) * 5 + 1; lastPage = Math.ceil(page/5) * 5; }
	else{ startPage = (page/5) * 5 - 4; lastPage = parseInt(page) };
	
	var next = true;
	
	if (lastPage >= totalPage){
		lastPage = totalPage;
		next = false;
	}
	pagination.push(totalPage, startPage, lastPage, next, parseInt(page));
	res.send({'pagination' : pagination, 'files': obj});
});


//콘텐츠 이미지 업로드 등록
router.post('/contents/insert/upload', ensureAuthenticated, function(req, res, next) {
	
	var form = new formidable.IncomingForm();

	form.parse(req);
//	form.on("fileBegin", function (name, file){
//		console.log('upload come on3');
//    });
    form.on("file", function (name, file){
        fs.readFile(file.path, function(error, data){
        	var filePath = __dirname + '/../public/uploads/' + file.name;
        	
        	fs.writeFile(filePath, data, function(error){
        		if(error){
        			//throw err;
        			//res.redirect('back');
        		}else {
        			//form.on("end", function() {
        				 // res.redirect('back');
        				//});
        		}
        	});
        });
    });
    
    form.on("end", function() {
		  res.redirect('back');
		});

});

router.post('/contents/insert', ensureAuthenticated, function(req, res, next) {
	
	var CP = 1;
	
	var title = req.body.title;
	var contents = req.body.contents;
	var category = req.body.category;
	var photo = req.body.photo;
	var userNo = req.body.userNo;
	var writer = req.body.writer;
	//console.log(writer);
	var userText = req.body.userText;
	var date = getWorldTime(+9);
	var rdate = req.body.rdate;
	//console.log(userNo);
	//console.log(title);
	var sets = {con_category : category, con_writer : writer, con_title : title, con_content : contents, con_photo : photo, con_viewCount : 0, con_regDate : date, con_upDate : date, user_no : userNo, user_comment : userText, con_release : rdate};
	
	mysql.insert('insert into bobbyDB.contents set ?', sets,  function (err, data){
		
    	res.redirect('/adm/contents');
    	
    });
});

router.post('/contents/update', ensureAuthenticated, function(req, res, next) {
	
	var CP = 1;
	
	var no = req.body.no;
	var title = req.body.title;
	var contents = req.body.contents;
	var category = req.body.category;
	var photo = req.body.photo;
	var userNo = req.body.userNo;
	var writer = req.body.writer;
	var userText = req.body.userText;
	var rdate   = req.body.rdate;
	var date = getWorldTime(+9);
	var sets = {con_no : no, con_category : category, con_title : title, con_content : contents, con_photo : photo, con_upDate : date, user_no : userNo, user_comment : userText, con_writer : writer,con_release : rdate   };
	mysql.update('update bobbyDB.contents set con_category = ?,  con_title = ?, con_content = ?, con_photo = ?,  con_upDate = ?, user_no = ?, user_comment = ?, con_writer = ? ,con_release= ?  where con_no = ?', [category,title,contents,photo,date,userNo,userText,writer,rdate,no], function (err, data){
		
    	res.redirect('/adm/contents');
    	
    });
});


router.post('/contents/insertMore', ensureAuthenticated, function(req, res, next) {
	
	var CP = 1;
	
	var con_no = req.body.con_no;
	var yes24 = req.body.yes24;
	var ala = req.body.ala;
	var kyobo = req.body.kyobo;
	var cmlabel = req.body.cmlabel;
	var sets = {con_no : con_no, cmore_label : cmlabel, cmore_op1 : yes24, cmore_op2 : ala, cmore_op3 : kyobo};
	
	mysql.insert('insert into bobbyDB.contentsMore set ?', sets,  function (err, data){
		
    	res.redirect('/adm/contents');
    	
    });

});

router.get('/contents/delete/:no', ensureAuthenticated, function(req, res, next) {
	
	var CP = 1;
	var no = req.params.no;
	
	mysql.del('delete from bobbyDB.contents where con_no = '+ no +'', function (err, data){
		if(err){
			res.redirect('/adm/contents');
		}else{
			res.redirect('/adm/contents');
		}
    });
});

router.get('/contents/detail/:no', ensureAuthenticated, function(req, res, next) {
	
	var CP = 1;
	var no = req.params.no;
	var cate;
	var user;
	
	mysql.select('select * from bobbyDB.con_cate', function (err, data){
		if(err){
			res.redirect('back');
		}
			mysql.select('select c.con_no, c.con_category, c.con_writer, c.con_title, c.con_content, c.con_photo, c.con_viewCount, c.con_regDate, c.con_upDate, c.con_likeCnt, c.comment_no, c.user_no, c.user_comment, c.con_release, u.user_email, u.user_name, u.user_profile_img, u.user_sns_url, u.user_sns_icon from bobbyDB.contents c left join bobbyDB.user u on u.user_no = c.user_no and u.user_level = "2" where 1=1 and c.con_no = '+no+'', function (err, data2){
				if(err){
					res.redirect('back');
				}
				mysql.select('select * from bobbyDB.user where user_level="2"', function (err, data3){
				if(err){
					res.redirect('back');
				}
				user = data3;
				res.render('admin/contents/update', {contents : data2, CP : CP, cate : data, user : user});
			});
		});
    });
});


router.post('/pop_ck', ensureAuthenticated, function(req, res, next) {
	
	var CP = 1;
	
	var pop_ck = req.body.pop_ck;
	var sets = { con_no : pop_ck };
	mysql.update('update bobbyDB.contents set con_pop= 1  where con_no = ?', [pop_ck], function (err, data){
		
    	res.redirect('/adm/contents');
    	
    });
});
router.post('/pop_ck_default', ensureAuthenticated, function(req, res, next) {
	
	var CP = 0;
	
	var pop_ck = req.body.pop_ck;
	var sets = { con_no : pop_ck };
	mysql.update('update bobbyDB.contents set con_pop= 0 where con_no = ?', [pop_ck], function (err, data){
		
    	res.redirect('/adm/index');
    	
    });
});


function ensureAuthenticated(req, res, next) {
    // 로그인이 되어 있으면, 다음 파이프라인으로 진행
    if (req.isAuthenticated()) { return next(); }
    // 로그인이 안되어 있으면, login 페이지로 진행
    res.redirect('/adm');
}

module.exports = router;
