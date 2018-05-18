var express = require('express'), ipfilter = require('express-ipfilter').IpFilter;
var router = express.Router();
var mysql = require("./model/mysql");
var nodemailer = require('nodemailer');
var urlencode = require('urlencode');


function getWorldTime(tzOffset) { // 24시간제
	  var now = new Date();
	  var tz = now.getTime() + (now.getTimezoneOffset() * 60000) + (tzOffset * 3600000);
	  now.setTime(tz);


	  var s =
	    leadingZeros(now.getFullYear(), 4) + '-' +
	    leadingZeros(now.getMonth() + 1, 2) + '-' +
	    leadingZeros(now.getDate(), 2) + ' ' +

	    leadingZeros(now.getHours(), 2) + ':' +
	    leadingZeros(now.getMinutes(), 2) + ':' +
	    leadingZeros(now.getSeconds(), 2);

	  return s;
}

function rdate() {
	var _tot;
	var now = new Date();
	var _year= now.getFullYear();
	var _mon = now.getMonth()+1;
	 _mon=""+_mon;
		if (_mon.length < 2 )
		{
		_mon="0"+_mon;
		}
	 _tot=_year+""+_mon;
	return _tot;
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

function releaseTime(){
	 var now = new Date();
	 var _year= now.getFullYear();
	 var _mon = now.getMonth()+1;
	 _mon=""+_mon;
	 if (_mon.length < 2 )
	 {
	    _mon="0"+_mon;
	 }
	 var _date=now.getDate ();
	 _date =""+_date;
     if (_date.length < 2 )
	 {
	    _date="0"+_date;
	 }
	 var _hor = now.getHours  ();
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
	 
	var _tot =_year+""+_mon+""+_date+""+_hor+""+ _min;

	return _tot;
}


function aaaa(){
	 var now = new Date();
	 var _year= now.getFullYear();
	 var _mon = now.getMonth()+1;
	 _mon=""+_mon;
	 if (_mon.length < 2 )
	 {
	    _mon="0"+_mon;
	 }
	 var _date=now.getDate();
	 //var _date = now.setDate(now.getDate() -1);
	 _date =""+_date;
     if (_date.length < 2 )
	 {
	    _date="0"+_date;
	 }
	var _tot =_year+"-"+_mon+"-"+_date;

	return _tot;
}


router.get('', function(req, res, next) {
	res.render('front/b_main', { });
});

router.get('/pguide', function(req, res, next) {
	res.render('front/b_pguide', { });
});

router.get('/uguide', function(req, res, next) {
	res.render('front/b_uguide', { });
});

router.get('/conlist', function(req, res, next) {
	var no = req.params.no;
	var row;

	var _tot = releaseTime();

	var qry="";
	
	 qry="select con_no, con_photo, con_title, if (a.con_upDate > DATE_ADD(now(),INTERVAL -1 DAY) ,'/page_imgs/main_img/new_mark4.svg','/page_imgs/main_img/new_mark1px.png') as chkDat from bobbyDB.contents a where a.con_release <= '"+_tot+"' order by a.con_no desc limit 0,60";
	mysql.select(qry, function (err, data){
		if (err) throw err;
		 row = data;
			
		 res.render('front/b_conlist', { contents : row});
	});
 });


router.get('/conde/:no', function(req, res, next) {

	var no = req.params.no;

	var _tot = releaseTime();

	var qry="";
	
	var row;
	var sets = {con_no : no};
	var next = {};
	var pre = {};


	mysql.update('update bobbyDB.contents set con_viewCount = con_viewCount + 1 where con_no = ?', [no] ,function (err, data){
		if(err){
			res.redirect('back');
		}
		
		mysql.select('select c.con_no, c.con_category, c.con_writer, c.con_title, c.con_content, c.con_photo, c.con_viewCount,c.con_regDate, c.con_upDate, c.con_likeCnt, c.comment_no, c.user_no, c.user_comment, c.con_release,  u.user_email, u.user_name, u.user_profile_img, u.user_sns_url, u.user_sns_icon, cate.cate_no, cate.cate_name from bobbyDB.contents c left join bobbyDB.user u on u.user_no = c.user_no left join bobbyDB.con_cate cate on c.con_category = cate.cate_no and u.user_level = "2" where 1=1 and c.con_no = '+no+'', function (err, data){
			if(err){
				res.redirect('back');
			}
			if(data.length == 0){
			var lang = 0;

			}else{			
			var lang = data[0].con_category;
			}
			var contents = data;


			qry="select con_no, con_photo, con_title from bobbyDB.contents where con_release <= '"+_tot+"' ORDER BY RAND() LIMIT 0,3";
				mysql.select(qry, function (err, data1){
					if(err){
					res.redirect('back');
					}
					row = data1;



			res.render('front/b_conde', {contents : contents, cont : row});
		});
	});
});
});


router.get('/top', function(req, res, next) {
		res.render('front/top', {});
});

router.get('/bottom', function(req, res, next) {
	res.render('front/bottom', { });
});


router.get('/test', function(req, res, next) {
	res.render('front/test', { });
});



module.exports = router;