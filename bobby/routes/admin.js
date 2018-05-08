/**
 * http://usejsdoc.org/
 */
var express = require('express');
var router = express.Router();
var fs = require('fs');
var multer = require('multer');

/*의미없는 코드 */
/*var storage = multer.diskStorage({
	destination: function (req, file, callback) {
		callback(null, './public/std');
	},
	filename: function (req, file, callback) {
		callback(null, file.originalname);
	}
});
var upload = multer({ storage : storage});*/


var formidable = require('formidable');
var dir = require('node-dir');
var mysql = require("./model/mysql");

var multiparty = require('connect-multiparty');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');


//var upload = multer({ dest: '../public/uploads/' });
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

	/*4월 27일 아이디 프로필 사진 작업 */
	/*
	var sess = req.session;
	var sePass = sess.passport;
	if(sePass != null){
		var proPhoto = sess.passport.user;
	}
	*/

	/*var id = req.body.id;
	var pw = req.body.pw;
	
	console.log(id, pw);
	if(id == "superadmin" && pw == "boto7aws!"){
		res.cookie('auth', true);
		res.redirect('/adm/contents');
	}else {
		res.redirect('/adm');
	}*/
});


router.get('/contents', ensureAuthenticated, function(req, res, next) {
	var CP = 1;
		mysql.select('select * from cider.cid_contents order by con_no desc', function (err, data){
			 res.render('admin/contents/contents', { CP : CP, contents : data });	    	
		});
});

router.get('/index', ensureAuthenticated, function(req, res, next) {
	var CP = 0;
		mysql.select('SELECT * from cider.cid_contents where con_pop = 1 order by con_release desc;', function (err, data){
			 res.render('admin/admin_index', { CP : CP, contents : data });
		});
});


router.get('/contents/insert', function(req, res, next) {
	
	var CP = 1;
	var cate;
	var user;
	mysql.select('select * from cider.cid_con_cate', function (err, data){
		if(err){
			res.redirect('back');
		}
		
		cate = data;
		
		mysql.select('select * from cider.cid_user where user_level="2"', function (err, data2){
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
	mysql.select('SELECT * FROM cider.cid_contents where con_category = 7 order by con_no desc', function (err, data){
		if(err){
			res.redirect('back');
		}
		
		cate = data;
		
		mysql.select('select * from cider.cid_user where user_level="2"', function (err, data2){
			if(err){
				res.redirect('back');
			}
			user = data2;

			res.render('admin/contents/insertMore', {cate : cate, user : user, CP : CP});
			});
		});
    });


/*test중 comment
router.get('/uMent/:user_no', function(req, res, next) {
	var user_no =  req.params.user_no;
		mysql.select('select * from cider.cid_user', function (err, data){
			if(err){
				res.redirect('back');
			}
			user_no = data;

			res.send({ userC : data });
			});
		});

*/

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

router.post('/discuss/insert/upload', ensureAuthenticated, function(req, res, next) {
	
	var form = new formidable.IncomingForm();
	
	form.parse(req);
    form.on("file", function (name, file){
        fs.readFile(file.path, function(error, data){
        	var filePath = __dirname + '/../public/discuss_imgs/' + file.name;

        	fs.writeFile(filePath, data, function(error){
        		if(error){
        		}else {
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
	
	mysql.insert('insert into cider.cid_contents set ?', sets,  function (err, data){
		
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
	mysql.update('update cider.cid_contents set con_category = ?,  con_title = ?, con_content = ?, con_photo = ?,  con_upDate = ?, user_no = ?, user_comment = ?, con_writer = ? ,con_release= ?  where con_no = ?', [category,title,contents,photo,date,userNo,userText,writer,rdate,no], function (err, data){
		
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
	
	mysql.insert('insert into cider.cid_contentsMore set ?', sets,  function (err, data){
		
    	res.redirect('/adm/contents');
    	
    });

});

router.get('/contents/delete/:no', ensureAuthenticated, function(req, res, next) {
	
	var CP = 1;
	var no = req.params.no;
	
	mysql.del('delete from cider.cid_contents where con_no = '+ no +'', function (err, data){
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
	
	mysql.select('select * from cider.cid_con_cate', function (err, data){
		if(err){
			res.redirect('back');
		}
			mysql.select('select c.con_no, c.con_category, c.con_writer, c.con_title, c.con_content, c.con_photo, c.con_viewCount, c.con_regDate, c.con_upDate, c.con_likeCnt, c.comment_no, c.user_no, c.user_comment, c.con_release, u.user_email, u.user_name, u.user_profile_img, u.user_sns_url, u.user_sns_icon from cider.cid_contents c left join cider.cid_user u on u.user_no = c.user_no and u.user_level = "2" where 1=1 and c.con_no = '+no+'', function (err, data2){
				if(err){
					res.redirect('back');
				}
				mysql.select('select * from cider.cid_user where user_level="2"', function (err, data3){
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
	mysql.update('update cider.cid_contents set con_pop= 1  where con_no = ?', [pop_ck], function (err, data){
		
    	res.redirect('/adm/contents');
    	
    });
});
router.post('/pop_ck_default', ensureAuthenticated, function(req, res, next) {
	
	var CP = 0;
	
	var pop_ck = req.body.pop_ck;
	var sets = { con_no : pop_ck };
	mysql.update('update cider.cid_contents set con_pop= 0 where con_no = ?', [pop_ck], function (err, data){
		
    	res.redirect('/adm/index');
    	
    });
});

router.get('/lecture', ensureAuthenticated, function(req, res, next) {
	var CP = 2;
	var now = new Date();
	var _year= now.getFullYear();
	var _mon = now.getMonth()+1;
	 _mon=""+_mon;
	 if (_mon.length < 2 )
	 {
	    _mon="0"+_mon;
	 }
	  var _date=now.getDate();
	  _date =""+_date;
	  if (_date.length < 2 )
		 {
		    _date="0"+_date;
		 }
	 
	var _tot=_year+"-"+_mon+"-"+_date;

	mysql.select("SELECT count(*) as inq FROM cider.std_ask where cate = '1' and stda_regdate like  \'%"+_tot+"%\' ", function (err, data){
		mysql.select("SELECT count(*) as app FROM cider.pay_appform where cate = '1' and regdate like  \'%"+_tot+"%\' ", function (err, data2){
			mysql.select("SELECT count(*) as nonac FROM cider.fin_nonaccount where cate = '1' and regDate like  \'%"+_tot+"%\' ", function (err, data3){

	res.render('admin/lecture/lecture_index', { CP : CP, inq:data, app:data2, nonac:data3});
	  });
	});
  });
});


router.get('/lecture/insert', ensureAuthenticated, function(req, res, next) {
	
	var CP = 2;
	var cate;
	mysql.select('select * from cider.cid_lec_cate', function (err, data){
		if(err){
			res.redirect('back');
		}
		cate = data;
			res.render('admin/lecture/insert', {cate : cate, CP : CP});
	});
});



router.post('/lecture/insert', ensureAuthenticated, function(req, res, next) {
	
	var CP = 2;

	var cate = '1'; // 세미나 코드
	var decate = '2018'; // 세미나 세부코드
	var subject = req.body.subject;
	var thum = req.body.thum;
	var img1 = req.body.img1;
	var img2 = req.body.img2;
	var leader = req.body.leader;
	var stime = req.body.stime;
	var sdate = req.body.sdate;
	var sstdate = req.body.sstdate;
	var sendate = req.body.sendate;
	var location = req.body.location;
	var mapX = req.body.mapX;
	var mapY = req.body.mapY;

	var price = req.body.price;
	var people = req.body.people;
	var state=''; // 0 신청중 1신청마감\
	var flag='';

	var date = getWorldTime(+9);
	var rdate = req.body.rdate;

	var sets = {cate:cate,decate:decate,subject : subject, thum : thum, img1 : img1, img2 : img2, leader:leader, stime : stime, sdate : sdate, sstdate : sstdate,
		sendate : sendate, location : location, mapX : mapX, mapY : mapY, price : price, people : people, regdate:date, state:'0', flag:'N'};
	
	mysql.insert('insert into cider.cid_semilist set ?', sets,  function (err, data){
    	res.redirect('/adm/lecture');
    });
});


router.post('/lecture/insert/upload', ensureAuthenticated, function(req, res, next) {
	var form = new formidable.IncomingForm();
	form.parse(req);
    form.on("file", function (name, file){
        fs.readFile(file.path, function(error, data){
        	var filePath = __dirname + '/../public/semi/' + file.name;
        	fs.writeFile(filePath, data, function(error){
        		if(error){
        			//throw err;
        			//res.redirect('back');
        		}else {
        		}
        	});

        });
    });
    form.on("end", function() {
		  res.redirect('back');
		});
});

router.get('/lecturelist', ensureAuthenticated, function(req, res, next) {
	
	var CP = 2;
	var cate;
	mysql.select('select * from cider.cid_semilist', function (err, data){
		if(err){
			res.redirect('back');
		}
		cate = data;
		res.render('admin/lecture/list', {semi : cate, CP : CP});
	});
});

router.get('/lecture/detail/:idx', ensureAuthenticated, function(req, res, next) {
	
	var CP = 2;
	var idx = req.params.idx;
	var std;

	mysql.select('select * from cider.cid_semilist where idx = '+idx+'', function (err, data){
		if(err){
			res.redirect('back');
		}
		std = data;
		res.render('admin/lecture/update', {semi : data, CP : CP});
	});
});


router.post('/lecture/update', ensureAuthenticated, function(req, res, next) {
	
	var CP = 2;
	
	var idx = req.body.idx;

	var subject = req.body.subject;
	var thum = req.body.thum;
	var img1 = req.body.img1;
	var img2 = req.body.img2;
	var leader = req.body.leader;
	var stime = req.body.stime;
	var sdate = req.body.sdate;
	var sstdate = req.body.sstdate;
	var sendate = req.body.sendate;
	var location = req.body.location;
	var mapX = req.body.mapX;
	var mapY = req.body.mapY;

	var price = req.body.price;
	var people = req.body.people;
	var state=req.body.state; // 0 신청중 1신청마감\
	var flag=req.body.flag;

	var regdate = getWorldTime(+9);

	var sets = {subject : subject, thum : thum, img1 : img1, img2 : img2, leader:leader, stime : stime, sdate : sdate, sstdate : sstdate,
		sendate : sendate, location : location, mapX : mapX, mapY : mapY, price : price, people : people, regdate:regdate, state:state, flag:flag};

//mysql.update('update cider.std_more set subject = ?, subject2 = ?, bgimg1 = ?,thum=?,leader = ? ,period = ?,sche1 = ?, sche2 = ? ,sche3= ? where idx = ?', [subject,subject2,bgimg1,thum,leader,period,sche1,sche2,sche3,idx], function (err, data){
    
	mysql.update('update cider.cid_semilist set subject = ?, thum = ?, img1 = ?, img2 =?, leader =?, stime =?, sdate =?, sstdate =?, sendate =?, location =?, mapX =?, mapY =?, price =?, people =?, regdate =?, state =?, flag =?  where idx = ?', [subject,thum,img1,img2,leader,stime,sdate,sstdate,sendate,location,mapX,mapY,price,people,regdate,state,flag,idx], function (err, data){
    	res.redirect('/adm/lecturelist');
    	
    });
});

//**************** 구매자 목록 **************

router.get('/lecture/customer', ensureAuthenticated, function(req,res,next){
	var CP = 2;
	mysql.select("SELECT * FROM cider.mobileOrder where PRODUCTCODE = '2' order by date desc;", function (err, data){
		mysql.select("SELECT * FROM cider.cardOrder where PRODUCTCODE = '2' order by date desc;", function (err, data2){
			mysql.select("SELECT * FROM cider.pay_appform where cate ='1' order by idx desc;", function (err, data3){
				mysql.select("SELECT * FROM cider.fin_nonaccount where cate='1' order by idx desc;", function (err, data4){
		res.render('admin/lecture/customer', { CP : CP, mobile:data, card:data2, code:data3, non:data4 });
	 });
	});
  });
});
});

//**************** 무통장 수정 **************
router.post('/lecture/customer_up', ensureAuthenticated, function(req, res, next) {
	var CP = 2;
	var idx = req.body.idx;
	var state = req.body.state;
	var codeNum = req.body.codeNum;
	var sets = { state : state, codeNum : codeNum,idx:idx };
	mysql.update('update cider.fin_nonaccount set state = ?, codeNum = ?  where idx = ?', [state,codeNum,idx], function (err, data){
    	res.redirect('/adm/lecture/customer');
    });
});


router.get('/lecture/applist', ensureAuthenticated, function(req, res, next) {
	var CP = 2;
	var stdlist;
	mysql.select('SELECT * from cider.cid_semilist order by idx desc;', function (err, data){
		stdlist = data;
		res.render('admin/lecture/applist', { CP : CP, stdlist : data});
	});
  });

router.get('/lecture/applist/:idx', ensureAuthenticated, function(req, res, next) {
	var CP = 2;
	var idx = req.params.idx;
	mysql.select('SELECT * FROM cider.pay_appform where cate = "1" and decate = '+idx+' order by idx desc;', function (err, data){
		mysql.select("SELECT * FROM cider.fin_nonaccount where cate='1' and decate = "+idx+" and state='입금확인' order by idx desc;", function (err, data2){
		res.render('admin/lecture/applist_detail', { CP : CP, appfm : data , non:data2});
	});
  });
});




router.get('/lecture/inquiry', ensureAuthenticated, function(req, res, next) {
	var CP = 2;
	mysql.select("SELECT * FROM cider.std_ask where cate='1' order by stda_no desc", function (err, data){
	res.render('admin/lecture/lecture_inquiry', { CP : CP, inq:data});
	});
});

router.get('/lecture/inquiryd/:idx', ensureAuthenticated, function(req, res, next) {
	var CP = 2;
	var idx = req.params.idx;
	mysql.select('SELECT * FROM cider.std_ask where stda_no = '+idx+'', function (err, data){
	res.render('admin/lecture/lecture_inquiry_detail', { CP : CP, inq:data});
	});
});









router.get('/lecture/list', ensureAuthenticated, function(req, res, next) {
	var CP = 2;
		mysql.select('SELECT * from cider.cid_applyform order by app_no desc;', function (err, data){
			console.log(CP);
			 res.render('admin/lecture/lecture_list', { CP : CP, lecture : data });	    	
		});
});

router.get('/lecture/detail/:app_no', ensureAuthenticated, function(req, res, next) {
	
	var CP = 2;
	var app_no = req.params.app_no;
	
	mysql.select('select * from cider.cid_applyform', function (err, data2){
		if(err){
			res.redirect('back');
		}
		user = data2;
		mysql.select('select * from cider.cid_applyform where app_no = '+ app_no +'', function (err, data){
			if(err){
				res.redirect('back');
			}
			res.render('admin/lecture/lecture_detail', {CP : CP, lecture : data});
		});
    });
});


router.post('/lecture/detail/update', ensureAuthenticated, function(req, res, next) {

	var CP = 2;
	
	var app_no = req.body.app_no;
	var app_process = req.body.app_process;
	
	//console.log(app_process);
	//console.log(app_no);
	
	var date = getWorldTime(+9);
	
	var sets = {app_no : app_no, app_process : app_process, app_upDate : date };
	
	mysql.update('update cider.cid_applyform set app_process = ?, app_upDate = ? where app_no = ?', [app_process,date,app_no], function (err, data){
		
    	res.redirect('/adm/lecture/list/');
    	
    });
});

router.get('/lecture/list/delete/:app_no', function(req, res, next) {
	
	var CP = 2;
	var app_no = req.params.app_no;
	
	mysql.del('delete from cider.cid_applyform where app_no = '+ app_no +'', function (err, data){
		if(err){
			res.redirect('/adm/lecture/list');
		}else{
			res.redirect('/adm/lecture/list');
		}
    });
});





router.get('/finance', ensureAuthenticated, function(req, res, next) {
	var CP = 3;
		mysql.select('SELECT * from cider.cid_fi_applyform order by fi_app_no desc;', function (err, data){
			console.log(CP);
			 res.render('admin/finance/finance_index', { CP : CP, finance : data });	    	
		});
});

router.get('/finance/detail/:fi_app_no', ensureAuthenticated, function(req, res, next) {
	
	var CP = 3;
	var fi_app_no = req.params.fi_app_no;
	
	mysql.select('select * from cider.cid_fi_applyform', function (err, data2){
		if(err){
			res.redirect('back');
		}
		user = data2;
		mysql.select('select * from cider.cid_fi_applyform where fi_app_no = '+ fi_app_no +'', function (err, data){
			if(err){
				res.redirect('back');
			}
			res.render('admin/finance/finance_detail', {CP : CP, finance : data});
		});
    });
});


router.get('/finance/delete/:fi_app_no', function(req, res, next) {
	
	var CP = 3;
	var fi_app_no = req.params.fi_app_no;
	
	mysql.del('delete from cider.cid_fi_applyform where fi_app_no = '+ fi_app_no +'', function (err, data){
		if(err){
			res.redirect('/adm/finance');
		}else{
			res.redirect('/adm/finance');
		}
    });
});


router.get('/finance/slist', ensureAuthenticated, function(req, res, next) {
	var CP = 3;
		mysql.select('SELECT * from cider.cid_survey where sry_cate ="5" order by sry_no desc;', function (err, data){
			 res.render('admin/finance/finance_slist', { CP : CP, slist : data });	    	
		});
});

router.get('/finance/detail2/:sry_no', ensureAuthenticated, function(req, res, next) {
	
	var CP = 3;
	var sry_no = req.params.sry_no;
	

		mysql.select('select * from cider.cid_survey where sry_no = '+ sry_no +'', function (err, data){
			if(err){
				res.redirect('back');
			}
			res.render('admin/finance/finance_detail2', {CP : CP, slist : data});
		});
    });



//2016년 8월 25일 기능추가
//관리자 입력 오류 부분 때문에 임시로 만든 부분
//더미 자동생성 버튼
router.get('/contents/insert2', ensureAuthenticated, function(req, res, next) {

var CP = 1;
var now = new Date();
var _year= now.getFullYear();
var _mon = now.getMonth()+2;
 _mon=""+_mon;
 if (_mon.length < 2 )
 {
    _mon="0"+_mon;
 }
  var _date=now.getDate();
  _date =""+_date;
  if (_date.length < 2 )
	 {
	    _date="0"+_date;
	 }
  var _hor = now.getHours() +2;
 _hor =""+_hor;
 if (_hor.length < 2 )
 {
    _hor="0"+_hor;
 }
 var _min=now.getMinutes();
  _min =""+_min;
 if (_min.length < 2 )
 {
    _min="0"+_min;
 }
 
var _tot=_year+""+_mon+""+_date+""+_hor+""+ _min;
var title = "더미";
var contents = " ";
var category = "1";
var photo = "/uploads/leverage-in-the-financial-markets.jpg";
var userNo = "";
var writer = "";
var userText ="";
var date = getWorldTime(+9);
var cdate = _tot;
var sets = {con_category : category, con_title : title, con_content : contents, con_photo : photo, con_viewCount : 0, con_regDate : date, con_upDate : date, con_writer : writer, user_no : userNo, user_comment : userText,con_release : cdate};

mysql.insert('insert into cider.cid_contents set ?', sets,  function (err, data){
    res.redirect('/adm/contents');
    
 });
});


//토론

router.get('/discuss', ensureAuthenticated, function(req, res, next) {
	var CP = 4;
	var askval;
	mysql.select('SELECT * from cider.cid_dis_reg order by dis_no desc;', function (err, data){

		mysql.select('select * from cider.cid_dis_ask order by disAsk_no desc;', function(err,data2){

			askval = data2;
			mysql.select('select * from cider.cid_dis_declar order by disDec_no desc;', function(err,data3){
				declar = data3;

	res.render('admin/discuss/discuss_index', { CP : CP, discuss : data, askval : askval, declar:declar });
	 });
	});    	
  });
});

router.get('/discuss/insert', ensureAuthenticated, function(req, res, next) {
	var CP = 4;
	var cate;
	mysql.select('select * from cider.cid_dis_cate', function (err, data){
		if(err){
			res.redirect('back');
		}
		res.render('admin/discuss/discuss_insert',  {cate : data, CP : CP});
	});
});


/* 정체를 알 수 없는 코드... 내가 이걸 어케 한거지;;
router.post("/discuss/insert/upload", upload.any(), function(req, res, next) {
	var table = {}
	var keys = Object.keys(req.files);
	keys.forEach(function(key) {
		var file = req.files[key];
		table[file.fieldname] = "/discuss_imgs/"+file.originalname;
	});
});
*/
router.post('/discuss/insert', ensureAuthenticated, function(req, res, next) {
	
	var CP = 4;

	var title = req.body.title;
	var category = req.body.category;
	var photo = req.body.photo;
	var writer = req.body.writer;
	var comt_1 = req.body.comt_1;
	var comt_2 = req.body.comt_2;
	var date = getWorldTime(+9);
	var rdate = req.body.rdate;
	var no = req.body.no;

	var sets = {dis_cate : category, dis_writer : writer, dis_title:title, dis_thum:photo,dis_comt_1:comt_1, dis_comt_2:comt_2, dis_comt_3:"기타",dis_regdate:date, dis_update:date,dis_view:0,dis_release:rdate};
	mysql.insert('insert into cider.cid_dis_reg set ?', sets,  function (err, data){
		if(no == null){
			res.redirect('/adm/discuss');
		}
		else{
		mysql.del('delete from cider.cid_dis_ask where disAsk_no = '+ no +'', function (err, data){

		res.redirect('/adm/discuss');
		});
		}
	});
});




router.get('/discuss/insert_2/:disAsk_no', ensureAuthenticated, function(req, res, next) {
	var CP = 4;
	var no = req.params.disAsk_no;

	mysql.select('select * from cider.cid_dis_cate', function (err, data){
		if(err){
			res.redirect('back');
		}

		mysql.select('select * from cider.cid_dis_ask where disAsk_no = '+ no +'', function (err, data2){
			if(err){
				res.redirect('back');
			}

		res.render('admin/discuss/discuss_insert2',  {cate : data, CP : CP, askval:data2});
	});
  });
});



router.get('/discuss/files/:page', ensureAuthenticated, function(req, res, next){
	var page;
	if (typeof req.params.page == 'undefined'){
		page = 1;
	}
	page = req.params.page;
	var obj = [];
	var start = (page - 1) * 12;
	var end = page * 12 -1;
	
	var dir = __dirname + "/../public/discuss_imgs/";
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

router.get('/discuss/detail/:dis_no', ensureAuthenticated, function(req, res, next) {
	var CP= 4;
	var no = req.params.dis_no;
	console.log(no);
	mysql.select('select * from cider.cid_dis_cate', function (err, data2){
		if(err){
			res.redirect('back');
		}

		mysql.select('select * from cider.cid_dis_reg where dis_no ='+no+'', function(err,data){
			if(err){
				res.redirect('back');
			}
			console.log(data);
		res.render('admin/discuss/discuss_update',{ CP:CP, discuss:data, cate:data2});
	});
  });
});


router.post('/discuss/update', ensureAuthenticated, function(req, res, next) {
	
	var CP = 1;
	
	var title = req.body.title;
	var category = req.body.category;
	var photo = req.body.photo;
	var writer = req.body.writer;
	var comt_1 = req.body.comt_1;
	var comt_2 = req.body.comt_2;
	var date = getWorldTime(+9);
	var rdate = req.body.rdate;
	var no = req.body.dis_no;

	var date = getWorldTime(+9);
	
	var sets = {dis_no : no, dis_cate : category, dis_writer : writer, dis_title:title, dis_thum:photo,dis_comt_1:comt_1, dis_comt_2:comt_2 , dis_update:date, dis_release:rdate};
	console.log(sets);
	mysql.update('update cider.cid_dis_reg set dis_cate = ?,  dis_writer = ?, dis_title = ?, dis_thum = ?,  dis_comt_1 = ?, dis_comt_2 = ?, dis_update = ? ,dis_release= ? where dis_no = ?', [category,writer,title,photo,comt_1,comt_2,date,rdate,no], function (err, data){
		
    	res.redirect('/adm/discuss');
    	
    });
});


router.get('/discuss/delete/:no', function(req, res, next) {
	
	var CP = 3;
	var no = req.params.no;
	
	mysql.del('delete from cider.cid_dis_reg where dis_no = '+ no +'', function (err, data){
		if(err){
			res.redirect('/adm/discuss');
		}else{
			res.redirect('/adm/discuss');
		}
    });
});

router.get('/discuss/askdelete/:no', function(req, res, next) {
	
	var CP = 3;
	var no = req.params.no;
	
	mysql.del('delete from cider.cid_dis_ask where disAsk_no = '+ no +'', function (err, data){
		if(err){
			res.redirect('/adm/discuss');
		}else{
			res.redirect('/adm/discuss');
		}
    });
});

router.get('/discuss/comtlist', ensureAuthenticated, function(req, res, next) {
	var CP = 4;
	//mysql.select('(SELECT dis_no,comt_no,"" as comtco_no,comt_writer,comt_regdate from cider.cid_dis_comt) UNION (SELECT "",comt_no,comtco_no as comtco_no,comtco_writer,comtco_date FROM cider.cid_dis_comt_comt)order by comt_regdate desc;', function (err, data){
	mysql.select('SELECT * from cider.cid_dis_comt order by comt_regdate desc;', function (err, data){

		var comtlist = data;

	res.render('admin/discuss/discuss_comtlist', { CP : CP, comtlist:data });
  });
});

router.get('/discuss/comtcolist', ensureAuthenticated, function(req, res, next) {
	var CP = 4;
	//mysql.select('(select dis_no,comt_no,"" as comtco_no,"" as comtco_writer, "" as comtco_text,"" as comtco_date from cider.cid_dis_comt) UNION (select "",comt_no,comtco_no,comtco_writer, comtco_text, comtco_date from cider.cid_dis_comt_comt) order by comtco_date desc;', function (err, data){
	mysql.select('SELECT * FROM cider.cid_dis_comt_comt order by comtco_date desc;', function (err, data){
		var comtlistco = data;
		console.log(comtlistco);

	res.render('admin/discuss/discuss_comtcolist', { CP : CP, comtlistco:data });
	});
 });

/* comtcolist Ajax */
router.get('/gotoComtNo/:comtco_no', function(req,res,next){
	var comtco_no = req.params.comtco_no;

	mysql.select('SELECT dis_no FROM cider.cid_dis_comt where comt_no='+comtco_no+'',function(err,data){
		console.log(data);
		res.send({disno:data});
	});

});

router.get('/discuss/comtdelete/:no', function(req, res, next) {
	
	var CP = 3;
	var no = req.params.no;
	
	mysql.del('delete from cider.cid_dis_comt where comt_no = '+ no +'', function (err, data){
		if(err){
			res.redirect('/adm/discuss/comtlist');
		}else{
			res.redirect('/adm/discuss/comtlist');
		}
    });
});

router.get('/discuss/comtcodelete/:no', function(req, res, next) {
	
	var CP = 3;
	var no = req.params.no;
	
	mysql.del('delete from cider.cid_dis_comt_comt where comtco_no = '+ no +'', function (err, data){
		if(err){
			res.redirect('/adm/discuss/comtcolist');
		}else{
			res.redirect('/adm/discuss/comtcolist');
		}
    });
});

router.get('/discuss/declarComtdelete/:no&:decno', function(req, res, next) {
	
	var CP = 3;
	var no = req.params.no;
	var decno = req.params.decno;
	
	mysql.del('delete from cider.cid_dis_comt where comt_no = '+ no +'', function (err, data){
		mysql.del('delete from cider.cid_dis_declar where disDec_no = '+ decno +'', function (err, data){
		if(err){
			res.redirect('/adm/discuss');
		}else{
			res.redirect('/adm/discuss');
		}
	  });
    });
});

router.get('/discuss/declarComtdelete2/:no&:decno', function(req, res, next) {
	
	var CP = 3;
	var no = req.params.no;
	var decno = req.params.decno;
	
	mysql.del('delete from cider.cid_dis_comt_comt where comtco_no = '+ no +'', function (err, data){
		mysql.del('delete from cider.cid_dis_declar where disDec_no = '+ decno +'', function (err, data){
		if(err){
			res.redirect('/adm/discuss');
		}else{
			res.redirect('/adm/discuss');
		}
	  });
    });
});


router.get('/discuss/declardelete/:no', function(req, res, next) {
	
	var CP = 3;
	var no = req.params.no;
	
	mysql.del('delete from cider.cid_dis_declar where disDec_no = '+ no +'', function (err, data){
		if(err){
			res.redirect('/adm/discuss');
		}else{
			res.redirect('/adm/discuss');
		}
    });
});

//설문조사 2017 4월 19일



router.get('/survey', ensureAuthenticated, function(req, res, next) {
	var CP = 5;
		mysql.select('SELECT * from cider.cid_survey order by sry_no desc;', function (err, data){
			mysql.select('SELECT count(*) as sry FROM cider.cid_survey;', function (err, data1){
			res.render('admin/survey/survey_index', { CP : CP, survey : data, sryAll:data1 });	    	
		});
	});
});

router.get('/survey/detail/:sry_no', ensureAuthenticated, function(req, res, next) {
	
	var CP = 5;
	var sry_no = req.params.sry_no;
	
	mysql.select('select * from cider.cid_survey', function (err, data2){
		if(err){
			res.redirect('back');
		}
		user = data2;
		mysql.select('select * from cider.cid_survey where sry_no = '+ sry_no +'', function (err, data){
			if(err){
				res.redirect('back');
			}
			res.render('admin/survey/survey_detail', {CP : CP, survey : data});
		});
    });
});


router.get('/survey/delete/:sry_no', function(req, res, next) {
	
	var CP = 5;
	var sry_no = req.params.sry_no;
	
	mysql.del('delete from cider.cid_survey where sry_no = '+ sry_no +'', function (err, data){
		if(err){
			res.redirect('/adm/survey');
		}else{
			res.redirect('/adm/survey');
		}
    });
});



router.get('/consulting', ensureAuthenticated, function(req, res, next) {
	var CP = 9;
	mysql.select('select * from cider.cid_consulting order by cons_no desc', function (err, data){
		 res.render('admin/consulting/consulting', { CP : CP, consulting : data });
	});
	
});

router.post('/consulting/insert',  function(req, res, next) {
	var CP = 9;
	
	var contents = req.body.contents;
	var url = req.body.url;
	var name = req.body.name;
	var photo = req.body.photo;
	var date = getWorldTime(+9);
	
	var sets = {cons_name : name, cons_img : photo, cons_site_url : url, cons_content : contents, cons_regDate : date, cons_upDate : date };
	//console.log('insert into cider.cid_consulting set ? '+sets);
	mysql.insert('insert into cider.cid_consulting set ?', sets,  function (err, data){
		
		console.log(err);
		console.log(data);
		
    	res.redirect('/adm/consulting');
    	if (err){
    		res.redirect('/adm/consulting');
    	}
    });
});

router.get('/consulting/insert', ensureAuthenticated, function(req, res, next) {
	
	var CP = 9;
	res.render('admin/consulting/insert', { CP : CP });
	
});

router.get('/consulting/detail/:no', ensureAuthenticated, function(req, res, next) {
	
	var CP = 9;
	var no = req.params.no;
	var user;
	
	mysql.select('select * from cider.cid_user where user_level="2"', function (err, data2){
		if(err){
			res.redirect('back');
		}
		user = data2;
		mysql.select('select * from cider.cid_consulting where cons_no = '+ no +'', function (err, data){
			if(err){
				res.redirect('back');
			}
			res.render('admin/consulting/update', {consulting : data, CP : CP, user: user});
		});
    });
});

router.post('/consulting/update', ensureAuthenticated, function(req, res, next) {
	
	var CP = 9;
	
	var no = req.body.no;
	var name = req.body.name;
	var contents = req.body.contents;
	var img = req.body.photo;
	var url = req.body.url;
	var date = getWorldTime(+9);
	
	var sets = {cons_no : no, cons_name : name, cons_content : contents, cons_img : img, cons_site_url : url, cons_upDate : date };
	//mysql.update('update cider.cid_consulting set cons_name = :cons_name,  cons_img = :cons_img, cons_site_url = :cons_site_url, cons_content = :cons_content,  cons_upDate = :cons_upDate where cons_no = :cons_no', sets, function (err, data){
	mysql.update('update cider.cid_consulting set cons_name = ?,  cons_img = ?, cons_site_url = ?, cons_content = ?,  cons_upDate = ? where cons_no = ?', [name,img,url,contents,date,no], function (err, data){
    	res.redirect('/adm/consulting');
    	
    });
});


router.get('/consulting/delete/:no', ensureAuthenticated, function(req, res, next) {
	
	var CP = 9;
	var no = req.params.no;
	
	mysql.del('delete from cider.cid_consulting where cons_no = '+ no +'', function (err, data){
		if(err){
			res.redirect('/adm/consulting');
		}else{
			res.redirect('/adm/consulting');
		}
    	
    });
});
function ensureAuthenticated(req, res, next) {
    // 로그인이 되어 있으면, 다음 파이프라인으로 진행
    if (req.isAuthenticated()) { return next(); }
    // 로그인이 안되어 있으면, login 페이지로 진행
    res.redirect('/adm');
}




// **********************  admin finbook
// ************ 핀북 

router.get('/finbook', ensureAuthenticated, function(req,res,next){
	var CP = 6;
		res.render('admin/finbook/index', { CP : CP });
});

router.get('/finbook/insert', ensureAuthenticated, function(req,res,next){
	var CP = 6;
	mysql.select('select * from cider.fin_code order by idx desc', function (err, data){
		mysql.select('select count(*)  AS num  from cider.fin_code order by idx desc', function (err, data2){


		res.render('admin/finbook/codeInsert', { CP : CP, finbook:data, count:data2 });
	});
	});
});


//**************** 쿠폰 번호 등록 **************

router.post('/finbook/insert', ensureAuthenticated, function(req,res,next){
	var CP = 6;
	var regi = req.body.regi;
	var codeNum = req.body.codeNum;
	var date = getWorldTime(+9);
	
	var sets = {fcode : codeNum, registrant:regi, date : date};
	//console.log('insert into cider.cid_consulting set ? '+sets);
	mysql.insert('insert into cider.fin_code set ?', sets,  function (err, data){
		
		console.log(err);
		console.log(data);
		res.send('<script>alert("쿠폰 등록 완료 감사합니다");location.href="/adm/finbook/insert";</script>');
    	//res.redirect('/adm/finbook');
    	if (err){
    		res.redirect('/adm/finbook/insert');
    	}
    });
});

//**************** 코드번호 삭제 **************

router.get('/finbook/cdDelete/:idx', ensureAuthenticated, function(req, res, next) {
	
	var CP = 1;
	var no = req.params.idx;
	
	mysql.del('delete from cider.fin_code where idx = '+ no +'', function (err, data){
		if(err){
			res.redirect('/adm/finbook/insert');
		}else{
			res.redirect('/adm/finbook/insert');
		}
    });
});

//**************** 구매자 목록 **************

router.get('/finbook/customer', ensureAuthenticated, function(req,res,next){
	var CP = 6;
	mysql.select("SELECT * FROM cider.mobileOrder      order by date desc", function (err, data){
		mysql.select("SELECT * FROM cider.cardOrder      order by date desc;", function (err, data2){
			mysql.select('SELECT cider.fin_order.ORDERNO, cider.fin_order.USERNAME, cider.fin_order.EMAIL, cider.fin_order.TELNO, cider.fin_order.payDate, cider.fin_code.fcode, cider.fin_order.flag FROM cider.fin_order INNER JOIN cider.fin_code ON cider.fin_order.idx=cider.fin_code.idx  where cider.fin_order.flag= "Y";', function (err, data3){
		res.render('admin/finbook/customer', { CP : CP, mobile:data, card:data2, code:data3 });
	 });
	});
  });
});

//**************** 주문자 상세 보기 **************

router.get('/finbook/orderDetail/:ORDERNO', ensureAuthenticated, function(req,res,next){
	var CP = 6;
	var no = req.params.ORDERNO;

	mysql.select('SELECT * FROM cider.mobileOrder where ORDERNO= '+ no +' order by date desc', function (err, data){
		mysql.select('SELECT * FROM cider.cardOrder where ORDERNO= '+ no +' order by date desc;', function (err, data2){
			

		res.render('admin/finbook/orderDetail', { CP : CP, mobile:data, card:data2 });
	  });
	});
});



//**************** 주문 번호 검색 **************
router.get('/finbook/ORDERNO/', ensureAuthenticated, function(req,res,next){
	var CP = 6;
	var ORDERNO = req.query.ORDERNO;

	mysql.select('(SELECT ORDERNO, USERNAME, EMAIL, date FROM cider.cardOrder where ORDERNO = '+ORDERNO+') UNION (SELECT ORDERNO, USERNAME, EMAIL, date FROM cider.mobileOrder where ORDERNO = '+ORDERNO+');', function(err,data){
	//mysql.select('(SELECT dis_no,comt_no,"" as comtco_no,comt_writer,comt_regdate from cider.cid_dis_comt) UNION (SELECT "",comt_no,comtco_no as comtco_no,comtco_writer,comtco_date FROM cider.cid_dis_comt_comt)order by comt_regdate desc;', function (err, data){
	
	//res.send(ORDERNO);
	res.render('admin/finbook/orderno', { CP : CP, search:data });
	});
});

//**************** 성명으로 검색 **************
router.get('/finbook/USERNAME/', ensureAuthenticated, function(req,res,next){
	var CP = 6;
	var USERNAME = req.query.USERNAME;

	mysql.select('(SELECT ORDERNO, USERNAME, EMAIL, date FROM cider.cardOrder where USERNAME =  \''+USERNAME+'\') UNION (SELECT ORDERNO, USERNAME, EMAIL, date FROM cider.mobileOrder where USERNAME = \''+USERNAME+'\');', function(err,data){
	//mysql.select('(SELECT dis_no,comt_no,"" as comtco_no,comt_writer,comt_regdate from cider.cid_dis_comt) UNION (SELECT "",comt_no,comtco_no as comtco_no,comtco_writer,comtco_date FROM cider.cid_dis_comt_comt)order by comt_regdate desc;', function (err, data){
	
	//res.send(ORDERNO);
	res.render('admin/finbook/username', { CP : CP, search:data });
	});
});



//**************** 카드 주문 삭제 **************
router.get('/finbook/cardDelete/:ORDERNO', ensureAuthenticated, function(req, res, next) {
	
	var CP = 6;
	var no = req.params.ORDERNO;
	
	mysql.del('delete from cider.cardOrder where ORDERNO = '+ no +'', function (err, data){
		if(err){
			res.redirect('/adm/finbook/customer');
		}else{
			res.redirect('/adm/finbook/customer');
		}
    });
});

//**************** 모바일 주문 삭제 **************
router.get('/finbook/mobileDelete/:ORDERNO', ensureAuthenticated, function(req, res, next) {
	
	var CP = 6;
	var no = req.params.ORDERNO;
	
	mysql.del('delete from cider.mobileOrder where ORDERNO = '+ no +'', function (err, data){
		if(err){
			res.redirect('/adm/finbook/customer');
		}else{
			res.redirect('/adm/finbook/customer');
		}
    });
});

//**************** 무통장 목록 **************

router.get('/finbook/bankbook', ensureAuthenticated, function(req,res,next){
	var CP = 6;
	mysql.select('SELECT * FROM cider.fin_nonaccount order by regDate desc', function (err, data){

		res.render('admin/finbook/bankbook', { CP : CP, bank:data });
	});
});

//**************** 무통장 수정 **************
router.post('/finbook/bank_up', ensureAuthenticated, function(req, res, next) {
	var CP = 6;
	var idx = req.body.idx;
	var state = req.body.state;
	console.log(state);
	var codeNum = req.body.codeNum;
	var sets = { state : state, codeNum : codeNum,idx:idx };
	mysql.update('update cider.fin_nonaccount set state = ?, codeNum = ?  where idx = ?', [state,codeNum,idx], function (err, data){
		
    	res.redirect('/adm/finbook/bankbook');
    	
    });
});



//**            포도 재무설계              **/
// podo admin


router.get('/podo', ensureAuthenticated, function(req, res, next) {
	var CP = 7;
		mysql.select('SELECT * from cider.podo_apply order by pd_no desc;', function (err, data){
			 res.render('admin/podo/podo_index', { CP : CP, podo : data });	    	
		});
});

router.get('/podo/detail/:pd_no', ensureAuthenticated, function(req, res, next) {
	
	var CP = 7;
	var pd_no = req.params.pd_no;
	
		mysql.select('select * from cider.podo_apply where pd_no = '+ pd_no +'', function (err, data){
			if(err){
				res.redirect('back');
			}
			res.render('admin/podo/podo_detail', {CP : CP, podo : data});
		});
    });


router.get('/podo/delete/:pd_no', function(req, res, next) {
	
	var CP = 7;
	var pd_no = req.params.pd_no;
	
	mysql.del('delete from cider.podo_apply where pd_no = '+ pd_no +'', function (err, data){
		if(err){
			res.redirect('/adm/podopod');
		}else{
			res.redirect('/adm/podo');
		}
    });
});



/* 스터디 */

router.get('/study', ensureAuthenticated, function(req, res, next) {
	var CP = 8;
	var now = new Date();
	var _year= now.getFullYear();
	var _mon = now.getMonth()+1;
	 _mon=""+_mon;
	 if (_mon.length < 2 )
	 {
	    _mon="0"+_mon;
	 }
	  var _date=now.getDate();
	  _date =""+_date;
	  if (_date.length < 2 )
		 {
		    _date="0"+_date;
		 }
	 
	var _tot=_year+"-"+_mon+"-"+_date;

	mysql.select("SELECT count(*) as inq FROM cider.std_ask where cate = '2' and stda_regdate like  \'%"+_tot+"%\' ", function (err, data){
		mysql.select("SELECT count(*) as app FROM cider.pay_appform where cate = '182' and regdate like  \'%"+_tot+"%\' ", function (err, data2){
			mysql.select("SELECT count(*) as nonac FROM cider.fin_nonaccount where cate = '182' and regDate like  \'%"+_tot+"%\' ", function (err, data3){

	res.render('admin/study/std_index', { CP : CP, inq:data, app:data2, nonac:data3});
	  });
	});
  });
});

router.get('/studyin', ensureAuthenticated, function(req, res, next) {
	var CP = 8;
	res.render('admin/study/std_insert', { CP : CP});
});

//스터디 이미지 업로드 등록
router.post('/study/insert/upload', ensureAuthenticated, function(req, res, next) {
	var form = new formidable.IncomingForm();	

	form.parse(req);
    form.on("file", function (name, file){
        fs.readFile(file.path, function(error, data){

        	var filePath = __dirname + '/../public/std/' + file.name;


        	fs.writeFile(filePath, data, function(error){
        		if(error){
        		}else {
        		}
        	});
        });
    });
    form.on("end", function() {
		  res.redirect('back');
		});
});


router.post('/study/insert', ensureAuthenticated, function(req, res, next) {
	
	var CP = 8;

	var cate = '182'; // 18년 시즌2

	var decate = req.body.decate;
	var recentdate = req.body.recentdate;
	var subject = req.body.subject;
	var subject2 = req.body.subject2;
	var bgimg1 = req.body.bgimg1;
	var thum = req.body.thum;
	var thum2 = req.body.thum2;
	var img1 = req.body.img1;
	var img2 = req.body.img2;
	var img3 = req.body.img3;
	var leader = req.body.leader;
	var period = req.body.period;
	var sche1 = req.body.sche1;
	var sche2 = req.body.sche2;
	var sche3 = req.body.sche3;
	var location = req.body.location;
	var price = req.body.price;
	var people = req.body.people;
	var line1 = req.body.line1;
	var line2 = req.body.line2;
	var line3 = req.body.line3;
	var value1 = req.body.value1;
	var value2 = req.body.value2;
	var value3 = req.body.value3;
	var slimg1 = req.body.slimg1;
	var slimg2 = req.body.slimg2;
	var slimg3 = req.body.slimg3;
	var slimg4 = req.body.slimg4;
	var lepro1 = req.body.lepro1;
	var lepro2 = req.body.lepro2;
	var lepro3 = req.body.lepro3;
	var lepro4 = req.body.lepro4;
	var appt1 = req.body.appt1;
	var appc1 = req.body.appc1;
	var appt2 = req.body.appt2;
	var appc2 = req.body.appc2;
	var appt3 = req.body.appt3;
	var appc3 = req.body.appc3;
	var step1 = req.body.step1;
	var stepc1 = req.body.stepc1;
	var step2 = req.body.step2;
	var stepc2 = req.body.stepc2;
	var step3 = req.body.step3;
	var stepc3 = req.body.stepc3;
	var flag='';
	var state ='0';

	var date = getWorldTime(+9);
	var rdate = req.body.rdate;

	var sets = {cate:cate,recentdate:recentdate,decate:decate,subject : subject, subject2 : subject2, bgimg1 : bgimg1, thum : thum, thum2 : thum2, leader:leader, period : period, sche1 : sche1, sche2 : sche2,
		sche3 : sche3, location : location, price : price, people : people, line1 : line1, line2 : line2, line3 : line3, value1 : value1,
	 value2 : value2, value3 : value3, slimg1 : slimg1, slimg2 : slimg2, slimg3 : slimg3, slimg4 : slimg4, lepro1 : lepro1,
	 lepro2 : lepro2, lepro3 : lepro3, lepro4 : lepro4, appt1 : appt1, appc1 : appc1, appt2 : appt2, appc2 : appc2, appt3 : appt3, appc3 : appc3,
	 step1 : step1, stepc1 : stepc1, step2:step2,stepc2:stepc2,step3:step3,stepc3:stepc3, regdate:date, flag:'N', state:state};
	
	mysql.insert('insert into cider.std_more set ?', sets,  function (err, data){
    	res.redirect('/adm/study');
    });
});

router.post('/study/update', ensureAuthenticated, function(req, res, next) {
	
	var CP = 8;
	
	var idx = req.body.idx;
	var recentdate = req.body.recentdate;
	var decate = req.body.decate;
	var subject = req.body.subject;
	var subject2 = req.body.subject2;
	var bgimg1 = req.body.bgimg1;
	var thum = req.body.thum;
	var thum2 = req.body.thum2;
	var img1 = req.body.img1;
	var img2 = req.body.img2;
	var img3 = req.body.img3;
	var leader = req.body.leader;
	var period = req.body.period;
	var sche1 = req.body.sche1;
	var sche2 = req.body.sche2;
	var sche3 = req.body.sche3;
	var location = req.body.location;
	var price = req.body.price;
	var people = req.body.people;
	var line1 = req.body.line1;
	var line2 = req.body.line2;
	var line3 = req.body.line3;
	var value1 = req.body.value1;
	var value2 = req.body.value2;
	var value3 = req.body.value3;
	var slimg1 = req.body.slimg1;
	var slimg2 = req.body.slimg2;
	var slimg3 = req.body.slimg3;
	var slimg4 = req.body.slimg4;
	var lepro1 = req.body.lepro1;
	var lepro2 = req.body.lepro2;
	var lepro3 = req.body.lepro3;
	var lepro4 = req.body.lepro4;
	var appt1 = req.body.appt1;
	var appc1 = req.body.appc1;
	var appt2 = req.body.appt2;
	var appc2 = req.body.appc2;
	var appt3 = req.body.appt3;
	var appc3 = req.body.appc3;
	var step1 = req.body.step1;
	var stepc1 = req.body.stepc1;
	var step2 = req.body.step2;
	var stepc2 = req.body.stepc2;
	var step3 = req.body.step3;
	var stepc3 = req.body.stepc3;
	var flag = req.body.flag;
	var state = req.body.state;
	console.log(state);

	var rdate   = req.body.rdate;
	var modate = getWorldTime(+9);
	
	var sets = {state:state,flag:flag,recentdate:recentdate,decate:decate,subject : subject, subject2 : subject2, bgimg1 : bgimg1, thum : thum, thum2 : thum2, leader:leader, period : period, sche1 : sche1, sche2 : sche2,
		sche3 : sche3, location : location, price : price, people : people, line1 : line1, line2 : line2, line3 : line3, value1 : value1,
	 value2 : value2, value3 : value3, slimg1 : slimg1, slimg2 : slimg2, slimg3 : slimg3, slimg4 : slimg4, lepro1 : lepro1,
	 lepro2 : lepro2, lepro3 : lepro3, lepro4 : lepro4, appt1 : appt1, appc1 : appc1, appt2 : appt2, appc2 : appc2, appt3 : appt3, appc3 : appc3,
	 step1 : step1, stepc1 : stepc1, step2:step2,stepc2:stepc2,step3:step3,stepc3:stepc3,modate:modate};

//mysql.update('update cider.std_more set subject = ?, subject2 = ?, bgimg1 = ?,thum=?,leader = ? ,period = ?,sche1 = ?, sche2 = ? ,sche3= ? where idx = ?', [subject,subject2,bgimg1,thum,leader,period,sche1,sche2,sche3,idx], function (err, data){
    
	mysql.update('update cider.std_more set state=?,flag=?,recentdate=?,decate=?,subject = ?, subject2 = ?, bgimg1 = ?, thum = ?, thum2=?, leader = ?, period = ?, sche1 = ?, sche2 = ? ,sche3= ? ,location= ?,price= ? ,people= ? ,line1= ? ,line2= ? ,line3= ? ,value1= ? ,value2= ? ,value3= ? ,slimg1= ? ,slimg2= ? ,slimg3= ? ,slimg4= ? ,lepro1= ?,lepro2= ?,lepro3= ?  ,lepro4= ?  ,appt1= ?  ,appc1= ?  ,appt2= ?  ,appc2= ?  ,appt3= ?  ,appc3= ?  ,step1= ?  ,stepc1= ?,step2= ?  ,stepc2= ?,step3= ?  ,stepc3= ? , modate= ? where idx = ?', [state,flag,recentdate,decate,subject,subject2,bgimg1,thum,thum2,leader,period,sche1,sche2,sche3,location,price,people,line1,line2,line3,value1,value2,value3,slimg1,slimg2,slimg3,slimg4,lepro1,lepro2,lepro3,lepro4,appt1,appc1,appt2,appc2,appt3,appc3,step1,stepc1,step2,stepc2,step3,stepc3,modate,idx], function (err, data){
    	res.redirect('/adm/study/list');
    	
    });
});


router.get('/study/list', ensureAuthenticated, function(req, res, next) {
	var CP = 8;
	var stdlist;
	mysql.select('SELECT * from cider.std_more order by idx desc;', function (err, data){
		stdlist = data;
		res.render('admin/study/std_list', { CP : CP, stdlist : data });
	});
});

router.get('/study/detail/:idx', ensureAuthenticated, function(req, res, next) {
	
	var CP = 8;
	var idx = req.params.idx;
	var std;

	mysql.select('select * from cider.std_more where idx = '+idx+'', function (err, data){
		if(err){
			res.redirect('back');
		}
		std = data;
		res.render('admin/study/std_upd', {std : data, CP : CP});
	});
});

router.get('/study/memlist', ensureAuthenticated, function(req, res, next) {
	var CP = 8;
	var stdlist;
	mysql.select('SELECT * from cider.std_more order by idx desc;', function (err, data){
		stdlist = data;
		res.render('admin/study/std_memlist', { CP : CP, stdlist : data});
	});
  });

router.get('/study/memlist/:idx', ensureAuthenticated, function(req, res, next) {
	var CP = 8;
	var idx = req.params.idx;
	mysql.select('SELECT * FROM cider.pay_appform where decate = '+idx+' order by idx desc;', function (err, data){
		mysql.select("SELECT * FROM cider.fin_nonaccount where cate='182' and decate = "+idx+" and state='입금확인' order by idx desc;", function (err, data2){

		res.render('admin/study/std_memlist_detail', { CP : CP, appfm : data , non:data2});
	});
  });
});

//**************** 구매자 목록 **************

router.get('/study/customer', ensureAuthenticated, function(req,res,next){
	var CP = 8;
	mysql.select("SELECT * FROM cider.mobileOrder where PRODUCTCODE = '2' order by date desc;", function (err, data){
		mysql.select("SELECT * FROM cider.cardOrder where PRODUCTCODE = '2' order by date desc;", function (err, data2){
			mysql.select("SELECT * FROM cider.pay_appform where cate ='182' order by idx desc;", function (err, data3){
				mysql.select("SELECT * FROM cider.fin_nonaccount where cate='182' order by idx desc;", function (err, data4){
		res.render('admin/study/std_customer', { CP : CP, mobile:data, card:data2, code:data3, non:data4 });
	 });
	});
  });
});
});

//**************** 무통장 수정 **************
router.post('/study/customer_up', ensureAuthenticated, function(req, res, next) {
	var CP = 8;
	var idx = req.body.idx;
	var state = req.body.state;
	console.log(state);
	var codeNum = req.body.codeNum;
	var sets = { state : state, codeNum : codeNum,idx:idx };
	mysql.update('update cider.fin_nonaccount set state = ?, codeNum = ?  where idx = ?', [state,codeNum,idx], function (err, data){
    	res.redirect('/adm/study/customer');
    });
});


router.get('/study/inquiry', ensureAuthenticated, function(req, res, next) {
	var CP = 8;
	mysql.select("SELECT * FROM cider.std_ask where cate = '2' order by stda_no desc", function (err, data){
	res.render('admin/study/std_inquiry', { CP : CP, inq:data});
	});
});

router.get('/study/inquiryd/:idx', ensureAuthenticated, function(req, res, next) {
	var CP = 8;
	var idx = req.params.idx;
	mysql.select('SELECT * FROM cider.std_ask where stda_no = '+idx+'', function (err, data){
	res.render('admin/study/std_inquiry_detail', { CP : CP, inq:data});
	});
});







module.exports = router;
